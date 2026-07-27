# Runbook — Migração do VidraERP para Supabase Self-Hosted

**Objetivo:** criar uma cópia independente do sistema, rodando em infraestrutura própria (Docker/VPS), com todos os dados atuais migrados — **sem tocar no sistema em produção**, que continua rodando normalmente no Supabase Cloud enquanto a nova versão é construída e validada.

**Princípio geral:** tudo que você fizer aqui acontece num ambiente paralelo. O projeto Supabase Cloud atual não é alterado em nenhum momento — só é *lido* (para dump de dados).

---

## Fase 0 — Preparar o repositório clonado

Não trabalhe dentro do repositório original. Crie uma cópia isolada.

```bash
# Clona o repo original para uma nova pasta local
git clone https://github.com/jairosouza67/VidraSystem.git vidraerp-selfhosted
cd vidraerp-selfhosted

# Remove o vínculo com o repositório remoto original
git remote remove origin

# (Opcional, mas recomendado) cria um novo repositório vazio no GitHub
# chamado, por exemplo, "vidraerp-selfhosted", e aponta pra ele:
git remote add origin https://github.com/jairosouza67/vidraerp-selfhosted.git
git push -u origin main
```

A partir daqui, `vidraerp-selfhosted` é o único lugar onde você mexe. O repositório original (`VidraSystem`) fica intocado, continua deployado como está hoje.

---

## Fase 1 — Provisionar a VPS

Requisitos mínimos para começar (ambiente de validação, não produção de muitos tenants ainda):

| Recurso | Mínimo | Recomendado |
|---|---|---|
| vCPU | 2 | 4 |
| RAM | 4 GB | 8 GB |
| Disco | 40 GB SSD | 80 GB SSD (NVMe se possível) |
| SO | Ubuntu 22.04/24.04 LTS | idem |

Provedores comuns no Brasil/LatAm: Hetzner, DigitalOcean, Contabo, ou a própria Hostinger (já usada no fluentoria.com.br) se ela oferecer VPS com Docker.

```bash
# Na VPS, atualize o sistema
sudo apt update && sudo apt upgrade -y

# Instale Docker e Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
newgrp docker

docker --version
docker compose version
```

---

## Fase 2 — Subir o stack Supabase self-hosted

O Supabase disponibiliza um `docker-compose.yml` oficial com todos os serviços (Postgres, Auth/GoTrue, PostgREST, Realtime, Storage, Studio, Edge Runtime).

```bash
# Na VPS
git clone --depth 1 https://github.com/supabase/supabase.git
cd supabase/docker

cp .env.example .env
```

Edite o `.env` e gere valores **novos e únicos** para:

```bash
# Gera uma senha forte para o Postgres
openssl rand -base64 32

# Gera o JWT secret (mínimo 32 caracteres)
openssl rand -base64 40
```

Preencha no `.env`:
- `POSTGRES_PASSWORD` → senha gerada
- `JWT_SECRET` → segredo gerado
- `ANON_KEY` e `SERVICE_ROLE_KEY` → gere com o script que o próprio repo do Supabase disponibiliza (`generate` no `docker/` ou via `supabase/cli`), pois precisam ser assinados com o `JWT_SECRET` acima
- `SITE_URL`, `API_EXTERNAL_URL`, `SUPABASE_PUBLIC_URL` → domínio/IP da sua VPS

```bash
docker compose up -d
docker compose ps   # confirma que todos os serviços estão "healthy"
```

Acesse o Supabase Studio (`http://SEU_IP:3000` ou domínio configurado) para confirmar que subiu corretamente.

---

## Fase 3 — Extrair schema e dados do projeto atual (Supabase Cloud)

Isso é **somente leitura** no projeto original — não altera nada lá.

```bash
# No seu computador ou na VPS, com acesso à connection string do projeto ATUAL
# (Painel Supabase Cloud → Project Settings → Database → Connection string)

pg_dump "postgresql://postgres:[SENHA_ATUAL]@[HOST_ATUAL]:5432/postgres" \
  --no-owner --no-privileges \
  --schema=public \
  --schema=auth \
  --schema=storage \
  -f vidraerp_dump.sql
```

**Atenção com o schema `auth`:** ele contém a tabela `auth.users` com senhas com hash (usando o algoritmo do GoTrue). Migrar esse schema junto costuma funcionar se a versão do GoTrue for compatível, mas é o ponto mais frágil da migração. Alternativa mais segura: migrar só `public` + `storage`, e recriar os usuários via API do novo GoTrue (todos precisarão redefinir senha uma vez, via fluxo de "esqueci minha senha").

---

## Fase 4 — Restaurar no banco self-hosted

```bash
# Aponta para o Postgres do stack self-hosted (roda dentro do docker compose)
psql "postgresql://postgres:[SENHA_NOVA]@SEU_IP:5432/postgres" \
  -f vidraerp_dump.sql
```

Depois de restaurar, **valide o RLS antes de qualquer outra coisa**:

```sql
-- Lista todas as tabelas do schema public e se RLS está habilitado
select schemaname, tablename, rowsecurity
from pg_tables
where schemaname = 'public'
order by rowsecurity, tablename;
```

Qualquer tabela com `rowsecurity = false` precisa ser revisada antes de seguir — é exatamente o ponto de atenção que levantamos no plano do SaaS.

---

## Fase 5 — Migrar Storage (arquivos)

Baixe os arquivos do Storage Cloud e suba no self-hosted. O jeito mais direto é via `rclone`, que fala S3 (o Storage do Supabase é compatível com S3):

```bash
# Instala rclone
curl https://rclone.org/install.sh | sudo bash

# Configura dois "remotes": origem (Cloud) e destino (self-hosted)
rclone config
# remote "supabase-cloud"  -> tipo S3, endpoint do projeto Cloud
# remote "supabase-self"   -> tipo S3, endpoint da sua VPS

# Copia todos os buckets
rclone sync supabase-cloud:nome-do-bucket supabase-self:nome-do-bucket --progress
```

Repita para cada bucket usado (logos, PDFs de orçamento, comprovantes, etc.).

---

## Fase 6 — Migrar Edge Functions

Como o código já é Deno, a portabilidade é alta:

```bash
# No repo clonado (vidraerp-selfhosted)
ls supabase/functions/
# emitir-nfe, cancelar-nfe, webhook-nfe, config-fiscal, enviar-nfe-email,
# criar-convite, validar-convite, alterar-role, deletar-registro, baixar-titulo

# Instala a Supabase CLI localmente
npm install -g supabase

# Aponta a CLI para o projeto self-hosted e faz deploy de cada função
supabase functions deploy emitir-nfe --project-ref self-hosted --no-verify-jwt
# repita para as demais
```

Reconfigure os secrets de cada função (tokens Focus NFe, Resend, etc.) no novo ambiente — **não copie segredos de produção direto**, gere/reconfirme cada um:

```bash
supabase secrets set FOCUS_NFE_TOKEN=xxxx --project-ref self-hosted
supabase secrets set RESEND_API_KEY=xxxx --project-ref self-hosted
```

---

## Fase 7 — Apontar o frontend clonado para o novo backend

No repo `vidraerp-selfhosted`, edite o `.env` do frontend:

```bash
VITE_SUPABASE_URL=http://SEU_IP:8000     # ou domínio configurado
VITE_SUPABASE_ANON_KEY=<ANON_KEY gerada na Fase 2>
```

Rode localmente para validar antes de publicar:

```bash
npm install
npm run dev
```

---

## Fase 8 — Validação em paralelo

Checklist antes de considerar a migração "pronta":

- [ ] Login funciona (usuários recriados ou migrados)
- [ ] RLS bloqueia corretamente acesso entre empresas diferentes (teste com 2 usuários de empresas distintas)
- [ ] Módulos críticos funcionam: Orçamentos, Pedidos/OS, Estoque, Financeiro, Fiscal
- [ ] Emissão de NF-e de teste funciona (ambiente de homologação da Focus NFe)
- [ ] Upload/download de arquivos do Storage funciona
- [ ] Edge Functions respondem sem erro (`supabase functions logs`)
- [ ] Backup automatizado está configurado (Fase 9)

Enquanto isso não estiver 100% validado, o sistema em produção continua no Supabase Cloud normalmente — nenhum usuário real é afetado.

---

## Fase 9 — Backup automatizado (você agora é responsável por isso)

No self-hosted, backup deixa de ser automático — monte uma rotina:

```bash
# Script simples de backup diário (crontab)
0 3 * * * pg_dump "postgresql://postgres:SENHA@localhost:5432/postgres" \
  | gzip > /backups/vidraerp_$(date +\%Y\%m\%d).sql.gz

# Envia para storage externo (ex: Backblaze B2, S3) via rclone
0 4 * * * rclone copy /backups remoto-backup:vidraerp-backups --progress
```

Mantenha pelo menos 7 backups diários + 4 semanais + 3 mensais.

---

## Fase 10 — Cutover (só quando tudo estiver validado)

1. Aponte o DNS do domínio de produção para a VPS
2. Rode um último `pg_dump`/`rclone sync` de diferença (dados criados entre a validação e o corte)
3. Mantenha o projeto Supabase Cloud ativo por um período de segurança (ex: 30 dias) como rollback
4. Só depois disso, considere desligar o projeto Cloud antigo

---

## Resumo da ordem de execução

1. Clonar repo → novo remoto
2. Provisionar VPS + Docker
3. Subir stack Supabase self-hosted
4. Dump do banco atual (leitura, sem risco)
5. Restaurar no self-hosted + auditar RLS
6. Migrar Storage
7. Migrar Edge Functions + secrets
8. Apontar frontend clonado pro novo backend
9. Validar tudo em paralelo
10. Configurar backup
11. Cutover de DNS só quando validado
