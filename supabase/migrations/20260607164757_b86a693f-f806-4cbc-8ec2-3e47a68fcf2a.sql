-- Lock down wattnow_session: tokens are sensitive, only service_role should access
ALTER TABLE public.wattnow_session ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.wattnow_session FROM anon, authenticated, PUBLIC;
GRANT ALL ON public.wattnow_session TO service_role;
-- Explicit deny policy for anon/authenticated (service_role bypasses RLS)
DROP POLICY IF EXISTS "deny all to non service role" ON public.wattnow_session;
CREATE POLICY "deny all to non service role"
  ON public.wattnow_session
  AS RESTRICTIVE
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

-- utility_readings: make the no-update / no-delete restriction explicit and future-proof
DROP POLICY IF EXISTS "no update on readings" ON public.utility_readings;
CREATE POLICY "no update on readings"
  ON public.utility_readings
  AS RESTRICTIVE
  FOR UPDATE
  TO public
  USING (false)
  WITH CHECK (false);

DROP POLICY IF EXISTS "no delete on readings" ON public.utility_readings;
CREATE POLICY "no delete on readings"
  ON public.utility_readings
  AS RESTRICTIVE
  FOR DELETE
  TO public
  USING (false);