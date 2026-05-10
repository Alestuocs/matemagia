-- MateMagia - Supabase Schema
-- Paste this in the Supabase SQL Editor and click Run

-- ──────────────────────────────────────────────
-- PROFILES
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- ──────────────────────────────────────────────
-- USER PROGRESS
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  xp INTEGER DEFAULT 0,
  streak INTEGER DEFAULT 0,
  last_study_date TEXT,
  unlocked_topics TEXT[] DEFAULT ARRAY['numbers-0-10'],
  completed_topics TEXT[] DEFAULT ARRAY[]::TEXT[],
  topic_stars JSONB DEFAULT '{}',
  exercises_total INTEGER DEFAULT 0,
  exercises_today INTEGER DEFAULT 0,
  correct_total INTEGER DEFAULT 0,
  daily_goal INTEGER DEFAULT 5,
  daily_goal_done INTEGER DEFAULT 0,
  achievements TEXT[] DEFAULT ARRAY[]::TEXT[],
  current_grade INTEGER DEFAULT 1,
  student_name TEXT DEFAULT '',
  assessment_done BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own progress" ON public.user_progress
  FOR ALL USING (auth.uid() = user_id);

-- ──────────────────────────────────────────────
-- EXERCISE ATTEMPTS (optional detailed logging)
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.exercise_attempts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  topic_id TEXT NOT NULL,
  exercise_id TEXT,
  is_correct BOOLEAN NOT NULL,
  xp_earned INTEGER DEFAULT 0,
  hint_used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.exercise_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own attempts" ON public.exercise_attempts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own attempts" ON public.exercise_attempts
  FOR SELECT USING (auth.uid() = user_id);

-- ──────────────────────────────────────────────
-- TRIGGER: Create profile on signup
-- ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_progress (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ──────────────────────────────────────────────
-- INDEXES
-- ──────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON public.user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_exercise_attempts_user_id ON public.exercise_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_exercise_attempts_topic_id ON public.exercise_attempts(topic_id);
