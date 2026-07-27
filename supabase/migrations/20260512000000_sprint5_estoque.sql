-- Sprint 5: Estoque básico com alertas
-- Tabelas: estoque_itens, estoque_movimentacoes, view estoque_critico

create table if not exists public.estoque_itens (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  codigo text not null,
  descricao text not null,
  categoria text not null check (categoria in ('Chapas', 'Ferragens', 'Perfis', 'Consumíveis', 'Outros')),
  unidade text not null default 'pç',
  quantidade numeric(10, 3) not null default 0,
  estoque_minimo numeric(10, 3) not null default 0,
  custo_unitario numeric(12, 2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (empresa_id, codigo)
);

create table if not exists public.estoque_movimentacoes (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  item_id uuid not null references public.estoque_itens(id) on delete restrict,
  tipo text not null check (tipo in ('Entrada', 'Saída', 'Devolução', 'Ajuste')),
  quantidade numeric(10, 3) not null,
  os_referencia text,
  observacao text,
  usuario_id uuid references public.perfis_usuario(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Trigger updated_at
drop trigger if exists estoque_itens_set_updated_at on public.estoque_itens;
create trigger estoque_itens_set_updated_at
before update on public.estoque_itens
for each row execute function public.set_updated_at();

-- Trigger: atualiza quantidade após movimentação
create or replace function public.aplicar_movimentacao_estoque()
returns trigger language plpgsql security definer as $$
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

drop trigger if exists trg_aplicar_movimentacao on public.estoque_movimentacoes;
create trigger trg_aplicar_movimentacao
after insert on public.estoque_movimentacoes
for each row execute function public.aplicar_movimentacao_estoque();

-- View: itens críticos (quantidade <= estoque_minimo)
create or replace view public.estoque_critico as
  select
    ei.id,
    ei.empresa_id,
    ei.codigo,
    ei.descricao,
    ei.categoria,
    ei.quantidade,
    ei.estoque_minimo,
    ei.custo_unitario,
    case
      when ei.quantidade = 0 then 'Sem estoque'
      when ei.quantidade < ei.estoque_minimo then 'Crítico'
      when ei.quantidade <= ei.estoque_minimo * 1.3 then 'Atenção'
    end as status_critico
  from public.estoque_itens ei
  where ei.deleted_at is null
    and ei.quantidade <= ei.estoque_minimo * 1.3;

-- RLS: estoque_itens
alter table public.estoque_itens enable row level security;

drop policy if exists estoque_itens_select on public.estoque_itens;
create policy estoque_itens_select on public.estoque_itens
for select using (
  auth.role() = 'service_role'
  or (auth.jwt() ->> 'empresa_id' is not null
      and empresa_id = (auth.jwt() ->> 'empresa_id')::uuid)
);

drop policy if exists estoque_itens_write on public.estoque_itens;
create policy estoque_itens_write on public.estoque_itens
for all using (
  auth.role() = 'service_role'
  or (auth.jwt() ->> 'empresa_id' is not null
      and empresa_id = (auth.jwt() ->> 'empresa_id')::uuid)
)
with check (
  auth.role() = 'service_role'
  or (auth.jwt() ->> 'empresa_id' is not null
      and empresa_id = (auth.jwt() ->> 'empresa_id')::uuid)
);

-- RLS: estoque_movimentacoes
alter table public.estoque_movimentacoes enable row level security;

drop policy if exists estoque_mov_select on public.estoque_movimentacoes;
create policy estoque_mov_select on public.estoque_movimentacoes
for select using (
  auth.role() = 'service_role'
  or (auth.jwt() ->> 'empresa_id' is not null
      and empresa_id = (auth.jwt() ->> 'empresa_id')::uuid)
);

drop policy if exists estoque_mov_write on public.estoque_movimentacoes;
create policy estoque_mov_write on public.estoque_movimentacoes
for all using (
  auth.role() = 'service_role'
  or (auth.jwt() ->> 'empresa_id' is not null
      and empresa_id = (auth.jwt() ->> 'empresa_id')::uuid)
)
with check (
  auth.role() = 'service_role'
  or (auth.jwt() ->> 'empresa_id' is not null
      and empresa_id = (auth.jwt() ->> 'empresa_id')::uuid)
);
