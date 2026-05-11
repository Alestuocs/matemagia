-- ============================================================
-- MateMagia — Migration 2026-05
-- Adds:
--   1. Beta allowlist gating signup
--   2. Bidirectional parent↔student linking via single code RPC
--   3. RLS hardening (remove "all profiles searchable" leak)
--   4. Backfill: ensure every user_progress row has an invite_code
-- ============================================================

-- ─── 1. BETA ALLOWLIST ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.beta_allowlist (
  email      TEXT PRIMARY KEY,
  added_by   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  added_at   TIMESTAMPTZ DEFAULT NOW(),
  note       TEXT
);

ALTER TABLE public.beta_allowlist ENABLE ROW LEVEL SECURITY;

-- No direct table access; only SECURITY DEFINER functions can touch it
DROP POLICY IF EXISTS "beta_allowlist no direct" ON public.beta_allowlist;
CREATE POLICY "beta_allowlist no direct"
  ON public.beta_allowlist FOR ALL TO public
  USING (false) WITH CHECK (false);

-- Grandfather everyone who already has an account
INSERT INTO public.beta_allowlist (email, note)
SELECT LOWER(u.email), 'auto-grandfathered'
FROM auth.users u
WHERE u.email IS NOT NULL AND u.email <> ''
ON CONFLICT (email) DO NOTHING;

-- ─── 2. is_email_allowed RPC (client preflight) ───────────────
CREATE OR REPLACE FUNCTION public.is_email_allowed(check_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  norm TEXT;
BEGIN
  norm := LOWER(TRIM(COALESCE(check_email, '')));
  IF norm = '' THEN RETURN FALSE; END IF;

  -- existing user → always allowed
  IF EXISTS (SELECT 1 FROM auth.users WHERE LOWER(email) = norm) THEN
    RETURN TRUE;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.beta_allowlist WHERE LOWER(email) = norm
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.is_email_allowed(TEXT) TO anon, authenticated;

-- ─── 3. Enforce beta in handle_new_user trigger ───────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  norm TEXT;
BEGIN
  norm := LOWER(TRIM(COALESCE(NEW.email, '')));

  IF norm <> '' AND NOT EXISTS (
    SELECT 1 FROM public.beta_allowlist WHERE LOWER(email) = norm
  ) THEN
    RAISE EXCEPTION 'BETA_NOT_ALLOWED' USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_progress (user_id, invite_code)
  VALUES (NEW.id, public.generate_invite_code())
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- ─── 4. Backfill invite_codes for any existing users ──────────
UPDATE public.user_progress
SET invite_code = public.generate_invite_code()
WHERE invite_code IS NULL OR invite_code = '';

-- ─── 5. Unique constraint so link upsert works ────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'parent_student_links_pair_unique'
  ) THEN
    -- de-dup first (keep most recent)
    DELETE FROM public.parent_student_links psl
    USING public.parent_student_links psl2
    WHERE psl.parent_id = psl2.parent_id
      AND psl.student_id = psl2.student_id
      AND psl.ctid < psl2.ctid;

    ALTER TABLE public.parent_student_links
      ADD CONSTRAINT parent_student_links_pair_unique
      UNIQUE (parent_id, student_id);
  END IF;
END $$;

-- ─── 6. link_by_invite_code RPC (bidirectional) ───────────────
CREATE OR REPLACE FUNCTION public.link_by_invite_code(target_code TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  me UUID := auth.uid();
  my_role TEXT;
  partner_id UUID;
  partner_role TEXT;
  partner_name TEXT;
  partner_email TEXT;
  parent_uid UUID;
  student_uid UUID;
  norm_code TEXT;
BEGIN
  IF me IS NULL THEN
    RAISE EXCEPTION 'NOT_AUTHENTICATED' USING ERRCODE = 'P0001';
  END IF;

  norm_code := UPPER(REGEXP_REPLACE(COALESCE(target_code, ''), '[^A-Z0-9-]', '', 'g'));
  IF length(norm_code) < 6 THEN
    RAISE EXCEPTION 'INVALID_CODE_FORMAT' USING ERRCODE = 'P0001';
  END IF;

  SELECT COALESCE(role, 'student') INTO my_role
    FROM public.user_progress WHERE user_id = me;

  SELECT user_id, COALESCE(role, 'student'), COALESCE(NULLIF(student_name, ''), '')
    INTO partner_id, partner_role, partner_name
  FROM public.user_progress
  WHERE UPPER(invite_code) = norm_code
  LIMIT 1;

  IF partner_id IS NULL THEN
    RAISE EXCEPTION 'CODE_NOT_FOUND' USING ERRCODE = 'P0001';
  END IF;
  IF partner_id = me THEN
    RAISE EXCEPTION 'CANNOT_LINK_SELF' USING ERRCODE = 'P0001';
  END IF;
  IF my_role = partner_role THEN
    RAISE EXCEPTION 'SAME_ROLE_CANNOT_LINK' USING ERRCODE = 'P0001';
  END IF;

  SELECT email INTO partner_email FROM public.profiles WHERE id = partner_id;
  IF partner_name = '' THEN
    SELECT COALESCE(full_name, split_part(email, '@', 1)) INTO partner_name
      FROM public.profiles WHERE id = partner_id;
  END IF;

  IF my_role = 'parent' THEN
    parent_uid := me;
    student_uid := partner_id;
  ELSE
    parent_uid := partner_id;
    student_uid := me;
  END IF;

  INSERT INTO public.parent_student_links (
    parent_id, student_id, child_email, child_name, status, verified_at
  )
  VALUES (
    parent_uid,
    student_uid,
    (SELECT email FROM public.profiles WHERE id = student_uid),
    (SELECT COALESCE(NULLIF(up.student_name, ''), pr.full_name, split_part(pr.email, '@', 1))
       FROM public.user_progress up
       JOIN public.profiles pr ON pr.id = up.user_id
       WHERE up.user_id = student_uid),
    'accepted',
    NOW()
  )
  ON CONFLICT (parent_id, student_id) DO UPDATE
    SET status = 'accepted',
        verified_at = NOW(),
        child_email = EXCLUDED.child_email,
        child_name  = EXCLUDED.child_name;

  RETURN jsonb_build_object(
    'success', true,
    'partner_id', partner_id,
    'partner_role', partner_role,
    'partner_name', partner_name,
    'partner_email', partner_email
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.link_by_invite_code(TEXT) TO authenticated;

-- ─── 7. my_linked_partners RPC ────────────────────────────────
CREATE OR REPLACE FUNCTION public.my_linked_partners()
RETURNS TABLE (
  partner_id UUID,
  partner_role TEXT,
  partner_email TEXT,
  partner_name TEXT,
  linked_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    CASE WHEN psl.parent_id = auth.uid() THEN psl.student_id ELSE psl.parent_id END AS partner_id,
    CASE WHEN psl.parent_id = auth.uid() THEN 'student'::TEXT ELSE 'parent'::TEXT END AS partner_role,
    p.email AS partner_email,
    COALESCE(NULLIF(up.student_name, ''), p.full_name, split_part(p.email, '@', 1)) AS partner_name,
    psl.verified_at AS linked_at
  FROM public.parent_student_links psl
  JOIN public.profiles p
    ON p.id = (CASE WHEN psl.parent_id = auth.uid() THEN psl.student_id ELSE psl.parent_id END)
  JOIN public.user_progress up ON up.user_id = p.id
  WHERE (psl.parent_id = auth.uid() OR psl.student_id = auth.uid())
    AND psl.status = 'accepted'
  ORDER BY psl.verified_at DESC NULLS LAST;
END;
$$;

GRANT EXECUTE ON FUNCTION public.my_linked_partners() TO authenticated;

-- ─── 8. unlink_partner RPC ────────────────────────────────────
CREATE OR REPLACE FUNCTION public.unlink_partner(partner UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'NOT_AUTHENTICATED' USING ERRCODE = 'P0001';
  END IF;

  DELETE FROM public.parent_student_links
  WHERE (parent_id = auth.uid()  AND student_id = partner)
     OR (student_id = auth.uid() AND parent_id  = partner);

  RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.unlink_partner(UUID) TO authenticated;

-- ─── 9. RLS hardening: remove cross-profile leak ──────────────
DROP POLICY IF EXISTS "Profiles searchable by authenticated" ON public.profiles;

-- ─── 10. helper for parent to read child's progress via RPC ───
CREATE OR REPLACE FUNCTION public.my_children_progress()
RETURNS SETOF public.user_progress
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT up.*
  FROM public.user_progress up
  JOIN public.parent_student_links psl ON psl.student_id = up.user_id
  WHERE psl.parent_id = auth.uid()
    AND psl.status = 'accepted';
$$;

GRANT EXECUTE ON FUNCTION public.my_children_progress() TO authenticated;
