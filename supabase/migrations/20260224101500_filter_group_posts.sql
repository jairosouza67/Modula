-- Atualizar RLS de checkins para SELECT
DROP POLICY IF EXISTS "Users can view all checkins" ON checkins;

CREATE POLICY "Users can view filtered checkins" ON checkins
FOR SELECT USING (
    group_id IS NULL -- Posts sem grupo (públicos)
    OR (SELECT type FROM groups g WHERE g.id = checkins.group_id) = 'public' -- Grupos públicos
    OR (user_id = (SELECT auth.uid())) -- Autor do post
    OR EXISTS (
        SELECT 1 FROM group_members gm 
        WHERE gm.group_id = checkins.group_id 
        AND gm.user_id = (SELECT auth.uid()) 
        AND gm.status = 'active'
    ) -- Membro do grupo
);

-- Remover e Recriar a View para evitar erro de ordem de colunas
DROP VIEW IF EXISTS checkins_feed;

CREATE VIEW checkins_feed AS
SELECT 
    c.id, c.user_id, c.group_id, c.title, c.type, c.image_url, 
    c.duration_minutes, c.distance_km, c.xp_earned, c.coins_earned, c.created_at,
    p.username, p.avatar_url,
    us.level,
    g.name as group_name,
    g.type as group_type,
    (SELECT COUNT(*) FROM likes l WHERE l.checkin_id = c.id) as likes_count,
    (SELECT COUNT(*) FROM comments cm WHERE cm.checkin_id = c.id) as comments_count
FROM checkins c
JOIN profiles p ON c.user_id = p.id
JOIN user_stats us ON c.user_id = us.user_id
LEFT JOIN groups g ON c.group_id = g.id;

GRANT SELECT ON checkins_feed TO authenticated, anon;
