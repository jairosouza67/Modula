-- Migration: Seasons

CREATE TABLE IF NOT EXISTS seasons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'active', -- 'upcoming' | 'active' | 'completed'
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS season_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id UUID REFERENCES seasons(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  initial_body_metrics_id UUID REFERENCES body_metrics(id) ON DELETE SET NULL,
  final_body_metrics_id UUID REFERENCES body_metrics(id) ON DELETE SET NULL,
  xp_earned INT DEFAULT 0,
  bio_score NUMERIC(10,2) DEFAULT 0,
  medals JSONB DEFAULT '[]',
  UNIQUE(season_id, user_id)
);

-- RLS
ALTER TABLE seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE season_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view seasons"
  ON seasons FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can view season participants"
  ON season_participants FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can join a season"
  ON season_participants FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own season participation"
  ON season_participants FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);
