-- Atomic rate limit check and increment function
-- Returns the new scan_count if increment succeeded, or NULL if limit reached
CREATE OR REPLACE FUNCTION public.increment_scan_usage(
  p_user_id UUID,
  p_scan_date DATE,
  p_limit INTEGER DEFAULT 10
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_scan_count INTEGER;
BEGIN
  INSERT INTO public.scan_usage (user_id, scan_date, scan_count)
  VALUES (p_user_id, p_scan_date, 1)
  ON CONFLICT (user_id, scan_date)
  DO UPDATE SET
    scan_count = scan_usage.scan_count + 1,
    updated_at = now()
  WHERE scan_usage.scan_count < p_limit
  RETURNING scan_count INTO v_scan_count;

  RETURN v_scan_count;
END;
$$;
