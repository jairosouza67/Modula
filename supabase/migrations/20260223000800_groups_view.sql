CREATE OR REPLACE VIEW groups_view AS
SELECT
    g.id,
    g.name,
    g.description,
    g.owner_id,
    g.photo_url,
    g.type as group_type,
    g.created_at,
    (SELECT COUNT(*) FROM group_members gm WHERE gm.group_id = g.id) AS member_count
FROM groups g;

GRANT SELECT ON groups_view TO authenticated;
GRANT SELECT ON groups_view TO anon;
