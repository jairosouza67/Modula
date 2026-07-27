 # Documentação do Projeto — AllVidros

 Última atualização: 2026-05-31

 Este documento descreve a arquitetura, áreas funcionais, convenções e procedimentos operacionais do sistema AllVidros. Use-o como referência rápida para desenvolvimento, deploy e manutenção.

 ## Visão Geral

 - Propósito: Sistema de gestão para vidraçarias (orçamentos, OS, estoque, fiscal, financeiro e logística).
 - Principais stacks:
   - Frontend: TypeScript, Vite, React/TSX (componentes em `src/`)
   - Backend: código serverless / Edge Functions + Node.js (entradas em `src/`, `server.ts`, `start.ts`)
   - Banco/Autenticação: Supabase (tabelas, storage, RLS)
   - Testes: Vitest (unit), Playwright (e2e)

 ## Estrutura do repositório (resumido)

 - `src/` — código frontend e algumas rotas/servidor (ex.: `router.tsx`, `server.ts`, `start.ts`)
 - `supabase/` — seeds e migrations (`migrations/`, `seed.sql`)
 - `docs/` — documentação do projeto (roadmap, integrações, este documento)
 - `tests/`, `playwright-report/`, `test-results/` — suites e relatórios de teste
 - `scripts/` — utilitários (ex.: `restore-md.ps1`)

 ## Áreas do sistema (por área funcional)

 1) Comercial
 - Objetivo: cadastro e gestão de clientes, fornecedores e produtos.
 - Principais entidades/tabelas: `clientes`, `fornecedores`, `produtos`.
 - Funcionalidades: busca rápida, histórico de OS e orçamentos, preços por m².
 - Locais no código: hooks em `src/hooks/useClientes.ts`, `useFaturamentoCliente.ts`.

 2) Operacional
 - Objetivo: orçamentos, ordens de serviço (OS), produção e plano de corte.
 - Entidades: `orcamentos`, `os`, `itens_orcamento`, `itens_os`.
 - Fluxos importantes: criação de orçamento → conversão em OS; geração de PDF de orçamentos (DANFE/DANFE-like para NF-e é tratado no módulo fiscal).
 - Locais: `src/components/features/` e `src/hooks/useDashboardData.ts`.

 3) Logística / Estoque
 - Objetivo: controle de saldo por produto, movimentações, alertas de estoque mínimo.
 - Entidades: `estoque`, `movimentacoes`, `ajustes`.
 - Regras: entrada de NF atualiza estoque; pedido de compra cria movimentação pendente.

 4) Compras
 - Objetivo: criar pedidos para fornecedores, recepção (parcial/total) e vínculo com NF de entrada.
 - Entidades: `pedidos_compra`, `nf_entrada`.

 5) Financeiro
 - Objetivo: contas a receber/pagar, parcelas vinculadas a OS, baixa manual e relatórios.
 - Entidades: `parcelas`, `contas_pagar`, `contas_receber`.

 6) Fiscal
 - Objetivo: emissão de NF-e, armazenamento de XML/PDF e envio por e-mail.
 - Observações: atualmente existe código de _mock_. Para integração real, seguir `docs/integracao_fiscal_producao.md`.
 - Entidades principais: `nfe_saida` (campos: numero, serie, chave_acesso, xml_path, status, email_enviado).

 7) Gestão / RH
 - Objetivo: cadastro de funcionários, cargos, e relatórios básicos.

 ## Arquitetura técnica

 - Frontend: componentes isolados, padrão de hooks para acesso a dados e chamadas ao Supabase.
 - API / backend: funções server-side (Edge/Node) para operações sensíveis (emissão fiscal, geração de PDF, envios de e-mail). Preferir Edge Functions no Supabase para segredos e integração direta.
 - Banco: usar migrations em `supabase/migrations` e `seed.sql` para dados iniciais.
 - Autenticação: Supabase Auth; aplicar RLS estrita nas tabelas que armazenam dados sensíveis.

 ## Convenções de código e estilo

 - TypeScript estrito quando possível. Usar `tsconfig.json` padrão do projeto.
 - Lint e formatação: `eslint` + `prettier` (configurações no repositório). Execute antes de PR.
 - Branching: `main` para produção, `develop` para integração, feature branches `feat/<descrição>`.

 ## Variáveis de ambiente críticas

 - `.env.example` lista variáveis esperadas. Valores sensíveis NÃO devem ser commitados.
 - Exemplos (ver `docs/integracao_fiscal_producao.md`):
   - `FISCAL_PROVIDER_API_KEY`, `FISCAL_CERT_BASE64`, `RESEND_API_KEY`, `SUPABASE_URL`, `SUPABASE_KEY`

 ## Deploy e DevOps

 - Hosts/targets observados no repositório: Netlify (`netlify.toml`) para frontend; Cloudflare Workers / Wrangler para edge quando aplicável.
 - Recomenda-se usar pipelines CI que executem:
   1. `npm ci`
   2. `npm run lint`
   3. `npm test` (unit)
   4. Build e deploy para staging

 ## Testes

 - Unit: `vitest` (config em `vitest.config.ts`). Execute `npm run test:unit`.
 - E2E: `playwright` (config em `playwright.config.ts`). Execute `npm run test:e2e`.
 - Relatórios: cobertura em `coverage/`, relatórios Playwright em `playwright-report/`.

 ## Integrações externas

 - Fiscal: seguir `docs/integracao_fiscal_producao.md` para provedor fiscal recomendado (Focus NFe, Nuvem Fiscal, eNotas).
 - E-mail: Resend / SendGrid / Mailgun; templates e verificação de domínio necessários.
 - Storage: Supabase Storage para XML/PDF (retenção conforme legislação).

 ## Operações e manutenção

 - Backups: exportar regularmente dump do banco (pg_dump) e arquivos XML/PDF do Storage.
 - Logs: centralizar em provider de logs (ex.: Logflare, Sentry) para erros e auditoria.
 - Retenção: arquivos fiscais por 5 anos.

 ## Pontos de atenção (risks & tech debt)

 - Vários documentos auxiliares foram removidos; recomendo manter um repositório de docs histórico (backup) antes de limpezas.
 - Certificado digital A1 e credenciais fiscais devem ser testados em homologação antes de produção.
 - RLS e políticas de acesso em Supabase exigem revisão sempre que novas consultas são adicionadas.

 ## Como começar localmente (resumo rápido)

 1. Instalar dependências

 ```bash
 npm ci
 ```

 2. Copiar `.env.example` → `.env` e preencher variáveis essenciais

 3. Rodar em modo dev

 ```bash
 npm run dev
 ```

 4. Rodar testes unitários

 ```bash
 npm run test:unit
 ```

 ## Arquivos e links úteis

 - Roadmap e prioridades: [docs/roadmap-vidracaria.md](docs/roadmap-vidracaria.md)
 - Integração fiscal (requisitos): [docs/integracao_fiscal_producao.md](docs/integracao_fiscal_producao.md)
 - Migrations e seeds: [supabase/](supabase/)
 - Entrypoints servidor: [src/server.ts](src/server.ts), [src/start.ts](src/start.ts)

 ## Próximos passos recomendados

 - Restaurar ou mover para backup os documentos de conhecimento interno removidos (se necessário).
 - Revisar `supabase/migrations` e executar em ambiente de staging.
 - Implementar pipeline CI que rode lint, testes e build automático.

 ---
 Documento gerado pelo assistente em 2026-05-31.
