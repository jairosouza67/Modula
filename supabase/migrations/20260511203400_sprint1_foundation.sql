create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.empresas (
  id uuid primary key default gen_random_uuid(),
  nome_fantasia text not null,
  razao_social text not null,
  cnpj text not null unique,
  endereco text not null,
  certificado_digital text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists empresas_set_updated_at on public.empresas;
create trigger empresas_set_updated_at
before update on public.empresas
for each row execute function public.set_updated_at();

create table if not exists public.perfis_usuario (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  user_id uuid not null,
  nome text not null,
  email text not null,
  role text not null check (role in ('admin', 'gestor', 'vendedor', 'tecnico', 'financeiro')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (empresa_id, user_id)
);

drop trigger if exists perfis_usuario_set_updated_at on public.perfis_usuario;
create trigger perfis_usuario_set_updated_at
before update on public.perfis_usuario
for each row execute function public.set_updated_at();

create table if not exists public.config_precos (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  categoria text not null check (categoria in ('vidro', 'processamento')),
  descricao text not null,
  valor numeric(12, 2) not null check (valor >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (empresa_id, categoria, descricao)
);

drop trigger if exists config_precos_set_updated_at on public.config_precos;
create trigger config_precos_set_updated_at
before update on public.config_precos
for each row execute function public.set_updated_at();

alter table public.empresas enable row level security;
alter table public.perfis_usuario enable row level security;
alter table public.config_precos enable row level security;

drop policy if exists empresas_select_by_empresa on public.empresas;
create policy empresas_select_by_empresa
on public.empresas
for select
using (
  auth.role() = 'service_role'
  or (
    auth.jwt() ->> 'empresa_id' is not null
    and id = (auth.jwt() ->> 'empresa_id')::uuid
  )
);

drop policy if exists empresas_write_by_empresa on public.empresas;
create policy empresas_write_by_empresa
on public.empresas
for all
using (
  auth.role() = 'service_role'
  or (
    auth.jwt() ->> 'empresa_id' is not null
    and id = (auth.jwt() ->> 'empresa_id')::uuid
  )
)
with check (
  auth.role() = 'service_role'
  or (
    auth.jwt() ->> 'empresa_id' is not null
    and id = (auth.jwt() ->> 'empresa_id')::uuid
  )
);

drop policy if exists perfis_usuario_select_by_empresa on public.perfis_usuario;
create policy perfis_usuario_select_by_empresa
on public.perfis_usuario
for select
using (
  auth.role() = 'service_role'
  or (
    auth.jwt() ->> 'empresa_id' is not null
    and empresa_id = (auth.jwt() ->> 'empresa_id')::uuid
  )
);

drop policy if exists perfis_usuario_write_by_empresa on public.perfis_usuario;
create policy perfis_usuario_write_by_empresa
on public.perfis_usuario
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

drop policy if exists config_precos_select_by_empresa on public.config_precos;
create policy config_precos_select_by_empresa
on public.config_precos
for select
using (
  auth.role() = 'service_role'
  or (
    auth.jwt() ->> 'empresa_id' is not null
    and empresa_id = (auth.jwt() ->> 'empresa_id')::uuid
  )
);

drop policy if exists config_precos_write_by_empresa on public.config_precos;
create policy config_precos_write_by_empresa
on public.config_precos
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
