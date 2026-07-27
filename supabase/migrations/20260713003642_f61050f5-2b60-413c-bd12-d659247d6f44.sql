
REVOKE EXECUTE ON FUNCTION public.aplicar_penalidade(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.regenerar_hp(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.calcular_bio_score(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.processar_checkin(text, text, int, text, uuid, int) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.processar_checkin(text, text, int, text, uuid, int) TO authenticated;
