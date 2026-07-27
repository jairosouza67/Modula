# Task — Implementação NF-e SEFAZ Real

## Gaps identificados no plano atual
- [ ] Migration SQL não foi criada no projeto
- [ ] Edge Functions não existem no projeto
- [ ] Clientes sem campos de endereço completo (CEP, bairro, UF) para NF-e
- [ ] Produtos sem campo NCM no formulário de cadastro
- [ ] Config page sem aba Fiscal (token + ambiente)
- [ ] useFiscalData.ts não chama Edge Function
- [ ] ModalEmitirNfe sem forma de pagamento
- [ ] _app.fiscal.tsx sem botão DANFE / status EM_PROCESSAMENTO / motivo rejeição
- [ ] Cancelamento de NF-e não chama Focus NFe API (só atualiza DB)
- [ ] Sem Realtime subscription para atualizar status automaticamente

## Execução

- [ ] **1. Migration SQL** — criar arquivo com todos os campos + empresa_secrets
- [ ] **2. Edge Function emitir-nfe** — criar supabase/functions/emitir-nfe/index.ts
- [ ] **3. Edge Function webhook-nfe** — criar supabase/functions/webhook-nfe/index.ts
- [ ] **4. Edge Function cancelar-nfe** — criar supabase/functions/cancelar-nfe/index.ts
- [ ] **5. useFiscalData.ts** — atualizar useEmitirNfe + useCancelarNfe + adicionar useNfeRealtime
- [ ] **6. ModalEmitirNfe.tsx** — adicionar forma de pagamento
- [ ] **7. _app.fiscal.tsx** — DANFE, spinner EM_PROCESSAMENTO, motivo rejeição, Realtime
- [ ] **8. _app.config.tsx** — nova aba "Fiscal" com formulário de token + ambiente
- [ ] **9. _app.produtos.tsx** — campo NCM no form de produto
