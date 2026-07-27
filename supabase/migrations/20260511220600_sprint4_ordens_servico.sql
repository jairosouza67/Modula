create table if not exists public.ordens_servico (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  orcamento_id uuid not null references public.orcamentos(id) on delete restrict,
  cliente_id uuid references public.clientes(id) on delete restrict,
  tecnico_id uuid references public.perfis_usuario(id) on delete set null,
  numero text not null,
  status text not null check (status in ('Na Fila', 'Em Producao', 'Instalacao', 'Concluido')),
  data_previsao date not null,
  itens jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (empresa_id, numero)
);

drop trigger if exists ordens_servico_set_updated_at on public.ordens_servico;
create trigger ordens_servico_set_updated_at
before update on public.ordens_servico
for each row execute function public.set_updated_at();

alter table public.ordens_servico enable row level security;

-- Policies para OS
drop policy if exists ordens_servico_select_by_empresa on public.ordens_servico;
create policy ordens_servico_select_by_empresa
on public.ordens_servico
for select
using (
  auth.role() = 'service_role'
  or (
    auth.jwt() ->> 'empresa_id' is not null
    and empresa_id = (auth.jwt() ->> 'empresa_id')::uuid
  )
);

drop policy if exists ordens_servico_write_by_empresa on public.ordens_servico;
create policy ordens_servico_write_by_empresa
on public.ordens_servico
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
