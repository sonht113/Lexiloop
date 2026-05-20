-- Table: scan_usage
-- Tracks per-user daily scan counts for AI vocabulary scan rate limiting.
-- Composite PK on (user_id, scan_date) ensures one row per user per day.

CREATE TABLE public.scan_usage (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scan_date DATE NOT NULL,
  scan_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, scan_date)
);

-- Enable Row Level Security
ALTER TABLE public.scan_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only read their own scan usage
CREATE POLICY "Users can view own scan usage"
  ON public.scan_usage FOR SELECT
  USING (auth.uid() = user_id);

-- Note: Service role (used by Edge Function) bypasses RLS,
-- so no explicit INSERT/UPDATE policy is needed for the Edge Function.
