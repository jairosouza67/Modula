CREATE OR REPLACE FUNCTION processar_checkin(
    p_title text,
    p_type text,
    p_duration_minutes int DEFAULT NULL,
    p_image_url text DEFAULT NULL
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
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Não autorizado';
    END IF;

    -- Cálculo de XP
    v_xp_earned := 50; -- base
    IF p_image_url IS NOT NULL THEN
        v_xp_earned := v_xp_earned + 20;
    END IF;
    IF p_duration_minutes IS NOT NULL THEN
        IF p_duration_minutes > 60 THEN
            v_xp_earned := v_xp_earned + 50;
        ELSIF p_duration_minutes > 30 THEN
            v_xp_earned := v_xp_earned + 30;
        END IF;
        v_xp_earned := v_xp_earned + p_duration_minutes;
    END IF;

    v_coins_earned := v_xp_earned;

    -- Inserir checkin
    INSERT INTO checkins(user_id, title, type, duration_minutes, image_url, xp_earned, coins_earned)
    VALUES (v_user_id, p_title, p_type, p_duration_minutes, p_image_url, v_xp_earned, v_coins_earned)
    RETURNING id INTO v_checkin_id;

    -- Atualizar user_stats
    SELECT total_xp, coins, level INTO v_curr_xp, v_curr_coins, v_curr_level
    FROM user_stats WHERE user_id = v_user_id;

    IF FOUND THEN
        v_new_total_xp := v_curr_xp + v_xp_earned;
        v_new_coins := v_curr_coins + v_coins_earned;
        v_new_level := v_curr_level;

        IF v_new_total_xp > 1000 AND v_new_total_xp <= 2500 AND v_new_level < 5 THEN v_new_level := 5;
        ELSIF v_new_total_xp > 2500 AND v_new_total_xp <= 5000 AND v_new_level < 10 THEN v_new_level := 10;
        ELSIF v_new_total_xp > 5000 AND v_new_total_xp <= 10000 AND v_new_level < 15 THEN v_new_level := 15;
        ELSIF v_new_total_xp > 10000 AND v_new_level < 20 THEN v_new_level := 20;
        END IF;

        UPDATE user_stats 
        SET total_xp = v_new_total_xp,
            coins = v_new_coins,
            level = v_new_level,
            checkins_count = checkins_count + 1
        WHERE user_id = v_user_id;
    ELSE
        -- Usuário novo sem stats ainda
        v_new_level := 1;
        v_new_total_xp := v_xp_earned;
        v_new_coins := v_coins_earned;
        INSERT INTO user_stats(user_id, total_xp, coins, level, checkins_count)
        VALUES (v_user_id, v_new_total_xp, v_new_coins, v_new_level, 1);
    END IF;

    -- Tentar atualizar o avatar (básico, mas pode ser expandido futuramente ou acionado por trigger DB)
    -- Insert caso não exista, update caso contrário
    INSERT INTO avatars (user_id, stage) VALUES (v_user_id, (CASE WHEN v_new_level >= 20 THEN 5 WHEN v_new_level >= 15 THEN 4 WHEN v_new_level >= 10 THEN 3 WHEN v_new_level >= 5 THEN 2 ELSE 1 END))
    ON CONFLICT (user_id) DO UPDATE SET stage = EXCLUDED.stage;

    RETURN jsonb_build_object(
        'checkin_id', v_checkin_id,
        'xp_earned', v_xp_earned,
        'coins_earned', v_coins_earned,
        'new_total_xp', v_new_total_xp,
        'new_level', v_new_level
    );
END;
$$;
