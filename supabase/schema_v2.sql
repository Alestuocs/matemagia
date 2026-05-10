-- MateMagia v2 schema additions
-- Run this AFTER the original schema.sql

-- Add role to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'student' CHECK (role IN ('student', 'parent'));
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS parent_email TEXT;

-- Parent-student relationships
CREATE TABLE IF NOT EXISTS public.parent_student_links (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  invite_code TEXT UNIQUE DEFAULT upper(substring(md5(random()::text), 1, 8)),
  student_email TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(parent_id, student_id)
);
ALTER TABLE public.parent_student_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Parents manage own links" ON public.parent_student_links
  FOR ALL USING (auth.uid() = parent_id);
CREATE POLICY "Students view own links" ON public.parent_student_links
  FOR SELECT USING (auth.uid() = student_id);

-- Parents can view their children's progress
CREATE POLICY "Parents view children progress" ON public.user_progress
  FOR SELECT USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM public.parent_student_links
      WHERE parent_id = auth.uid() AND student_id = user_id AND status = 'accepted'
    )
  );

-- Math chat messages
CREATE TABLE IF NOT EXISTS public.math_chat (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  message TEXT NOT NULL,
  topic_context TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.math_chat ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own chat" ON public.math_chat
  FOR ALL USING (auth.uid() = user_id);

-- Exercise history (prevent repeats)
CREATE TABLE IF NOT EXISTS public.exercise_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  topic_id TEXT NOT NULL,
  exercise_hash TEXT NOT NULL,
  shown_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, topic_id, exercise_hash)
);
ALTER TABLE public.exercise_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own history" ON public.exercise_history
  FOR ALL USING (auth.uid() = user_id);
