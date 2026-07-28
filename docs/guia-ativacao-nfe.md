# Guia de Ativação — Emissão de NF-e Real

## O que você vai fazer

1. Criar conta e gerar token na Focus NFe
2. Instalar o certificado digital A1
3. Configurar o webhook
4. Inserir o token no sistema
5. Emitir sua primeira nota

---

## PASSO 1 — Criar conta na Focus NFe

1. Acesse **[focusnfe.com.br](https://focusnfe.com.br)** e clique em **"Teste Grátis"**
2. Preencha com os dados da empresa:
   - CNPJ: `14.032.864/0001-08`
   - E-mail: `marmorariarc@hotmail.com`
3. Confirme o e-mail e faça login no painel

---

## PASSO 2 — Instalar o Certificado Digital A1

> ⚠️ Você precisa do arquivo `.pfx` do certificado + a senha dele.
> Peça ao seu contador se não tiver.

1. No painel da Focus NFe, vá em **Empresas → sua empresa**
2. Role até a seção **"Certificado Digital"**
3. Clique em **"Enviar Certificado"**
4. Selecione o arquivo `.pfx`
5. Digite a **senha do certificado**
6. Clique em **Salvar**

✅ Quando aparecer "Certificado válido" com a data de vencimento, está correto.

---

## PASSO 3 — Gerar o Token da API

1. No painel da Focus NFe, clique em **Configurações → Tokens de API**
2. Clique em **"Novo Token"**
3. Dê um nome (ex: `ModulaAPP`)
4. Selecione o ambiente:
   - **Homologação** → para testes (use primeiro!)
   - **Produção** → para notas reais (só depois de testar)
5. Clique em **Gerar**
6. **Copie o token** — ele só aparece uma vez!

> 💡 Guarde o token em local seguro. Se perder, precisará gerar outro.

---

## PASSO 4 — Configurar o Webhook

O webhook é o que avisa o sistema quando a SEFAZ autoriza a nota.

1. No painel da Focus NFe, vá em **Configurações → Webhooks**
2. Clique em **"Adicionar Webhook"**
3. Preencha:
   - **URL:** cole a URL abaixo (substitua `SEU-PROJETO` pelo ID do seu projeto Supabase):
     ```
     https://SEU-PROJETO.supabase.co/functions/v1/webhook-nfe
     ```
   - **Eventos:** marque os três:
     - ✅ `nfe.autorizada`
     - ✅ `nfe.cancelada`
     - ✅ `nfe.erro_autorizacao`
4. Clique em **Salvar**

> 💡 O ID do seu projeto Supabase está na URL do painel: `app.supabase.com/project/SEU-PROJETO`

---

## PASSO 5 — Inserir o Token no ModulaAPP

1. Abra o sistema ModulaAPP
2. Vá em **Configurações** (menu lateral)
3. Clique na aba **"Fiscal"**
4. Cole o token gerado no campo **"Token Focus NFe"**
5. Marque **"Ambiente de Produção"** se for emitir notas reais (deixe desmarcado para testes)
6. Clique em **"Salvar configuração fiscal"**

✅ Pronto — o sistema está conectado à Focus NFe.

---

## PASSO 6 — Emitir a Primeira Nota Fiscal

1. Vá em **Fiscal** (menu lateral)
2. Clique no botão **"Emitir NF-e"** (canto superior direito)
3. Preencha o formulário:
   - **Ordem de Serviço:** selecione a OS que gerou a venda
   - **CPF/CNPJ do cliente:** obrigatório
   - **Forma de pagamento:** selecione como o cliente pagou
4. Clique em **"Emitir Nota Fiscal"**
5. O status vai aparecer como **"Em Processamento"** (spinner azul)
6. Aguarde alguns segundos — quando a SEFAZ autorizar, o status muda automaticamente para **"Emitida"** ✅
7. Clique em **"DANFE"** para baixar o PDF da nota

---

## Fluxo de Status da Nota

```
Emitida pelo sistema → EM PROCESSAMENTO
         ↓
   SEFAZ autoriza → EMITIDA ✅  (baixar DANFE disponível)
         ou
   SEFAZ rejeita  → DENEGADA ❌  (motivo aparece na tabela)
```

---

## Cancelamento de Nota

1. Na tabela de NF-e, clique no menu **⋯** ao lado da nota
2. Selecione **"Cancelar NF-e"**
3. Digite a **justificativa** (mínimo 15 caracteres)
   - Ex: `"Venda cancelada a pedido do cliente"`
4. Confirme — a nota será cancelada na SEFAZ automaticamente

> ⚠️ O prazo para cancelamento é de **24 horas** após a autorização.

---

## Problemas Comuns

| Problema                                           | Solução                                                                     |
| -------------------------------------------------- | --------------------------------------------------------------------------- |
| Status ficou em "Em Processamento" por muito tempo | Verifique se o webhook está configurado corretamente no painel Focus NFe    |
| Nota aparece como "Denegada"                       | Leia o motivo na tabela. Geralmente é NCM errado ou dado do cliente ausente |
| Botão "Emitir" retorna erro de token               | Vá em Configurações → Fiscal e verifique se o token foi salvo               |
| Certificado inválido na Focus NFe                  | Verifique com o contador se o arquivo `.pfx` e a senha estão corretos       |

---

## Contato Focus NFe

- **Suporte:** [focusnfe.com.br/suporte](https://focusnfe.com.br/suporte)
- **Documentação:** [doc.focusnfe.com.br](https://doc.focusnfe.com.br)
- **Chat no painel:** disponível após login

Não existe token público compartilhado — cada conta tem o seu próprio token. Mas há uma boa notícia:

✅ O que você pode fazer agora (sem cartão, sem custo)
Criar conta gratuita em 5 minutos
Acesse app.focusnfe.com.br/cadastro
Preencha os dados básicos — sem cartão de crédito
Confirme o e-mail
No painel: Configurações → Tokens → Gerar token de Homologação
Pronto. Você tem um token de teste gratuito.

🔑 Vantagem do ambiente de Homologação
Não precisa do certificado A1 do cliente para testar.

No ambiente de homologação, a Focus NFe usa automaticamente um certificado genérico de testes — você consegue emitir notas de teste completas, ver o XML retornado, o webhook disparando e o status mudando no sistema, sem precisar do .pfx do cliente.

Ou seja, o fluxo de teste completo é:

Cria conta grátis → Pega token de homologação
↓
Cola o token em Configurações → Fiscal (com "Produção" desmarcado)
↓
Configura o webhook
↓
Emite nota de teste no sistema → vê status mudar para EMITIDA
↓
Quando cliente entregar o certificado A1:
instala na Focus NFe + troca para token de Produção → go live ✅
Então você consegue testar e validar tudo agora, e só na hora de ir para produção que precisará do certificado do cliente.
