
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE TABLE public.user_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  total_xp INT NOT NULL DEFAULT 0,
  coins INT NOT NULL DEFAULT 0,
  level INT NOT NULL DEFAULT 1,
  checkins_count INT NOT NULL DEFAULT 0,
  discipline INT DEFAULT 10, stamina INT DEFAULT 100,
  hp INT DEFAULT 100, max_hp INT DEFAULT 100,
  strength INT DEFAULT 10, speed INT DEFAULT 10, endurance INT DEFAULT 10,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.user_stats TO authenticated;
GRANT SELECT ON public.user_stats TO anon;
GRANT ALL ON public.user_stats TO service_role;
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_stats viewable by all" ON public.user_stats FOR SELECT USING (true);
CREATE POLICY "users insert own stats" ON public.user_stats FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users update own stats" ON public.user_stats FOR UPDATE USING (auth.uid() = user_id);

CREATE TABLE public.avatars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  stage INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.avatars TO authenticated;
GRANT SELECT ON public.avatars TO anon;
GRANT ALL ON public.avatars TO service_role;
ALTER TABLE public.avatars ENABLE ROW LEVEL SECURITY;
CREATE POLICY "avatars viewable by all" ON public.avatars FOR SELECT USING (true);
CREATE POLICY "users insert own avatar" ON public.avatars FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users update own avatar" ON public.avatars FOR UPDATE USING (auth.uid() = user_id);

CREATE TABLE public.groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  photo_url TEXT,
  type TEXT NOT NULL DEFAULT 'public' CHECK (type IN ('public','private')),
  password TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.groups TO authenticated;
GRANT SELECT ON public.groups TO anon;
GRANT ALL ON public.groups TO service_role;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "groups viewable by all" ON public.groups FOR SELECT USING (true);
CREATE POLICY "authenticated create groups" ON public.groups FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "owners update groups" ON public.groups FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "owners delete groups" ON public.groups FOR DELETE USING (auth.uid() = owner_id);

CREATE TABLE public.group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(group_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.group_members TO authenticated;
GRANT SELECT ON public.group_members TO anon;
GRANT ALL ON public.group_members TO service_role;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "group_members viewable by all" ON public.group_members FOR SELECT USING (true);
CREATE POLICY "auth insert members" ON public.group_members FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "users leave group" ON public.group_members FOR DELETE USING (
  auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.groups g WHERE g.id = group_id AND g.owner_id = auth.uid())
);

CREATE TABLE public.group_blocked_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(group_id, user_id)
);
GRANT SELECT, INSERT, DELETE ON public.group_blocked_users TO authenticated;
GRANT ALL ON public.group_blocked_users TO service_role;
ALTER TABLE public.group_blocked_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "blocked viewable to owner/self" ON public.group_blocked_users FOR SELECT USING (
  auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.groups g WHERE g.id = group_id AND g.owner_id = auth.uid())
);
CREATE POLICY "owner block users" ON public.group_blocked_users FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.groups g WHERE g.id = group_id AND g.owner_id = auth.uid())
);
CREATE POLICY "owner unblock" ON public.group_blocked_users FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.groups g WHERE g.id = group_id AND g.owner_id = auth.uid())
);

CREATE TABLE public.group_join_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(group_id, user_id)
);
GRANT SELECT, INSERT, DELETE ON public.group_join_requests TO authenticated;
GRANT ALL ON public.group_join_requests TO service_role;
ALTER TABLE public.group_join_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "requests viewable to owner/self" ON public.group_join_requests FOR SELECT USING (
  auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.groups g WHERE g.id = group_id AND g.owner_id = auth.uid())
);
CREATE POLICY "users create own request" ON public.group_join_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "owner or requester delete" ON public.group_join_requests FOR DELETE USING (
  auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.groups g WHERE g.id = group_id AND g.owner_id = auth.uid())
);

CREATE TABLE public.checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  group_id UUID REFERENCES public.groups(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  image_url TEXT,
  duration_minutes INT,
  distance_km NUMERIC(6,2),
  xp_earned INT NOT NULL DEFAULT 0,
  coins_earned INT NOT NULL DEFAULT 0,
  intensity INT DEFAULT 5,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.checkins TO authenticated;
GRANT SELECT ON public.checkins TO anon;
GRANT ALL ON public.checkins TO service_role;
ALTER TABLE public.checkins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "checkins filtered select" ON public.checkins FOR SELECT USING (
  group_id IS NULL
  OR user_id = auth.uid()
  OR (SELECT type FROM public.groups g WHERE g.id = checkins.group_id) = 'public'
  OR EXISTS (SELECT 1 FROM public.group_members gm WHERE gm.group_id = checkins.group_id AND gm.user_id = auth.uid() AND gm.status = 'active')
);
CREATE POLICY "users insert own checkins" ON public.checkins FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users update own checkins" ON public.checkins FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "users delete own checkins" ON public.checkins FOR DELETE USING (auth.uid() = user_id);

CREATE TABLE public.likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checkin_id UUID NOT NULL REFERENCES public.checkins(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(checkin_id, user_id)
);
GRANT SELECT, INSERT, DELETE ON public.likes TO authenticated;
GRANT SELECT ON public.likes TO anon;
GRANT ALL ON public.likes TO service_role;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "likes viewable" ON public.likes FOR SELECT USING (true);
CREATE POLICY "users like" ON public.likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users unlike" ON public.likes FOR DELETE USING (auth.uid() = user_id);

CREATE TABLE public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checkin_id UUID NOT NULL REFERENCES public.checkins(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.comments TO authenticated;
GRANT SELECT ON public.comments TO anon;
GRANT ALL ON public.comments TO service_role;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "comments viewable" ON public.comments FOR SELECT USING (true);
CREATE POLICY "users comment" ON public.comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users delete own comment" ON public.comments FOR DELETE USING (auth.uid() = user_id);

CREATE TABLE public.body_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  weight NUMERIC(5,2),
  body_fat_percent NUMERIC(5,2),
  lean_mass NUMERIC(5,2),
  measurements JSONB,
  notes TEXT,
  measured_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.body_metrics TO authenticated;
GRANT ALL ON public.body_metrics TO service_role;
ALTER TABLE public.body_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own body metrics select" ON public.body_metrics FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own body metrics insert" ON public.body_metrics FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own body metrics update" ON public.body_metrics FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own body metrics delete" ON public.body_metrics FOR DELETE USING (auth.uid() = user_id);

CREATE TABLE public.seasons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.seasons TO authenticated, anon;
GRANT ALL ON public.seasons TO service_role;
ALTER TABLE public.seasons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "seasons viewable" ON public.seasons FOR SELECT USING (true);

CREATE TABLE public.season_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id UUID NOT NULL REFERENCES public.seasons(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  initial_body_metrics_id UUID REFERENCES public.body_metrics(id) ON DELETE SET NULL,
  final_body_metrics_id UUID REFERENCES public.body_metrics(id) ON DELETE SET NULL,
  xp_earned INT NOT NULL DEFAULT 0,
  bio_score NUMERIC(10,2) NOT NULL DEFAULT 0,
  medals JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(season_id, user_id)
);
GRANT SELECT, INSERT, UPDATE ON public.season_participants TO authenticated;
GRANT ALL ON public.season_participants TO service_role;
ALTER TABLE public.season_participants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "season participants viewable" ON public.season_participants FOR SELECT USING (true);
CREATE POLICY "users join season" ON public.season_participants FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users update own participation" ON public.season_participants FOR UPDATE USING (auth.uid() = user_id);

CREATE TABLE public.weekly_bosses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  hp INT NOT NULL,
  current_hp INT NOT NULL,
  group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.weekly_bosses TO authenticated, anon;
GRANT ALL ON public.weekly_bosses TO service_role;
ALTER TABLE public.weekly_bosses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bosses viewable" ON public.weekly_bosses FOR SELECT USING (true);

CREATE TABLE public.boss_damage_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  boss_id UUID NOT NULL REFERENCES public.weekly_bosses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  checkin_id UUID REFERENCES public.checkins(id) ON DELETE CASCADE,
  damage INT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.boss_damage_log TO authenticated, anon;
GRANT ALL ON public.boss_damage_log TO service_role;
ALTER TABLE public.boss_damage_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "damage log viewable" ON public.boss_damage_log FOR SELECT USING (true);

CREATE VIEW public.checkins_feed WITH (security_invoker=true) AS
SELECT
  c.id, c.user_id, c.group_id, c.title, c.type, c.image_url,
  c.duration_minutes, c.distance_km, c.xp_earned, c.coins_earned, c.created_at,
  p.username, p.avatar_url, us.level,
  g.name AS group_name, g.type AS group_type,
  (SELECT COUNT(*) FROM public.likes l WHERE l.checkin_id = c.id) AS likes_count,
  (SELECT COUNT(*) FROM public.comments cm WHERE cm.checkin_id = c.id) AS comments_count
FROM public.checkins c
JOIN public.profiles p ON c.user_id = p.id
LEFT JOIN public.user_stats us ON c.user_id = us.user_id
LEFT JOIN public.groups g ON c.group_id = g.id;
GRANT SELECT ON public.checkins_feed TO authenticated, anon;

CREATE VIEW public.global_ranking_view WITH (security_invoker=true) AS
SELECT us.user_id, us.total_xp, us.level, us.checkins_count, p.username, p.avatar_url
FROM public.user_stats us
JOIN public.profiles p ON us.user_id = p.id
ORDER BY us.total_xp DESC;
GRANT SELECT ON public.global_ranking_view TO authenticated, anon;

CREATE VIEW public.groups_view WITH (security_invoker=true) AS
SELECT
  g.id, g.name, g.description, g.owner_id, g.photo_url,
  g.type AS group_type, g.password, g.created_at,
  (SELECT COUNT(*) FROM public.group_members gm WHERE gm.group_id = g.id) AS member_count
FROM public.groups g;
GRANT SELECT ON public.groups_view TO authenticated, anon;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_user_stats_updated BEFORE UPDATE ON public.user_stats FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_avatars_updated BEFORE UPDATE ON public.avatars FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_groups_updated BEFORE UPDATE ON public.groups FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, username, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  ) ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_stats (user_id) VALUES (NEW.id) ON CONFLICT (user_id) DO NOTHING;
  INSERT INTO public.avatars (user_id, stage) VALUES (NEW.id, 1) ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.processar_checkin(
    p_title text, p_type text,
    p_duration_minutes int DEFAULT NULL, p_image_url text DEFAULT NULL,
    p_group_id uuid DEFAULT NULL, p_intensity int DEFAULT 5
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_user_id uuid; v_xp_earned int; v_coins_earned int;
    v_new_total_xp int; v_new_coins int; v_new_level int;
    v_curr_level int; v_curr_xp int; v_curr_coins int; v_checkin_id uuid;
    v_hp int; v_max_hp int; v_stamina int;
    v_str int; v_spd int; v_end int; v_disc int;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN RAISE EXCEPTION 'Não autorizado'; END IF;
    v_xp_earned := (COALESCE(p_duration_minutes, 30) * COALESCE(p_intensity, 5)) / 5;
    IF p_image_url IS NOT NULL THEN v_xp_earned := v_xp_earned + 20; END IF;
    v_coins_earned := v_xp_earned;
    INSERT INTO checkins(user_id, group_id, title, type, duration_minutes, image_url, xp_earned, coins_earned, intensity)
    VALUES (v_user_id, p_group_id, p_title, p_type, p_duration_minutes, p_image_url, v_xp_earned, v_coins_earned, p_intensity)
    RETURNING id INTO v_checkin_id;
    SELECT total_xp, coins, level, hp, max_hp, stamina, strength, speed, endurance, discipline
      INTO v_curr_xp, v_curr_coins, v_curr_level, v_hp, v_max_hp, v_stamina, v_str, v_spd, v_end, v_disc
      FROM user_stats WHERE user_id = v_user_id;
    IF FOUND THEN
        v_new_total_xp := v_curr_xp + v_xp_earned;
        v_new_coins := v_curr_coins + v_coins_earned;
        IF p_type = 'Musculação' THEN v_str := COALESCE(v_str,10)+2; v_max_hp := COALESCE(v_max_hp,100)+5;
        ELSIF p_type IN ('Corrida','Ciclismo') THEN v_spd := COALESCE(v_spd,10)+2; v_end := COALESCE(v_end,10)+1; v_stamina := COALESCE(v_stamina,100)+5;
        ELSIF p_type IN ('Funcional','Crossfit') THEN v_end := COALESCE(v_end,10)+2; v_stamina := COALESCE(v_stamina,100)+5; v_disc := COALESCE(v_disc,10)+1;
        ELSIF p_type IN ('Yoga','Artes Marciais') THEN v_disc := COALESCE(v_disc,10)+2; v_stamina := COALESCE(v_stamina,100)+5;
        ELSIF p_type = 'Natação' THEN v_end := COALESCE(v_end,10)+2; v_spd := COALESCE(v_spd,10)+1;
        END IF;
        v_hp := LEAST(COALESCE(v_hp,100) + (COALESCE(v_max_hp,100)*0.20)::int, COALESCE(v_max_hp,100));
        v_new_level := 1;
        WHILE v_new_level < 50 AND v_new_total_xp >= (25 * (v_new_level + 1) * (v_new_level + 1)) LOOP
            v_new_level := v_new_level + 1;
        END LOOP;
        UPDATE user_stats SET total_xp=v_new_total_xp, coins=v_new_coins, level=v_new_level,
            checkins_count=checkins_count+1, hp=v_hp, max_hp=v_max_hp, stamina=v_stamina,
            strength=v_str, speed=v_spd, endurance=v_end, discipline=v_disc
        WHERE user_id = v_user_id;
    ELSE
        v_new_level := 1; v_new_total_xp := v_xp_earned; v_new_coins := v_coins_earned;
        INSERT INTO user_stats(user_id, total_xp, coins, level, checkins_count)
        VALUES (v_user_id, v_new_total_xp, v_new_coins, v_new_level, 1);
    END IF;
    INSERT INTO avatars (user_id, stage) VALUES (v_user_id, (CASE
        WHEN v_new_level >= 41 THEN 5 WHEN v_new_level >= 31 THEN 4
        WHEN v_new_level >= 21 THEN 3 WHEN v_new_level >= 11 THEN 2 ELSE 1 END))
    ON CONFLICT (user_id) DO UPDATE SET stage = EXCLUDED.stage;
    RETURN jsonb_build_object(
        'checkin_id', v_checkin_id, 'xp_earned', v_xp_earned, 'coins_earned', v_coins_earned,
        'new_total_xp', v_new_total_xp, 'new_level', v_new_level, 'old_level', COALESCE(v_curr_level, 0)
    );
END; $$;

CREATE OR REPLACE FUNCTION public.aplicar_penalidade(p_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_hp int; v_max_hp int;
BEGIN
    SELECT hp, max_hp INTO v_hp, v_max_hp FROM user_stats WHERE user_id = p_user_id;
    IF FOUND THEN
        v_hp := GREATEST(v_hp - (v_max_hp * 0.10)::int, (v_max_hp * 0.20)::int);
        UPDATE user_stats SET hp = v_hp,
          stamina = GREATEST(COALESCE(stamina,100) - 10, 0),
          discipline = GREATEST(COALESCE(discipline,10) - 2, 0)
        WHERE user_id = p_user_id;
    END IF;
END; $$;

CREATE OR REPLACE FUNCTION public.regenerar_hp(p_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_hp int; v_max_hp int;
BEGIN
    SELECT hp, max_hp INTO v_hp, v_max_hp FROM user_stats WHERE user_id = p_user_id;
    IF FOUND THEN
        UPDATE user_stats
        SET hp = LEAST(COALESCE(v_hp,100) + (COALESCE(v_max_hp,100)*0.20)::int, COALESCE(v_max_hp,100)),
            stamina = LEAST(COALESCE(stamina,100) + 20, 100)
        WHERE user_id = p_user_id;
    END IF;
END; $$;

CREATE OR REPLACE FUNCTION public.calcular_bio_score(p_initial_metrics_id UUID, p_final_metrics_id UUID)
RETURNS numeric LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_initial_fat numeric; v_final_fat numeric; v_initial_lean numeric; v_final_lean numeric;
        v_fat_score numeric := 0; v_lean_score numeric := 0;
BEGIN
    SELECT body_fat_percent, lean_mass INTO v_initial_fat, v_initial_lean FROM body_metrics WHERE id = p_initial_metrics_id;
    SELECT body_fat_percent, lean_mass INTO v_final_fat, v_final_lean FROM body_metrics WHERE id = p_final_metrics_id;
    IF v_initial_fat IS NOT NULL AND v_final_fat IS NOT NULL THEN v_fat_score := (v_initial_fat - v_final_fat) * 100; END IF;
    IF v_initial_lean IS NOT NULL AND v_final_lean IS NOT NULL THEN v_lean_score := (v_final_lean - v_initial_lean) * 120; END IF;
    RETURN v_fat_score + v_lean_score;
END; $$;
