-- Migration: Bio Score Calculation
CREATE OR REPLACE FUNCTION calcular_bio_score(
    p_initial_metrics_id UUID,
    p_final_metrics_id UUID
)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_initial_fat numeric;
    v_final_fat numeric;
    v_initial_lean numeric;
    v_final_lean numeric;
    v_fat_score numeric := 0;
    v_lean_score numeric := 0;
BEGIN
    SELECT body_fat_percent, lean_mass INTO v_initial_fat, v_initial_lean 
    FROM body_metrics WHERE id = p_initial_metrics_id;
    
    SELECT body_fat_percent, lean_mass INTO v_final_fat, v_final_lean 
    FROM body_metrics WHERE id = p_final_metrics_id;

    IF v_initial_fat IS NOT NULL AND v_final_fat IS NOT NULL THEN
        -- Positive score for losing fat: (15 - 14) * 100 = 100
        v_fat_score := (v_initial_fat - v_final_fat) * 100;
    END IF;

    IF v_initial_lean IS NOT NULL AND v_final_lean IS NOT NULL THEN
        -- Positive score for gaining lean mass: (50 - 48) * 120 = 240
        v_lean_score := (v_final_lean - v_initial_lean) * 120;
    END IF;

    RETURN v_fat_score + v_lean_score;
END;
$$;
