-- Profiles
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING ((select auth.uid()) = id);

-- User stats
DROP POLICY IF EXISTS "Users can view all user_stats" ON user_stats;
DROP POLICY IF EXISTS "Users can insert their own stats" ON user_stats;
DROP POLICY IF EXISTS "Users can update their own stats" ON user_stats;
CREATE POLICY "Users can view all user_stats" ON user_stats FOR SELECT USING (true);
CREATE POLICY "Users can insert their own stats" ON user_stats FOR INSERT WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "Users can update their own stats" ON user_stats FOR UPDATE USING ((select auth.uid()) = user_id);

-- Avatars
DROP POLICY IF EXISTS "Users can view all avatars" ON avatars;
DROP POLICY IF EXISTS "Users can insert their own avatar" ON avatars;
DROP POLICY IF EXISTS "Users can update their own avatar" ON avatars;
CREATE POLICY "Users can view all avatars" ON avatars FOR SELECT USING (true);
CREATE POLICY "Users can insert their own avatar" ON avatars FOR INSERT WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "Users can update their own avatar" ON avatars FOR UPDATE USING ((select auth.uid()) = user_id);

-- Checkins
DROP POLICY IF EXISTS "Users can view all checkins" ON checkins;
DROP POLICY IF EXISTS "Users can insert their own checkins" ON checkins;
DROP POLICY IF EXISTS "Users can update their own checkins" ON checkins;
DROP POLICY IF EXISTS "Users can delete their own checkins" ON checkins;
CREATE POLICY "Users can view all checkins" ON checkins FOR SELECT USING (true);
CREATE POLICY "Users can insert their own checkins" ON checkins FOR INSERT WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "Users can update their own checkins" ON checkins FOR UPDATE USING ((select auth.uid()) = user_id);
CREATE POLICY "Users can delete their own checkins" ON checkins FOR DELETE USING ((select auth.uid()) = user_id);

-- Groups
DROP POLICY IF EXISTS "Users can view all groups" ON groups;
DROP POLICY IF EXISTS "Users can insert groups" ON groups;
DROP POLICY IF EXISTS "Owners can update groups" ON groups;
CREATE POLICY "Users can view all groups" ON groups FOR SELECT USING (true);
CREATE POLICY "Users can insert groups" ON groups FOR INSERT WITH CHECK ((select auth.uid()) = owner_id);
CREATE POLICY "Owners can update groups" ON groups FOR UPDATE USING ((select auth.uid()) = owner_id);

-- Group Members
DROP POLICY IF EXISTS "Users can view all group_members" ON group_members;
DROP POLICY IF EXISTS "Users can insert group_members" ON group_members;
DROP POLICY IF EXISTS "Users can delete their own membership" ON group_members;
CREATE POLICY "Users can view all group_members" ON group_members FOR SELECT USING (true);
CREATE POLICY "Users can insert group_members" ON group_members FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can delete their own membership" ON group_members FOR DELETE USING ((select auth.uid()) = user_id);
