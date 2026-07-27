-- Migration: Adicionar atributos RPG, vida, e nova fórmula de level/XP

DO $$ 
BEGIN 
    BEGIN
        ALTER TABLE user_stats ADD COLUMN IF NOT EXISTS discipline INT DEFAULT 10;
    EXCEPTION WHEN duplicate_column THEN END;
    
    BEGIN
        ALTER TABLE user_stats ADD COLUMN IF NOT EXISTS stamina INT DEFAULT 100;
    EXCEPTION WHEN duplicate_column THEN END;

    BEGIN
        ALTER TABLE user_stats ADD COLUMN IF NOT EXISTS hp INT DEFAULT 100;
    EXCEPTION WHEN duplicate_column THEN END;

    BEGIN
        ALTER TABLE user_stats ADD COLUMN IF NOT EXISTS max_hp INT DEFAULT 100;
    EXCEPTION WHEN duplicate_column THEN END;
    
    BEGIN
        ALTER TABLE user_stats ADD COLUMN IF NOT EXISTS strength INT DEFAULT 10;
    EXCEPTION WHEN duplicate_column THEN END;
    
    BEGIN
        ALTER TABLE user_stats ADD COLUMN IF NOT EXISTS speed INT DEFAULT 10;
    EXCEPTION WHEN duplicate_column THEN END;
    
    BEGIN
        ALTER TABLE user_stats ADD COLUMN IF NOT EXISTS endurance INT DEFAULT 10;
    EXCEPTION WHEN duplicate_column THEN END;

    BEGIN
        ALTER TABLE checkins ADD COLUMN IF NOT EXISTS intensity INT DEFAULT 5;
    EXCEPTION WHEN duplicate_column THEN END;
END $$;

-- Atualizar RPC de Check-in para incorporar os atributos e a lógica de XP

CREATE OR REPLACE FUNCTION processar_checkin(
    p_title text,
    p_type text,
    p_duration_minutes int DEFAULT NULL,
    p_image_url text DEFAULT NULL,
    p_group_id uuid DEFAULT NULL,
    p_intensity int DEFAULT 5
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id uuid;
    v_xp_earned int;
    v_coins_earned int;
    v_new_total_xp int;
    v_new_coins int;
    v_new_level int;
    v_curr_level int;
    v_curr_xp int;
    v_curr_coins int;
    v_checkin_id uuid;
    
    -- Atributos
    v_hp int;
    v_max_hp int;
    v_stamina int;
    v_str int;
    v_spd int;
    v_end int;
    v_disc int;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Não autorizado';
    END IF;

    -- Cálculo de XP (duração * intensidade) / 5
    -- Se duration não for passado, assumimos 30 min como base para não quebrar checkins rápidos
    v_xp_earned := (COALESCE(p_duration_minutes, 30) * COALESCE(p_intensity, 5)) / 5;
    
    IF p_image_url IS NOT NULL THEN
        v_xp_earned := v_xp_earned + 20;
    END IF;

    v_coins_earned := v_xp_earned;

    -- Inserir checkin
    INSERT INTO checkins(user_id, group_id, title, type, duration_minutes, image_url, xp_earned, coins_earned, intensity)
    VALUES (v_user_id, p_group_id, p_title, p_type, p_duration_minutes, p_image_url, v_xp_earned, v_coins_earned, p_intensity)
    RETURNING id INTO v_checkin_id;

    -- Buscar stats atuais
    SELECT total_xp, coins, level, hp, max_hp, stamina, strength, speed, endurance, discipline 
    INTO v_curr_xp, v_curr_coins, v_curr_level, v_hp, v_max_hp, v_stamina, v_str, v_spd, v_end, v_disc
    FROM user_stats WHERE user_id = v_user_id;

    IF FOUND THEN
        v_new_total_xp := v_curr_xp + v_xp_earned;
        v_new_coins := v_curr_coins + v_coins_earned;
        
        -- Atualizar atributos baseado no tipo de treino
        IF p_type = 'Musculação' THEN
            v_str := COALESCE(v_str, 10) + 2;
            v_max_hp := COALESCE(v_max_hp, 100) + 5;
        ELSIF p_type = 'Corrida' OR p_type = 'Ciclismo' THEN
            v_spd := COALESCE(v_spd, 10) + 2;
            v_end := COALESCE(v_end, 10) + 1;
            v_stamina := COALESCE(v_stamina, 100) + 5;
        ELSIF p_type = 'Funcional' OR p_type = 'Crossfit' THEN
            v_end := COALESCE(v_end, 10) + 2;
            v_stamina := COALESCE(v_stamina, 100) + 5;
            v_disc := COALESCE(v_disc, 10) + 1;
        ELSIF p_type = 'Yoga' OR p_type = 'Artes Marciais' THEN
            v_disc := COALESCE(v_disc, 10) + 2;
            v_stamina := COALESCE(v_stamina, 100) + 5;
        ELSIF p_type = 'Natação' THEN
            v_end := COALESCE(v_end, 10) + 2;
            v_spd := COALESCE(v_spd, 10) + 1;
        END IF;

        -- Regenerar HP por treinar (+20% do max) - usuário revive ou fortalece progresso
        v_hp := LEAST(COALESCE(v_hp, 100) + (COALESCE(v_max_hp, 100) * 0.20)::int, COALESCE(v_max_hp, 100));
        
        -- Curva de Nível (1 a 50)
        -- XP req = 25 * (L^2)  (ex: Lv2=100, Lv5=625, Lv10=2500, Lv20=10000, Lv50=62500)
        v_new_level := 1;
        WHILE v_new_level < 50 AND v_new_total_xp >= (25 * (v_new_level + 1) * (v_new_level + 1)) LOOP
            v_new_level := v_new_level + 1;
        END LOOP;

        UPDATE user_stats 
        SET total_xp = v_new_total_xp,
            coins = v_new_coins,
            level = v_new_level,
            checkins_count = checkins_count + 1,
            hp = v_hp,
            max_hp = v_max_hp,
            stamina = v_stamina,
            strength = v_str,
            speed = v_spd,
            endurance = v_end,
            discipline = v_disc
        WHERE user_id = v_user_id;
    ELSE
        -- Usuário novo sem stats
        v_new_level := 1;
        v_new_total_xp := v_xp_earned;
        v_new_coins := v_coins_earned;
        
        v_hp := 100;
        v_max_hp := 100;
        v_stamina := 100;
        v_str := 10;
        v_spd := 10;
        v_end := 10;
        v_disc := 10;

        IF p_type = 'Musculação' THEN v_str := v_str + 2; v_max_hp := v_max_hp + 5;
        ELSIF p_type = 'Corrida' OR p_type = 'Ciclismo' THEN v_spd := v_spd + 2; v_end := v_end + 1; v_stamina := v_stamina + 5;
        ELSIF p_type = 'Funcional' OR p_type = 'Crossfit' THEN v_end := v_end + 2; v_stamina := v_stamina + 5; v_disc := v_disc + 1;
        ELSIF p_type = 'Yoga' OR p_type = 'Artes Marciais' THEN v_disc := v_disc + 2; v_stamina := v_stamina + 5;
        ELSIF p_type = 'Natação' THEN v_end := v_end + 2; v_spd := v_spd + 1;
        END IF;

        INSERT INTO user_stats(user_id, total_xp, coins, level, checkins_count, hp, max_hp, stamina, strength, speed, endurance, discipline)
        VALUES (v_user_id, v_new_total_xp, v_new_coins, v_new_level, 1, v_hp, v_max_hp, v_stamina, v_str, v_spd, v_end, v_disc);
    END IF;

    -- Update avatar stage (Stage 1 to 5 mapping 50 levels)
    -- Stage 1 (Nv 1-10), Stage 2 (Nv 11-20), Stage 3 (Nv 21-30), Stage 4 (Nv 31-40), Stage 5 (Nv 41-50)
    INSERT INTO avatars (user_id, stage) 
    VALUES (v_user_id, (CASE 
        WHEN v_new_level >= 41 THEN 5 
        WHEN v_new_level >= 31 THEN 4 
        WHEN v_new_level >= 21 THEN 3 
        WHEN v_new_level >= 11 THEN 2 
        ELSE 1 END))
    ON CONFLICT (user_id) DO UPDATE SET stage = EXCLUDED.stage;

    RETURN jsonb_build_object(
        'checkin_id', v_checkin_id,
        'xp_earned', v_xp_earned,
        'coins_earned', v_coins_earned,
        'new_total_xp', v_new_total_xp,
        'new_level', v_new_level,
        'old_level', COALESCE(v_curr_level, 0),
        'attributes_gained', (
            CASE 
                WHEN p_type = 'Musculação' THEN '+2 STR, +5 Max HP'
                WHEN p_type = 'Corrida' OR p_type = 'Ciclismo' THEN '+2 SPD, +1 END, +5 STM'
                WHEN p_type = 'Funcional' OR p_type = 'Crossfit' THEN '+2 END, +1 DISC, +5 STM'
                WHEN p_type = 'Yoga' OR p_type = 'Artes Marciais' THEN '+2 DISC, +5 STM'
                WHEN p_type = 'Natação' THEN '+2 END, +1 SPD'
                ELSE ''
            END
        )
    );
END;
$$;

-- Função de penalidade (Perda de HP leve para usuários)
CREATE OR REPLACE FUNCTION aplicar_penalidade(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_hp int;
    v_max_hp int;
BEGIN
    SELECT hp, max_hp INTO v_hp, v_max_hp FROM user_stats WHERE user_id = p_user_id;
    IF FOUND THEN
        -- Penalidade de 10% do HP, mas nunca cai abaixo de 20% do MAX HP (nunca morre)
        v_hp := GREATEST(v_hp - (v_max_hp * 0.10)::int, (v_max_hp * 0.20)::int);
        
        UPDATE user_stats 
        SET hp = v_hp,
            stamina = GREATEST(COALESCE(stamina, 100) - 10, 0),
            discipline = GREATEST(COALESCE(discipline, 10) - 2, 0)
        WHERE user_id = p_user_id;
    END IF;
END;
$$;

-- Função recuperar HP
CREATE OR REPLACE FUNCTION regenerar_hp(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_hp int;
    v_max_hp int;
BEGIN
    SELECT hp, max_hp INTO v_hp, v_max_hp FROM user_stats WHERE user_id = p_user_id;
    IF FOUND THEN
        UPDATE user_stats 
        SET hp = LEAST(COALESCE(v_hp, 100) + (COALESCE(v_max_hp, 100) * 0.20)::int, COALESCE(v_max_hp, 100)),
            stamina = LEAST(COALESCE(stamina, 100) + 20, 100)
        WHERE user_id = p_user_id;
    END IF;
END;
$$;
