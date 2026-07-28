-- =================================================================
-- Sprint 12 — Configuração do Storage para XML de NFe
-- ModulaAPP — 2026-05-12
-- =================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('nfe_xml', 'nfe_xml', false)
ON CONFLICT (id) DO NOTHING;

-- Políticas de RLS para o storage.objects

CREATE POLICY "Usuários autenticados podem consultar xmls de nfe"
ON storage.objects FOR SELECT
USING (bucket_id = 'nfe_xml' AND auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem fazer upload de xmls"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'nfe_xml' AND auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem atualizar xmls"
ON storage.objects FOR UPDATE
USING (bucket_id = 'nfe_xml' AND auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem deletar xmls"
ON storage.objects FOR DELETE
USING (bucket_id = 'nfe_xml' AND auth.role() = 'authenticated');
