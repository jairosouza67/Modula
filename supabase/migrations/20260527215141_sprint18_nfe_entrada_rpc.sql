CREATE OR REPLACE FUNCTION registrar_nfe_entrada(
  p_empresa_id UUID,
  p_fornecedor_id UUID,
  p_fornecedor_nome TEXT,
  p_numero TEXT,
  p_serie TEXT,
  p_chave_acesso TEXT,
  p_data_emissao DATE,
  p_valor_total NUMERIC,
  p_pedido_compra_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_nfe_id UUID;
  v_item RECORD;
  v_estoque_id UUID;
  v_forn_id UUID;
BEGIN
  -- Se p_pedido_compra_id foi informado, buscar o fornecedor dele
  v_forn_id := p_fornecedor_id;
  IF p_pedido_compra_id IS NOT NULL AND v_forn_id IS NULL THEN
    SELECT fornecedor_id INTO v_forn_id
    FROM pedidos_compra
    WHERE id = p_pedido_compra_id AND empresa_id = p_empresa_id;
  END IF;

  -- Insere a NFe
  INSERT INTO nfe_entrada (
    empresa_id, fornecedor_id, fornecedor_nome, numero, serie, chave_acesso, data_emissao, valor_total, pedido_compra_id
  ) VALUES (
    p_empresa_id, v_forn_id, p_fornecedor_nome, p_numero, p_serie, p_chave_acesso, p_data_emissao, p_valor_total, p_pedido_compra_id
  ) RETURNING id INTO v_nfe_id;

  -- Atualiza o pedido e estoque
  IF p_pedido_compra_id IS NOT NULL THEN
    UPDATE pedidos_compra SET status = 'recebido_total' WHERE id = p_pedido_compra_id AND empresa_id = p_empresa_id;

    FOR v_item IN (SELECT * FROM pedidos_compra_itens WHERE pedido_id = p_pedido_compra_id) LOOP
      
      SELECT id INTO v_estoque_id
      FROM estoque_itens
      WHERE empresa_id = p_empresa_id AND nome_produto = v_item.produto;

      IF v_estoque_id IS NULL THEN
        INSERT INTO estoque_itens (empresa_id, nome_produto, quantidade, estoque_minimo, unidade)
        VALUES (p_empresa_id, v_item.produto, 0, 0, 'UN')
        RETURNING id INTO v_estoque_id;
      END IF;

      INSERT INTO estoque_movimentacoes (
        item_id, tipo, quantidade, observacao
      ) VALUES (
        v_estoque_id, 'entrada', v_item.quantidade,
        'Entrada via NFe: ' || p_chave_acesso || ' (Pedido: ' || p_pedido_compra_id || ')'
      );

    END LOOP;
  END IF;

  RETURN jsonb_build_object('nfe_id', v_nfe_id);
END;
$$;
