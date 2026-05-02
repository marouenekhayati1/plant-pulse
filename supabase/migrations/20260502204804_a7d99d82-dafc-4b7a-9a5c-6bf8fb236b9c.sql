
-- Roles enum
CREATE TYPE public.tech_role AS ENUM ('technician', 'maintenance_manager', 'admin');

-- Utility enum
CREATE TYPE public.utility_kind AS ENUM (
  'generator_g1', 'generator_g2', 'osmosis', 'hot_water',
  'steam_boiler', 'water_room', 'chiller'
);

-- Technicians table
CREATE TABLE public.technicians (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  matricule TEXT NOT NULL UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  role public.tech_role NOT NULL DEFAULT 'technician',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Utility readings table
CREATE TABLE public.utility_readings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  utility public.utility_kind NOT NULL,
  technician_id UUID NOT NULL REFERENCES public.technicians(id) ON DELETE RESTRICT,
  technician_name TEXT NOT NULL,
  technician_matricule TEXT NOT NULL,
  guard_post SMALLINT NOT NULL CHECK (guard_post IN (1,2,3)),
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  computed JSONB NOT NULL DEFAULT '{}'::jsonb,
  anomaly BOOLEAN NOT NULL DEFAULT false,
  anomaly_fields JSONB NOT NULL DEFAULT '[]'::jsonb,
  checklist JSONB,
  comment TEXT,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_readings_utility ON public.utility_readings(utility, recorded_at DESC);
CREATE INDEX idx_readings_tech ON public.utility_readings(technician_id, recorded_at DESC);
CREATE INDEX idx_readings_recorded_at ON public.utility_readings(recorded_at DESC);

-- Thresholds table
CREATE TABLE public.thresholds (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  utility public.utility_kind NOT NULL,
  field_key TEXT NOT NULL,
  label TEXT NOT NULL,
  min_value NUMERIC,
  max_value NUMERIC,
  warn_min NUMERIC,
  warn_max NUMERIC,
  unit TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (utility, field_key)
);

-- RLS: enable, then permissive policies (auth handled at app layer via matricule).
ALTER TABLE public.technicians ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.utility_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.thresholds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read technicians" ON public.technicians FOR SELECT USING (true);
CREATE POLICY "public insert technicians" ON public.technicians FOR INSERT WITH CHECK (true);
CREATE POLICY "public update technicians" ON public.technicians FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "public delete technicians" ON public.technicians FOR DELETE USING (true);

CREATE POLICY "public read readings" ON public.utility_readings FOR SELECT USING (true);
CREATE POLICY "public insert readings" ON public.utility_readings FOR INSERT WITH CHECK (true);

CREATE POLICY "public read thresholds" ON public.thresholds FOR SELECT USING (true);
CREATE POLICY "public insert thresholds" ON public.thresholds FOR INSERT WITH CHECK (true);
CREATE POLICY "public update thresholds" ON public.thresholds FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "public delete thresholds" ON public.thresholds FOR DELETE USING (true);

-- Seed default thresholds
INSERT INTO public.thresholds (utility, field_key, label, min_value, max_value, warn_min, warn_max, unit) VALUES
('generator_g1','engine_load','Charge moteur', 0, 95, 10, 85, '%'),
('generator_g1','exhaust_temp','Temp. échappement', 200, 550, 250, 500, '°C'),
('generator_g1','cyl_min_temp','Temp. cyl min', 150, 480, 180, 450, '°C'),
('generator_g1','cyl_max_temp','Temp. cyl max', 150, 500, 180, 470, '°C'),
('generator_g1','cooling_in','Eau refr. entrée', 30, 90, 35, 80, '°C'),
('generator_g1','cooling_out','Eau refr. sortie', 40, 95, 45, 85, '°C'),
('generator_g1','superheated_return','Retour eau surchauffée', 60, 130, 70, 120, '°C'),
('generator_g2','engine_load','Charge moteur', 0, 95, 10, 85, '%'),
('generator_g2','exhaust_temp','Temp. échappement', 200, 550, 250, 500, '°C'),
('generator_g2','cyl_min_temp','Temp. cyl min', 150, 480, 180, 450, '°C'),
('generator_g2','cyl_max_temp','Temp. cyl max', 150, 500, 180, 470, '°C'),
('generator_g2','cooling_in','Eau refr. entrée', 30, 90, 35, 80, '°C'),
('generator_g2','cooling_out','Eau refr. sortie', 40, 95, 45, 85, '°C'),
('generator_g2','superheated_return','Retour eau surchauffée', 60, 130, 70, 120, '°C'),
('osmosis','production_flow','Débit production', 5, 50, 8, 45, 'GPM'),
('osmosis','reject_flow','Débit rejet', 0, 30, 0, 25, 'GPM'),
('osmosis','system_pressure','Pression système', 100, 250, 120, 230, 'PSI'),
('osmosis','filter_5_before','Filtre 5µ avant', 0, 60, 0, 50, 'PSI'),
('osmosis','filter_5_after','Filtre 5µ après', 0, 55, 0, 45, 'PSI'),
('osmosis','filter_carbon','Filtre charbon', 0, 60, 0, 50, 'PSI'),
('osmosis','filter_1','Filtre 1µ', 0, 55, 0, 45, 'PSI'),
('hot_water','mingazzini_temp','Température Mingazzini', 60, 130, 70, 120, '°C'),
('hot_water','mingazzini_pressure','Pression Mingazzini', 1, 8, 1.5, 7, 'bar'),
('hot_water','ici_temp','Température ICI', 60, 130, 70, 120, '°C'),
('hot_water','ici_pressure','Pression ICI', 1, 8, 1.5, 7, 'bar'),
('hot_water','r2_pressure','Pression R2', 1, 8, 1.5, 7, 'bar'),
('steam_boiler','actual_pressure','Pression réelle', 1, 12, 2, 10, 'bar'),
('chiller','chilled_in','Eau glacée entrée', 8, 18, 9, 16, '°C'),
('chiller','chilled_out','Eau glacée sortie', 4, 12, 5, 10, '°C'),
('chiller','tower_in','Tour entrée', 25, 38, 26, 36, '°C'),
('chiller','tower_out','Tour sortie', 28, 42, 29, 40, '°C'),
('chiller','hot_in','Eau chaude entrée', 70, 130, 75, 120, '°C'),
('chiller','hot_out','Eau chaude sortie', 60, 120, 65, 115, '°C'),
('chiller','vacuum_pressure','Pression vide', 0, 30, 0, 25, 'mmHg');

-- Seed an initial admin technician
INSERT INTO public.technicians (matricule, first_name, last_name, role) VALUES
('ADMIN001','Admin','Système','admin');
