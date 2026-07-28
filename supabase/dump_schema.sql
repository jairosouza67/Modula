


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pg_cron" WITH SCHEMA "pg_catalog";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."aplicar_movimentacao_estoque"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
begin
  if NEW.tipo in ('Entrada', 'Devolução') then
    update public.estoque_itens
    set quantidade = quantidade + NEW.quantidade
    where id = NEW.item_id;
  elsif NEW.tipo = 'Saída' then
    -- Valida estoque suficiente
    if (select quantidade from public.estoque_itens where id = NEW.item_id) < NEW.quantidade then
      raise exception 'Estoque insuficiente para o item %', NEW.item_id;
    end if;
    update public.estoque_itens
    set quantidade = quantidade - NEW.quantidade
    where id = NEW.item_id;
  elsif NEW.tipo = 'Ajuste' then
    update public.estoque_itens
    set quantidade = NEW.quantidade
    where id = NEW.item_id;
  end if;
  return NEW;
end;
$$;


ALTER FUNCTION "public"."aplicar_movimentacao_estoque"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."can_access_empresa"("target_empresa_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT (
    -- 1. Service role sempre tem acesso (admin do Supabase)
    auth.role() = 'service_role'
    
    -- 2. JWT com empresa_id no payload (para tokens customizados)
    OR (
      auth.jwt() ->> 'empresa_id' IS NOT NULL
      AND target_empresa_id = (auth.jwt() ->> 'empresa_id')::uuid
    )
    
    -- 3. Usuário vinculado à empresa via perfis_usuario (caminho seguro)
    OR EXISTS (
      SELECT 1
      FROM public.perfis_usuario p
      WHERE p.user_id = auth.uid()
        AND p.empresa_id = target_empresa_id
    )
    
    -- ❌ REMOVIDO: bypass que dava acesso universal a authenticated users
    -- OR (
    --   auth.role() = 'authenticated'
    --   AND target_empresa_id = '00000000-0000-0000-0000-000000000001'::uuid
    -- )
  );
$$;


ALTER FUNCTION "public"."can_access_empresa"("target_empresa_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_orcamento_expirado"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  if new.status = 'Aberto' and new.data_validade < current_date then
    new.status := 'Expirado';
  end if;
  return new;
end;
$$;


ALTER FUNCTION "public"."check_orcamento_expirado"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."current_empresa_id"() RETURNS "uuid"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT p.empresa_id
  FROM public.perfis_usuario p
  WHERE p.user_id = auth.uid()
  ORDER BY p.created_at ASC
  LIMIT 1;
$$;


ALTER FUNCTION "public"."current_empresa_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_atualizar_saldo_conta"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    IF (NEW.tipo = 'ENTRADA') THEN
      UPDATE contas_bancarias SET saldo_atual = saldo_atual + NEW.valor WHERE id = NEW.conta_id;
    ELSE
      UPDATE contas_bancarias SET saldo_atual = saldo_atual - NEW.valor WHERE id = NEW.conta_id;
    END IF;
  ELSIF (TG_OP = 'DELETE') THEN
    IF (OLD.tipo = 'ENTRADA') THEN
      UPDATE contas_bancarias SET saldo_atual = saldo_atual - OLD.valor WHERE id = OLD.conta_id;
    ELSE
      UPDATE contas_bancarias SET saldo_atual = saldo_atual + OLD.valor WHERE id = OLD.conta_id;
    END IF;
  ELSIF (TG_OP = 'UPDATE') THEN
    IF (OLD.tipo = 'ENTRADA') THEN
      UPDATE contas_bancarias SET saldo_atual = saldo_atual - OLD.valor WHERE id = OLD.conta_id;
    ELSE
      UPDATE contas_bancarias SET saldo_atual = saldo_atual + OLD.valor WHERE id = OLD.conta_id;
    END IF;
    IF (NEW.tipo = 'ENTRADA') THEN
      UPDATE contas_bancarias SET saldo_atual = saldo_atual + NEW.valor WHERE id = NEW.conta_id;
    ELSE
      UPDATE contas_bancarias SET saldo_atual = saldo_atual - NEW.valor WHERE id = NEW.conta_id;
    END IF;
  END IF;
  RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."fn_atualizar_saldo_conta"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_keepalive_ping"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  INSERT INTO public._keepalive_log (pinged_at)
  VALUES (now());
END;
$$;


ALTER FUNCTION "public"."fn_keepalive_ping"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."gerar_numero_pedido_compra"("p_empresa_id" "uuid") RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_seq BIGINT;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(numero FROM 4) AS BIGINT)), 0) + 1
    INTO v_seq
    FROM pedidos_compra
    WHERE empresa_id = p_empresa_id;
  RETURN 'PC-' || LPAD(v_seq::TEXT, 4, '0');
END;
$$;


ALTER FUNCTION "public"."gerar_numero_pedido_compra"("p_empresa_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_next_nfe_numero"("p_empresa_id" "uuid") RETURNS bigint
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_proximo BIGINT;
BEGIN
  -- Calcula o próximo número com base no máximo existente para a empresa.
  -- O SELECT FOR UPDATE na tabela inteira (filtrada por empresa) serializa
  -- chamadas concorrentes e evita duplicatas na constraint UNIQUE.
  SELECT COALESCE(MAX(numero::BIGINT), 0) + 1
    INTO v_proximo
    FROM public.nfe_saida
   WHERE empresa_id = p_empresa_id
   FOR UPDATE;

  RETURN v_proximo;
END;
$$;


ALTER FUNCTION "public"."get_next_nfe_numero"("p_empresa_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin_user"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.perfis_usuario p
    WHERE p.user_id = auth.uid()
      AND p.role IN ('superadmin', 'admin')
  );
$$;


ALTER FUNCTION "public"."is_admin_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."marcar_os_atrasadas"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  update public.ordens_servico
  set is_atrasada = (data_previsao is not null and data_previsao < current_date)
  where status not in ('Concluido')
    and deleted_at is null;
end;
$$;


ALTER FUNCTION "public"."marcar_os_atrasadas"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."registrar_nfe_entrada"("p_empresa_id" "uuid", "p_fornecedor_id" "uuid", "p_fornecedor_nome" "text", "p_numero" "text", "p_serie" "text", "p_chave_acesso" "text", "p_data_emissao" "date", "p_valor_total" numeric, "p_pedido_compra_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_nfe_id UUID;
  v_item RECORD;
  v_estoque_id UUID;
  v_forn_id UUID;
BEGIN
  -- Se p_pedido_compra_id foi informado, buscar o fornecedor dele
  v_forn_id := p_fornecedor_id;
  IF p_pedido_compra_id IS NOT NULL AND v_forn_id IS NULL THEN
    SELECT fornecedor_id INTO v_forn_id
    FROM pedidos_compra
    WHERE id = p_pedido_compra_id AND empresa_id = p_empresa_id;
  END IF;

  -- Insere a NFe
  INSERT INTO nfe_entrada (
    empresa_id, fornecedor_id, fornecedor_nome, numero, serie, chave_acesso, data_emissao, valor_total, pedido_compra_id
  ) VALUES (
    p_empresa_id, v_forn_id, p_fornecedor_nome, p_numero, p_serie, p_chave_acesso, p_data_emissao, p_valor_total, p_pedido_compra_id
  ) RETURNING id INTO v_nfe_id;

  -- Atualiza o pedido e estoque
  IF p_pedido_compra_id IS NOT NULL THEN
    UPDATE pedidos_compra SET status = 'recebido_total' WHERE id = p_pedido_compra_id AND empresa_id = p_empresa_id;

    FOR v_item IN (SELECT * FROM pedidos_compra_itens WHERE pedido_id = p_pedido_compra_id) LOOP
      
      SELECT id INTO v_estoque_id
      FROM estoque_itens
      WHERE empresa_id = p_empresa_id AND nome_produto = v_item.produto;

      IF v_estoque_id IS NULL THEN
        INSERT INTO estoque_itens (empresa_id, nome_produto, quantidade, estoque_minimo, unidade)
        VALUES (p_empresa_id, v_item.produto, 0, 0, 'UN')
        RETURNING id INTO v_estoque_id;
      END IF;

      INSERT INTO estoque_movimentacoes (
        item_id, tipo, quantidade, observacao
      ) VALUES (
        v_estoque_id, 'entrada', v_item.quantidade,
        'Entrada via NFe: ' || p_chave_acesso || ' (Pedido: ' || p_pedido_compra_id || ')'
      );

    END LOOP;
  END IF;

  RETURN jsonb_build_object('nfe_id', v_nfe_id);
END;
$$;


ALTER FUNCTION "public"."registrar_nfe_entrada"("p_empresa_id" "uuid", "p_fornecedor_id" "uuid", "p_fornecedor_nome" "text", "p_numero" "text", "p_serie" "text", "p_chave_acesso" "text", "p_data_emissao" "date", "p_valor_total" numeric, "p_pedido_compra_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."rls_auto_enable"() RETURNS "event_trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog'
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$$;


ALTER FUNCTION "public"."rls_auto_enable"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_atualizado_em"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$ BEGIN NEW.atualizado_em = now(); RETURN NEW; END; $$;


ALTER FUNCTION "public"."set_atualizado_em"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trg_atualizar_saldo_credito"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_valor_total NUMERIC(12,2);
  v_original NUMERIC(12,2);
BEGIN
  SELECT COALESCE(SUM(valor_utilizado), 0)
    INTO v_valor_total
    FROM creditos_uso
    WHERE credito_id = COALESCE(NEW.credito_id, OLD.credito_id);

  SELECT valor_original INTO v_original
    FROM creditos_fornecedor
    WHERE id = COALESCE(NEW.credito_id, OLD.credito_id);

  UPDATE creditos_fornecedor SET
    valor_disponivel = v_original - v_valor_total,
    status = CASE
      WHEN (v_original - v_valor_total) <= 0 THEN 'utilizado'
      WHEN (v_original - v_valor_total) < v_original THEN 'parcialmente_utilizado'
      ELSE 'disponivel'
    END,
    atualizado_em = now()
  WHERE id = COALESCE(NEW.credito_id, OLD.credito_id);

  RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."trg_atualizar_saldo_credito"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trg_atualizar_totais_pedido"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  UPDATE pedidos_compra SET
    valor_total = (SELECT COALESCE(SUM(total), 0) FROM pedidos_compra_itens WHERE pedido_id = NEW.pedido_id),
    area_total_m2 = (SELECT COALESCE(SUM(m2_calculado), 0) FROM pedidos_compra_itens WHERE pedido_id = NEW.pedido_id),
    qtd_total_pecas = (SELECT COALESCE(SUM(quantidade), 0) FROM pedidos_compra_itens WHERE pedido_id = NEW.pedido_id),
    atualizado_em = now()
  WHERE id = NEW.pedido_id;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."trg_atualizar_totais_pedido"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trg_avaliar_atraso_os"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  NEW.is_atrasada := (NEW.data_previsao is not null)
                     and (NEW.data_previsao < current_date)
                     and (NEW.status <> 'Concluido');
  return NEW;
end;
$$;


ALTER FUNCTION "public"."trg_avaliar_atraso_os"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trg_criar_romaneio_em_transporte"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_romaneio_id UUID;
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'em_transporte' THEN
    INSERT INTO romaneios (empresa_id, pedido_compra_id, data_emissao)
    VALUES (NEW.empresa_id, NEW.id, CURRENT_DATE)
    RETURNING id INTO v_romaneio_id;

    INSERT INTO romaneio_itens (romaneio_id, produto, largura_mm, altura_mm, qtd_encomendada, m2)
    SELECT v_romaneio_id, produto, largura_mm, altura_mm, quantidade, m2_calculado
    FROM pedidos_compra_itens
    WHERE pedido_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."trg_criar_romaneio_em_transporte"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trg_entrada_estoque_romaneio"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_item RECORD;
  v_estoque_id UUID;
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'concluido' THEN
    FOR v_item IN
      SELECT * FROM romaneio_itens
      WHERE romaneio_id = NEW.id AND situacao = 'ok'
    LOOP
      SELECT id INTO v_estoque_id
      FROM estoque_itens
      WHERE empresa_id = NEW.empresa_id AND nome = v_item.produto
      LIMIT 1;

      IF v_estoque_id IS NOT NULL THEN
        INSERT INTO estoque_movimentacoes (
          item_id, tipo, quantidade, referencia_tipo, referencia_id, observacao
        ) VALUES (
          v_estoque_id, 'entrada', v_item.qtd_recebida,
          'romaneio', NEW.id,
          'Entrada automática via romaneio ' || NEW.id::TEXT
        );
      END IF;
    END LOOP;

    UPDATE pedidos_compra
    SET status = 'concluido', atualizado_em = now()
    WHERE id = NEW.pedido_compra_id;
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."trg_entrada_estoque_romaneio"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trg_registrar_etapa_pedido"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO pedidos_compra_etapas (pedido_id, etapa, usuario_nome)
    VALUES (NEW.id, NEW.status, 'Sistema');

    IF NEW.status = 'concluido' THEN
      NEW.data_conclusao = now();
    END IF;
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."trg_registrar_etapa_pedido"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trg_status_inicial_pedido"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF NEW.status = 'emissao' AND NEW.valor_total > NEW.limite_liberacao THEN
    NEW.status = 'aguardando_liberacao';
  ELSIF NEW.status = 'emissao' THEN
    NEW.status = 'autorizado';
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."trg_status_inicial_pedido"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."_keepalive_log" (
    "id" bigint NOT NULL,
    "executed_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "status" "text" DEFAULT 'ok'::"text" NOT NULL,
    "details" "jsonb"
);


ALTER TABLE "public"."_keepalive_log" OWNER TO "postgres";


ALTER TABLE "public"."_keepalive_log" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."_keepalive_log_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."categorias_financeiras" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "empresa_id" "uuid" NOT NULL,
    "parent_id" "uuid",
    "codigo" "text" NOT NULL,
    "nome" "text" NOT NULL,
    "tipo" "text" NOT NULL,
    "ativo" boolean DEFAULT true NOT NULL,
    "criado_em" timestamp with time zone DEFAULT "now"() NOT NULL,
    "atualizado_em" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "categorias_financeiras_tipo_check" CHECK (("tipo" = ANY (ARRAY['RECEITA'::"text", 'DESPESA'::"text", 'CUSTO'::"text"])))
);


ALTER TABLE "public"."categorias_financeiras" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."clientes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "empresa_id" "uuid" NOT NULL,
    "nome" "text" NOT NULL,
    "documento" "text" NOT NULL,
    "tipo_documento" "text" NOT NULL,
    "contato" "text" NOT NULL,
    "segmento" "text" NOT NULL,
    "ultimo_contato" "date" DEFAULT CURRENT_DATE NOT NULL,
    "volume_total" numeric(12,2) DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted_at" timestamp with time zone,
    "email" "text",
    "telefone" "text",
    "endereco" "text",
    "cidade" "text",
    "representante" "text",
    "referencia" "text",
    "cep" "text",
    "bairro" "text",
    "uf" "text",
    "numero_endereco" "text",
    "complemento" "text",
    "codigo_municipio" integer,
    "inscricao_estadual" "text",
    CONSTRAINT "clientes_segmento_check" CHECK (("segmento" = ANY (ARRAY['Construtoras'::"text", 'Residencial'::"text", 'Arquitetos'::"text", 'Comercial'::"text"]))),
    CONSTRAINT "clientes_tipo_documento_check" CHECK (("tipo_documento" = ANY (ARRAY['cpf'::"text", 'cnpj'::"text"]))),
    CONSTRAINT "clientes_volume_total_check" CHECK (("volume_total" >= (0)::numeric))
);


ALTER TABLE "public"."clientes" OWNER TO "postgres";


COMMENT ON COLUMN "public"."clientes"."codigo_municipio" IS 'Código IBGE do município do cliente';



COMMENT ON COLUMN "public"."clientes"."inscricao_estadual" IS 'Inscrição Estadual do cliente (quando contribuinte ICMS)';



CREATE TABLE IF NOT EXISTS "public"."colaboradores" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "empresa_id" "uuid" NOT NULL,
    "nome" character varying(255) NOT NULL,
    "cpf" character varying(14),
    "cargo" character varying(100) NOT NULL,
    "salario" numeric(10,2) DEFAULT 0 NOT NULL,
    "status" character varying(20) DEFAULT 'Ativo'::character varying NOT NULL,
    "data_admissao" "date" NOT NULL,
    "data_demissao" "date",
    "data_limite_ferias" "date",
    "horas_extras_mes" numeric(5,2) DEFAULT 0,
    "telefone" character varying(20),
    "email" character varying(255),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "colaboradores_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['Ativo'::character varying, 'Inativo'::character varying, 'Afastado'::character varying])::"text"[])))
);


ALTER TABLE "public"."colaboradores" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."condicoes_pagamento" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "empresa_id" "uuid" NOT NULL,
    "codigo" "text" NOT NULL,
    "descricao" "text" NOT NULL,
    "prazos_dias" integer[] NOT NULL,
    "desconto_pct" numeric(5,2) DEFAULT 0 NOT NULL,
    "acrescimo_pct" numeric(5,2) DEFAULT 0 NOT NULL,
    "aplicacao" "text" DEFAULT 'ambos'::"text" NOT NULL,
    "ativo" boolean DEFAULT true NOT NULL,
    "criado_em" timestamp with time zone DEFAULT "now"() NOT NULL,
    "atualizado_em" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "condicoes_pagamento_aplicacao_check" CHECK (("aplicacao" = ANY (ARRAY['venda'::"text", 'compra'::"text", 'ambos'::"text"])))
);


ALTER TABLE "public"."condicoes_pagamento" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."config_precos" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "empresa_id" "uuid" NOT NULL,
    "categoria" "text" NOT NULL,
    "descricao" "text" NOT NULL,
    "valor" numeric(12,2) NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "config_precos_categoria_check" CHECK (("categoria" = ANY (ARRAY['vidro'::"text", 'processamento'::"text"]))),
    CONSTRAINT "config_precos_valor_check" CHECK (("valor" >= (0)::numeric))
);


ALTER TABLE "public"."config_precos" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."contas_bancarias" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "empresa_id" "uuid" NOT NULL,
    "nome" "text" NOT NULL,
    "tipo" "text" NOT NULL,
    "saldo_inicial" numeric(12,2) DEFAULT 0 NOT NULL,
    "saldo_atual" numeric(12,2) DEFAULT 0 NOT NULL,
    "ativo" boolean DEFAULT true NOT NULL,
    "criado_em" timestamp with time zone DEFAULT "now"() NOT NULL,
    "atualizado_em" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "contas_bancarias_tipo_check" CHECK (("tipo" = ANY (ARRAY['BANCO'::"text", 'CAIXA'::"text", 'APLICAÇÃO'::"text"])))
);


ALTER TABLE "public"."contas_bancarias" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."contas_pagar_receber" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "empresa_id" "uuid" NOT NULL,
    "cliente_id" "uuid",
    "fornecedor_id" "uuid",
    "categoria_id" "uuid" NOT NULL,
    "data_vencimento" "date" NOT NULL,
    "data_competencia" "date" DEFAULT CURRENT_DATE NOT NULL,
    "valor_previsto" numeric(12,2) NOT NULL,
    "valor_pago" numeric(12,2) DEFAULT 0 NOT NULL,
    "status" "text" DEFAULT 'PENDENTE'::"text" NOT NULL,
    "lancamento_id" "uuid",
    "observacoes" "text",
    "criado_em" timestamp with time zone DEFAULT "now"() NOT NULL,
    "atualizado_em" timestamp with time zone DEFAULT "now"() NOT NULL,
    "ordem_servico_id" "uuid",
    "parcela" "text",
    CONSTRAINT "contas_pagar_receber_status_check" CHECK (("status" = ANY (ARRAY['PENDENTE'::"text", 'PAGO'::"text", 'CANCELADO'::"text", 'ATRASADO'::"text"])))
);


ALTER TABLE "public"."contas_pagar_receber" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."convites" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "email" "text" NOT NULL,
    "role" "text" NOT NULL,
    "token" "text" NOT NULL,
    "empresa_id" "uuid",
    "convidado_por" "uuid",
    "expires_at" timestamp with time zone NOT NULL,
    "usado_em" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "convites_role_check" CHECK (("role" = ANY (ARRAY['superadmin'::"text", 'admin'::"text", 'gestor'::"text", 'vendedor'::"text", 'tecnico'::"text", 'financeiro'::"text"])))
);


ALTER TABLE "public"."convites" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."creditos_fornecedor" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "empresa_id" "uuid" NOT NULL,
    "fornecedor_id" "uuid" NOT NULL,
    "tipo" "text" NOT NULL,
    "numero" "text" NOT NULL,
    "valor_original" numeric(12,2) NOT NULL,
    "valor_disponivel" numeric(12,2) NOT NULL,
    "data_emissao" "date" DEFAULT CURRENT_DATE NOT NULL,
    "data_vencimento" "date" NOT NULL,
    "descricao" "text",
    "status" "text" DEFAULT 'disponivel'::"text" NOT NULL,
    "criado_por" "uuid",
    "criado_em" timestamp with time zone DEFAULT "now"() NOT NULL,
    "atualizado_em" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "creditos_fornecedor_status_check" CHECK (("status" = ANY (ARRAY['disponivel'::"text", 'parcialmente_utilizado'::"text", 'utilizado'::"text", 'vencido'::"text"]))),
    CONSTRAINT "creditos_fornecedor_tipo_check" CHECK (("tipo" = ANY (ARRAY['devolucao'::"text", 'bonificacao'::"text", 'desconto_futuro'::"text", 'nota_credito'::"text"]))),
    CONSTRAINT "creditos_fornecedor_valor_original_check" CHECK (("valor_original" > (0)::numeric))
);


ALTER TABLE "public"."creditos_fornecedor" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."creditos_uso" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "credito_id" "uuid" NOT NULL,
    "pedido_compra_id" "uuid" NOT NULL,
    "valor_utilizado" numeric(12,2) NOT NULL,
    "data_uso" timestamp with time zone DEFAULT "now"() NOT NULL,
    "criado_por" "uuid",
    CONSTRAINT "creditos_uso_valor_utilizado_check" CHECK (("valor_utilizado" > (0)::numeric))
);


ALTER TABLE "public"."creditos_uso" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."empresa_secrets" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "empresa_id" "uuid" NOT NULL,
    "chave" "text" NOT NULL,
    "valor" "text" NOT NULL,
    "criado_em" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."empresa_secrets" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."empresas" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "nome_fantasia" "text" NOT NULL,
    "razao_social" "text" NOT NULL,
    "cnpj" "text" NOT NULL,
    "endereco" "text" NOT NULL,
    "certificado_digital" "text" DEFAULT ''::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "cidade" "text",
    "telefone" "text",
    "inscricao_estadual" "text",
    "codigo_municipio" integer DEFAULT 2919504,
    "crt" integer DEFAULT 1,
    "cep" "text",
    "bairro" "text",
    "logradouro" "text",
    "numero_endereco" "text",
    "complemento" "text",
    "uf" "text"
);


ALTER TABLE "public"."empresas" OWNER TO "postgres";


COMMENT ON COLUMN "public"."empresas"."uf" IS 'UF do emitente (ex: BA, SP, RJ)';



CREATE TABLE IF NOT EXISTS "public"."estoque_itens" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "empresa_id" "uuid" NOT NULL,
    "codigo" "text" NOT NULL,
    "descricao" "text" NOT NULL,
    "categoria" "text" NOT NULL,
    "unidade" "text" DEFAULT 'pç'::"text" NOT NULL,
    "quantidade" numeric(10,3) DEFAULT 0 NOT NULL,
    "estoque_minimo" numeric(10,3) DEFAULT 0 NOT NULL,
    "custo_unitario" numeric(12,2) DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted_at" timestamp with time zone,
    "produto_id" "uuid",
    CONSTRAINT "estoque_itens_categoria_check" CHECK (("categoria" = ANY (ARRAY['Chapas'::"text", 'Ferragens'::"text", 'Perfis'::"text", 'Consumíveis'::"text", 'Outros'::"text"])))
);


ALTER TABLE "public"."estoque_itens" OWNER TO "postgres";


COMMENT ON COLUMN "public"."estoque_itens"."produto_id" IS 'Vínculo opcional com o catálogo de produtos — usado para baixa automática de estoque ao aprovar orçamentos.';



CREATE OR REPLACE VIEW "public"."estoque_critico" WITH ("security_invoker"='on') AS
 SELECT "id",
    "empresa_id",
    "codigo",
    "descricao",
    "categoria",
    "quantidade",
    "estoque_minimo",
    "custo_unitario",
        CASE
            WHEN ("quantidade" = (0)::numeric) THEN 'Sem estoque'::"text"
            WHEN ("quantidade" < "estoque_minimo") THEN 'Crítico'::"text"
            WHEN ("quantidade" <= ("estoque_minimo" * 1.3)) THEN 'Atenção'::"text"
            ELSE NULL::"text"
        END AS "status_critico"
   FROM "public"."estoque_itens" "ei"
  WHERE (("deleted_at" IS NULL) AND ("quantidade" <= ("estoque_minimo" * 1.3)));


ALTER VIEW "public"."estoque_critico" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."estoque_movimentacoes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "empresa_id" "uuid" NOT NULL,
    "item_id" "uuid" NOT NULL,
    "tipo" "text" NOT NULL,
    "quantidade" numeric(10,3) NOT NULL,
    "os_referencia" "text",
    "observacao" "text",
    "usuario_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "orcamento_id" "uuid",
    CONSTRAINT "estoque_movimentacoes_tipo_check" CHECK (("tipo" = ANY (ARRAY['Entrada'::"text", 'Saída'::"text", 'Devolução'::"text", 'Ajuste'::"text"])))
);


ALTER TABLE "public"."estoque_movimentacoes" OWNER TO "postgres";


COMMENT ON COLUMN "public"."estoque_movimentacoes"."orcamento_id" IS 'Orçamento que originou a movimentação — usado para devolução ao cancelar produção.';



CREATE TABLE IF NOT EXISTS "public"."formas_pagamento" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "empresa_id" "uuid" NOT NULL,
    "codigo" "text" NOT NULL,
    "descricao" "text" NOT NULL,
    "aplicacao" "text" DEFAULT 'ambos'::"text" NOT NULL,
    "ativo" boolean DEFAULT true NOT NULL,
    "criado_em" timestamp with time zone DEFAULT "now"() NOT NULL,
    "atualizado_em" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "formas_pagamento_aplicacao_check" CHECK (("aplicacao" = ANY (ARRAY['venda'::"text", 'compra'::"text", 'ambos'::"text"])))
);


ALTER TABLE "public"."formas_pagamento" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."fornecedores" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "empresa_id" "uuid" NOT NULL,
    "nome" "text" NOT NULL,
    "cnpj" "text" NOT NULL,
    "contato" "text" NOT NULL,
    "categoria" "text" NOT NULL,
    "dados_fiscais" "text" DEFAULT ''::"text" NOT NULL,
    "dados_bancarios" "text" DEFAULT ''::"text" NOT NULL,
    "a_pagar" numeric(12,2) DEFAULT 0 NOT NULL,
    "vencimento" "date",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted_at" timestamp with time zone,
    CONSTRAINT "fornecedores_a_pagar_check" CHECK (("a_pagar" >= (0)::numeric)),
    CONSTRAINT "fornecedores_categoria_check" CHECK (("categoria" = ANY (ARRAY['Chapas temperadas'::"text", 'Perfis aluminio'::"text", 'Ferragens box/janela'::"text", 'Espelhos lapidados'::"text", 'Consumiveis'::"text"])))
);


ALTER TABLE "public"."fornecedores" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."lancamentos" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "empresa_id" "uuid" NOT NULL,
    "conta_id" "uuid" NOT NULL,
    "categoria_id" "uuid" NOT NULL,
    "data_pagamento" "date" DEFAULT CURRENT_DATE NOT NULL,
    "valor" numeric(12,2) NOT NULL,
    "tipo" "text" NOT NULL,
    "descricao" "text" NOT NULL,
    "documento_ref" "text",
    "conciliado" boolean DEFAULT false NOT NULL,
    "criado_em" timestamp with time zone DEFAULT "now"() NOT NULL,
    "atualizado_em" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "lancamentos_tipo_check" CHECK (("tipo" = ANY (ARRAY['ENTRADA'::"text", 'SAIDA'::"text"])))
);


ALTER TABLE "public"."lancamentos" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."logs_auditoria" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "usuario_id" "uuid",
    "empresa_id" "uuid" NOT NULL,
    "acao" "text" NOT NULL,
    "severidade" "text" NOT NULL,
    "detalhes" "jsonb",
    "ip_origem" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "logs_auditoria_severidade_check" CHECK (("severidade" = ANY (ARRAY['low'::"text", 'medium'::"text", 'high'::"text", 'critical'::"text"])))
);


ALTER TABLE "public"."logs_auditoria" OWNER TO "postgres";


COMMENT ON TABLE "public"."logs_auditoria" IS 'Logs de auditoria para ações críticas e conformidade LGPD.';



COMMENT ON COLUMN "public"."logs_auditoria"."acao" IS 'Descrição da ação realizada (ex: anonimizar_titular, login_sucesso).';



COMMENT ON COLUMN "public"."logs_auditoria"."severidade" IS 'Nível de criticidade da ação para monitoramento.';



CREATE TABLE IF NOT EXISTS "public"."nfe_entrada" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "empresa_id" "uuid" NOT NULL,
    "fornecedor_id" "uuid",
    "fornecedor_nome" "text" NOT NULL,
    "numero" "text" NOT NULL,
    "serie" "text" NOT NULL,
    "chave_acesso" "text" NOT NULL,
    "data_emissao" "date" NOT NULL,
    "valor_total" numeric(12,2) NOT NULL,
    "pedido_compra_id" "uuid",
    "status_sped" "text" DEFAULT 'pendente'::"text" NOT NULL,
    "xml_url" "text",
    "dados_xml" "jsonb",
    "criado_em" timestamp with time zone DEFAULT "now"() NOT NULL,
    "atualizado_em" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "nfe_entrada_status_sped_check" CHECK (("status_sped" = ANY (ARRAY['pendente'::"text", 'lancada'::"text"])))
);


ALTER TABLE "public"."nfe_entrada" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."nfe_saida" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "empresa_id" "uuid" NOT NULL,
    "os_id" "uuid" NOT NULL,
    "numero" "text" NOT NULL,
    "serie" "text" DEFAULT '1'::"text" NOT NULL,
    "chave_acesso" "text",
    "valor_total" numeric(12,2) NOT NULL,
    "status" "text" DEFAULT 'EMITIDA'::"text" NOT NULL,
    "xml_path" "text",
    "criado_em" timestamp with time zone DEFAULT "now"() NOT NULL,
    "atualizado_em" timestamp with time zone DEFAULT "now"() NOT NULL,
    "email_enviado" boolean DEFAULT false,
    "email_enviado_em" timestamp with time zone,
    "cliente_nome" "text",
    "cliente_documento" "text",
    "valor_impostos" numeric(12,2) DEFAULT 0,
    "itens" "jsonb" DEFAULT '[]'::"jsonb",
    "cliente_email" "text",
    "protocolo_autorizacao" "text",
    "xml_autorizado" "text",
    "xml_cancelamento" "text",
    "focus_nfe_ref" "text",
    "danfe_url" "text",
    "data_autorizacao" timestamp with time zone,
    "motivo_rejeicao" "text",
    "forma_pagamento" "text" DEFAULT 'dinheiro'::"text",
    "descricao_itens" "text",
    "modalidade_frete" "text" DEFAULT '9'::"text",
    CONSTRAINT "nfe_saida_modalidade_frete_check" CHECK (("modalidade_frete" = ANY (ARRAY['0'::"text", '1'::"text", '2'::"text", '3'::"text", '4'::"text", '9'::"text"]))),
    CONSTRAINT "nfe_saida_status_check" CHECK (("status" = ANY (ARRAY['EMITIDA'::"text", 'CANCELADA'::"text", 'EM_PROCESSAMENTO'::"text", 'DENEGADA'::"text"])))
);


ALTER TABLE "public"."nfe_saida" OWNER TO "postgres";


COMMENT ON COLUMN "public"."nfe_saida"."email_enviado" IS 'Indica se a NF-e foi enviada por e-mail ao cliente';



COMMENT ON COLUMN "public"."nfe_saida"."email_enviado_em" IS 'Data/hora do envio do e-mail';



COMMENT ON COLUMN "public"."nfe_saida"."cliente_email" IS 'E-mail do cliente para envio da NF-e';



COMMENT ON COLUMN "public"."nfe_saida"."modalidade_frete" IS 'Modalidade de frete: 0=Emitente, 1=Destinatário, 2=Terceiros, 3=Próprio Remetente, 4=Próprio Destinatário, 9=Sem Frete';



CREATE TABLE IF NOT EXISTS "public"."obrigacoes_fiscais" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "empresa_id" "uuid" NOT NULL,
    "tipo" "text" NOT NULL,
    "competencia" "text" NOT NULL,
    "data_vencimento" "date" NOT NULL,
    "valor" numeric(12,2) NOT NULL,
    "status" "text" DEFAULT 'PENDENTE'::"text" NOT NULL,
    "data_pagamento" "date",
    "criado_em" timestamp with time zone DEFAULT "now"() NOT NULL,
    "atualizado_em" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "obrigacoes_fiscais_status_check" CHECK (("status" = ANY (ARRAY['PENDENTE'::"text", 'PAGO'::"text", 'ATRASADO'::"text"])))
);


ALTER TABLE "public"."obrigacoes_fiscais" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."orcamentos" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "empresa_id" "uuid" NOT NULL,
    "cliente_id" "uuid",
    "numero" "text" NOT NULL,
    "descricao" "text" NOT NULL,
    "itens" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "area_total" numeric(10,2) DEFAULT 0 NOT NULL,
    "valor_total" numeric(12,2) DEFAULT 0 NOT NULL,
    "status" "text" NOT NULL,
    "data_validade" "date" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted_at" timestamp with time zone,
    CONSTRAINT "orcamentos_status_check" CHECK (("status" = ANY (ARRAY['Aberto'::"text", 'Aprovado'::"text", 'Expirado'::"text", 'Rejeitado'::"text"])))
);


ALTER TABLE "public"."orcamentos" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ordens_servico" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "empresa_id" "uuid" NOT NULL,
    "orcamento_id" "uuid" NOT NULL,
    "cliente_id" "uuid",
    "tecnico_id" "uuid",
    "numero" "text" NOT NULL,
    "status" "text" NOT NULL,
    "data_previsao" "date",
    "itens" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted_at" timestamp with time zone,
    "is_atrasada" boolean DEFAULT false NOT NULL,
    "hora_previsao" time without time zone,
    "status_instalacao" "text" DEFAULT 'Agendado'::"text",
    "endereco_instalacao" "text",
    CONSTRAINT "ordens_servico_status_check" CHECK (("status" = ANY (ARRAY['Na Fila'::"text", 'Em Producao'::"text", 'Instalacao'::"text", 'Concluido'::"text"]))),
    CONSTRAINT "ordens_servico_status_instalacao_check" CHECK (("status_instalacao" = ANY (ARRAY['Agendado'::"text", 'Em Rota'::"text", 'Concluido'::"text"])))
);


ALTER TABLE "public"."ordens_servico" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."os_atrasadas" WITH ("security_invoker"='on') AS
 SELECT "id",
    "empresa_id",
    "numero",
    "status",
    "data_previsao",
    "tecnico_id",
    "is_atrasada",
    (EXTRACT(day FROM ("now"() - ("data_previsao")::timestamp with time zone)))::integer AS "dias_atraso"
   FROM "public"."ordens_servico" "os"
  WHERE (("deleted_at" IS NULL) AND ("is_atrasada" = true));


ALTER VIEW "public"."os_atrasadas" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."pedido_compra_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."pedido_compra_seq" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."pedidos_compra" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "empresa_id" "uuid" NOT NULL,
    "numero" "text" NOT NULL,
    "fornecedor_id" "uuid" NOT NULL,
    "condicao_pagamento_id" "uuid",
    "forma_pagamento_id" "uuid",
    "previsao_entrega" "date" NOT NULL,
    "observacoes" "text",
    "status" "text" DEFAULT 'rascunho'::"text" NOT NULL,
    "status_liberacao" "text" DEFAULT 'pendente'::"text" NOT NULL,
    "justificativa_reprovacao" "text",
    "limite_liberacao" numeric(12,2) DEFAULT 5000 NOT NULL,
    "valor_total" numeric(12,2) DEFAULT 0 NOT NULL,
    "area_total_m2" numeric(10,4) DEFAULT 0 NOT NULL,
    "qtd_total_pecas" integer DEFAULT 0 NOT NULL,
    "data_conclusao" timestamp with time zone,
    "criado_por" "uuid",
    "criado_em" timestamp with time zone DEFAULT "now"() NOT NULL,
    "atualizado_em" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "pedidos_compra_status_check" CHECK (("status" = ANY (ARRAY['rascunho'::"text", 'aguardando_aprovacao'::"text", 'aprovado'::"text", 'enviado'::"text", 'recebido_parcial'::"text", 'recebido_total'::"text", 'cancelado'::"text"])))
);


ALTER TABLE "public"."pedidos_compra" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."pedidos_compra_etapas" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "pedido_id" "uuid" NOT NULL,
    "etapa" "text" NOT NULL,
    "data_hora" timestamp with time zone DEFAULT "now"() NOT NULL,
    "usuario_id" "uuid",
    "usuario_nome" "text",
    "observacao" "text"
);


ALTER TABLE "public"."pedidos_compra_etapas" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."pedidos_compra_itens" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "pedido_id" "uuid" NOT NULL,
    "produto" "text" NOT NULL,
    "projeto_vinculado" "text",
    "os_vinculada" "uuid",
    "largura_mm" numeric(8,2) DEFAULT 0,
    "altura_mm" numeric(8,2) DEFAULT 0,
    "quantidade" integer NOT NULL,
    "m2_calculado" numeric(10,4) DEFAULT 0,
    "preco_m2" numeric(10,2) DEFAULT 0,
    "total" numeric(12,2) NOT NULL,
    "produto_id" "uuid",
    "quantidade_recebida" integer DEFAULT 0 NOT NULL,
    "preco_unitario" numeric(10,2) DEFAULT 0 NOT NULL,
    CONSTRAINT "pedidos_compra_itens_quantidade_check" CHECK (("quantidade" > 0))
);


ALTER TABLE "public"."pedidos_compra_itens" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."perfis_usuario" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "empresa_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "nome" "text" NOT NULL,
    "email" "text" NOT NULL,
    "role" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "perfis_usuario_role_check" CHECK (("role" = ANY (ARRAY['superadmin'::"text", 'admin'::"text", 'gestor'::"text", 'vendedor'::"text", 'tecnico'::"text", 'financeiro'::"text"])))
);


ALTER TABLE "public"."perfis_usuario" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."produtos" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "empresa_id" "uuid" NOT NULL,
    "codigo" "text" NOT NULL,
    "descricao" "text" NOT NULL,
    "unidade" "text" DEFAULT 'm²'::"text" NOT NULL,
    "valor_compra" numeric(10,2) DEFAULT 0 NOT NULL,
    "margem_lucro" numeric(5,4) DEFAULT 0.46 NOT NULL,
    "valor_venda" numeric(10,2) GENERATED ALWAYS AS (("valor_compra" * ((1)::numeric + "margem_lucro"))) STORED,
    "categoria" "text" DEFAULT 'vidro'::"text" NOT NULL,
    "ativo" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "fornecedor_id" "uuid",
    "ncm" "text",
    "cest" "text",
    "cfop" "text" DEFAULT '5102'::"text",
    "unidade_fiscal" "text" DEFAULT 'UN'::"text",
    "origem" integer DEFAULT 0
);


ALTER TABLE "public"."produtos" OWNER TO "postgres";


COMMENT ON TABLE "public"."produtos" IS 'Catálogo de produtos base (vidros, kits, ferragens) — valores base históricos';



COMMENT ON COLUMN "public"."produtos"."codigo" IS 'Código do produto: VI8, KA, PX40, etc.';



COMMENT ON COLUMN "public"."produtos"."valor_venda" IS 'Valor gerado por fórmula: valor_compra × (1 + margem_lucro) — coluna STORED';



COMMENT ON COLUMN "public"."produtos"."categoria" IS 'vidro | kit | ferragem | servico';



CREATE TABLE IF NOT EXISTS "public"."representantes_comerciais" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "empresa_id" "uuid" NOT NULL,
    "fornecedor_id" "uuid" NOT NULL,
    "nome" "text" NOT NULL,
    "telefone" "text" NOT NULL,
    "email" "text" NOT NULL,
    "regiao" "text",
    "observacoes" "text",
    "ativo" boolean DEFAULT true NOT NULL,
    "criado_em" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."representantes_comerciais" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."romaneio_itens" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "romaneio_id" "uuid" NOT NULL,
    "produto" "text" NOT NULL,
    "espessura_mm" numeric(6,2),
    "largura_mm" numeric(8,2) NOT NULL,
    "altura_mm" numeric(8,2) NOT NULL,
    "qtd_encomendada" integer NOT NULL,
    "qtd_recebida" integer DEFAULT 0 NOT NULL,
    "m2" numeric(10,4),
    "peso_kg" numeric(10,2),
    "situacao" "text" DEFAULT 'ok'::"text" NOT NULL,
    CONSTRAINT "romaneio_itens_situacao_check" CHECK (("situacao" = ANY (ARRAY['ok'::"text", 'faltante'::"text", 'quebrado'::"text", 'fora_especificacao'::"text"])))
);


ALTER TABLE "public"."romaneio_itens" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."romaneios" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "empresa_id" "uuid" NOT NULL,
    "pedido_compra_id" "uuid" NOT NULL,
    "numero_nfe" "text",
    "numero_oe" "text",
    "data_emissao" "date" NOT NULL,
    "data_recebimento" "date",
    "status" "text" DEFAULT 'pendente'::"text" NOT NULL,
    "criado_em" timestamp with time zone DEFAULT "now"() NOT NULL,
    "atualizado_em" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "romaneios_status_check" CHECK (("status" = ANY (ARRAY['pendente'::"text", 'em_conferencia'::"text", 'concluido'::"text", 'divergencia'::"text"])))
);


ALTER TABLE "public"."romaneios" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."servico_componentes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "servico_id" "uuid" NOT NULL,
    "produto_id" "uuid" NOT NULL,
    "quantidade" numeric(6,2) DEFAULT 1 NOT NULL,
    "tipo_preco" "text" DEFAULT 'M2'::"text" NOT NULL,
    "ordem" integer DEFAULT 0 NOT NULL
);


ALTER TABLE "public"."servico_componentes" OWNER TO "postgres";


COMMENT ON TABLE "public"."servico_componentes" IS 'Itens que compõem um serviço composto (vidro + kits + ferragens)';



COMMENT ON COLUMN "public"."servico_componentes"."tipo_preco" IS 'M2 (metro quadrado) | PC_FX (preço fixo) | PC_ML (metro linear)';



CREATE TABLE IF NOT EXISTS "public"."servicos_compostos" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "empresa_id" "uuid" NOT NULL,
    "codigo" "text" NOT NULL,
    "nome" "text" NOT NULL,
    "categoria" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."servicos_compostos" OWNER TO "postgres";


COMMENT ON TABLE "public"."servicos_compostos" IS 'Serviços formados por combinação de produtos (≈ aba CALCULO da planilha)';



COMMENT ON COLUMN "public"."servicos_compostos"."categoria" IS 'porta_pivotante | porta_correr | janela | box | especial';



CREATE TABLE IF NOT EXISTS "public"."tabela_precos_fornecedor" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "empresa_id" "uuid" NOT NULL,
    "fornecedor_id" "uuid" NOT NULL,
    "produto" "text" NOT NULL,
    "unidade" "text" DEFAULT 'm2'::"text" NOT NULL,
    "preco" numeric(12,2) NOT NULL,
    "vigencia_inicio" "date" DEFAULT CURRENT_DATE NOT NULL,
    "vigencia_fim" "date" NOT NULL,
    "criado_por" "uuid",
    "criado_em" timestamp with time zone DEFAULT "now"() NOT NULL,
    "atualizado_em" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "tabela_precos_fornecedor_preco_check" CHECK (("preco" > (0)::numeric))
);


ALTER TABLE "public"."tabela_precos_fornecedor" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_compras_por_fornecedor" WITH ("security_invoker"='on') AS
 SELECT "f"."id" AS "fornecedor_id",
    "f"."nome" AS "fornecedor_nome",
    "f"."empresa_id",
    "count"("pc"."id") AS "total_pedidos",
    "sum"("pc"."valor_total") AS "valor_total_compras",
    "sum"("pc"."area_total_m2") AS "volume_total_m2",
    "count"("pc"."id") FILTER (WHERE (("pc"."status" = 'concluido'::"text") AND ("pc"."data_conclusao" <= "pc"."previsao_entrega"))) AS "entregues_no_prazo",
        CASE
            WHEN ("count"("pc"."id") FILTER (WHERE ("pc"."status" = 'concluido'::"text")) > 0) THEN ((("count"("pc"."id") FILTER (WHERE (("pc"."status" = 'concluido'::"text") AND ("pc"."data_conclusao" <= "pc"."previsao_entrega"))))::numeric * 100.0) / ("count"("pc"."id") FILTER (WHERE ("pc"."status" = 'concluido'::"text")))::numeric)
            ELSE (0)::numeric
        END AS "perc_no_prazo"
   FROM ("public"."fornecedores" "f"
     LEFT JOIN "public"."pedidos_compra" "pc" ON (("f"."id" = "pc"."fornecedor_id")))
  GROUP BY "f"."id", "f"."nome", "f"."empresa_id";


ALTER VIEW "public"."v_compras_por_fornecedor" OWNER TO "postgres";


ALTER TABLE ONLY "public"."_keepalive_log"
    ADD CONSTRAINT "_keepalive_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."categorias_financeiras"
    ADD CONSTRAINT "categorias_financeiras_empresa_id_codigo_key" UNIQUE ("empresa_id", "codigo");



ALTER TABLE ONLY "public"."categorias_financeiras"
    ADD CONSTRAINT "categorias_financeiras_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."clientes"
    ADD CONSTRAINT "clientes_empresa_id_documento_key" UNIQUE ("empresa_id", "documento");



ALTER TABLE ONLY "public"."clientes"
    ADD CONSTRAINT "clientes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."colaboradores"
    ADD CONSTRAINT "colaboradores_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."condicoes_pagamento"
    ADD CONSTRAINT "condicoes_pagamento_empresa_id_codigo_key" UNIQUE ("empresa_id", "codigo");



ALTER TABLE ONLY "public"."condicoes_pagamento"
    ADD CONSTRAINT "condicoes_pagamento_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."config_precos"
    ADD CONSTRAINT "config_precos_empresa_id_categoria_descricao_key" UNIQUE ("empresa_id", "categoria", "descricao");



ALTER TABLE ONLY "public"."config_precos"
    ADD CONSTRAINT "config_precos_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."contas_bancarias"
    ADD CONSTRAINT "contas_bancarias_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."contas_pagar_receber"
    ADD CONSTRAINT "contas_pagar_receber_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."convites"
    ADD CONSTRAINT "convites_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."convites"
    ADD CONSTRAINT "convites_token_key" UNIQUE ("token");



ALTER TABLE ONLY "public"."creditos_fornecedor"
    ADD CONSTRAINT "creditos_fornecedor_empresa_id_fornecedor_id_numero_key" UNIQUE ("empresa_id", "fornecedor_id", "numero");



ALTER TABLE ONLY "public"."creditos_fornecedor"
    ADD CONSTRAINT "creditos_fornecedor_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."creditos_uso"
    ADD CONSTRAINT "creditos_uso_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."empresa_secrets"
    ADD CONSTRAINT "empresa_secrets_empresa_id_chave_key" UNIQUE ("empresa_id", "chave");



ALTER TABLE ONLY "public"."empresa_secrets"
    ADD CONSTRAINT "empresa_secrets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."empresas"
    ADD CONSTRAINT "empresas_cnpj_key" UNIQUE ("cnpj");



ALTER TABLE ONLY "public"."empresas"
    ADD CONSTRAINT "empresas_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."estoque_itens"
    ADD CONSTRAINT "estoque_itens_empresa_id_codigo_key" UNIQUE ("empresa_id", "codigo");



ALTER TABLE ONLY "public"."estoque_itens"
    ADD CONSTRAINT "estoque_itens_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."estoque_movimentacoes"
    ADD CONSTRAINT "estoque_movimentacoes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."formas_pagamento"
    ADD CONSTRAINT "formas_pagamento_empresa_id_codigo_key" UNIQUE ("empresa_id", "codigo");



ALTER TABLE ONLY "public"."formas_pagamento"
    ADD CONSTRAINT "formas_pagamento_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."fornecedores"
    ADD CONSTRAINT "fornecedores_empresa_id_cnpj_key" UNIQUE ("empresa_id", "cnpj");



ALTER TABLE ONLY "public"."fornecedores"
    ADD CONSTRAINT "fornecedores_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."lancamentos"
    ADD CONSTRAINT "lancamentos_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."logs_auditoria"
    ADD CONSTRAINT "logs_auditoria_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."nfe_entrada"
    ADD CONSTRAINT "nfe_entrada_chave_acesso_key" UNIQUE ("chave_acesso");



ALTER TABLE ONLY "public"."nfe_entrada"
    ADD CONSTRAINT "nfe_entrada_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."nfe_saida"
    ADD CONSTRAINT "nfe_saida_chave_acesso_key" UNIQUE ("chave_acesso");



ALTER TABLE ONLY "public"."nfe_saida"
    ADD CONSTRAINT "nfe_saida_focus_nfe_ref_key" UNIQUE ("focus_nfe_ref");



ALTER TABLE ONLY "public"."nfe_saida"
    ADD CONSTRAINT "nfe_saida_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."obrigacoes_fiscais"
    ADD CONSTRAINT "obrigacoes_fiscais_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."orcamentos"
    ADD CONSTRAINT "orcamentos_empresa_id_numero_key" UNIQUE ("empresa_id", "numero");



ALTER TABLE ONLY "public"."orcamentos"
    ADD CONSTRAINT "orcamentos_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ordens_servico"
    ADD CONSTRAINT "ordens_servico_empresa_id_numero_key" UNIQUE ("empresa_id", "numero");



ALTER TABLE ONLY "public"."ordens_servico"
    ADD CONSTRAINT "ordens_servico_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pedidos_compra"
    ADD CONSTRAINT "pedidos_compra_empresa_id_numero_key" UNIQUE ("empresa_id", "numero");



ALTER TABLE ONLY "public"."pedidos_compra_etapas"
    ADD CONSTRAINT "pedidos_compra_etapas_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pedidos_compra_itens"
    ADD CONSTRAINT "pedidos_compra_itens_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pedidos_compra"
    ADD CONSTRAINT "pedidos_compra_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."perfis_usuario"
    ADD CONSTRAINT "perfis_usuario_empresa_id_user_id_key" UNIQUE ("empresa_id", "user_id");



ALTER TABLE ONLY "public"."perfis_usuario"
    ADD CONSTRAINT "perfis_usuario_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."produtos"
    ADD CONSTRAINT "produtos_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."representantes_comerciais"
    ADD CONSTRAINT "representantes_comerciais_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."romaneio_itens"
    ADD CONSTRAINT "romaneio_itens_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."romaneios"
    ADD CONSTRAINT "romaneios_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."servico_componentes"
    ADD CONSTRAINT "servico_componentes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."servicos_compostos"
    ADD CONSTRAINT "servicos_compostos_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tabela_precos_fornecedor"
    ADD CONSTRAINT "tabela_precos_fornecedor_empresa_id_fornecedor_id_produto_v_key" UNIQUE ("empresa_id", "fornecedor_id", "produto", "vigencia_inicio", "vigencia_fim");



ALTER TABLE ONLY "public"."tabela_precos_fornecedor"
    ADD CONSTRAINT "tabela_precos_fornecedor_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."produtos"
    ADD CONSTRAINT "uq_produto_codigo_empresa" UNIQUE ("empresa_id", "codigo");



ALTER TABLE ONLY "public"."servicos_compostos"
    ADD CONSTRAINT "uq_servico_codigo_empresa" UNIQUE ("empresa_id", "codigo");



CREATE INDEX "idx_categorias_empresa" ON "public"."categorias_financeiras" USING "btree" ("empresa_id");



CREATE INDEX "idx_colaboradores_cargo" ON "public"."colaboradores" USING "btree" ("cargo");



CREATE INDEX "idx_colaboradores_empresa" ON "public"."colaboradores" USING "btree" ("empresa_id");



CREATE INDEX "idx_colaboradores_status" ON "public"."colaboradores" USING "btree" ("status");



CREATE INDEX "idx_condicoes_pagamento_empresa" ON "public"."condicoes_pagamento" USING "btree" ("empresa_id");



CREATE INDEX "idx_contas_bancarias_empresa" ON "public"."contas_bancarias" USING "btree" ("empresa_id");



CREATE INDEX "idx_convites_email" ON "public"."convites" USING "btree" ("email");



CREATE INDEX "idx_convites_token" ON "public"."convites" USING "btree" ("token");



CREATE INDEX "idx_cp_receber_empresa" ON "public"."contas_pagar_receber" USING "btree" ("empresa_id");



CREATE INDEX "idx_cp_receber_os" ON "public"."contas_pagar_receber" USING "btree" ("ordem_servico_id");



CREATE INDEX "idx_cp_receber_vencimento" ON "public"."contas_pagar_receber" USING "btree" ("data_vencimento");



CREATE INDEX "idx_creditos_fornec_empresa" ON "public"."creditos_fornecedor" USING "btree" ("empresa_id");



CREATE INDEX "idx_creditos_fornec_fornecedor" ON "public"."creditos_fornecedor" USING "btree" ("fornecedor_id");



CREATE INDEX "idx_creditos_uso_credito" ON "public"."creditos_uso" USING "btree" ("credito_id");



CREATE INDEX "idx_empresa_secrets_empresa" ON "public"."empresa_secrets" USING "btree" ("empresa_id");



CREATE INDEX "idx_estoque_itens_produto_id" ON "public"."estoque_itens" USING "btree" ("produto_id") WHERE ("produto_id" IS NOT NULL);



CREATE INDEX "idx_estoque_mov_orcamento" ON "public"."estoque_movimentacoes" USING "btree" ("orcamento_id") WHERE ("orcamento_id" IS NOT NULL);



CREATE INDEX "idx_formas_pagamento_empresa" ON "public"."formas_pagamento" USING "btree" ("empresa_id");



CREATE INDEX "idx_lancamentos_conta" ON "public"."lancamentos" USING "btree" ("conta_id");



CREATE INDEX "idx_lancamentos_data" ON "public"."lancamentos" USING "btree" ("data_pagamento");



CREATE INDEX "idx_lancamentos_empresa" ON "public"."lancamentos" USING "btree" ("empresa_id");



CREATE INDEX "idx_nfe_entrada_chave" ON "public"."nfe_entrada" USING "btree" ("chave_acesso");



CREATE INDEX "idx_nfe_entrada_empresa" ON "public"."nfe_entrada" USING "btree" ("empresa_id");



CREATE INDEX "idx_nfe_entrada_pedido" ON "public"."nfe_entrada" USING "btree" ("pedido_compra_id");



CREATE INDEX "idx_nfe_saida_empresa" ON "public"."nfe_saida" USING "btree" ("empresa_id");



CREATE INDEX "idx_nfe_saida_focus_ref" ON "public"."nfe_saida" USING "btree" ("focus_nfe_ref");



CREATE INDEX "idx_nfe_saida_numero" ON "public"."nfe_saida" USING "btree" ("numero");



CREATE UNIQUE INDEX "idx_nfe_saida_numero_unico" ON "public"."nfe_saida" USING "btree" ("empresa_id", "numero", "serie") WHERE ("status" <> 'EM_PROCESSAMENTO'::"text");



CREATE INDEX "idx_nfe_saida_os" ON "public"."nfe_saida" USING "btree" ("os_id");



CREATE INDEX "idx_obrigacoes_fiscais_empresa" ON "public"."obrigacoes_fiscais" USING "btree" ("empresa_id");



CREATE INDEX "idx_obrigacoes_fiscais_vencimento" ON "public"."obrigacoes_fiscais" USING "btree" ("data_vencimento");



CREATE INDEX "idx_pedidos_compra_empresa" ON "public"."pedidos_compra" USING "btree" ("empresa_id");



CREATE INDEX "idx_pedidos_compra_etapas_pedido" ON "public"."pedidos_compra_etapas" USING "btree" ("pedido_id");



CREATE INDEX "idx_pedidos_compra_fornecedor" ON "public"."pedidos_compra" USING "btree" ("fornecedor_id");



CREATE INDEX "idx_pedidos_compra_itens_pedido" ON "public"."pedidos_compra_itens" USING "btree" ("pedido_id");



CREATE INDEX "idx_pedidos_compra_status" ON "public"."pedidos_compra" USING "btree" ("status");



CREATE INDEX "idx_produtos_codigo" ON "public"."produtos" USING "btree" ("codigo");



CREATE INDEX "idx_produtos_empresa_ativo" ON "public"."produtos" USING "btree" ("empresa_id", "ativo");



CREATE INDEX "idx_representantes_empresa" ON "public"."representantes_comerciais" USING "btree" ("empresa_id");



CREATE INDEX "idx_representantes_fornecedor" ON "public"."representantes_comerciais" USING "btree" ("fornecedor_id");



CREATE INDEX "idx_romaneio_itens_romaneio" ON "public"."romaneio_itens" USING "btree" ("romaneio_id");



CREATE INDEX "idx_romaneios_empresa" ON "public"."romaneios" USING "btree" ("empresa_id");



CREATE INDEX "idx_romaneios_pedido" ON "public"."romaneios" USING "btree" ("pedido_compra_id");



CREATE INDEX "idx_servico_componentes_servico" ON "public"."servico_componentes" USING "btree" ("servico_id");



CREATE INDEX "idx_servicos_compostos_empresa" ON "public"."servicos_compostos" USING "btree" ("empresa_id");



CREATE INDEX "idx_tabela_precos_empresa" ON "public"."tabela_precos_fornecedor" USING "btree" ("empresa_id");



CREATE INDEX "idx_tabela_precos_fornecedor" ON "public"."tabela_precos_fornecedor" USING "btree" ("fornecedor_id");



CREATE OR REPLACE TRIGGER "before_update_orcamento_expirado" BEFORE INSERT OR UPDATE ON "public"."orcamentos" FOR EACH ROW EXECUTE FUNCTION "public"."check_orcamento_expirado"();



CREATE OR REPLACE TRIGGER "clientes_set_updated_at" BEFORE UPDATE ON "public"."clientes" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "config_precos_set_updated_at" BEFORE UPDATE ON "public"."config_precos" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "empresas_set_updated_at" BEFORE UPDATE ON "public"."empresas" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "estoque_itens_set_updated_at" BEFORE UPDATE ON "public"."estoque_itens" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "fornecedores_set_updated_at" BEFORE UPDATE ON "public"."fornecedores" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "obrigacoes_fiscais_set_atualizado_em" BEFORE UPDATE ON "public"."obrigacoes_fiscais" FOR EACH ROW EXECUTE FUNCTION "public"."set_atualizado_em"();



CREATE OR REPLACE TRIGGER "orcamentos_set_updated_at" BEFORE UPDATE ON "public"."orcamentos" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "ordens_servico_set_updated_at" BEFORE UPDATE ON "public"."ordens_servico" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "perfis_usuario_set_updated_at" BEFORE UPDATE ON "public"."perfis_usuario" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at_colaboradores" BEFORE UPDATE ON "public"."colaboradores" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "tr_lancamento_atualiza_saldo" AFTER INSERT OR DELETE OR UPDATE ON "public"."lancamentos" FOR EACH ROW EXECUTE FUNCTION "public"."fn_atualizar_saldo_conta"();



CREATE OR REPLACE TRIGGER "trg_aplicar_movimentacao" AFTER INSERT ON "public"."estoque_movimentacoes" FOR EACH ROW EXECUTE FUNCTION "public"."aplicar_movimentacao_estoque"();



CREATE OR REPLACE TRIGGER "trg_credito_uso_saldo" AFTER INSERT OR DELETE OR UPDATE ON "public"."creditos_uso" FOR EACH ROW EXECUTE FUNCTION "public"."trg_atualizar_saldo_credito"();



CREATE OR REPLACE TRIGGER "trg_item_pedido_totais" AFTER INSERT OR DELETE OR UPDATE ON "public"."pedidos_compra_itens" FOR EACH ROW EXECUTE FUNCTION "public"."trg_atualizar_totais_pedido"();



CREATE OR REPLACE TRIGGER "trg_os_check_atrasada" BEFORE INSERT OR UPDATE ON "public"."ordens_servico" FOR EACH ROW EXECUTE FUNCTION "public"."trg_avaliar_atraso_os"();



CREATE OR REPLACE TRIGGER "trg_pedido_compra_etapa" BEFORE UPDATE ON "public"."pedidos_compra" FOR EACH ROW EXECUTE FUNCTION "public"."trg_registrar_etapa_pedido"();



CREATE OR REPLACE TRIGGER "trg_pedido_compra_status_inicial" BEFORE INSERT ON "public"."pedidos_compra" FOR EACH ROW EXECUTE FUNCTION "public"."trg_status_inicial_pedido"();



CREATE OR REPLACE TRIGGER "trg_pedido_em_transporte_romaneio" AFTER UPDATE ON "public"."pedidos_compra" FOR EACH ROW EXECUTE FUNCTION "public"."trg_criar_romaneio_em_transporte"();



CREATE OR REPLACE TRIGGER "trg_romaneio_concluido_estoque" AFTER UPDATE ON "public"."romaneios" FOR EACH ROW EXECUTE FUNCTION "public"."trg_entrada_estoque_romaneio"();



ALTER TABLE ONLY "public"."categorias_financeiras"
    ADD CONSTRAINT "categorias_financeiras_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."categorias_financeiras"
    ADD CONSTRAINT "categorias_financeiras_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."categorias_financeiras"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."clientes"
    ADD CONSTRAINT "clientes_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."colaboradores"
    ADD CONSTRAINT "colaboradores_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."condicoes_pagamento"
    ADD CONSTRAINT "condicoes_pagamento_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."config_precos"
    ADD CONSTRAINT "config_precos_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."contas_bancarias"
    ADD CONSTRAINT "contas_bancarias_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."contas_pagar_receber"
    ADD CONSTRAINT "contas_pagar_receber_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "public"."categorias_financeiras"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."contas_pagar_receber"
    ADD CONSTRAINT "contas_pagar_receber_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "public"."clientes"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."contas_pagar_receber"
    ADD CONSTRAINT "contas_pagar_receber_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."contas_pagar_receber"
    ADD CONSTRAINT "contas_pagar_receber_fornecedor_id_fkey" FOREIGN KEY ("fornecedor_id") REFERENCES "public"."fornecedores"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."contas_pagar_receber"
    ADD CONSTRAINT "contas_pagar_receber_lancamento_id_fkey" FOREIGN KEY ("lancamento_id") REFERENCES "public"."lancamentos"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."contas_pagar_receber"
    ADD CONSTRAINT "contas_pagar_receber_ordem_servico_id_fkey" FOREIGN KEY ("ordem_servico_id") REFERENCES "public"."ordens_servico"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."convites"
    ADD CONSTRAINT "convites_convidado_por_fkey" FOREIGN KEY ("convidado_por") REFERENCES "public"."perfis_usuario"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."convites"
    ADD CONSTRAINT "convites_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."creditos_fornecedor"
    ADD CONSTRAINT "creditos_fornecedor_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."creditos_fornecedor"
    ADD CONSTRAINT "creditos_fornecedor_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."creditos_fornecedor"
    ADD CONSTRAINT "creditos_fornecedor_fornecedor_id_fkey" FOREIGN KEY ("fornecedor_id") REFERENCES "public"."fornecedores"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."creditos_uso"
    ADD CONSTRAINT "creditos_uso_credito_id_fkey" FOREIGN KEY ("credito_id") REFERENCES "public"."creditos_fornecedor"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."creditos_uso"
    ADD CONSTRAINT "creditos_uso_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."creditos_uso"
    ADD CONSTRAINT "creditos_uso_pedido_compra_id_fkey" FOREIGN KEY ("pedido_compra_id") REFERENCES "public"."pedidos_compra"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."empresa_secrets"
    ADD CONSTRAINT "empresa_secrets_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."estoque_itens"
    ADD CONSTRAINT "estoque_itens_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."estoque_itens"
    ADD CONSTRAINT "estoque_itens_produto_id_fkey" FOREIGN KEY ("produto_id") REFERENCES "public"."produtos"("id");



ALTER TABLE ONLY "public"."estoque_movimentacoes"
    ADD CONSTRAINT "estoque_movimentacoes_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."estoque_movimentacoes"
    ADD CONSTRAINT "estoque_movimentacoes_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "public"."estoque_itens"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."estoque_movimentacoes"
    ADD CONSTRAINT "estoque_movimentacoes_orcamento_id_fkey" FOREIGN KEY ("orcamento_id") REFERENCES "public"."orcamentos"("id");



ALTER TABLE ONLY "public"."estoque_movimentacoes"
    ADD CONSTRAINT "estoque_movimentacoes_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "public"."perfis_usuario"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."formas_pagamento"
    ADD CONSTRAINT "formas_pagamento_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."fornecedores"
    ADD CONSTRAINT "fornecedores_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."lancamentos"
    ADD CONSTRAINT "lancamentos_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "public"."categorias_financeiras"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."lancamentos"
    ADD CONSTRAINT "lancamentos_conta_id_fkey" FOREIGN KEY ("conta_id") REFERENCES "public"."contas_bancarias"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."lancamentos"
    ADD CONSTRAINT "lancamentos_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."logs_auditoria"
    ADD CONSTRAINT "logs_auditoria_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id");



ALTER TABLE ONLY "public"."logs_auditoria"
    ADD CONSTRAINT "logs_auditoria_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."nfe_entrada"
    ADD CONSTRAINT "nfe_entrada_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."nfe_entrada"
    ADD CONSTRAINT "nfe_entrada_fornecedor_id_fkey" FOREIGN KEY ("fornecedor_id") REFERENCES "public"."fornecedores"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."nfe_entrada"
    ADD CONSTRAINT "nfe_entrada_pedido_compra_id_fkey" FOREIGN KEY ("pedido_compra_id") REFERENCES "public"."pedidos_compra"("id");



ALTER TABLE ONLY "public"."nfe_saida"
    ADD CONSTRAINT "nfe_saida_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."nfe_saida"
    ADD CONSTRAINT "nfe_saida_os_id_fkey" FOREIGN KEY ("os_id") REFERENCES "public"."ordens_servico"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."obrigacoes_fiscais"
    ADD CONSTRAINT "obrigacoes_fiscais_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."orcamentos"
    ADD CONSTRAINT "orcamentos_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "public"."clientes"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."orcamentos"
    ADD CONSTRAINT "orcamentos_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ordens_servico"
    ADD CONSTRAINT "ordens_servico_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "public"."clientes"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."ordens_servico"
    ADD CONSTRAINT "ordens_servico_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ordens_servico"
    ADD CONSTRAINT "ordens_servico_orcamento_id_fkey" FOREIGN KEY ("orcamento_id") REFERENCES "public"."orcamentos"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."ordens_servico"
    ADD CONSTRAINT "ordens_servico_tecnico_id_fkey" FOREIGN KEY ("tecnico_id") REFERENCES "public"."colaboradores"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."pedidos_compra"
    ADD CONSTRAINT "pedidos_compra_condicao_pagamento_id_fkey" FOREIGN KEY ("condicao_pagamento_id") REFERENCES "public"."condicoes_pagamento"("id");



ALTER TABLE ONLY "public"."pedidos_compra"
    ADD CONSTRAINT "pedidos_compra_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."pedidos_compra"
    ADD CONSTRAINT "pedidos_compra_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."pedidos_compra_etapas"
    ADD CONSTRAINT "pedidos_compra_etapas_pedido_id_fkey" FOREIGN KEY ("pedido_id") REFERENCES "public"."pedidos_compra"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."pedidos_compra_etapas"
    ADD CONSTRAINT "pedidos_compra_etapas_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."pedidos_compra"
    ADD CONSTRAINT "pedidos_compra_forma_pagamento_id_fkey" FOREIGN KEY ("forma_pagamento_id") REFERENCES "public"."formas_pagamento"("id");



ALTER TABLE ONLY "public"."pedidos_compra"
    ADD CONSTRAINT "pedidos_compra_fornecedor_id_fkey" FOREIGN KEY ("fornecedor_id") REFERENCES "public"."fornecedores"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."pedidos_compra_itens"
    ADD CONSTRAINT "pedidos_compra_itens_os_vinculada_fkey" FOREIGN KEY ("os_vinculada") REFERENCES "public"."ordens_servico"("id");



ALTER TABLE ONLY "public"."pedidos_compra_itens"
    ADD CONSTRAINT "pedidos_compra_itens_pedido_id_fkey" FOREIGN KEY ("pedido_id") REFERENCES "public"."pedidos_compra"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."pedidos_compra_itens"
    ADD CONSTRAINT "pedidos_compra_itens_produto_id_fkey" FOREIGN KEY ("produto_id") REFERENCES "public"."produtos"("id");



ALTER TABLE ONLY "public"."perfis_usuario"
    ADD CONSTRAINT "perfis_usuario_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."produtos"
    ADD CONSTRAINT "produtos_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id");



ALTER TABLE ONLY "public"."produtos"
    ADD CONSTRAINT "produtos_fornecedor_id_fkey" FOREIGN KEY ("fornecedor_id") REFERENCES "public"."fornecedores"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."representantes_comerciais"
    ADD CONSTRAINT "representantes_comerciais_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."representantes_comerciais"
    ADD CONSTRAINT "representantes_comerciais_fornecedor_id_fkey" FOREIGN KEY ("fornecedor_id") REFERENCES "public"."fornecedores"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."romaneio_itens"
    ADD CONSTRAINT "romaneio_itens_romaneio_id_fkey" FOREIGN KEY ("romaneio_id") REFERENCES "public"."romaneios"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."romaneios"
    ADD CONSTRAINT "romaneios_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."romaneios"
    ADD CONSTRAINT "romaneios_pedido_compra_id_fkey" FOREIGN KEY ("pedido_compra_id") REFERENCES "public"."pedidos_compra"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."servico_componentes"
    ADD CONSTRAINT "servico_componentes_produto_id_fkey" FOREIGN KEY ("produto_id") REFERENCES "public"."produtos"("id");



ALTER TABLE ONLY "public"."servico_componentes"
    ADD CONSTRAINT "servico_componentes_servico_id_fkey" FOREIGN KEY ("servico_id") REFERENCES "public"."servicos_compostos"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."servicos_compostos"
    ADD CONSTRAINT "servicos_compostos_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id");



ALTER TABLE ONLY "public"."tabela_precos_fornecedor"
    ADD CONSTRAINT "tabela_precos_fornecedor_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."tabela_precos_fornecedor"
    ADD CONSTRAINT "tabela_precos_fornecedor_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."tabela_precos_fornecedor"
    ADD CONSTRAINT "tabela_precos_fornecedor_fornecedor_id_fkey" FOREIGN KEY ("fornecedor_id") REFERENCES "public"."fornecedores"("id") ON DELETE CASCADE;



CREATE POLICY "Colaboradores são isolados por empresa" ON "public"."colaboradores" USING (("empresa_id" IN ( SELECT "perfis_usuario"."empresa_id"
   FROM "public"."perfis_usuario"
  WHERE ("perfis_usuario"."user_id" = "auth"."uid"()))));



CREATE POLICY "Insert colaboradores da própria empresa" ON "public"."colaboradores" FOR INSERT WITH CHECK (("empresa_id" IN ( SELECT "perfis_usuario"."empresa_id"
   FROM "public"."perfis_usuario"
  WHERE ("perfis_usuario"."user_id" = "auth"."uid"()))));



CREATE POLICY "Service role full access on _keepalive_log" ON "public"."_keepalive_log" USING ((( SELECT "auth"."role"() AS "role") = 'service_role'::"text")) WITH CHECK ((( SELECT "auth"."role"() AS "role") = 'service_role'::"text"));



CREATE POLICY "Users can insert audit logs" ON "public"."logs_auditoria" FOR INSERT WITH CHECK ("public"."can_access_empresa"("empresa_id"));



CREATE POLICY "Users can read their company's audit logs" ON "public"."logs_auditoria" FOR SELECT USING ("public"."can_access_empresa"("empresa_id"));



ALTER TABLE "public"."_keepalive_log" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."categorias_financeiras" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "categorias_financeiras_empresa" ON "public"."categorias_financeiras" USING (("empresa_id" IN ( SELECT "perfis_usuario"."empresa_id"
   FROM "public"."perfis_usuario"
  WHERE ("perfis_usuario"."user_id" = "auth"."uid"()))));



ALTER TABLE "public"."clientes" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "clientes_select_by_empresa" ON "public"."clientes" FOR SELECT USING ("public"."can_access_empresa"("empresa_id"));



CREATE POLICY "clientes_write_by_empresa" ON "public"."clientes" USING ("public"."can_access_empresa"("empresa_id")) WITH CHECK ("public"."can_access_empresa"("empresa_id"));



ALTER TABLE "public"."colaboradores" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."condicoes_pagamento" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "condicoes_pagamento_empresa" ON "public"."condicoes_pagamento" USING (("empresa_id" IN ( SELECT "perfis_usuario"."empresa_id"
   FROM "public"."perfis_usuario"
  WHERE ("perfis_usuario"."user_id" = "auth"."uid"()))));



ALTER TABLE "public"."config_precos" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "config_precos_select_by_empresa" ON "public"."config_precos" FOR SELECT USING ("public"."can_access_empresa"("empresa_id"));



CREATE POLICY "config_precos_write_by_empresa" ON "public"."config_precos" USING ("public"."can_access_empresa"("empresa_id")) WITH CHECK ("public"."can_access_empresa"("empresa_id"));



ALTER TABLE "public"."contas_bancarias" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "contas_bancarias_empresa" ON "public"."contas_bancarias" USING (("empresa_id" IN ( SELECT "perfis_usuario"."empresa_id"
   FROM "public"."perfis_usuario"
  WHERE ("perfis_usuario"."user_id" = "auth"."uid"()))));



ALTER TABLE "public"."contas_pagar_receber" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "contas_pagar_receber_empresa" ON "public"."contas_pagar_receber" USING (("empresa_id" IN ( SELECT "perfis_usuario"."empresa_id"
   FROM "public"."perfis_usuario"
  WHERE ("perfis_usuario"."user_id" = "auth"."uid"()))));



ALTER TABLE "public"."convites" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "convites_insert_by_admin" ON "public"."convites" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."perfis_usuario" "p"
  WHERE (("p"."user_id" = "auth"."uid"()) AND ("p"."role" = ANY (ARRAY['superadmin'::"text", 'admin'::"text"])) AND ("p"."empresa_id" = "convites"."empresa_id")))));



CREATE POLICY "convites_select_by_token" ON "public"."convites" FOR SELECT USING ((("auth"."uid"() IS NOT NULL) AND (("auth"."uid"() = "convidado_por") OR (EXISTS ( SELECT 1
   FROM "public"."perfis_usuario" "p"
  WHERE (("p"."user_id" = "auth"."uid"()) AND ("p"."role" = ANY (ARRAY['superadmin'::"text", 'admin'::"text"])) AND ("p"."empresa_id" = "convites"."empresa_id")))))));



CREATE POLICY "convites_update_by_token" ON "public"."convites" FOR UPDATE USING ((("auth"."uid"() IS NOT NULL) AND (("auth"."uid"() = "convidado_por") OR (EXISTS ( SELECT 1
   FROM "public"."perfis_usuario" "p"
  WHERE (("p"."user_id" = "auth"."uid"()) AND ("p"."role" = ANY (ARRAY['superadmin'::"text", 'admin'::"text"])) AND ("p"."empresa_id" = "convites"."empresa_id"))))))) WITH CHECK ((("auth"."uid"() IS NOT NULL) AND (("auth"."uid"() = "convidado_por") OR (EXISTS ( SELECT 1
   FROM "public"."perfis_usuario" "p"
  WHERE (("p"."user_id" = "auth"."uid"()) AND ("p"."role" = ANY (ARRAY['superadmin'::"text", 'admin'::"text"])) AND ("p"."empresa_id" = "convites"."empresa_id")))))));



ALTER TABLE "public"."creditos_fornecedor" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "creditos_fornecedor_empresa" ON "public"."creditos_fornecedor" USING (("empresa_id" IN ( SELECT "perfis_usuario"."empresa_id"
   FROM "public"."perfis_usuario"
  WHERE ("perfis_usuario"."user_id" = "auth"."uid"()))));



ALTER TABLE "public"."creditos_uso" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "creditos_uso_empresa" ON "public"."creditos_uso" USING (("credito_id" IN ( SELECT "creditos_fornecedor"."id"
   FROM "public"."creditos_fornecedor"
  WHERE ("creditos_fornecedor"."empresa_id" IN ( SELECT "perfis_usuario"."empresa_id"
           FROM "public"."perfis_usuario"
          WHERE ("perfis_usuario"."user_id" = "auth"."uid"()))))));



ALTER TABLE "public"."empresa_secrets" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "empresa_secrets_service_only" ON "public"."empresa_secrets" USING (("auth"."role"() = 'service_role'::"text"));



ALTER TABLE "public"."empresas" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "empresas_select_by_empresa" ON "public"."empresas" FOR SELECT USING ("public"."can_access_empresa"("id"));



CREATE POLICY "empresas_write_by_empresa" ON "public"."empresas" USING ("public"."can_access_empresa"("id")) WITH CHECK ("public"."can_access_empresa"("id"));



ALTER TABLE "public"."estoque_itens" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "estoque_itens_select" ON "public"."estoque_itens" FOR SELECT USING ("public"."can_access_empresa"("empresa_id"));



CREATE POLICY "estoque_itens_write" ON "public"."estoque_itens" USING ("public"."can_access_empresa"("empresa_id")) WITH CHECK ("public"."can_access_empresa"("empresa_id"));



CREATE POLICY "estoque_mov_select" ON "public"."estoque_movimentacoes" FOR SELECT USING ("public"."can_access_empresa"("empresa_id"));



CREATE POLICY "estoque_mov_write" ON "public"."estoque_movimentacoes" USING ("public"."can_access_empresa"("empresa_id")) WITH CHECK ("public"."can_access_empresa"("empresa_id"));



ALTER TABLE "public"."estoque_movimentacoes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."formas_pagamento" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "formas_pagamento_empresa" ON "public"."formas_pagamento" USING (("empresa_id" IN ( SELECT "perfis_usuario"."empresa_id"
   FROM "public"."perfis_usuario"
  WHERE ("perfis_usuario"."user_id" = "auth"."uid"()))));



ALTER TABLE "public"."fornecedores" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "fornecedores_select_by_empresa" ON "public"."fornecedores" FOR SELECT USING ("public"."can_access_empresa"("empresa_id"));



CREATE POLICY "fornecedores_write_by_empresa" ON "public"."fornecedores" USING ("public"."can_access_empresa"("empresa_id")) WITH CHECK ("public"."can_access_empresa"("empresa_id"));



ALTER TABLE "public"."lancamentos" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "lancamentos_empresa" ON "public"."lancamentos" USING (("empresa_id" IN ( SELECT "perfis_usuario"."empresa_id"
   FROM "public"."perfis_usuario"
  WHERE ("perfis_usuario"."user_id" = "auth"."uid"()))));



ALTER TABLE "public"."logs_auditoria" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."nfe_entrada" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "nfe_entrada_empresa" ON "public"."nfe_entrada" USING (("empresa_id" IN ( SELECT "perfis_usuario"."empresa_id"
   FROM "public"."perfis_usuario"
  WHERE ("perfis_usuario"."user_id" = "auth"."uid"()))));



ALTER TABLE "public"."nfe_saida" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "nfe_saida_select_by_empresa" ON "public"."nfe_saida" FOR SELECT USING ("public"."can_access_empresa"("empresa_id"));



CREATE POLICY "nfe_saida_write_by_empresa" ON "public"."nfe_saida" USING ("public"."can_access_empresa"("empresa_id")) WITH CHECK ("public"."can_access_empresa"("empresa_id"));



ALTER TABLE "public"."obrigacoes_fiscais" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "obrigacoes_fiscais_select_by_empresa" ON "public"."obrigacoes_fiscais" FOR SELECT USING ("public"."can_access_empresa"("empresa_id"));



CREATE POLICY "obrigacoes_fiscais_write_by_empresa" ON "public"."obrigacoes_fiscais" USING ("public"."can_access_empresa"("empresa_id")) WITH CHECK ("public"."can_access_empresa"("empresa_id"));



ALTER TABLE "public"."orcamentos" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "orcamentos_select_by_empresa" ON "public"."orcamentos" FOR SELECT USING ("public"."can_access_empresa"("empresa_id"));



CREATE POLICY "orcamentos_write_by_empresa" ON "public"."orcamentos" USING ("public"."can_access_empresa"("empresa_id")) WITH CHECK ("public"."can_access_empresa"("empresa_id"));



ALTER TABLE "public"."ordens_servico" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "ordens_servico_select_by_empresa" ON "public"."ordens_servico" FOR SELECT USING ("public"."can_access_empresa"("empresa_id"));



CREATE POLICY "ordens_servico_write_by_empresa" ON "public"."ordens_servico" USING ("public"."can_access_empresa"("empresa_id")) WITH CHECK ("public"."can_access_empresa"("empresa_id"));



ALTER TABLE "public"."pedidos_compra" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."pedidos_compra_etapas" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "pedidos_compra_etapas_select" ON "public"."pedidos_compra_etapas" FOR SELECT USING (("pedido_id" IN ( SELECT "pedidos_compra"."id"
   FROM "public"."pedidos_compra"
  WHERE "public"."can_access_empresa"("pedidos_compra"."empresa_id"))));



CREATE POLICY "pedidos_compra_etapas_write" ON "public"."pedidos_compra_etapas" USING (("pedido_id" IN ( SELECT "pedidos_compra"."id"
   FROM "public"."pedidos_compra"
  WHERE "public"."can_access_empresa"("pedidos_compra"."empresa_id")))) WITH CHECK (("pedido_id" IN ( SELECT "pedidos_compra"."id"
   FROM "public"."pedidos_compra"
  WHERE "public"."can_access_empresa"("pedidos_compra"."empresa_id"))));



ALTER TABLE "public"."pedidos_compra_itens" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "pedidos_compra_itens_select" ON "public"."pedidos_compra_itens" FOR SELECT USING (("pedido_id" IN ( SELECT "pedidos_compra"."id"
   FROM "public"."pedidos_compra"
  WHERE "public"."can_access_empresa"("pedidos_compra"."empresa_id"))));



CREATE POLICY "pedidos_compra_itens_write" ON "public"."pedidos_compra_itens" USING (("pedido_id" IN ( SELECT "pedidos_compra"."id"
   FROM "public"."pedidos_compra"
  WHERE "public"."can_access_empresa"("pedidos_compra"."empresa_id")))) WITH CHECK (("pedido_id" IN ( SELECT "pedidos_compra"."id"
   FROM "public"."pedidos_compra"
  WHERE "public"."can_access_empresa"("pedidos_compra"."empresa_id"))));



CREATE POLICY "pedidos_compra_select_by_empresa" ON "public"."pedidos_compra" FOR SELECT USING ("public"."can_access_empresa"("empresa_id"));



CREATE POLICY "pedidos_compra_write_by_empresa" ON "public"."pedidos_compra" USING ("public"."can_access_empresa"("empresa_id")) WITH CHECK ("public"."can_access_empresa"("empresa_id"));



ALTER TABLE "public"."perfis_usuario" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "perfis_usuario_select_by_empresa" ON "public"."perfis_usuario" FOR SELECT USING ("public"."can_access_empresa"("empresa_id"));



CREATE POLICY "perfis_usuario_write_by_empresa" ON "public"."perfis_usuario" USING (("public"."can_access_empresa"("empresa_id") AND "public"."is_admin_user"())) WITH CHECK (("public"."can_access_empresa"("empresa_id") AND "public"."is_admin_user"()));



ALTER TABLE "public"."produtos" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "produtos_select_by_empresa" ON "public"."produtos" FOR SELECT USING ("public"."can_access_empresa"("empresa_id"));



CREATE POLICY "produtos_write_by_empresa" ON "public"."produtos" USING ("public"."can_access_empresa"("empresa_id")) WITH CHECK ("public"."can_access_empresa"("empresa_id"));



ALTER TABLE "public"."representantes_comerciais" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "representantes_comerciais_empresa" ON "public"."representantes_comerciais" USING (("empresa_id" IN ( SELECT "perfis_usuario"."empresa_id"
   FROM "public"."perfis_usuario"
  WHERE ("perfis_usuario"."user_id" = "auth"."uid"()))));



ALTER TABLE "public"."romaneio_itens" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "romaneio_itens_empresa" ON "public"."romaneio_itens" USING (("romaneio_id" IN ( SELECT "romaneios"."id"
   FROM "public"."romaneios"
  WHERE ("romaneios"."empresa_id" IN ( SELECT "perfis_usuario"."empresa_id"
           FROM "public"."perfis_usuario"
          WHERE ("perfis_usuario"."user_id" = "auth"."uid"()))))));



ALTER TABLE "public"."romaneios" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "romaneios_empresa" ON "public"."romaneios" USING (("empresa_id" IN ( SELECT "perfis_usuario"."empresa_id"
   FROM "public"."perfis_usuario"
  WHERE ("perfis_usuario"."user_id" = "auth"."uid"()))));



ALTER TABLE "public"."servico_componentes" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "servico_componentes_select" ON "public"."servico_componentes" FOR SELECT USING (("servico_id" IN ( SELECT "servicos_compostos"."id"
   FROM "public"."servicos_compostos"
  WHERE "public"."can_access_empresa"("servicos_compostos"."empresa_id"))));



CREATE POLICY "servico_componentes_write" ON "public"."servico_componentes" USING (("servico_id" IN ( SELECT "servicos_compostos"."id"
   FROM "public"."servicos_compostos"
  WHERE "public"."can_access_empresa"("servicos_compostos"."empresa_id")))) WITH CHECK (("servico_id" IN ( SELECT "servicos_compostos"."id"
   FROM "public"."servicos_compostos"
  WHERE "public"."can_access_empresa"("servicos_compostos"."empresa_id"))));



ALTER TABLE "public"."servicos_compostos" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "servicos_compostos_select_by_empresa" ON "public"."servicos_compostos" FOR SELECT USING ("public"."can_access_empresa"("empresa_id"));



CREATE POLICY "servicos_compostos_write_by_empresa" ON "public"."servicos_compostos" USING ("public"."can_access_empresa"("empresa_id")) WITH CHECK ("public"."can_access_empresa"("empresa_id"));



ALTER TABLE "public"."tabela_precos_fornecedor" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "tabela_precos_fornecedor_empresa" ON "public"."tabela_precos_fornecedor" USING (("empresa_id" IN ( SELECT "perfis_usuario"."empresa_id"
   FROM "public"."perfis_usuario"
  WHERE ("perfis_usuario"."user_id" = "auth"."uid"()))));





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";











































































































































































GRANT ALL ON FUNCTION "public"."aplicar_movimentacao_estoque"() TO "anon";
GRANT ALL ON FUNCTION "public"."aplicar_movimentacao_estoque"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."aplicar_movimentacao_estoque"() TO "service_role";



GRANT ALL ON FUNCTION "public"."can_access_empresa"("target_empresa_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."can_access_empresa"("target_empresa_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."can_access_empresa"("target_empresa_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."check_orcamento_expirado"() TO "anon";
GRANT ALL ON FUNCTION "public"."check_orcamento_expirado"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_orcamento_expirado"() TO "service_role";



GRANT ALL ON FUNCTION "public"."current_empresa_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."current_empresa_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."current_empresa_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_atualizar_saldo_conta"() TO "anon";
GRANT ALL ON FUNCTION "public"."fn_atualizar_saldo_conta"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_atualizar_saldo_conta"() TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_keepalive_ping"() TO "anon";
GRANT ALL ON FUNCTION "public"."fn_keepalive_ping"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_keepalive_ping"() TO "service_role";



GRANT ALL ON FUNCTION "public"."gerar_numero_pedido_compra"("p_empresa_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."gerar_numero_pedido_compra"("p_empresa_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gerar_numero_pedido_compra"("p_empresa_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_next_nfe_numero"("p_empresa_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_next_nfe_numero"("p_empresa_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_next_nfe_numero"("p_empresa_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_next_nfe_numero"("p_empresa_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_admin_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."marcar_os_atrasadas"() TO "anon";
GRANT ALL ON FUNCTION "public"."marcar_os_atrasadas"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."marcar_os_atrasadas"() TO "service_role";



GRANT ALL ON FUNCTION "public"."registrar_nfe_entrada"("p_empresa_id" "uuid", "p_fornecedor_id" "uuid", "p_fornecedor_nome" "text", "p_numero" "text", "p_serie" "text", "p_chave_acesso" "text", "p_data_emissao" "date", "p_valor_total" numeric, "p_pedido_compra_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."registrar_nfe_entrada"("p_empresa_id" "uuid", "p_fornecedor_id" "uuid", "p_fornecedor_nome" "text", "p_numero" "text", "p_serie" "text", "p_chave_acesso" "text", "p_data_emissao" "date", "p_valor_total" numeric, "p_pedido_compra_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."registrar_nfe_entrada"("p_empresa_id" "uuid", "p_fornecedor_id" "uuid", "p_fornecedor_nome" "text", "p_numero" "text", "p_serie" "text", "p_chave_acesso" "text", "p_data_emissao" "date", "p_valor_total" numeric, "p_pedido_compra_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "anon";
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_atualizado_em"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_atualizado_em"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_atualizado_em"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trg_atualizar_saldo_credito"() TO "anon";
GRANT ALL ON FUNCTION "public"."trg_atualizar_saldo_credito"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trg_atualizar_saldo_credito"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trg_atualizar_totais_pedido"() TO "anon";
GRANT ALL ON FUNCTION "public"."trg_atualizar_totais_pedido"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trg_atualizar_totais_pedido"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trg_avaliar_atraso_os"() TO "anon";
GRANT ALL ON FUNCTION "public"."trg_avaliar_atraso_os"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trg_avaliar_atraso_os"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trg_criar_romaneio_em_transporte"() TO "anon";
GRANT ALL ON FUNCTION "public"."trg_criar_romaneio_em_transporte"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trg_criar_romaneio_em_transporte"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trg_entrada_estoque_romaneio"() TO "anon";
GRANT ALL ON FUNCTION "public"."trg_entrada_estoque_romaneio"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trg_entrada_estoque_romaneio"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trg_registrar_etapa_pedido"() TO "anon";
GRANT ALL ON FUNCTION "public"."trg_registrar_etapa_pedido"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trg_registrar_etapa_pedido"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trg_status_inicial_pedido"() TO "anon";
GRANT ALL ON FUNCTION "public"."trg_status_inicial_pedido"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trg_status_inicial_pedido"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";
























GRANT ALL ON TABLE "public"."_keepalive_log" TO "anon";
GRANT ALL ON TABLE "public"."_keepalive_log" TO "authenticated";
GRANT ALL ON TABLE "public"."_keepalive_log" TO "service_role";



GRANT ALL ON SEQUENCE "public"."_keepalive_log_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."_keepalive_log_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."_keepalive_log_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."categorias_financeiras" TO "anon";
GRANT ALL ON TABLE "public"."categorias_financeiras" TO "authenticated";
GRANT ALL ON TABLE "public"."categorias_financeiras" TO "service_role";



GRANT ALL ON TABLE "public"."clientes" TO "anon";
GRANT ALL ON TABLE "public"."clientes" TO "authenticated";
GRANT ALL ON TABLE "public"."clientes" TO "service_role";



GRANT ALL ON TABLE "public"."colaboradores" TO "anon";
GRANT ALL ON TABLE "public"."colaboradores" TO "authenticated";
GRANT ALL ON TABLE "public"."colaboradores" TO "service_role";



GRANT ALL ON TABLE "public"."condicoes_pagamento" TO "anon";
GRANT ALL ON TABLE "public"."condicoes_pagamento" TO "authenticated";
GRANT ALL ON TABLE "public"."condicoes_pagamento" TO "service_role";



GRANT ALL ON TABLE "public"."config_precos" TO "anon";
GRANT ALL ON TABLE "public"."config_precos" TO "authenticated";
GRANT ALL ON TABLE "public"."config_precos" TO "service_role";



GRANT ALL ON TABLE "public"."contas_bancarias" TO "anon";
GRANT ALL ON TABLE "public"."contas_bancarias" TO "authenticated";
GRANT ALL ON TABLE "public"."contas_bancarias" TO "service_role";



GRANT ALL ON TABLE "public"."contas_pagar_receber" TO "anon";
GRANT ALL ON TABLE "public"."contas_pagar_receber" TO "authenticated";
GRANT ALL ON TABLE "public"."contas_pagar_receber" TO "service_role";



GRANT ALL ON TABLE "public"."convites" TO "anon";
GRANT ALL ON TABLE "public"."convites" TO "authenticated";
GRANT ALL ON TABLE "public"."convites" TO "service_role";



GRANT ALL ON TABLE "public"."creditos_fornecedor" TO "anon";
GRANT ALL ON TABLE "public"."creditos_fornecedor" TO "authenticated";
GRANT ALL ON TABLE "public"."creditos_fornecedor" TO "service_role";



GRANT ALL ON TABLE "public"."creditos_uso" TO "anon";
GRANT ALL ON TABLE "public"."creditos_uso" TO "authenticated";
GRANT ALL ON TABLE "public"."creditos_uso" TO "service_role";



GRANT ALL ON TABLE "public"."empresa_secrets" TO "anon";
GRANT ALL ON TABLE "public"."empresa_secrets" TO "authenticated";
GRANT ALL ON TABLE "public"."empresa_secrets" TO "service_role";



GRANT ALL ON TABLE "public"."empresas" TO "anon";
GRANT ALL ON TABLE "public"."empresas" TO "authenticated";
GRANT ALL ON TABLE "public"."empresas" TO "service_role";



GRANT ALL ON TABLE "public"."estoque_itens" TO "anon";
GRANT ALL ON TABLE "public"."estoque_itens" TO "authenticated";
GRANT ALL ON TABLE "public"."estoque_itens" TO "service_role";



GRANT ALL ON TABLE "public"."estoque_critico" TO "anon";
GRANT ALL ON TABLE "public"."estoque_critico" TO "authenticated";
GRANT ALL ON TABLE "public"."estoque_critico" TO "service_role";



GRANT ALL ON TABLE "public"."estoque_movimentacoes" TO "anon";
GRANT ALL ON TABLE "public"."estoque_movimentacoes" TO "authenticated";
GRANT ALL ON TABLE "public"."estoque_movimentacoes" TO "service_role";



GRANT ALL ON TABLE "public"."formas_pagamento" TO "anon";
GRANT ALL ON TABLE "public"."formas_pagamento" TO "authenticated";
GRANT ALL ON TABLE "public"."formas_pagamento" TO "service_role";



GRANT ALL ON TABLE "public"."fornecedores" TO "anon";
GRANT ALL ON TABLE "public"."fornecedores" TO "authenticated";
GRANT ALL ON TABLE "public"."fornecedores" TO "service_role";



GRANT ALL ON TABLE "public"."lancamentos" TO "anon";
GRANT ALL ON TABLE "public"."lancamentos" TO "authenticated";
GRANT ALL ON TABLE "public"."lancamentos" TO "service_role";



GRANT ALL ON TABLE "public"."logs_auditoria" TO "anon";
GRANT ALL ON TABLE "public"."logs_auditoria" TO "authenticated";
GRANT ALL ON TABLE "public"."logs_auditoria" TO "service_role";



GRANT ALL ON TABLE "public"."nfe_entrada" TO "anon";
GRANT ALL ON TABLE "public"."nfe_entrada" TO "authenticated";
GRANT ALL ON TABLE "public"."nfe_entrada" TO "service_role";



GRANT ALL ON TABLE "public"."nfe_saida" TO "anon";
GRANT ALL ON TABLE "public"."nfe_saida" TO "authenticated";
GRANT ALL ON TABLE "public"."nfe_saida" TO "service_role";



GRANT ALL ON TABLE "public"."obrigacoes_fiscais" TO "anon";
GRANT ALL ON TABLE "public"."obrigacoes_fiscais" TO "authenticated";
GRANT ALL ON TABLE "public"."obrigacoes_fiscais" TO "service_role";



GRANT ALL ON TABLE "public"."orcamentos" TO "anon";
GRANT ALL ON TABLE "public"."orcamentos" TO "authenticated";
GRANT ALL ON TABLE "public"."orcamentos" TO "service_role";



GRANT ALL ON TABLE "public"."ordens_servico" TO "anon";
GRANT ALL ON TABLE "public"."ordens_servico" TO "authenticated";
GRANT ALL ON TABLE "public"."ordens_servico" TO "service_role";



GRANT ALL ON TABLE "public"."os_atrasadas" TO "anon";
GRANT ALL ON TABLE "public"."os_atrasadas" TO "authenticated";
GRANT ALL ON TABLE "public"."os_atrasadas" TO "service_role";



GRANT ALL ON SEQUENCE "public"."pedido_compra_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."pedido_compra_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."pedido_compra_seq" TO "service_role";



GRANT ALL ON TABLE "public"."pedidos_compra" TO "anon";
GRANT ALL ON TABLE "public"."pedidos_compra" TO "authenticated";
GRANT ALL ON TABLE "public"."pedidos_compra" TO "service_role";



GRANT ALL ON TABLE "public"."pedidos_compra_etapas" TO "anon";
GRANT ALL ON TABLE "public"."pedidos_compra_etapas" TO "authenticated";
GRANT ALL ON TABLE "public"."pedidos_compra_etapas" TO "service_role";



GRANT ALL ON TABLE "public"."pedidos_compra_itens" TO "anon";
GRANT ALL ON TABLE "public"."pedidos_compra_itens" TO "authenticated";
GRANT ALL ON TABLE "public"."pedidos_compra_itens" TO "service_role";



GRANT ALL ON TABLE "public"."perfis_usuario" TO "anon";
GRANT ALL ON TABLE "public"."perfis_usuario" TO "authenticated";
GRANT ALL ON TABLE "public"."perfis_usuario" TO "service_role";



GRANT ALL ON TABLE "public"."produtos" TO "anon";
GRANT ALL ON TABLE "public"."produtos" TO "authenticated";
GRANT ALL ON TABLE "public"."produtos" TO "service_role";



GRANT ALL ON TABLE "public"."representantes_comerciais" TO "anon";
GRANT ALL ON TABLE "public"."representantes_comerciais" TO "authenticated";
GRANT ALL ON TABLE "public"."representantes_comerciais" TO "service_role";



GRANT ALL ON TABLE "public"."romaneio_itens" TO "anon";
GRANT ALL ON TABLE "public"."romaneio_itens" TO "authenticated";
GRANT ALL ON TABLE "public"."romaneio_itens" TO "service_role";



GRANT ALL ON TABLE "public"."romaneios" TO "anon";
GRANT ALL ON TABLE "public"."romaneios" TO "authenticated";
GRANT ALL ON TABLE "public"."romaneios" TO "service_role";



GRANT ALL ON TABLE "public"."servico_componentes" TO "anon";
GRANT ALL ON TABLE "public"."servico_componentes" TO "authenticated";
GRANT ALL ON TABLE "public"."servico_componentes" TO "service_role";



GRANT ALL ON TABLE "public"."servicos_compostos" TO "anon";
GRANT ALL ON TABLE "public"."servicos_compostos" TO "authenticated";
GRANT ALL ON TABLE "public"."servicos_compostos" TO "service_role";



GRANT ALL ON TABLE "public"."tabela_precos_fornecedor" TO "anon";
GRANT ALL ON TABLE "public"."tabela_precos_fornecedor" TO "authenticated";
GRANT ALL ON TABLE "public"."tabela_precos_fornecedor" TO "service_role";



GRANT ALL ON TABLE "public"."v_compras_por_fornecedor" TO "anon";
GRANT ALL ON TABLE "public"."v_compras_por_fornecedor" TO "authenticated";
GRANT ALL ON TABLE "public"."v_compras_por_fornecedor" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";



































