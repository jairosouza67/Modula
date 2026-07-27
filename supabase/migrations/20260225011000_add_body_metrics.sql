-- Migration: Bioimpedance (Body Metrics)

CREATE TABLE IF NOT EXISTS body_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  weight NUMERIC(5,2),
  body_fat_percent NUMERIC(5,2),
  lean_mass NUMERIC(5,2),
  measurements JSONB,
  notes TEXT,
  measured_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE body_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own body metrics"
  ON body_metrics FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own body metrics"
  ON body_metrics FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own body metrics"
  ON body_metrics FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);
