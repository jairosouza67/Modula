# Guia Passo a Passo: Configuração de DNS no Resend

Este guia orienta de forma simples e direta sobre como configurar as entradas DNS no seu provedor de domínio (como Hostinger, Registro.br, GoDaddy, Cloudflare, etc.) para ativar o envio de e-mails reais em produção através do Resend no **ModulaAPP**.

---

## 1. Por que essa configuração é necessária?
O Resend impede o envio de e-mails usando domínios de terceiros (como `@gmail.com` ou `@hotmail.com`) por motivos de segurança anti-spam internacional. Para que o ModulaAPP possa enviar e-mails de Notas Fiscais diretamente para seus clientes, você precisa provar que é o proprietário do seu domínio adicionando registros DNS nele.

---

## 2. Acessando a Zona de DNS (Ex: Hostinger)
1. Faça login no seu painel da **Hostinger** (ou do seu provedor de domínio).
2. Vá na aba **Domínios** e clique no seu domínio (ex: `seudominio.com.br`).
3. No menu lateral esquerdo, clique em **Editor de Zona DNS** (ou Gerenciar DNS).

---

## 3. Adicionando as Entradas DNS

Adicione os 4 registros a seguir na tabela de DNS do seu painel.

### Registro 1: Autenticação de E-mail (DKIM)
Este registro garante que o e-mail não seja adulterado no caminho.
* **Tipo**: `TXT`
* **Nome / Host / Apelido**: `resend._domainkey`
  *(Nota: Se o painel da Hostinger preencher automaticamente o final com seu domínio, deve ficar `resend._domainkey.seudominio.com.br`)*
* **Conteúdo / Valor**: Copie o valor longo gerado no painel do Resend (começa com `p=MIGfMA...`)
* **TTL**: Padrão (Auto ou 3600)

### Registro 2: Autorização de Envio (SPF)
Este registro informa aos provedores de e-mail (como Gmail, Outlook) que o Resend está autorizado a enviar mensagens em nome do seu domínio.
* **Tipo**: `TXT`
* **Nome / Host / Apelido**: `send`
  *(Nota: Isso criará o subdomínio `send.seudominio.com.br`)*
* **Conteúdo / Valor**: Copie o valor de texto do SPF fornecido pelo Resend (começa com `v=spf1 ...`)
* **TTL**: Padrão (Auto ou 3600)

### Registro 3: Roteamento de Respostas (MX)
Este registro gerencia respostas enviadas para o subdomínio de e-mail.
* **Tipo**: `MX`
* **Nome / Host / Apelido**: `send`
* **Aponta para / Servidor de E-mail**: Copie o valor fornecido na coluna Content (ex: `feedback-smtp.us-east-1.amazonses.com` ou similar do Resend)
* **Prioridade**: `10`
* **TTL**: Padrão (Auto ou 3600)

### Registro 4: Segurança contra Phishing (DMARC - Opcional, mas Recomendado)
Informa aos servidores o que fazer se um e-mail não passar nos testes DKIM/SPF.
* **Tipo**: `TXT`
* **Nome / Host / Apelido**: `_dmarc`
* **Conteúdo / Valor**: `v=DMARC1; p=none;`
* **TTL**: Padrão (Auto ou 3600)

---

## 4. Finalizando a Verificação no Resend
1. Após salvar os registros no seu painel de DNS, voltar à página do Resend.
2. Clique no botão preto **"I've added the records"** (Eu adicionei os registros).
3. O status do domínio mudará de **Pending** (Pendente) para **Verified** (Verificado). 
   *(Atenção: A propagação dos registros na internet pode levar de **5 minutos até 2 horas**)*.

---

## 5. Atualizando o ModulaAPP com seu Domínio

Uma vez que o domínio esteja marcado como **Verified** no Resend:

1. No terminal do projeto, configure o e-mail de envio oficial (remetente) rodando o seguinte comando:
   ```powershell
   npx supabase secrets set RESEND_FROM_EMAIL="ModulaAPP <nfe@seudominio.com.br>"
   ```
   *(Substitua `nfe@seudominio.com.br` pelo endereço que deseja usar como remetente)*.

2. Teste novamente a entrega usando o script criado:
   ```powershell
   node scripts/testar-resend-email.mjs jairosouza67@gmail.com
   ```
   Dessa vez, a mensagem chegará com sucesso em qualquer destinatário!
