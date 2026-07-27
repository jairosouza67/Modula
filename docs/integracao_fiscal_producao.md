# Integração Fiscal para Produção — Relatório de Requisitos

## Resumo

Este documento descreve o que é necessário para substituir os mocks atuais do módulo Fiscal por integrações reais de **emissão de NF-e (SEFAZ)** e **envio de e-mail ao cliente**.

---

## 1. Emissão de NF-e (Integração SEFAZ)

### Status Atual (Mock)
- Gera número fictício aleatório
- Chave de acesso fake (random string)
- XML simplificado sem assinatura digital
- Nenhuma comunicação com a SEFAZ

### O que é necessário

| Item | Descrição |
|------|-----------|
| **Certificado Digital A1** | Arquivo `.pfx` (e-CNPJ) válido para assinatura das notas. Custo ~R$150–300/ano |
| **Provedor de emissão fiscal** | API intermediária que assina, transmite e retorna o XML autorizado |
| **Cadastro na SEFAZ** | Credenciamento para emissão em produção (após testes em homologação) |
| **Armazenamento de XML** | Supabase Storage ou S3 para guardar XMLs por 5 anos (obrigatório) |

### Provedores Recomendados

| Provedor | Preço Estimado | Observações |
|----------|---------------|-------------|
| [Focus NFe](https://focusnfe.com.br) | A partir de R$49/mês (50 notas) | API REST simples, boa documentação |
| [Nuvem Fiscal](https://nuvemfiscal.com.br) | A partir de R$39/mês | SDK JS disponível |
| [eNotas](https://enotas.com.br) | A partir de R$59/mês | Dashboard próprio, suporte bom |
| [Tecnospeed](https://tecnospeed.com.br) | Sob consulta | Mais robusto, ideal para volume alto |

### Fluxo de Implementação

```
1. Contratar provedor de emissão fiscal
2. Configurar certificado digital A1 no provedor
3. Criar Edge Function no Supabase:
   - Recebe dados da NF-e (cliente, itens, valores, impostos)
   - Chama API do provedor para emitir
   - Recebe XML autorizado + protocolo + chave de acesso real
   - Salva XML no Storage
   - Atualiza registro na tabela nfe_saida (status, chave_acesso, xml_path)
4. Testar em ambiente de homologação
5. Solicitar credenciamento em produção na SEFAZ-SP
6. Go-live
```

### Dados que já temos prontos
- ✅ Cliente (nome, documento)
- ✅ Itens (descrição, quantidade, valor)
- ✅ Valor total e impostos
- ✅ Tabela `nfe_saida` com campos necessários (numero, serie, chave_acesso, xml_path, status)

### Dados que faltam cadastrar
- ❌ NCM dos produtos (classificação fiscal)
- ❌ CFOP (código fiscal da operação, ex: 5102 para venda)
- ❌ Dados do emitente (razão social, endereço, inscrição estadual)
- ❌ Regime tributário formal configurado

---

## 2. Envio de E-mail da NF-e ao Cliente

### Status Atual (Mock)
- Simula delay de 1.2s
- Marca `email_enviado = true` no banco
- Não envia nada de verdade

### O que é necessário

| Item | Descrição |
|------|-----------|
| **Serviço de e-mail transacional** | API para envio programático de e-mails |
| **Domínio verificado** | Para enviar de `nfe@suaempresa.com.br` (evita spam) |
| **Template de e-mail** | HTML com dados da nota, link para download do XML/PDF |
| **Geração de PDF (DANFE)** | Converter XML autorizado em PDF visual da nota |

### Provedores Recomendados

| Provedor | Preço Estimado | Observações |
|----------|---------------|-------------|
| [Resend](https://resend.com) | Grátis até 3.000 e-mails/mês | API moderna, SDK JS, ideal para Supabase Edge Functions |
| [SendGrid](https://sendgrid.com) | Grátis até 100 e-mails/dia | Mais antigo, robusto |
| [Mailgun](https://mailgun.com) | $0.80 por 1.000 e-mails | Boa entregabilidade |
| [AWS SES](https://aws.amazon.com/ses) | $0.10 por 1.000 e-mails | Mais barato em escala |

### Fluxo de Implementação

```
1. Contratar serviço de e-mail (recomendo Resend pela simplicidade)
2. Verificar domínio (DNS: SPF, DKIM, DMARC)
3. Criar template HTML do e-mail da NF-e
4. Criar Edge Function no Supabase:
   - Recebe nfeId + email do cliente
   - Busca dados da NF-e no banco
   - Gera PDF da DANFE (ou anexa XML)
   - Envia e-mail via API do provedor
   - Atualiza email_enviado + email_enviado_em no banco
5. Testar com e-mails internos
6. Go-live
```

### Sobre a geração do PDF (DANFE)
- Pode usar biblioteca `danfe-js` ou `jspdf` para gerar localmente
- Ou o próprio provedor fiscal (Focus, Nuvem) já retorna o PDF pronto
- Armazenar PDF no Supabase Storage junto ao XML

---

## 3. Estimativa de Custos Mensais

| Serviço | Custo Estimado |
|---------|---------------|
| Provedor fiscal (50 notas/mês) | R$ 39–59/mês |
| Certificado digital A1 | ~R$ 20/mês (anualizado) |
| E-mail transacional (até 100 notas) | Grátis (Resend) ou ~R$ 5/mês |
| Storage (XMLs + PDFs) | Incluso no plano Supabase |
| **Total estimado** | **~R$ 60–85/mês** |

---

## 4. Prioridade de Implementação

| Fase | Entrega | Prazo Estimado |
|------|---------|----------------|
| **Fase 1** | Integração com provedor fiscal (homologação) | 1–2 semanas |
| **Fase 2** | Emissão real em produção + armazenamento XML | 1 semana |
| **Fase 3** | Envio de e-mail com PDF/XML anexo | 3–5 dias |
| **Fase 4** | Cancelamento de NF-e + carta de correção | 1 semana |

---

## 5. Variáveis de Ambiente Necessárias

```env
# Provedor Fiscal
FISCAL_PROVIDER_API_KEY=xxx
FISCAL_PROVIDER_URL=https://api.focusnfe.com.br/v2
FISCAL_ENVIRONMENT=homologacao  # ou producao

# Certificado Digital
FISCAL_CERT_BASE64=xxx  # .pfx codificado em base64
FISCAL_CERT_PASSWORD=xxx

# E-mail
RESEND_API_KEY=re_xxx
EMAIL_FROM=nfe@vidracaria.com.br
EMAIL_REPLY_TO=contato@vidracaria.com.br
```

---

## 6. Decisões Pendentes

- [ ] Escolher provedor fiscal (Focus NFe vs Nuvem Fiscal)
- [ ] Adquirir certificado digital A1 (e-CNPJ)
- [ ] Definir domínio de envio de e-mail
- [ ] Cadastrar NCM e CFOP nos produtos
- [ ] Completar dados do emitente (inscrição estadual, endereço fiscal)
