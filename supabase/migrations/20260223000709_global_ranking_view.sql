CREATE OR REPLACE VIEW global_ranking_view AS
SELECT
    us.user_id,
    us.total_xp,
    us.level,
    us.checkins_count,
    p.username,
    p.avatar_url
FROM user_stats us
JOIN profiles p ON us.user_id = p.id
ORDER BY us.total_xp DESC;

GRANT SELECT ON global_ranking_view TO authenticated;
GRANT SELECT ON global_ranking_view TO anon;
