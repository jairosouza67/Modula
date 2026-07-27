create table if not exists public.clientes (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  nome text not null,
  documento text not null,
  tipo_documento text not null check (tipo_documento in ('cpf', 'cnpj')),
  contato text not null,
  segmento text not null check (segmento in ('Construtoras', 'Residencial', 'Arquitetos', 'Comercial')),
  ultimo_contato date not null default current_date,
  volume_total numeric(12, 2) not null default 0 check (volume_total >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (empresa_id, documento)
);

drop trigger if exists clientes_set_updated_at on public.clientes;
create trigger clientes_set_updated_at
before update on public.clientes
for each row execute function public.set_updated_at();

create table if not exists public.fornecedores (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  nome text not null,
  cnpj text not null,
  contato text not null,
  categoria text not null check (categoria in ('Chapas temperadas', 'Perfis aluminio', 'Ferragens box/janela', 'Espelhos lapidados', 'Consumiveis')),
  dados_fiscais text not null default '',
  dados_bancarios text not null default '',
  a_pagar numeric(12, 2) not null default 0 check (a_pagar >= 0),
  vencimento date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (empresa_id, cnpj)
);

drop trigger if exists fornecedores_set_updated_at on public.fornecedores;
create trigger fornecedores_set_updated_at
before update on public.fornecedores
for each row execute function public.set_updated_at();

alter table public.clientes enable row level security;
alter table public.fornecedores enable row level security;

-- Policies para Clientes
drop policy if exists clientes_select_by_empresa on public.clientes;
create policy clientes_select_by_empresa
on public.clientes
for select
using (
  auth.role() = 'service_role'
  or (
    auth.jwt() ->> 'empresa_id' is not null
    and empresa_id = (auth.jwt() ->> 'empresa_id')::uuid
  )
);

drop policy if exists clientes_write_by_empresa on public.clientes;
create policy clientes_write_by_empresa
on public.clientes
for all
using (
  auth.role() = 'service_role'
  or (
    auth.jwt() ->> 'empresa_id' is not null
    and empresa_id = (auth.jwt() ->> 'empresa_id')::uuid
  )
)
with check (
  auth.role() = 'service_role'
  or (
    auth.jwt() ->> 'empresa_id' is not null
    and empresa_id = (auth.jwt() ->> 'empresa_id')::uuid
  )
);

-- Policies para Fornecedores
drop policy if exists fornecedores_select_by_empresa on public.fornecedores;
create policy fornecedores_select_by_empresa
on public.fornecedores
for select
using (
  auth.role() = 'service_role'
  or (
    auth.jwt() ->> 'empresa_id' is not null
    and empresa_id = (auth.jwt() ->> 'empresa_id')::uuid
  )
);

drop policy if exists fornecedores_write_by_empresa on public.fornecedores;
create policy fornecedores_write_by_empresa
on public.fornecedores
for all
using (
  auth.role() = 'service_role'
  or (
    auth.jwt() ->> 'empresa_id' is not null
    and empresa_id = (auth.jwt() ->> 'empresa_id')::uuid
  )
)
with check (
  auth.role() = 'service_role'
  or (
    auth.jwt() ->> 'empresa_id' is not null
    and empresa_id = (auth.jwt() ->> 'empresa_id')::uuid
  )
);
