-- Migration 2026-05-11: parent dashboard analytics
-- Adds SECURITY DEFINER RPCs that aggregate a linked child's
-- exercise_attempts so the parent can see daily activity, accuracy
-- per topic, and the modules with the most errors.

CREATE OR REPLACE FUNCTION public.child_stats(child UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSONB;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'NOT_AUTHENTICATED' USING ERRCODE = 'P0001';
  END IF;
  -- Caller must be linked as parent of `child`.
  IF NOT EXISTS (
    SELECT 1 FROM public.parent_student_links
    WHERE parent_id = auth.uid()
      AND student_id = child
      AND status = 'accepted'
  ) THEN
    RAISE EXCEPTION 'NOT_LINKED' USING ERRCODE = 'P0001';
  END IF;

  SELECT jsonb_build_object(
    'total_attempts', COALESCE((SELECT count(*) FROM exercise_attempts WHERE user_id = child), 0),
    'correct_attempts', COALESCE((SELECT count(*) FROM exercise_attempts WHERE user_id = child AND is_correct), 0),
    'first_attempt_at', (SELECT min(created_at) FROM exercise_attempts WHERE user_id = child),
    'last_attempt_at',  (SELECT max(created_at) FROM exercise_attempts WHERE user_id = child),

    'last_14_days', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'day', day,
        'attempts', cnt,
        'correct', correct
      ) ORDER BY day)
      FROM (
        SELECT date_trunc('day', created_at AT TIME ZONE 'America/Santiago')::date AS day,
               count(*) AS cnt,
               count(*) FILTER (WHERE is_correct) AS correct
        FROM exercise_attempts
        WHERE user_id = child
          AND created_at >= now() - interval '14 days'
        GROUP BY 1
      ) t
    ), '[]'::jsonb),

    'by_topic', COALESCE((
      SELECT jsonb_object_agg(topic_id, info)
      FROM (
        SELECT topic_id,
               jsonb_build_object(
                 'attempts', count(*),
                 'correct',  count(*) FILTER (WHERE is_correct),
                 'wrong',    count(*) FILTER (WHERE NOT is_correct),
                 'last_attempt_at', max(created_at)
               ) AS info
        FROM exercise_attempts
        WHERE user_id = child
        GROUP BY topic_id
      ) t
    ), '{}'::jsonb),

    'worst_topics', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'topic_id', topic_id,
        'attempts', attempts,
        'wrong', wrong,
        'accuracy', round(((attempts - wrong)::numeric / attempts) * 100, 1)
      ))
      FROM (
        SELECT topic_id,
               count(*) AS attempts,
               count(*) FILTER (WHERE NOT is_correct) AS wrong
        FROM exercise_attempts
        WHERE user_id = child
        GROUP BY topic_id
        HAVING count(*) >= 3
           AND (count(*) FILTER (WHERE NOT is_correct))::float / count(*) > 0.3
        ORDER BY wrong DESC
        LIMIT 5
      ) t
    ), '[]'::jsonb)
  )
  INTO result;

  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.child_stats(UUID) TO authenticated;
