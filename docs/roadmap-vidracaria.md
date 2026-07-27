# Roadmap de funcionalidades — Sistema de Vidraçaria

> Use este documento para acompanhar o desenvolvimento de cada área do sistema.
> Marque os itens com `[x]` conforme forem concluídos.
> Itens marcados com `(plus)` são opcionais — implementar após o núcleo estar funcional.

---

## Legenda

- `[ ]` — Pendente
- `[x]` — Concluído
- `(plus)` — Funcionalidade adicional, não obrigatória no MVP

---

## 1. Operacional

### Dashboard

- [X] Resumo de OS abertas, atrasadas e entregues
- [X] Total de orçamentos do mês
- [X] Alertas de estoque baixo
- [X] Faturamento do mês (valor simples)

### Orçamentos

- [X] Cadastro de orçamento com itens de vidro
- [X] Cálculo de m² automático por item
- [X] Geração de PDF do orçamento
- [X] Conversão de orçamento em OS
- [X] Status: rascunho / enviado / aprovado / recusado
- [X] Remover Orçamento criado.
- [X] Roles definidas.

### Pedidos / OS

- [X] Criação de OS a partir de orçamento ou avulso
- [X] Status: aberto / produção / pronto / entregue
- [X] Alerta automático de OS com prazo vencido
- [X] Campos: cliente, prazo, responsável, observações

### Produção

- [X] Lista de itens a produzir por OS
- [ ] Marcação de tipo de processamento por item `(plus)`
- [X] Status de cada item: aguardando / em processo / pronto
- [ ] Plano de corte simplificado — lista de medidas agrupadas `(plus)`

---

## 2. Comercial

### Clientes

- [X] Cadastro com nome, CPF/CNPJ, telefone, e-mail, endereço
- [X] Histórico de OS e orçamentos do cliente
- [X] Busca e filtro rápido

### Fornecedores

- [X] Cadastro com CNPJ, contato e prazo de entrega
- [X] Listagem de produtos por fornecedor

### Produtos / Materiais

- [X] Cadastro de vidros e insumos com unidade e preço
- [X] Vínculo com fornecedor
- [X] Controle de preço de custo × venda

---

## 3. Compras

### Fluxo de compra

- [X] Criação de pedido de compra (produto, quantidade, fornecedor)
- [X] Status: rascunho / enviado / recebido / cancelado
- [X] Aprovação simples pelo administrador
- [X] Recebimento parcial ou total

### Entrada de NF

- [X] Registro de NF de entrada com chave e valor
- [X] Vínculo com pedido de compra
- [X] Atualização automática do estoque ao confirmar

## 4. Logística

### Estoque

- [X] Saldo atual por produto
- [X] Movimentações de entrada e saída
- [X] Alerta de estoque mínimo
- [X] Ajuste manual de inventário

### Instalações

- [X] Agenda de instalações (data, horário, endereço)
- [X] Vínculo com OS
- [X] Atribuição de equipe / instalador
- [X] Status: agendado / em rota / concluído

---

## 5. Financeiro

### Contas a receber

- [X] Lançamento de parcelas vinculadas a OS
- [X] Status: pendente / recebido / vencido
- [X] Baixa de pagamento manual

### Contas a pagar

- [X] Lançamento de despesas e compras
- [X] Vencimento e status de pagamento

### Visão geral

- [X] Resumo mensal: entradas, saídas e saldo
- [X] DRE simplificado — receita menos custos igual a resultado `(plus)`

---

## 6. Fiscal

### NF-e de saída

- [X] Emissão de NF-e vinculada à OS (Mock)
- [X] Campos básicos: cliente, produtos, valor e impostos (mock)
- [X] Envio ao cliente por e-mail (Mock)

### Obrigações (básico)

- [X] Calendário de vencimentos (DAS, FGTS)
- [X] Registro de pagamento das guias

---

## 7. Gestão

### RH básico

- [X] Cadastro de funcionários com cargo e salário
- [ ] Registro de ponto simplificado `(plus)`

### Relatórios essenciais

- [X] OS por período (volume e prazo)
- [X] Faturamento por cliente (melhorar gráfico)
- [X] Produtos mais vendidos (m² e valor)
- [X] Inadimplência — contas vencidas

### Configurações

- [X] Dados da empresa (nome, CNPJ, logo)
- [X] Usuários e perfis de acesso
- [X] Tabela de preços de vidros por m²

---

## Ordem sugerida de desenvolvimento

| Etapa | Área       | Motivo                                           |
| ----- | ----------- | ------------------------------------------------ |
| 1     | Comercial   | Base de clientes, fornecedores e produtos        |
| 2     | Operacional | Core do negócio — orçamentos e OS             |
| 3     | Logística  | Estoque alimentado pelas OS e compras            |
| 4     | Compras     | Entrada de mercadoria e atualização de estoque |
| 5     | Financeiro  | Controle de caixa a partir das OS finalizadas    |
| 6     | Fiscal      | NF-e de saída e obrigações mensais            |
| 7     | Gestão     | Relatórios e RH após o sistema estar rodando   |

---

*Última atualização: maio de 2026*
