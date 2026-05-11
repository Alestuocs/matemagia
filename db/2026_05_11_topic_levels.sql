-- Migration 2026-05-11: difficulty levels per topic
-- Allows tracking how far a student has progressed within a single topic
-- (e.g. addition: level 1 sums up to 10, level 3 up to 100, level 5 carries).

ALTER TABLE public.user_progress
  ADD COLUMN IF NOT EXISTS topic_levels jsonb NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.user_progress.topic_levels IS
  'Map of topicId -> current difficulty level (1..5). Stored as jsonb.';
