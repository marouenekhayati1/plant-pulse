-- WattNow session cache (single row keyed by id='singleton')
CREATE TABLE public.wattnow_session (
  id text PRIMARY KEY DEFAULT 'singleton',
  access_token text NOT NULL,
  id_token text,
  refresh_token text,
  device_key text,
  user_id text NOT NULL,
  expires_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.wattnow_session ENABLE ROW LEVEL SECURITY;
-- No policies: only service-role (which bypasses RLS) can read/write.

-- Realtime snapshots (one row per poll)
CREATE TABLE public.wattnow_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recorded_at timestamptz NOT NULL DEFAULT now(),
  randa1_kw numeric,
  randa2_kw numeric,
  randa3_kw numeric,
  ge1_kw numeric,
  ge2_kw numeric,
  conso_kw numeric,
  prod_kw numeric,
  delta_kw numeric,
  raw jsonb
);

CREATE INDEX idx_wattnow_snapshots_recorded_at ON public.wattnow_snapshots(recorded_at DESC);

ALTER TABLE public.wattnow_snapshots ENABLE ROW LEVEL SECURITY;

-- Public read (the app uses a custom technician auth, not auth.uid())
CREATE POLICY "public read wattnow snapshots"
  ON public.wattnow_snapshots FOR SELECT
  USING (true);
-- No insert policy: only service-role writes.