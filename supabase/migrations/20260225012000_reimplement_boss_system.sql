-- Migration: Reimplementing Boss System

CREATE TABLE IF NOT EXISTS weekly_bosses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  hp INT NOT NULL,
  current_hp INT NOT NULL,
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  status TEXT DEFAULT 'active', -- 'active' | 'defeated' | 'victorious'
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS boss_damage_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  boss_id UUID REFERENCES weekly_bosses(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  checkin_id UUID REFERENCES checkins(id) ON DELETE CASCADE,
  damage INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE weekly_bosses ENABLE ROW LEVEL SECURITY;
ALTER TABLE boss_damage_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active bosses"
  ON weekly_bosses FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anyone can view boss damage log"
  ON boss_damage_log FOR SELECT
  TO authenticated
  USING (true);

-- Insert logic is handled by Edge Functions or Secure RPCs
