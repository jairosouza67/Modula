# Plano Técnico — Integração NF-e Real com SEFAZ-BA

## Dados da Empresa (já confirmados)

```
Razão Social:        R. E. C. MARMORARIA E MARCENARIA LTDA
Nome Fantasia:       MODULAAPP
CNPJ:                14.032.864/0001-08  →  "14032864000108"
Inscrição Estadual:  096.918.958 ME      →  "096918958"
Endereço:            Av. Gil Ferreira Pessoa, 70, Galpão, Taquari
Município:           Livramento de Nossa Senhora – BA
CEP:                 46140-000
Código IBGE:         2919504
Regime:              Simples Nacional (CRT = 1)
Telefone:            (77) 34441022
E-mail:              marmorariarc@hotmail.com
```

---

## Arquitetura Geral

```
[React Frontend]
      │
      │ invokeEdgeFunction("emitir-nfe", payload)
      ▼
[Supabase Edge Function: emitir-nfe]
      │  1. Busca dados empresa + token Focus NFe (Supabase Secrets)
      │  2. Monta JSON Focus NFe com dados da OS/cliente
      │  3. POST https://api.focusnfe.com.br/v2/nfe?ref={uuid}
      │  4. Grava nfe_saida com status EM_PROCESSAMENTO + focus_ref
      ▼
[Focus NFe API]
      │  Assina XML com certificado A1 + transmite para SEFAZ-BA
      ▼
[SEFAZ-BA — NFeAutorizacao4]
      │  Protocolo de autorização (cStatus 100 = Autorizado)
      ▼
[Focus NFe Webhook → Supabase Edge Function: webhook-nfe]
      │  Atualiza nfe_saida: status EMITIDA, protocolo, danfe_url
      ▼
[Frontend] ← Supabase Realtime notifica mudança de status
```

---

## FASE 1 — Migration: Novos Campos no Banco

### `supabase/migrations/20260701_nfe_sefaz_integration.sql`

```sql
-- ── 1. Campos fiscais na tabela empresas ─────────────────────────
ALTER TABLE public.empresas
  ADD COLUMN IF NOT EXISTS inscricao_estadual    TEXT,
  ADD COLUMN IF NOT EXISTS codigo_municipio      INTEGER DEFAULT 2919504,
  ADD COLUMN IF NOT EXISTS crt                   INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS cep                   TEXT,
  ADD COLUMN IF NOT EXISTS bairro                TEXT,
  ADD COLUMN IF NOT EXISTS logradouro            TEXT,
  ADD COLUMN IF NOT EXISTS numero_endereco       TEXT,
  ADD COLUMN IF NOT EXISTS complemento           TEXT;

-- Seed com dados reais da ModulaAPP
UPDATE public.empresas
SET
  inscricao_estadual  = '096918958',
  codigo_municipio    = 2919504,
  crt                 = 1,
  cep                 = '46140000',
  bairro              = 'Taquari',
  logradouro          = 'Avenida Gil Ferreira Pessoa',
  numero_endereco     = '70',
  complemento         = 'Galpao'
WHERE cnpj = '14032864000108'
   OR id = (SELECT id FROM public.empresas LIMIT 1);

-- ── 2. Campos fiscais na tabela produtos ─────────────────────────
ALTER TABLE public.produtos
  ADD COLUMN IF NOT EXISTS ncm               TEXT,
  ADD COLUMN IF NOT EXISTS cest              TEXT,
  ADD COLUMN IF NOT EXISTS cfop              TEXT DEFAULT '5102',
  ADD COLUMN IF NOT EXISTS unidade_fiscal    TEXT DEFAULT 'UN',
  ADD COLUMN IF NOT EXISTS origem            INTEGER DEFAULT 0;

-- ── 3. Campos de autorização SEFAZ na nfe_saida ──────────────────
ALTER TABLE public.nfe_saida
  ADD COLUMN IF NOT EXISTS protocolo_autorizacao TEXT,
  ADD COLUMN IF NOT EXISTS xml_autorizado        TEXT,
  ADD COLUMN IF NOT EXISTS xml_cancelamento      TEXT,
  ADD COLUMN IF NOT EXISTS focus_nfe_ref         TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS danfe_url             TEXT,
  ADD COLUMN IF NOT EXISTS data_autorizacao      TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS motivo_rejeicao       TEXT,
  ADD COLUMN IF NOT EXISTS forma_pagamento       TEXT DEFAULT 'dinheiro';

-- ── 4. Tabela de secrets por empresa ─────────────────────────────
-- (armazena o token Focus NFe de cada empresa com segurança)
CREATE TABLE IF NOT EXISTS public.empresa_secrets (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id  UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  chave       TEXT NOT NULL,
  valor       TEXT NOT NULL,
  criado_em   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (empresa_id, chave)
);

ALTER TABLE public.empresa_secrets ENABLE ROW LEVEL SECURITY;
-- Apenas service_role acessa (nunca exposto ao browser)
CREATE POLICY empresa_secrets_service_only ON public.empresa_secrets
  USING (auth.role() = 'service_role');
```

---

## FASE 2 — Edge Function: `emitir-nfe`

### `supabase/functions/emitir-nfe/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { v4 as uuidv4 } from "https://esm.sh/uuid@9";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const FOCUS_NFE_BASE = "https://api.focusnfe.com.br/v2"; // Produção
// const FOCUS_NFE_BASE = "https://homologacao.focusnfe.com.br/v2"; // Homologação

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  const body = await req.json();
  const { nfe_saida_id, empresa_id } = body;

  // 1. Busca dados da NF-e + OS + cliente
  const { data: nfe, error: nfeErr } = await supabase
    .from("nfe_saida")
    .select(`
      *,
      ordens_servico (
        numero, itens, valor_total,
        clientes (nome, documento, endereco, cidade, telefone, email)
      )
    `)
    .eq("id", nfe_saida_id)
    .single();

  if (nfeErr || !nfe) {
    return new Response(JSON.stringify({ error: "NF-e não encontrada" }), { status: 404 });
  }

  // 2. Busca dados da empresa
  const { data: empresa } = await supabase
    .from("empresas")
    .select("*")
    .eq("id", empresa_id)
    .single();

  // 3. Busca token Focus NFe
  const { data: secret } = await supabase
    .from("empresa_secrets")
    .select("valor")
    .eq("empresa_id", empresa_id)
    .eq("chave", "focus_nfe_token")
    .single();

  if (!secret?.valor) {
    return new Response(JSON.stringify({ error: "Token Focus NFe não configurado" }), { status: 400 });
  }

  const focusToken = secret.valor;
  const focusRef = uuidv4(); // Referência única da nota na Focus NFe

  // 4. Monta itens da NF-e a partir dos itens da OS
  const os = nfe.ordens_servico;
  const cliente = os?.clientes;
  const itensOS = Array.isArray(os?.itens) ? os.itens : [];

  const itensFocus = itensOS.map((item: any, idx: number) => {
    const valorUnitario = item.valorTotal || item.precoUnitario || item.valor || 0;
    const quantidade = item.quantidade || 1;
    return {
      numero_item: idx + 1,
      codigo_produto: item.produtoCodigo || `ITEM-${idx + 1}`,
      descricao: item.descricao || item.nomeServico || `Produto ${idx + 1}`,
      codigo_ncm: item.ncm || "70051000", // Vidro Float como padrão
      cfop: item.cfop || "5102",
      unidade_comercial: item.unidade || "UN",
      quantidade_comercial: quantidade,
      valor_unitario_comercial: valorUnitario,
      valor_bruto: valorUnitario * quantidade,
      origem_mercadoria: 0,
      // Simples Nacional sem crédito de ICMS
      situacao_tributaria: "400",
      icms_csosn: "400",
      // PIS/COFINS não tributados (Simples)
      pis_situacao_tributaria: "07",
      cofins_situacao_tributaria: "07",
    };
  });

  // Fallback se não há itens: usa valor total
  if (itensFocus.length === 0) {
    itensFocus.push({
      numero_item: 1,
      codigo_produto: "SERVICO-001",
      descricao: "Serviços de vidraçaria",
      codigo_ncm: "70051000",
      cfop: "5102",
      unidade_comercial: "UN",
      quantidade_comercial: 1,
      valor_unitario_comercial: nfe.valor_total,
      valor_bruto: nfe.valor_total,
      origem_mercadoria: 0,
      situacao_tributaria: "400",
      icms_csosn: "400",
      pis_situacao_tributaria: "07",
      cofins_situacao_tributaria: "07",
    });
  }

  // 5. Monta payload Focus NFe (layout 4.00)
  const payload = {
    natureza_operacao: "Venda de mercadoria",
    forma_pagamento: 0,
    tipo_documento: 1,
    local_destino: 1,
    data_emissao: new Date().toISOString(),
    tipo_operacao: 1,
    finalidade_emissao: 1,
    consumidor_final: 1,
    presenca_comprador: 1,

    emitente: {
      cnpj: "14032864000108",
      nome: empresa?.nome || "MODULAAPP",
      logradouro: empresa?.logradouro || "Avenida Gil Ferreira Pessoa",
      numero: empresa?.numero_endereco || "70",
      complemento: empresa?.complemento || "Galpao",
      bairro: empresa?.bairro || "Taquari",
      municipio: "Livramento de Nossa Senhora",
      uf: "BA",
      cep: empresa?.cep || "46140000",
      codigo_municipio: empresa?.codigo_municipio || 2919504,
      telefone: "7734441022",
      regime_tributario: empresa?.crt || 1,
      inscricao_estadual: empresa?.inscricao_estadual || "096918958",
    },

    destinatario: {
      // CPF/CNPJ do cliente — campo obrigatório
      ...(cliente?.documento?.replace(/\D/g, "").length === 11
        ? { cpf: cliente.documento.replace(/\D/g, "") }
        : { cnpj: cliente?.documento?.replace(/\D/g, "") || "00000000000" }
      ),
      nome: cliente?.nome || "Consumidor Final",
      email: nfe.cliente_email || cliente?.email || undefined,
      indicador_inscricao_estadual: 9, // 9 = Não Contribuinte
      // Endereço do destinatário (obrigatório para NF-e)
      logradouro: cliente?.endereco || "Não Informado",
      numero: "S/N",
      bairro: "Não Informado",
      municipio: cliente?.cidade || "Livramento de Nossa Senhora",
      uf: "BA",
      cep: "46140000",
      codigo_municipio: 2919504,
    },

    items: itensFocus,

    formas_pagamento: [{
      forma_pagamento: mapFormaPagamento(nfe.forma_pagamento),
      valor_pagamento: nfe.valor_total,
    }],

    informacoes_adicionais_contribuinte:
      `OS: ${os?.numero || "N/A"} | Simples Nacional`,
  };

  // 6. Envia para Focus NFe
  const focusUrl = `${FOCUS_NFE_BASE}/nfe?ref=${focusRef}`;
  const focusResponse = await fetch(focusUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${btoa(focusToken + ":")}`,
    },
    body: JSON.stringify(payload),
  });

  const focusData = await focusResponse.json();

  if (!focusResponse.ok && focusResponse.status !== 200) {
    console.error("[emitir-nfe] Focus NFe error:", focusData);
    return new Response(
      JSON.stringify({ error: "Erro ao enviar para Focus NFe", details: focusData }),
      { status: 500 }
    );
  }

  // 7. Atualiza nfe_saida com referência e status EM_PROCESSAMENTO
  await supabase
    .from("nfe_saida")
    .update({
      focus_nfe_ref: focusRef,
      status: "EM_PROCESSAMENTO",
    })
    .eq("id", nfe_saida_id);

  return new Response(
    JSON.stringify({ success: true, ref: focusRef, status: "EM_PROCESSAMENTO" }),
    { headers: { "Content-Type": "application/json" } }
  );
});

function mapFormaPagamento(forma?: string): string {
  const map: Record<string, string> = {
    dinheiro: "01",
    pix: "17",
    cartao_debito: "04",
    cartao_credito: "03",
    boleto: "15",
    transferencia: "03",
  };
  return map[forma || "dinheiro"] || "01";
}
```

---

## FASE 3 — Edge Function: `webhook-nfe`

### `supabase/functions/webhook-nfe/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req) => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  const body = await req.json();

  // Focus NFe envia: { ref, status, cnpj_emitente, ... }
  const { ref, status, chave_nfe, numero, protocolo, caminho_danfe, motivo } = body;

  if (!ref) {
    return new Response("Missing ref", { status: 400 });
  }

  // Mapeia status Focus NFe → nosso status
  const statusMap: Record<string, string> = {
    autorizado: "EMITIDA",
    cancelado: "CANCELADA",
    erro_autorizacao: "DENEGADA",
    denegado: "DENEGADA",
  };

  const novoStatus = statusMap[status] || "DENEGADA";

  const updateData: Record<string, any> = {
    status: novoStatus,
  };

  if (novoStatus === "EMITIDA") {
    updateData.chave_acesso = chave_nfe;
    updateData.numero = numero;
    updateData.protocolo_autorizacao = protocolo;
    updateData.danfe_url = caminho_danfe;
    updateData.data_autorizacao = new Date().toISOString();
    updateData.motivo_rejeicao = null;
  } else {
    updateData.motivo_rejeicao = motivo || "Nota rejeitada pela SEFAZ";
  }

  const { error } = await supabase
    .from("nfe_saida")
    .update(updateData)
    .eq("focus_nfe_ref", ref);

  if (error) {
    console.error("[webhook-nfe] Erro ao atualizar:", error);
    return new Response("DB error", { status: 500 });
  }

  console.log(`[webhook-nfe] NF-e ref=${ref} → status=${novoStatus}`);
  return new Response("OK", { status: 200 });
});
```

---

## FASE 4 — Alterações no Frontend

### 4.1 Atualizar `useEmitirNfe` no hook `useFiscalData.ts`

```typescript
// ANTES: inseria direto no banco
// DEPOIS: chama Edge Function

export function useEmitirNfe() {
  const queryClient = useQueryClient();
  const empresaId = getDefaultEmpresaId();
  const supabase = getSupabaseBrowserClient();

  return useMutation({
    mutationFn: async (dados: {
      os_id: string;
      cliente_nome: string;
      cliente_documento: string;
      cliente_email?: string;
      valor_total: number;
      valor_impostos: number;
      itens: any;
      forma_pagamento?: string;
    }) => {
      // 1. Cria registro EM_PROCESSAMENTO no banco
      const { data: nfeRecord, error: insertErr } = await supabase
        .from("nfe_saida")
        .insert({
          empresa_id: empresaId,
          os_id: dados.os_id,
          numero: "0", // Será atualizado pelo webhook
          serie: "1",
          status: "EM_PROCESSAMENTO",
          valor_total: dados.valor_total,
          valor_impostos: dados.valor_impostos,
          cliente_nome: dados.cliente_nome,
          cliente_documento: dados.cliente_documento,
          cliente_email: dados.cliente_email,
          itens: dados.itens,
          forma_pagamento: dados.forma_pagamento || "dinheiro",
        })
        .select()
        .single();

      if (insertErr || !nfeRecord) throw insertErr;

      // 2. Chama Edge Function para transmitir à SEFAZ via Focus NFe
      const { data: fnResult, error: fnError } = await supabase.functions
        .invoke("emitir-nfe", {
          body: {
            nfe_saida_id: nfeRecord.id,
            empresa_id: empresaId,
          },
        });

      if (fnError) throw fnError;
      return { ...nfeRecord, ...fnResult };
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nfes"] });
      queryClient.invalidateQueries({ queryKey: ["os_disponiveis_nfe"] });
      toast.success("NF-e enviada à SEFAZ!", {
        description: "Aguardando autorização... Status será atualizado automaticamente.",
      });
    },
    onError: (error: any) => {
      toast.error(userFriendlyError("Erro ao emitir NF-e", error));
    },
  });
}
```

### 4.2 Atualizar a tabela de NF-e em `_app.fiscal.tsx`

Adicionar:
- Coluna **"Chave"** (truncada para 8 dígitos com tooltip)
- Coluna **"Protocolo"**
- Spinner de loading para status `EM_PROCESSAMENTO`
- Botão **"Baixar DANFE"** (abre `danfe_url` em nova aba)
- Badge de motivo de rejeição para status `DENEGADA`

### 4.3 Campo de forma de pagamento no `ModalEmitirNfe.tsx`

Adicionar Select com opções:
- Dinheiro (01)
- PIX (17)
- Cartão de Débito (04)
- Cartão de Crédito (03)
- Boleto (15)

### 4.4 Página de Configuração Fiscal (nova aba em Config)

Formulário para o admin inserir:
- Token da Focus NFe (salvo em `empresa_secrets`)
- Modo: Homologação / Produção

---

## FASE 5 — Configurar Webhook na Focus NFe

No painel da Focus NFe:
1. Settings → Webhooks
2. URL do webhook: `https://<seu-projeto>.supabase.co/functions/v1/webhook-nfe`
3. Eventos: `nfe.autorizada`, `nfe.cancelada`, `nfe.erro`
4. Adicionar header de autenticação: `Authorization: Bearer <SUPABASE_ANON_KEY>`

---

## Tabela de NCM para os Produtos (configurar no cadastro)

| Produto | NCM | CFOP | Unidade |
|---|---|---|---|
| Vidro Float | `70051000` | 5102 | M2 |
| Vidro Temperado | `70071900` | 5102 | M2 |
| Vidro Laminado | `70072900` | 5102 | M2 |
| Espelho | `70099100` | 5102 | UN |
| Box de Banheiro | `70200000` | 5102 | UN |
| Pedra Mármore/Granito | `68029100` | 5102 | M2 |
| Serviço de Instalação | `83024200` | 5933 | UN |

---

## Checklist de Implementação

- [ ] **Fase 1** — Rodar migration `20260701_nfe_sefaz_integration.sql`
- [ ] **Fase 2** — Deploy Edge Function `emitir-nfe`
- [ ] **Fase 3** — Deploy Edge Function `webhook-nfe`
- [ ] **Fase 4** — Atualizar `useFiscalData.ts`, `_app.fiscal.tsx`, `ModalEmitirNfe.tsx`
- [ ] **Fase 5** — Configurar webhook na Focus NFe
- [ ] **Fase 6** — Inserir token Focus NFe (homologação) via página de config
- [ ] **Fase 7** — Emitir 3 notas de teste em homologação
- [ ] **Fase 8** — Inserir certificado A1 na Focus NFe (painel deles)
- [ ] **Fase 9** — Trocar para token de produção
- [ ] **Fase 10** — Emitir primeira nota real 🎉

---

## Cronograma Estimado

| Dia | Atividade |
|---|---|
| Dia 1 | Migration + Deploy Edge Functions |
| Dia 2 | Atualização do hook + ModalEmitirNfe |
| Dia 3 | Atualização da tela fiscal (DANFE, status, forma pagamento) |
| Dia 4 | Configuração Focus NFe (webhook, certificado) |
| Dia 5–7 | Testes em homologação + ajustes |
| Dia 8 | Go live em produção |
