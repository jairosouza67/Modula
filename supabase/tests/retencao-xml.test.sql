-- pgTAP tests para Retenção Fiscal (RET-01 a RET-03)
BEGIN;

SELECT plan(3);

-- Setup
INSERT INTO empresas (id, razao_social, cnpj) VALUES ('e0000000-0000-0000-0000-000000000002', 'Empresa Fiscal Teste', '22222222222222');

-- RET-01: Verificação de existência da tabela de NF-e e campo de XML
SELECT has_table('nfe_saida', 'RET-01: Tabela nfe_saida deve existir');
SELECT has_column('nfe_saida', 'xml_autorizado', 'RET-01: Coluna xml_autorizado deve existir para retenção');

-- RET-02: Verificação de RLS na tabela fiscal
-- (Simula acesso de outra empresa)
SET ROLE authenticated;
SET "request.jwt.claims" TO '{"sub": "u0000000-0000-0000-0000-000000000001", "role": "authenticated", "app_metadata": {"empresa_id": "e0000000-0000-0000-0000-000000000001"}}';

INSERT INTO nfe_saida (id, empresa_id, numero, valor_total, xml_autorizado) 
VALUES ('n0000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000002', '456', 250.00, '<xml>teste</xml>');

SELECT results_eq(
    $$ SELECT count(*)::int FROM nfe_saida WHERE empresa_id = 'e0000000-0000-0000-0000-000000000002' $$,
    ARRAY[0],
    'RET-02: RLS deve impedir que uma empresa veja XML de outra'
);

-- RET-03: Verificação de Trigger para Auditoria Fiscal
-- (Assume que existe uma trigger que registra no log_auditoria ao inserir NF-e)
SELECT has_trigger('nfe_saida', 'tr_auditoria_fiscal', 'RET-03: Deve existir trigger de auditoria para operações fiscais');

SELECT * FROM finish();
ROLLBACK;
