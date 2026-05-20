-- Revoke from PUBLIC (which covers anon and authenticated implicitly)
REVOKE EXECUTE ON FUNCTION public.increment_scan_usage(UUID, DATE, INTEGER) FROM PUBLIC;

-- Re-grant to service_role only (Edge Function uses this)
GRANT EXECUTE ON FUNCTION public.increment_scan_usage(UUID, DATE, INTEGER) TO service_role;
