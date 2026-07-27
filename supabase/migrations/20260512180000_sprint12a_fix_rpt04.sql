-- =================================================================
-- Sprint 12A Fix — Trigger e Relatório RPT-04
-- =================================================================

-- 1. Trigger de status inicial (faltante na migration original)
DROP TRIGGER IF EXISTS trg_pedido_compra_status_inicial ON pedidos_compra;
CREATE TRIGGER trg_pedido_compra_status_inicial
  BEFORE INSERT ON pedidos_compra
  FOR EACH ROW EXECUTE FUNCTION trg_status_inicial_pedido();

-- 2. View para Relatório RPT-04: Compras por Fornecedor
CREATE OR REPLACE VIEW v_compras_por_fornecedor AS
SELECT 
  f.id as fornecedor_id,
  f.nome as fornecedor_nome,
  f.empresa_id,
  COUNT(pc.id) as total_pedidos,
  SUM(pc.valor_total) as valor_total_compras,
  SUM(pc.area_total_m2) as volume_total_m2,
  COUNT(pc.id) FILTER (WHERE pc.status = 'concluido' AND pc.data_conclusao <= pc.previsao_entrega) as entregues_no_prazo,
  CASE 
    WHEN COUNT(pc.id) FILTER (WHERE pc.status = 'concluido') > 0 
    THEN (COUNT(pc.id) FILTER (WHERE pc.status = 'concluido' AND pc.data_conclusao <= pc.previsao_entrega) * 100.0 / COUNT(pc.id) FILTER (WHERE pc.status = 'concluido'))
    ELSE 0 
  END as perc_no_prazo
FROM fornecedores f
LEFT JOIN pedidos_compra pc ON f.id = pc.fornecedor_id
GROUP BY f.id, f.nome, f.empresa_id;

-- RLS para a View
ALTER VIEW v_compras_por_fornecedor SET (security_invoker = on);
