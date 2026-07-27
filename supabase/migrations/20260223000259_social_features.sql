CREATE TABLE IF NOT EXISTS likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  checkin_id UUID REFERENCES checkins(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  UNIQUE(checkin_id, user_id)
);

CREATE TABLE IF NOT EXISTS comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  checkin_id UUID REFERENCES checkins(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all likes" ON likes FOR SELECT USING (true);
CREATE POLICY "Users can insert their own likes" ON likes FOR INSERT WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "Users can delete their own likes" ON likes FOR DELETE USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can view all comments" ON comments FOR SELECT USING (true);
CREATE POLICY "Users can insert their own comments" ON comments FOR INSERT WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "Users can delete their own comments" ON comments FOR DELETE USING ((select auth.uid()) = user_id);

CREATE OR REPLACE VIEW checkins_feed AS
SELECT 
    c.id, c.user_id, c.group_id, c.title, c.type, c.image_url, 
    c.duration_minutes, c.distance_km, c.xp_earned, c.coins_earned, c.created_at,
    p.username, p.avatar_url,
    us.level,
    (SELECT COUNT(*) FROM likes l WHERE l.checkin_id = c.id) as likes_count,
    (SELECT COUNT(*) FROM comments cm WHERE cm.checkin_id = c.id) as comments_count
FROM checkins c
JOIN profiles p ON c.user_id = p.id
JOIN user_stats us ON c.user_id = us.user_id;

GRANT SELECT ON checkins_feed TO authenticated;
GRANT SELECT ON checkins_feed TO anon;
