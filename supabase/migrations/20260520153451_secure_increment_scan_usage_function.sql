-- Revoke execute from anon and authenticated roles
-- This function should only be called by the service role (Edge Function)
REVOKE EXECUTE ON FUNCTION public.increment_scan_usage(UUID, DATE, INTEGER) FROM anon;
REVOKE EXECUTE ON FUNCTION public.increment_scan_usage(UUID, DATE, INTEGER) FROM authenticated;

-- Set search_path to fix the mutable search_path warning
ALTER FUNCTION public.increment_scan_usage(UUID, DATE, INTEGER) SET search_path = public;
