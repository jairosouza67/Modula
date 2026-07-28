# Guia Completo — Integração e Migração do ModulaAPP para Supabase Self-Hosted

**Versão:** 1.0  
**Data:** 2026-07-24  
**Escopo:** procedimento operacional detalhado para subir o VidraERP em Supabase self-hosted (Docker/VPS), migrar schema/dados/storage/functions e fazer cutover com risco controlado.  
**Princípio absoluto:** o Supabase Cloud de produção **não é alterado** até o cutover deliberado. Tudo roda em **ambiente paralelo** até validação completa.

> Este documento substitui o runbook simplificado (`Runbook_Migracao_Supabase_SelfHosted.md`) como **fonte da verdade operacional**. O runbook antigo continua válido como visão rápida; este guia é o procedimento completo.

---

## Sumário

1. [Visão geral e arquitetura-alvo](#1-visão-geral-e-arquitetura-alvo)
2. [Inventário do sistema atual (VidraERP)](#2-inventário-do-sistema-atual-vidraerp)
3. [Premissas, riscos e decisões](#3-premissas-riscos-e-decisões)
4. [Fase 0 — Isolamento do repositório](#4-fase-0--isolamento-do-repositório)
5. [Fase 1 — Provisionar e endurecer a VPS](#5-fase-1--provisionar-e-endurecer-a-vps)
6. [Fase 2 — Subir o stack Supabase self-hosted](#6-fase-2--subir-o-stack-supabase-self-hosted)
7. [Fase 3 — Schema via migrations (fonte da verdade)](#7-fase-3--schema-via-migrations-fonte-da-verdade)
8. [Fase 4 — Migrar dados de negócio (`public`)](#8-fase-4--migrar-dados-de-negócio-public)
9. [Fase 5 — Migrar autenticação (usuários)](#9-fase-5--migrar-autenticação-usuários)
10. [Fase 6 — Migrar Storage](#10-fase-6--migrar-storage)
11. [Fase 7 — Deploy das Edge Functions](#11-fase-7--deploy-das-edge-functions)
12. [Fase 8 — Secrets e integrações externas](#12-fase-8--secrets-e-integrações-externas)
13. [Fase 9 — Frontend e variáveis de ambiente](#13-fase-9--frontend-e-variáveis-de-ambiente)
14. [Fase 10 — Jobs, cron e keepalive](#14-fase-10--jobs-cron-e-keepalive)
15. [Fase 11 — Matriz de validação](#15-fase-11--matriz-de-validação)
16. [Fase 12 — Backup, restore drill e monitoramento](#16-fase-12--backup-restore-drill-e-monitoramento)
17. [Fase 13 — Operação em paralelo](#17-fase-13--operação-em-paralelo)
18. [Fase 14 — Cutover (produção)](#18-fase-14--cutover-produção)
19. [Fase 15 — Rollback](#19-fase-15--rollback)
20. [Fase 16 — Pós-cutover (30 dias)](#20-fase-16--pós-cutover-30-dias)
21. [Anexos](#21-anexos)

---

## 1. Visão geral e arquitetura-alvo

### 1.1 O que existe hoje

| Camada | Onde roda hoje | Observação |
|---|---|---|
| Frontend (TanStack Start / Vite) | Netlify (`netlify.toml` → `dist/client`) | Usa `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` |
| Backend de dados | Supabase Cloud (Postgres + Auth + Storage + Edge Functions) | Projeto atual em produção |
| Auth | Supabase Auth (GoTrue) + `perfis_usuario` multi-empresa | Roles: superadmin, admin, gestor, vendedor, tecnico, financeiro |
| Fiscal | Edge Functions + Focus NFe | Homologação e produção |
| E-mail | Resend via `enviar-nfe-email` | DNS DKIM/SPF/MX no domínio |
| Storage | Bucket `nfe_xml` (privado) | Criado em migration `sprint12_storage` |

### 1.2 Arquitetura-alvo (self-hosted)

```
                    Internet
                        |
                   [ Cloudflare / DNS ]
                        |
                   [ VPS Ubuntu ]
                        |
              +---------v----------+
              | Reverse Proxy      |  Caddy ou Nginx
              | HTTPS (Let's Enc.) |  portas 80/443 apenas
              +----+----------+----+
                   |          |
          +--------v--+   +---v-----------+
          | Frontend  |   | Kong / API    |  :8000 interno
          | (estático |   | Supabase      |
          |  ou node) |   +---+-----------+
          +-----------+       |
              +---------------+------------------+
              |  Docker Compose Supabase stack   |
              |  - Postgres (+ pg_cron)          |
              |  - GoTrue (Auth)                 |
              |  - PostgREST                     |
              |  - Realtime                      |
              |  - Storage API + objeto local/S3 |
              |  - Edge Runtime (Functions)      |
              |  - Studio (NÃO público)          |
              |  - Meta / Analytics (opcional)   |
              +----------------------------------+
                        |
              [ Backups → B2/S3 externo ]
```

### 1.3 Domínios sugeridos

Defina **antes** de subir o stack (evita reescrever JWT/URLs depois):

| Uso | Exemplo | Público? |
|---|---|---|
| App (frontend) | `https://app.seudominio.com.br` | Sim |
| API Supabase | `https://api.seudominio.com.br` | Sim (via Kong) |
| Studio | `https://studio.interno.seudominio.com.br` ou só VPN/IP allowlist | **Não** na internet aberta |
| Webhook Focus | `https://api.seudominio.com.br/functions/v1/webhook-nfe` | Sim (endpoint específico) |

### 1.4 Estratégia de migração em uma frase

> **Schema pelo repositório (migrations) → dados de negócio por dump data-only → usuários recriados ou migrados com plano B → storage objetos+metadados → functions+secrets → validação longa em paralelo → cutover com freeze de escrita.**

---

## 2. Inventário do sistema atual (VidraERP)

Use esta seção como checklist de “o que precisa existir no self-hosted no final”.

### 2.1 Edge Functions (`supabase/functions/`)

| Função | Propósito | Auth esperada | Secrets críticos |
|---|---|---|---|
| `emitir-nfe` | Emite NF-e via Focus | Bearer JWT do usuário | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` + token Focus no banco/config |
| `cancelar-nfe` | Cancela NF-e | Bearer JWT | idem |
| `webhook-nfe` | Callback da Focus NFe | **Sem JWT de usuário** (webhook externo) | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` |
| `config-fiscal` | Config fiscal da empresa | Bearer JWT | service role |
| `enviar-nfe-email` | Envia PDF/XML por e-mail | Bearer JWT | `RESEND_API_KEY`, `RESEND_FROM_EMAIL` |
| `criar-convite` | Convida usuário | Bearer JWT | service role, `SITE_URL` / origin |
| `validar-convite` | Valida convite | conforme implementação | service role |
| `alterar-role` | Muda role | Bearer JWT + autorização | service role |
| `deletar-registro` | Delete privilegiado | Bearer JWT + autorização | service role |
| `baixar-titulo` | Baixa título financeiro | Bearer JWT | service role |
| `_shared/cors.ts` | CORS compartilhado | — | `ALLOWED_ORIGIN` |
| `_shared/roles.ts` | Roles válidas | — | — |

**Roles válidas no código:**  
`superadmin`, `admin`, `gestor`, `vendedor`, `tecnico`, `financeiro`

### 2.2 Storage

| Bucket | Público? | Migration | Conteúdo |
|---|---|---|---|
| `nfe_xml` | Não | `20260512100400_sprint12_storage.sql` | XMLs de NF-e |

> Se no Cloud existirem buckets extras criados manualmente (logos, comprovantes, PDFs), inventarie no painel Storage **antes** da migração e inclua na Fase 6.

### 2.3 Jobs / cron

| Job | Origem | Frequência | Observação |
|---|---|---|---|
| `keepalive-ping` | `20260620000000_keepalive_cron.sql` | diário 06:00 UTC | usa `pg_cron` + `public.fn_keepalive_ping()` |
| `scripts/keepalive.mjs` | script Node externo | opcional | alternativa se `pg_cron` falhar |

### 2.4 Variáveis de ambiente do app (frontend/backend local)

Baseadas em `.env.example`:

```bash
# Servidor
NODE_ENV=
PORT=
HOST=

# Supabase (server-side)
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=   # NUNCA no frontend
SUPABASE_JWT_SECRET=

# Vite (público no browser)
VITE_AUTH_PROVIDER=supabase
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_DEFAULT_EMPRESA_ID=
VITE_SITE_URL=

# E2E (opcional)
E2E_SUPABASE_ENABLED=
E2E_SUPABASE_EMAIL=
E2E_SUPABASE_PASSWORD=
E2E_BASE_URL=
```

### 2.5 Secrets das Edge Functions (mapa completo)

| Secret | Usado em | Notas |
|---|---|---|
| `SUPABASE_URL` | todas as functions | URL pública da API self-hosted |
| `SUPABASE_SERVICE_ROLE_KEY` | todas as functions | JWT service_role assinado com o **novo** `JWT_SECRET` |
| `RESEND_API_KEY` | `enviar-nfe-email` | chave Resend do ambiente novo (ou reutilizada com cuidado) |
| `RESEND_FROM_EMAIL` | `enviar-nfe-email` | ex: `NF-e VidraERP <nfe@seudominio.com.br>` |
| `ALLOWED_ORIGIN` | `_shared/cors.ts` | domínio do frontend; **não use `*` em produção** |
| `SITE_URL` | `criar-convite` | URL base do app para links de convite |

Token Focus NFe: no fluxo atual costuma vir da **config fiscal no banco** (por empresa/ambiente). Confirme na tabela/config usada por `config-fiscal` / `emitir-nfe` e garanta que o dump de dados traga esses registros (sem vazar em logs).

### 2.6 Migrations (fonte da verdade do schema)

Diretório: `supabase/migrations/`  
Ordem: aplicar **todas** em ordem lexicográfica de nome de arquivo (timestamp).

Não “inventar” schema no Studio. Se o Cloud divergiu do repo, **reconcilie no repo primeiro** (migration faltante) antes de migrar.

### 2.7 Integrações externas a reapontar no cutover

| Integração | O que muda | Quando |
|---|---|---|
| Focus NFe webhook URL | aponta para self-hosted | cutover (ou dual-write de teste em homolog) |
| Resend | chaves + from + DNS (se domínio novo) | antes da validação de e-mail |
| Netlify (ou host do frontend) | env `VITE_*` | deploy de staging e cutover |
| DNS do app | A/CNAME → VPS ou CDN | cutover |

---

## 3. Premissas, riscos e decisões

### 3.1 Premissas

1. Produção Cloud continua viva até cutover aprovado.
2. Self-hosted é cópia **independente** (JWT secret **novo**, keys **novas**).
3. Schema vem do **git**, não do dump de schema do Cloud.
4. Há janela de manutenção no cutover (freeze de escrita no Cloud).
5. Existe responsável operacional (backup, patch, HTTPS, alertas).

### 3.2 Riscos principais e mitigação

| Risco | Impacto | Mitigação |
|---|---|---|
| Dump de schema `auth` incompatível | restore quebra | **não** migrar schema auth; recriar usuários |
| RLS “ligado” mas policy permissiva | vazamento multi-tenant | matriz de testes com 2 empresas × roles |
| Storage só com arquivos, sem metadados | URLs quebradas | migrar `storage.objects` + buckets + policies |
| Functions deploy “como no Cloud” | functions não sobem | deploy via volume/Edge Runtime do Docker |
| Webhook Focus no Cloud após cutover | NF-e sem callback | reapontar webhook + fila de reprocessamento |
| Postgres exposto na internet | ransomware | firewall: só 80/443; DB só rede Docker |
| Studio público | admin takeover | VPN / allowlist / basic auth |
| Backup sem restore testado | perda total | drill mensal obrigatório |
| Cutover sem freeze | divergência fiscal/financeira | manutenção + sync final + validação de contagens |

### 3.3 Decisões oficiais deste guia

| Tema | Decisão |
|---|---|
| Schema | migrations do repositório |
| Dados | `pg_dump --data-only` do schema `public` (+ sequences) |
| Auth | **Plano A:** recriar usuários + mapear `auth.users.id` → `perfis_usuario` **Plano B:** migração controlada de `auth.users` (teste isolado) |
| Storage | bucket `nfe_xml` + metadados + objetos |
| Functions | montar código no Edge Runtime self-hosted; JWT verify **on** exceto `webhook-nfe` |
| Frontend | staging em subdomínio; cutover com env novo |
| Rollback | Cloud permanece 30 dias intacto |

---

## 4. Fase 0 — Isolamento do repositório

**Objetivo:** nunca commitar/deployar acidentalmente no repo/produção atuais.

### 4.1 Clone isolado

```bash
# Máquina local de trabalho
git clone https://github.com/jairosouza67/VidraSystem.git vidraerp-selfhosted
cd vidraerp-selfhosted

git remote -v
git remote remove origin

# Crie um repositório NOVO (vazio) no GitHub, ex: vidraerp-selfhosted
git remote add origin https://github.com/SEU_USUARIO/vidraerp-selfhosted.git
git push -u origin main
```

### 4.2 Branch de trabalho

```bash
git checkout -b infra/selfhosted-supabase
```

### 4.3 O que **não** copiar

- `.env` de produção com keys do Cloud (use apenas como **referência offline** em cofre)
- dumps SQL com dados reais no git
- service_role key em issues/PRs/chats

### 4.4 Critério de saída da Fase 0

- [ ] Pasta `vidraerp-selfhosted` isolada
- [ ] Remote novo configurado
- [ ] Repo original intocado
- [ ] Branch de infra criada

---

## 5. Fase 1 — Provisionar e endurecer a VPS

### 5.1 Dimensionamento

| Perfil | vCPU | RAM | Disco | Uso |
|---|---|---|---|---|
| Lab / validação | 4 | **8 GB** | 80 GB SSD | mínimo realista do stack |
| Produção inicial (1–poucos tenants) | 4 | 8–16 GB | 160 GB NVMe | recomendado |
| Produção multi-tenant | 8 | 16–32 GB | 320 GB+ | com margem de storage/XML |

> 2 vCPU / 4 GB **não** é recomendado para este ERP com Studio + Edge Runtime + fiscal.

### 5.2 SO e pacotes base

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y ca-certificates curl gnupg ufw fail2ban unzip jq git htop
```

### 5.3 Docker

```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
# reconecte a sessão SSH
docker --version
docker compose version
```

### 5.4 Firewall (obrigatório)

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
# NÃO abra 5432, 3000 (Studio), 8000 direto se usar proxy
sudo ufw enable
sudo ufw status verbose
```

### 5.5 Usuário e SSH

- Desabilite login root por senha
- Use chave SSH
- Opcional: mude porta SSH e restrinja por IP admin

### 5.6 Swap (se RAM = 8 GB)

```bash
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### 5.7 Estrutura de diretórios na VPS

```bash
sudo mkdir -p /opt/vidraerp/{supabase,backups,scripts,proxy,secrets}
sudo chown -R $USER:$USER /opt/vidraerp
```

### 5.8 Critério de saída da Fase 1

- [ ] VPS com 8 GB+ RAM
- [ ] Docker OK
- [ ] UFW só 22/80/443 (ou 22 restrito)
- [ ] Diretórios `/opt/vidraerp` criados
- [ ] Acesso SSH por chave

---

## 6. Fase 2 — Subir o stack Supabase self-hosted

### 6.1 Obter o compose oficial

```bash
cd /opt/vidraerp
git clone --depth 1 https://github.com/supabase/supabase.git supabase-src
cp -r supabase-src/docker ./supabase
cd /opt/vidraerp/supabase
cp .env.example .env
```

### 6.2 Gerar segredos **novos** (nunca reutilize os do Cloud)

```bash
# Postgres password
openssl rand -base64 32

# JWT secret (>= 32 chars; use 48+)
openssl rand -base64 48
```

Gere `ANON_KEY` e `SERVICE_ROLE_KEY` **assinadas com o novo JWT_SECRET** (script do repositório Supabase / ferramenta JWT do projeto docker).  
**Não** copie as keys do projeto Cloud: elas não batem com o secret novo e quebram Auth.

### 6.3 Preencher `.env` do stack

Campos mínimos a revisar:

```bash
POSTGRES_PASSWORD=***novo***
JWT_SECRET=***novo***
ANON_KEY=***jwt_anon_novo***
SERVICE_ROLE_KEY=***jwt_service_novo***

SITE_URL=https://app.seudominio.com.br
API_EXTERNAL_URL=https://api.seudominio.com.br
SUPABASE_PUBLIC_URL=https://api.seudominio.com.br

# E-mail (Auth: convites, reset de senha) — configure SMTP real
# SMTP_ADMIN_EMAIL=...
# SMTP_HOST=...
# SMTP_PORT=...
# SMTP_USER=...
# SMTP_PASS=...
# SMTP_SENDER_NAME=VidraERP
```

Salve uma cópia cifrada do `.env` no cofre (1Password/Bitwarden/etc.). **Não commite.**

### 6.4 Subir o stack

```bash
cd /opt/vidraerp/supabase
docker compose pull
docker compose up -d
docker compose ps
```

Aguarde todos os serviços `healthy` / `running`.  
Se algum reiniciar em loop: `docker compose logs -f <serviço>`.

### 6.5 Reverse proxy HTTPS (exemplo conceitual Caddy)

Objetivo: expor só API (e frontend, se hospedado na mesma VPS). Studio **não** fica público.

Exemplo de intenção de rotas:

```text
api.seudominio.com.br   →  localhost:8000   (Kong)
app.seudominio.com.br   →  frontend estático / container
studio (interno)        →  localhost:3000   apenas em 127.0.0.1 ou VPN
```

Valide:

```bash
curl -sS https://api.seudominio.com.br/auth/v1/health
curl -sS https://api.seudominio.com.br/rest/v1/ -H "apikey: $ANON_KEY" | head
```

### 6.6 Hardening extra do Studio

Opções (escolha ao menos uma):

1. Não publicar porta 3000 no host (só rede Docker + SSH tunnel)
2. Basic auth no proxy
3. Allowlist de IP do escritório/VPN

Acesso admin via:

```bash
ssh -L 3000:localhost:3000 user@vps
# browser: http://localhost:3000
```

### 6.7 Critério de saída da Fase 2

- [ ] `docker compose ps` saudável
- [ ] HTTPS na API
- [ ] Studio não público
- [ ] Keys novas documentadas no cofre
- [ ] Postgres inacessível da internet

---

## 7. Fase 3 — Schema via migrations (fonte da verdade)

### 7.1 Por que não restaurar schema via `pg_dump` do Cloud

- versões de Auth/Storage/Realtime diferem
- grants/owners do Cloud poluem o self-hosted
- perde alinhamento com `supabase/migrations/`
- dificulta deploys futuros de migration

### 7.2 Preparar CLI e link local

Na máquina de trabalho (ou na VPS):

```bash
cd /caminho/vidraerp-selfhosted
npm install -g supabase   # ou use npx supabase

# Suba um tunnel/DB URL do Postgres self-hosted (rede interna ou SSH)
# Exemplo de connection string interna:
# postgresql://postgres:SENHA@localhost:5432/postgres
```

### 7.3 Aplicar migrations na ordem do repo

**Método preferido:** `supabase db push` apontando para o DB self-hosted, **ou** aplicar com `psql` em ordem.

Lista atual (conferir sempre o diretório real):

```text
supabase/migrations/20260511203400_sprint1_foundation.sql
supabase/migrations/20260511215800_sprint2_clientes_fornecedores.sql
...
supabase/migrations/20260720_nfe_campos_faltantes.sql
```

Script de aplicação ordenada (exemplo):

```bash
export DATABASE_URL="postgresql://postgres:SENHA@127.0.0.1:5432/postgres"

for f in supabase/migrations/*.sql; do
  echo ">>> Applying $f"
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$f" || exit 1
done
```

### 7.4 Extensões e pré-requisitos

Antes/durante as migrations, confirme:

```sql
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_cron";   -- necessário para keepalive
-- outras usadas pelo projeto, se houver
```

Se `pg_cron` não estiver disponível na imagem, documente fallback (Fase 10 com `keepalive.mjs` + cron do SO).

### 7.5 Validar schema pós-migrations

```sql
-- Tabelas public
SELECT count(*) AS tabelas_public
FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';

-- RLS ligado?
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY rowsecurity, tablename;

-- Funções críticas
SELECT proname
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND proname IN ('fn_keepalive_ping', 'get_next_nfe_numero');

-- Bucket storage
SELECT * FROM storage.buckets;
```

### 7.6 Reconciliação Cloud × Repo (se divergir)

Se o Cloud tiver objetos que **não** estão nas migrations:

1. Extraia DDL do Cloud (somente leitura)
2. Crie migration nova no repo self-hosted
3. Aplique no self-hosted
4. **Não** “conserte só no Studio”

### 7.7 Critério de saída da Fase 3

- [ ] Todas as migrations aplicadas sem erro
- [ ] Bucket `nfe_xml` existe
- [ ] Funções/triggers críticos existem
- [ ] Nenhuma tabela de negócio sem RLS (exceto exceções documentadas)

---

## 8. Fase 4 — Migrar dados de negócio (`public`)

### 8.1 Princípio

Migrar **dados**, não “o mundo inteiro do Postgres Cloud”.

### 8.2 Pré-check no Cloud (somente leitura)

```sql
-- Contagens de referência (salve o resultado)
SELECT 'empresas' AS t, count(*) FROM empresas
UNION ALL SELECT 'clientes', count(*) FROM clientes
UNION ALL SELECT 'orcamentos', count(*) FROM orcamentos
UNION ALL SELECT 'ordens_servico', count(*) FROM ordens_servico
UNION ALL SELECT 'nfe_saida', count(*) FROM nfe_saida
UNION ALL SELECT 'perfis_usuario', count(*) FROM perfis_usuario
-- acrescente as demais tabelas críticas
;
```

### 8.3 Dump data-only do schema `public`

Na máquina com acesso à connection string **de leitura** do Cloud:

```bash
# Use session mode / direct connection se possível (evite pooler transaction mode para dump)
export CLOUD_DB="postgresql://postgres.[ref]:[SENHA]@aws-0-...pooler.supabase.com:5432/postgres"

pg_dump "$CLOUD_DB" \
  --data-only \
  --no-owner \
  --no-privileges \
  --schema=public \
  --disable-triggers \
  -f vidraerp_public_data.sql
```

**Notas:**

- `--disable-triggers` ajuda com FKs na restauração; reabilite/valide depois.
- **Não** inclua `auth`, `storage`, `realtime`, `supabase_functions` neste dump.
- Guarde o arquivo cifrado; não commite no git.

### 8.4 Dump de sequences (importante)

Sem sequences, próximos IDs/números colidem.

```bash
pg_dump "$CLOUD_DB" \
  --data-only \
  --schema=public \
  --table='*_id_seq' \
  -f vidraerp_sequences.sql
# se o glob não funcionar no seu pg_dump, exporte sequences via SQL:
```

```sql
-- No Cloud: liste sequences e valores
SELECT sequencename, last_value, is_called
FROM pg_sequences
WHERE schemaname = 'public';
```

Gere `setval(...)` no destino com base nisso.

### 8.5 Restaurar no self-hosted

```bash
export SELF_DB="postgresql://postgres:SENHA@127.0.0.1:5432/postgres"

# Ideal: restaurar em manutenção do ambiente novo (ainda não em produção)
psql "$SELF_DB" -v ON_ERROR_STOP=1 -f vidraerp_public_data.sql
psql "$SELF_DB" -v ON_ERROR_STOP=1 -f vidraerp_sequences.sql
```

Se FKs falharem:

1. Identifique a ordem de dependências
2. Ou use sessão com `session_replication_role = replica` **somente** durante o load, com cuidado:

```sql
BEGIN;
SET session_replication_role = replica;
-- \i vidraerp_public_data.sql
SET session_replication_role = DEFAULT;
COMMIT;
```

### 8.6 Pós-restore: contagens e integridade

Repita as contagens da seção 8.2 no self-hosted e compare.

```sql
-- FKs órfãs (exemplos; adapte)
SELECT count(*) AS perfis_sem_empresa
FROM perfis_usuario p
LEFT JOIN empresas e ON e.id = p.empresa_id
WHERE e.id IS NULL;
```

Rode também os testes SQL do repo, se aplicáveis:

- `supabase/tests/integridade-referencial.test.sql`
- `supabase/tests/retencao-xml.test.sql`

### 8.7 Dados sensíveis e config fiscal

Confirme presença de:

- empresas e dados fiscais
- tokens Focus armazenados (se no banco)
- numeração NF-e / sequenciais
- títulos financeiros e vínculos com OS

### 8.8 Critério de saída da Fase 4

- [ ] Contagens Cloud ≈ Self (diferenças explicadas)
- [ ] Sequences alinhadas
- [ ] Sem órfãos críticos
- [ ] Config fiscal legível pelas functions

---

## 9. Fase 5 — Migrar autenticação (usuários)

### 9.1 Por que Auth é o ponto mais frágil

- schema `auth` é gerenciado pelo GoTrue do stack
- hashes de senha dependem de versão/compatibilidade
- IDs de usuário amarram `perfis_usuario`, auditoria, convites, etc.

### 9.2 Plano A (recomendado): recriar usuários + remap de IDs

#### Passo A1 — Exportar mapa de usuários do Cloud (leitura)

```sql
-- Cloud
SELECT
  u.id AS old_auth_id,
  u.email,
  u.created_at,
  u.email_confirmed_at IS NOT NULL AS email_confirmed,
  p.id AS perfil_id,
  p.empresa_id,
  p.role
FROM auth.users u
LEFT JOIN public.perfis_usuario p ON p.user_id = u.id
ORDER BY u.email;
```

Salve como CSV cifrado: `auth_user_map_cloud.csv`.

#### Passo A2 — Criar usuários no self-hosted via Admin API

Com `SERVICE_ROLE_KEY` **nova**:

```bash
# Exemplo conceitual (um usuário)
curl -X POST "https://api.seudominio.com.br/auth/v1/admin/users" \
  -H "apikey: $SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@empresa.com",
    "email_confirm": true,
    "password": "SenhaTemporariaForte!123"
  }'
```

Guarde `new_auth_id` retornado.

#### Passo A3 — Atualizar FKs em `public`

Para cada usuário:

```sql
UPDATE public.perfis_usuario
SET user_id = 'NEW_AUTH_UUID'
WHERE user_id = 'OLD_AUTH_UUID';

-- Repita em qualquer outra tabela que referencie auth.users.id
```

Liste todas as FKs para `auth.users`:

```sql
SELECT
  tc.table_schema, tc.table_name, kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND ccu.table_schema = 'auth'
  AND ccu.table_name = 'users';
```

#### Passo A4 — Forçar reset de senha

Envie fluxo “esqueci minha senha” **ou** comunique senha temporária com troca obrigatória no 1º login.

Configure SMTP do GoTrue **antes**, senão reset não chega.

### 9.3 Plano B (avançado): migrar `auth.users` com hash

Somente se:

- versões GoTrue Cloud ≈ self-hosted forem compatíveis
- teste em laboratório com 2 usuários passar (login real)
- houver backup e script de rollback do schema auth

**Não** é o caminho padrão deste guia.

Procedimento resumido (lab):

1. Dump **data-only** de tabelas auth necessárias (`users`, `identities`, etc.)
2. Restore em DB clone de teste
3. Login com senha real
4. Só então considere produção

### 9.4 Convites pendentes

Tabela de convites (migration `20260626000000_create_convites.sql`):

- convites não usados: reemitir no ambiente novo
- tokens antigos apontando para URL Cloud: invalidar

### 9.5 Critério de saída da Fase 5

- [ ] Usuários admin/gestor conseguem login no self-hosted
- [ ] `perfis_usuario.user_id` aponta para IDs novos
- [ ] Roles corretas
- [ ] Reset de senha funcional (SMTP)
- [ ] Superadmin validado

---

## 10. Fase 6 — Migrar Storage

### 10.1 Componentes a migrar

1. **Buckets** (já via migration → `nfe_xml`)
2. **Policies** (já via migration)
3. **Metadados** (`storage.objects`)
4. **Bytes dos arquivos** (filesystem/S3 do Storage)

Migrar só (4) sem (3) = app quebrado.

### 10.2 Inventário no Cloud

```sql
SELECT bucket_id, count(*) AS objetos, coalesce(sum(metadata->>'size')::bigint,0) AS bytes
FROM storage.objects
GROUP BY 1;
```

Painel Storage: liste buckets extras além de `nfe_xml`.

### 10.3 Migrar objetos (S3-compatible) com rclone

```bash
# Instalar rclone
curl https://rclone.org/install.sh | sudo bash
rclone config
```

Configure:

| Remote | Endpoint | Keys |
|---|---|---|
| `supabase-cloud` | endpoint S3 do projeto Cloud | access key do Storage Cloud |
| `supabase-self` | endpoint S3 do self-hosted | keys do stack novo |

```bash
rclone sync supabase-cloud:nfe_xml supabase-self:nfe_xml --progress --checksum
```

### 10.4 Migrar metadados `storage.objects`

Opções:

**Opção 1 — reupload via API** (mais lento, metadados recriados corretamente)  
**Opção 2 — dump data-only de `storage.objects` + ajuste de IDs** (mais rápido, mais frágil)

Para volume baixo/médio de XML, prefira **reupload scriptado** autenticado com service role, lendo paths do Cloud.

### 10.5 Validação Storage

```bash
# Upload de teste
# Download de XML real migrado
# URL assinada com usuário autenticado
# Negar acesso anon ao bucket privado
```

```sql
SELECT count(*) FROM storage.objects WHERE bucket_id = 'nfe_xml';
```

### 10.6 Critério de saída da Fase 6

- [ ] Contagem de objetos Cloud ≈ Self
- [ ] Download autenticado OK
- [ ] Anon bloqueado em `nfe_xml`
- [ ] Emissão/consulta NF-e encontra XML quando esperado

---

## 11. Fase 7 — Deploy das Edge Functions

### 11.1 Realidade do self-hosted

No Cloud, `supabase functions deploy` fala com a API hospedada.  
No self-hosted, o padrão é:

1. copiar `supabase/functions/**` para o volume/diretório consumido pelo **Edge Runtime**
2. configurar env/secrets do runtime
3. reiniciar o serviço de functions
4. expor via Kong em `/functions/v1/<nome>`

> Ajuste os paths exatos conforme a versão do `docker` do Supabase que você clonou (leia o `docker-compose.yml` e docs da tag usada).

### 11.2 Preparar código

```bash
# Na VPS
mkdir -p /opt/vidraerp/functions
rsync -av --delete \
  /caminho/vidraerp-selfhosted/supabase/functions/ \
  /opt/vidraerp/functions/
```

Garanta que `_shared/` está acessível às functions (imports relativos `../_shared/...`).

### 11.3 JWT verification por função

| Função | Verify JWT no gateway? | Motivo |
|---|---|---|
| `webhook-nfe` | **NÃO** (ou verify off + autenticação alternativa) | Focus chama sem JWT de usuário |
| `emitir-nfe`, `cancelar-nfe`, `config-fiscal`, `enviar-nfe-email` | **SIM** | operação sensível; function ainda valida Bearer |
| `alterar-role`, `deletar-registro`, `baixar-titulo` | **SIM** | alto privilégio |
| `criar-convite`, `validar-convite` | **SIM** (avaliar fluxo público de validação) | evitar abuso |

**Nunca** deixe `--no-verify-jwt` como padrão global.

Para `webhook-nfe`, mitigações recomendadas:

- secret compartilhado em header (se a Focus permitir custom)
- allowlist de IPs Focus (se disponível)
- validar payload mínimo (`ref`, `status`) e idempotência
- rate limit no proxy

### 11.4 Smoke test de cada function

```bash
# Health/rota
curl -i "https://api.seudominio.com.br/functions/v1/webhook-nfe" -X POST \
  -H "Content-Type: application/json" \
  -d '{"ref":"teste-inexistente","status":"erro"}'

# Function autenticada (use JWT de usuário de teste)
curl -i "https://api.seudominio.com.br/functions/v1/config-fiscal" \
  -H "Authorization: Bearer $USER_JWT" \
  -H "apikey: $ANON_KEY"
```

Use também os scripts do repo (apontando env self-hosted):

- `scripts/testar-webhook-nfe.mjs`
- `scripts/testar-resend-email.mjs`

### 11.5 Critério de saída da Fase 7

- [ ] Todas as 10 functions respondem rota
- [ ] Functions autenticadas rejeitam sem token
- [ ] `webhook-nfe` atualiza `nfe_saida` em teste controlado
- [ ] Logs do Edge Runtime sem erro de import Deno

---

## 12. Fase 8 — Secrets e integrações externas

### 12.1 Injetar secrets no runtime de functions

Defina no `.env`/compose do Edge Runtime (nomes exatos conforme stack):

```bash
SUPABASE_URL=https://api.seudominio.com.br
SUPABASE_SERVICE_ROLE_KEY=***service_role_novo***
RESEND_API_KEY=***
RESEND_FROM_EMAIL=NF-e VidraERP <nfe@seudominio.com.br>
ALLOWED_ORIGIN=https://app.seudominio.com.br
SITE_URL=https://app.seudominio.com.br
```

Reinicie o serviço de functions após alterar secrets.

### 12.2 Resend

1. Confirme domínio verificado (ver `docs/configuracao-dns-resend.md`)
2. Use API key com escopo adequado
3. Teste envio real para caixa controlada
4. Verifique spam/DKIM

### 12.3 Focus NFe

**Ambiente de validação (antes do cutover):**

- use **homologação** (`https://homologacao.focusnfe.com.br/v2`)
- webhook de teste pode apontar temporariamente para URL self-hosted de staging
- **não** mude webhook de produção Cloud até o cutover

**No cutover:**

1. Atualize URL de callback para  
   `https://api.seudominio.com.br/functions/v1/webhook-nfe`
2. Emita NF-e de teste controlada (se possível em janela)
3. Confirme transição de status em `nfe_saida`
4. Tenha plano de reprocessar refs pendentes

### 12.4 CORS / origins

Em produção:

```bash
ALLOWED_ORIGIN=https://app.seudominio.com.br
```

Evite `*` com credentials.

### 12.5 Critério de saída da Fase 8

- [ ] E-mail de NF-e chega
- [ ] Emissão homolog Focus OK
- [ ] Webhook de teste OK no self-hosted
- [ ] Secrets não estão no git

---

## 13. Fase 9 — Frontend e variáveis de ambiente

### 13.1 `.env` do app self-hosted (staging)

```bash
NODE_ENV=production
VITE_AUTH_PROVIDER=supabase
VITE_SUPABASE_URL=https://api.seudominio.com.br
VITE_SUPABASE_ANON_KEY=***anon_key_nova***
VITE_DEFAULT_EMPRESA_ID=***uuid_empresa_padrao***
VITE_SITE_URL=https://app.seudominio.com.br

# Server-side (se SSR/server do TanStack Start precisar)
SUPABASE_URL=https://api.seudominio.com.br
SUPABASE_ANON_KEY=***anon***
SUPABASE_SERVICE_ROLE_KEY=***service***   # só no server, nunca VITE_
SUPABASE_JWT_SECRET=***jwt_secret_novo***
```

### 13.2 Build e deploy de staging

```bash
npm ci
npm run build
# publique dist/client em:
# - subdomínio staging (recomendado), ou
# - Netlify “branch deploy” / site separado
```

**Não** sobrescreva o site de produção no Netlify até o cutover.

### 13.3 Checklist funcional no browser (staging)

- [ ] Login / logout
- [ ] Sessão persiste refresh
- [ ] Dashboard carrega
- [ ] CRUD cliente
- [ ] Criar orçamento → gerar pedido/OS
- [ ] Estoque / compras
- [ ] Financeiro (baixar título)
- [ ] Fiscal (homolog)
- [ ] Convite de usuário
- [ ] Upload/download XML se aplicável

### 13.4 Critério de saída da Fase 9

- [ ] Staging público HTTPS apontando só para self-hosted
- [ ] Produção Cloud/Netlify intactos
- [ ] Fluxos críticos OK no staging

---

## 14. Fase 10 — Jobs, cron e keepalive

### 14.1 `pg_cron` no self-hosted

Verifique:

```sql
SELECT * FROM cron.job;
SELECT * FROM public._keepalive_log ORDER BY 1 DESC LIMIT 20;
```

Se o job `keepalive-ping` não existir, reaplique a migration ou:

```sql
SELECT cron.schedule(
  'keepalive-ping',
  '0 6 * * *',
  $$ SELECT public.fn_keepalive_ping(); $$
);
```

### 14.2 Fallback: cron do sistema + `scripts/keepalive.mjs`

```bash
# crontab -e
*/30 * * * * cd /opt/vidraerp/app && \
  SUPABASE_URL=https://api.seudominio.com.br \
  SUPABASE_SERVICE_ROLE_KEY=*** \
  /usr/bin/node scripts/keepalive.mjs >> /var/log/vidraerp-keepalive.log 2>&1
```

### 14.3 Outros agendamentos

Inventarie qualquer cron Netlify/GitHub Actions que fale com o Cloud e replique/apague conforme o cutover.

### 14.4 Critério de saída da Fase 10

- [ ] Keepalive executa e registra log
- [ ] Não há dependência oculta de cron do Cloud

---

## 15. Fase 11 — Matriz de validação

### 15.1 Segurança multi-tenant (obrigatório)

Crie/use 2 empresas: **Empresa A** e **Empresa B**.

| Teste | Usuário | Esperado |
|---|---|---|
| Ler clientes da própria empresa | vendedor A | OK |
| Ler clientes da outra empresa | vendedor A | **vazio/erro** |
| Alterar role | vendedor A | **negado** |
| Alterar role | admin A | OK dentro da empresa |
| Superadmin | superadmin | conforme regra de negócio |
| REST direto com anon key | — | sem dados sensíveis |
| Storage `nfe_xml` anon | — | **403** |
| Function `deletar-registro` sem auth | — | **401** |

Não basta `rowsecurity = true`. Teste **efeito**.

### 15.2 Matriz de papéis

Para cada role em `_shared/roles.ts`:

- [ ] login
- [ ] menus/rotas esperados
- [ ] bloqueio de ações indevidas
- [ ] RLS de tabelas do módulo

### 15.3 Módulos de negócio

| Módulo | Casos mínimos |
|---|---|
| Auth | login, logout, reset senha, convite |
| Clientes | CRUD + busca |
| Orçamentos | criar, calcular, PDF se houver |
| Pedidos / OS | fluxo status |
| Estoque | entrada/saída, baixa |
| Compras | pedido/romaneio se usado |
| Financeiro | título, baixa (`baixar-titulo`) |
| Fiscal | emitir homolog, cancelar, webhook, e-mail |
| RH | colaboradores se usado |
| Relatórios/Dashboard | carrega sem erro |

### 15.4 Carga leve

Opcional, com scripts em `tests/load/`:

- dashboard
- kanban
- orçamentos
- nfe

### 15.5 Critério de saída da Fase 11

- [ ] Checklist 100% no staging
- [ ] Zero vazamento cross-empresa nos testes
- [ ] Fiscal homolog OK ponta a ponta
- [ ] Aprovação formal do responsável do sistema

---

## 16. Fase 12 — Backup, restore drill e monitoramento

### 16.1 O que fazer backup

| Item | Frequência | Destino |
|---|---|---|
| Postgres (all / public+auth+storage meta) | diário | B2/S3 offsite |
| Arquivos Storage | diário | B2/S3 offsite |
| `.env` / secrets cifrados | a cada mudança | cofre offline |
| Volume Docker (opcional snapshot) | semanal | provider VPS |

### 16.2 Script diário (exemplo)

```bash
#!/usr/bin/env bash
set -euo pipefail
STAMP=$(date +%Y%m%d_%H%M%S)
BKDIR=/opt/vidraerp/backups
mkdir -p "$BKDIR"

docker compose -f /opt/vidraerp/supabase/docker-compose.yml exec -T db \
  pg_dump -U postgres -d postgres \
  | gzip > "$BKDIR/db_$STAMP.sql.gz"

rclone sync /var/lib/docker/volumes/…storage… remoto:vidraerp/storage --checksum || true
rclone copy "$BKDIR" remoto:vidraerp/db --include "db_$STAMP.sql.gz"

# retenção local 7 dias
find "$BKDIR" -name 'db_*.sql.gz' -mtime +7 -delete
```

Crontab:

```cron
0 3 * * * /opt/vidraerp/scripts/backup.sh >> /var/log/vidraerp-backup.log 2>&1
```

### 16.3 Retenção sugerida

- 7 diários
- 4 semanais
- 3 mensais

### 16.4 Restore drill (obrigatório antes do cutover)

1. Suba um Postgres temporário
2. Restaure o backup de ontem
3. Conte tabelas críticas
4. Suba app apontando para o restore
5. Login + 1 fluxo de leitura

Sem drill, **não há backup** — só arquivos.

### 16.5 Monitoramento mínimo

- Uptime da API e do app (UptimeRobot/Better Stack/etc.)
- Disco > 80% alerta
- `docker compose ps` via cron + alerta se unhealthy
- Logs de erro das functions
- Alerta se backup diário falhar

### 16.6 Critério de saída da Fase 12

- [ ] Backup automático rodando
- [ ] Cópia offsite verificada
- [ ] Restore drill documentado com data/hora
- [ ] Alertas ativos

---

## 17. Fase 13 — Operação em paralelo

### 17.1 Regras do período paralelo

| Ambiente | Quem usa | Escrita real? |
|---|---|---|
| Cloud produção | usuários reais | **Sim** |
| Self-hosted staging | time interno | só testes / dados de ensaio |

**Proibido:** usuários reais emitindo NF-e de produção no self-hosted antes do cutover.

### 17.2 Atualizações de dados durante o paralelo

Como a produção continua no Cloud, o self-hosted **envelhece**. Estratégias:

1. **Aceitar envelhecimento** e fazer sync final só no cutover (simples)
2. **Re-dump periódico** de `public` para o lab (apaga dados de teste do lab)
3. **Não** tentar dual-write em produção (complexidade alta, fora de escopo)

### 17.3 Duração recomendada

Mínimo **5–10 dias úteis** de validação com checklist, não “um sábado à tarde”.

### 17.4 Critério de saída da Fase 13

- [ ] Time confia no ambiente
- [ ] Incidentes de teste registrados e resolvidos
- [ ] Data de cutover agendada com stakeholders

---

## 18. Fase 14 — Cutover (produção)

### 18.1 Pré-corte (T-24h)

- [ ] Comunicar janela de manutenção
- [ ] Confirmar backups Cloud + self-hosted
- [ ] Confirmar DNS TTL baixo (ex.: 300s) com antecedência
- [ ] Scripts de contagem prontos
- [ ] Plano de rollback impresso/aberto
- [ ] Focus/Resend acessíveis
- [ ] Pessoas de plantão definidas

### 18.2 Janela de manutenção (T-0)

Ordem **exata**:

1. **Banner/manutenção** no app Cloud (se possível)
2. **Freeze de escrita**  
   - modo read-only prático: avisar usuários + desabilitar deploys + (opcional) bloquear writes via policy temporária **somente se souber reverter**
3. **Sync final de dados** do Cloud → Self  
   - `pg_dump --data-only` incremental/final das tabelas quentes  
   - `rclone sync` storage  
   - remap auth se novos usuários foram criados desde o último sync
4. **Validação rápida de contagens** (script)
5. **Reapontar webhook Focus** para self-hosted
6. **Deploy/env do frontend produção** → `VITE_SUPABASE_URL` e anon key novos  
   - Netlify env + rebuild, **ou** DNS do app se frontend estiver na VPS
7. **DNS API/app** se ainda não estiverem no destino final
8. **Smoke test produção** (login, 1 cliente, 1 leitura financeira, webhook ping)
9. **Abrir sistema** e monitorar logs 1–2h intensamente

### 18.3 O que **não** fazer no cutover

- Aplicar migration experimental
- Trocar JWT secret
- “Aproveitar” para refatorar código
- Apagar projeto Cloud

### 18.4 Critério de saída da Fase 14

- [ ] Usuários reais logam no self-hosted
- [ ] Webhook Focus chega no self-hosted
- [ ] Sem erros 5xx sustentados
- [ ] Cloud em standby (ainda pago/ativo)

---

## 19. Fase 15 — Rollback

### 19.1 Quando acionar

- Auth generalizado falhando
- Perda/risco fiscal (NF-e sem retorno)
- Corrupção de dados detectada
- Storage inacessível
- Indisponibilidade > limiar acordado (ex.: 30–60 min sem correção)

### 19.2 Procedimento de rollback

1. Reapontar DNS/env do frontend para **Cloud**
2. Reapontar webhook Focus para URL Cloud
3. Comunicar usuários
4. **Não** tente “mesclar” writes do self-hosted no Cloud sem análise  
   - se houve writes no self-hosted durante a janela, exporte e avalie reimport manual ponto a ponto (NF-e primeiro)

### 19.3 Critério de saída

- [ ] Produção estável de volta no Cloud
- [ ] Postmortem escrito
- [ ] Self-hosted preservado para forense

---

## 20. Fase 16 — Pós-cutover (30 dias)

### 20.1 Semana 1

- Monitorar erros Auth, REST, Functions
- Conferir backups diários + 1 restore drill
- Conferir numeração NF-e e webhooks
- Revisar disco e RAM

### 20.2 Dias 2–30

- Manter Cloud **somente leitura / standby**
- Não destruir backups Cloud
- Patch de segurança da VPS (`apt upgrade` planejado)
- Atualizar este guia com lições aprendidas

### 20.3 Após 30 dias estáveis

Somente então:

1. Export final de segurança do Cloud
2. Cancelar projeto Cloud (decisão explícita)
3. Rotacionar quaisquer secrets que tenham sido expostos no processo

---

## 21. Anexos

### Anexo A — Ordem mestre de execução

1. Isolar repo  
2. VPS + hardening + Docker  
3. Stack Supabase + HTTPS + Studio privado  
4. Migrations do git  
5. Data-only `public` + sequences  
6. Auth (recriar + remap)  
7. Storage objetos + metadados  
8. Edge Functions + secrets  
9. Resend + Focus homolog  
10. Frontend staging  
11. Cron/keepalive  
12. Matriz de validação  
13. Backup + restore drill  
14. Paralelo  
15. Cutover com freeze  
16. Standby Cloud 30 dias  

### Anexo B — Comandos de contagem (template)

```sql
SELECT 'empresas' t, count(*) c FROM empresas
UNION ALL SELECT 'perfis_usuario', count(*) FROM perfis_usuario
UNION ALL SELECT 'clientes', count(*) FROM clientes
UNION ALL SELECT 'fornecedores', count(*) FROM fornecedores
UNION ALL SELECT 'produtos', count(*) FROM produtos
UNION ALL SELECT 'orcamentos', count(*) FROM orcamentos
UNION ALL SELECT 'ordens_servico', count(*) FROM ordens_servico
UNION ALL SELECT 'nfe_saida', count(*) FROM nfe_saida
UNION ALL SELECT 'titulos', count(*) FROM titulos  -- ajuste nome real se diferente
ORDER BY 1;
```

> Ajuste nomes de tabelas aos reais do schema após `\dt public.*`.

### Anexo C — Inventário de Edge Functions (deploy checklist)

- [ ] `emitir-nfe`
- [ ] `cancelar-nfe`
- [ ] `webhook-nfe` (JWT verify off + proteções)
- [ ] `config-fiscal`
- [ ] `enviar-nfe-email`
- [ ] `criar-convite`
- [ ] `validar-convite`
- [ ] `alterar-role`
- [ ] `deletar-registro`
- [ ] `baixar-titulo`
- [ ] `_shared/cors.ts` e `_shared/roles.ts` presentes

### Anexo D — Variáveis: Cloud vs Self-hosted

| Variável | Cloud | Self-hosted |
|---|---|---|
| `VITE_SUPABASE_URL` | `https://xxxx.supabase.co` | `https://api.seudominio.com.br` |
| `VITE_SUPABASE_ANON_KEY` | key Cloud | key gerada no stack novo |
| `SUPABASE_SERVICE_ROLE_KEY` | key Cloud | key gerada no stack novo |
| `SUPABASE_JWT_SECRET` | secret Cloud | **secret novo** |
| Webhook Focus | `.../functions/v1/webhook-nfe` Cloud | mesma path no domínio novo |
| `ALLOWED_ORIGIN` | domínio app atual | domínio app self-hosted |

### Anexo E — Política de segredos

1. Nunca commitar `.env`, dumps, CSV de usuários  
2. Service role só em server/functions  
3. Rotacionar qualquer secret colado em chat/log  
4. Acesso SSH e Studio só para admins  
5. Backups offsite cifrados  

### Anexo F — Relação com o runbook antigo

| Tópico | Runbook antigo | Este guia |
|---|---|---|
| Clone repo | Sim | Sim + branch |
| VPS 4 GB | Mínimo 4 GB | **Mínimo real 8 GB** |
| Schema | dump Cloud | **migrations do repo** |
| Auth dump | opcional frágil | **Plano A recriar** |
| Storage | rclone only | rclone + metadados |
| Functions | `functions deploy` genérico | Edge Runtime + JWT matrix |
| Segurança VPS | básica | firewall, proxy, Studio privado |
| Cutover | DNS | freeze + sync + webhooks + frontend |
| Backup | pg_dump | pg_dump + storage + restore drill |

### Anexo G — Definição de “pronto para cutover”

Só avance se **todas** forem verdadeiras:

1. Schema 100% via migrations do git  
2. Contagens de dados validadas  
3. Login multi-role OK  
4. RLS cross-empresa testado  
5. Storage OK  
6. Functions OK  
7. Focus homolog + webhook OK  
8. Resend OK  
9. Backup + restore drill OK  
10. Rollback ensaiado em papel  
11. Janela comunicada  
12. Cloud permanece como fallback  

---

## Histórico

| Versão | Data | Autor | Notas |
|---|---|---|---|
| 1.0 | 2026-07-24 | Documentação operacional VidraERP | Guia completo paralelo ao runbook resumido |

---

**Fim do guia.**  
Qualquer desvio deste procedimento em produção deve ser registrado (data, motivo, responsável) e, se permanente, incorporado em nova versão deste documento.
