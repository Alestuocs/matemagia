-- Migration 2026-05-12: progress recovery + master summary
--
-- Context: a regression in the React client (now fixed) could overwrite
-- `user_progress` aggregate columns with default zeros when the in-memory
-- state was not yet hydrated from DB. The underlying event log
-- `exercise_attempts` is append-only and never lost data, so we can
-- rebuild the aggregate from it.
--
-- This migration adds:
--   1. recover_user_progress(target)  → SECURITY DEFINER RPC that
--      recomputes xp / exercises_total / correct_total / exercises_today
--      from exercise_attempts and writes them back with GREATEST(...)
--      semantics so it can never reduce already-correct fields. Returns
--      a JSON summary of what changed.
--   2. user_summary view            → joins user_progress with the
--      derived totals so the parent dashboard and the student app can
--      both read a single, consistent picture.
--
-- Safety:
--   · GREATEST() means re-running this RPC is idempotent and cannot
--     remove progress (e.g. a manual unlock won't be undone).
--   · A parent can recover their linked child's progress; a student can
--     recover their own.

-- ──────────────────────────────────────────────
-- 1. recover_user_progress(target)
-- ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.recover_user_progress(target UUID DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid UUID;
  caller UUID := auth.uid();
  derived_xp INTEGER;
  derived_total INTEGER;
  derived_correct INTEGER;
  derived_today INTEGER;
  before_row public.user_progress%ROWTYPE;
  after_row public.user_progress%ROWTYPE;
BEGIN
  IF caller IS NULL THEN
    RAISE EXCEPTION 'NOT_AUTHENTICATED' USING ERRCODE = 'P0001';
  END IF;

  uid := COALESCE(target, caller);

  -- If recovering someone else, caller must be an accepted parent link.
  IF uid <> caller THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.parent_student_links
      WHERE parent_id = caller
        AND student_id = uid
        AND status = 'accepted'
    ) THEN
      RAISE EXCEPTION 'NOT_LINKED' USING ERRCODE = 'P0001';
    END IF;
  END IF;

  SELECT * INTO before_row FROM public.user_progress WHERE user_id = uid;

  SELECT
    COALESCE(SUM(xp_earned), 0),
    COUNT(*),
    COUNT(*) FILTER (WHERE is_correct),
    COUNT(*) FILTER (
      WHERE created_at AT TIME ZONE 'America/Santiago' >= date_trunc('day', now() AT TIME ZONE 'America/Santiago')
    )
  INTO derived_xp, derived_total, derived_correct, derived_today
  FROM public.exercise_attempts
  WHERE user_id = uid;

  -- Upsert with GREATEST so a recovery NEVER reduces a field.
  INSERT INTO public.user_progress (user_id, xp, exercises_total, correct_total, exercises_today, updated_at)
  VALUES (uid, derived_xp, derived_total, derived_correct, derived_today, now())
  ON CONFLICT (user_id) DO UPDATE SET
    xp              = GREATEST(public.user_progress.xp,              EXCLUDED.xp),
    exercises_total = GREATEST(public.user_progress.exercises_total, EXCLUDED.exercises_total),
    correct_total   = GREATEST(public.user_progress.correct_total,   EXCLUDED.correct_total),
    exercises_today = GREATEST(public.user_progress.exercises_today, EXCLUDED.exercises_today),
    updated_at      = now();

  SELECT * INTO after_row FROM public.user_progress WHERE user_id = uid;

  RETURN jsonb_build_object(
    'user_id', uid,
    'derived', jsonb_build_object(
      'xp', derived_xp,
      'exercises_total', derived_total,
      'correct_total', derived_correct,
      'exercises_today', derived_today
    ),
    'before', jsonb_build_object(
      'xp', COALESCE(before_row.xp, 0),
      'exercises_total', COALESCE(before_row.exercises_total, 0),
      'correct_total', COALESCE(before_row.correct_total, 0)
    ),
    'after', jsonb_build_object(
      'xp', after_row.xp,
      'exercises_total', after_row.exercises_total,
      'correct_total', after_row.correct_total
    ),
    'recovered', (
      COALESCE(before_row.xp, 0) < derived_xp
      OR COALESCE(before_row.exercises_total, 0) < derived_total
      OR COALESCE(before_row.correct_total, 0) < derived_correct
    )
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.recover_user_progress(UUID) TO authenticated;

-- ──────────────────────────────────────────────
-- 2. user_summary view (single source of truth for UI)
-- ──────────────────────────────────────────────
-- Always read this in dashboards instead of user_progress directly. The
-- derived_* columns come from exercise_attempts and are authoritative;
-- the stored_* columns are what the client wrote. UIs should prefer
-- GREATEST(derived, stored) so a stale write can never display less than
-- the truth.
CREATE OR REPLACE VIEW public.user_summary AS
SELECT
  up.user_id,
  up.student_name,
  up.current_grade,
  up.role,
  up.assessment_done,
  up.streak,
  up.last_study_date,
  up.completed_topics,
  up.unlocked_topics,
  up.achievements,
  up.topic_stars,
  up.daily_goal,
  up.daily_goal_done,
  up.updated_at,
  -- Stored aggregate (what the client wrote)
  up.xp                                                AS stored_xp,
  up.exercises_total                                   AS stored_exercises_total,
  up.correct_total                                     AS stored_correct_total,
  -- Derived aggregate (computed from the event log)
  COALESCE(ea.derived_xp, 0)                           AS derived_xp,
  COALESCE(ea.derived_total, 0)                        AS derived_exercises_total,
  COALESCE(ea.derived_correct, 0)                      AS derived_correct_total,
  ea.last_attempt_at,
  -- Trustworthy display values: max of stored and derived
  GREATEST(up.xp,              COALESCE(ea.derived_xp, 0))      AS effective_xp,
  GREATEST(up.exercises_total, COALESCE(ea.derived_total, 0))   AS effective_exercises_total,
  GREATEST(up.correct_total,   COALESCE(ea.derived_correct, 0)) AS effective_correct_total
FROM public.user_progress up
LEFT JOIN (
  SELECT user_id,
         SUM(xp_earned)                          AS derived_xp,
         COUNT(*)                                AS derived_total,
         COUNT(*) FILTER (WHERE is_correct)      AS derived_correct,
         MAX(created_at)                         AS last_attempt_at
  FROM public.exercise_attempts
  GROUP BY user_id
) ea ON ea.user_id = up.user_id;

-- The view inherits row-level security from the underlying tables: each
-- authenticated user only sees their own row.
GRANT SELECT ON public.user_summary TO authenticated;
