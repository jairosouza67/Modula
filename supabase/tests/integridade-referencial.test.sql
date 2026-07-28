    -- pgTAP tests para Integridade Referencial (INT-01 a INT-05)
    BEGIN;

    -- Instala a extensão pgTAP no schema public (caso não exista no db de teste)
    CREATE EXTENSION IF NOT EXISTS pgtap;

    -- Define o plano de testes (5 testes esperados)
    SELECT plan(5);

    -- =====================================================================
    -- Setup Temporário de Dados
    -- =====================================================================

    -- Empresa e Fornecedor
    INSERT INTO empresas (id, razao_social, cnpj) VALUES ('e0000000-0000-0000-0000-000000000001', 'ModulaAPP Teste', '00000000000000');
    INSERT INTO fornecedores (id, empresa_id, razao_social, cnpj) VALUES ('f0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 'Fornecedor A', '11111111111111');

    -- Cliente e Orçamento
    INSERT INTO clientes (id, empresa_id, tipo, nome) VALUES ('c0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 'pf', 'Cliente Teste');
    INSERT INTO orcamentos (id, empresa_id, cliente_id, data_validade, itens, total) VALUES ('o0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', CURRENT_DATE, '[]', 100.00);

    -- OS e NF-e
    INSERT INTO ordens_servico (id, empresa_id, cliente_id, orcamento_id, prazo_entrega, itens) VALUES ('s0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'o0000000-0000-0000-0000-000000000001', CURRENT_DATE, '[]');
    -- (Mock) NF-e associada à OS
    INSERT INTO nfe_saida (id, empresa_id, os_id, numero, valor_total) 
    VALUES ('n0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 's0000000-0000-0000-0000-000000000001', '123', 100.00);

    -- Pedido Compra e Romaneio
    INSERT INTO pedidos_compra (id, empresa_id, fornecedor_id, tipo_documento, previsao_entrega) VALUES ('p0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001', 'pedido_compra', CURRENT_DATE);
    INSERT INTO romaneios (id, empresa_id, pedido_compra_id) VALUES ('r0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 'p0000000-0000-0000-0000-000000000001');

    -- =====================================================================
    -- Execução dos Testes
    -- =====================================================================

    -- INT-01: OS com NF-e não exclui (Neste caso, mockaremos a constraint ou trigger que impede a exclusão)
    -- Depende da tabela nfe_saida ter FK para ordens_servico com ON DELETE RESTRICT
    SELECT throws_ok(
        $$ DELETE FROM ordens_servico WHERE id = 's0000000-0000-0000-0000-000000000001' $$,
        '23503', -- Código de erro para foreign_key_violation
        null,
        'INT-01: Não deve ser possível excluir OS com NF-e ou faturamento vinculado'
    );

    -- INT-02: PC com Romaneio não exclui
    SELECT throws_ok(
        $$ DELETE FROM pedidos_compra WHERE id = 'p0000000-0000-0000-0000-000000000001' $$,
        '23503',
        null,
        'INT-02: Não deve ser possível excluir Pedido de Compra com Romaneio recebido'
    );

    -- INT-03: Cliente com OS não exclui (hard delete)
    SELECT throws_ok(
        $$ DELETE FROM clientes WHERE id = 'c0000000-0000-0000-0000-000000000001' $$,
        '23503',
        null,
        'INT-03: Não deve ser possível fazer hard delete de Cliente com OS vinculada'
    );

    -- INT-04: Fornecedor com Pedido de Compra não exclui
    SELECT throws_ok(
        $$ DELETE FROM fornecedores WHERE id = 'f0000000-0000-0000-0000-000000000001' $$,
        '23503',
        null,
        'INT-04: Não deve ser possível excluir Fornecedor com Pedido de Compra vinculado'
    );

    -- INT-05: Orçamento convertido em OS não exclui
    SELECT throws_ok(
        $$ DELETE FROM orcamentos WHERE id = 'o0000000-0000-0000-0000-000000000001' $$,
        '23503',
        null,
        'INT-05: Não deve ser possível excluir Orçamento que foi convertido em OS'
    );

    -- Finaliza os testes e limpa o banco de testes (ROLLBACK desfaz as inserções de setup)
    SELECT * FROM finish();
    ROLLBACK;
