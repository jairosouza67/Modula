create table if not exists public.orcamentos (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  cliente_id uuid references public.clientes(id) on delete restrict,
  numero text not null,
  descricao text not null,
  itens jsonb not null default '[]'::jsonb,
  area_total numeric(10, 2) not null default 0,
  valor_total numeric(12, 2) not null default 0,
  status text not null check (status in ('Aberto', 'Aprovado', 'Expirado', 'Rejeitado')),
  data_validade date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (empresa_id, numero)
);

drop trigger if exists orcamentos_set_updated_at on public.orcamentos;
create trigger orcamentos_set_updated_at
before update on public.orcamentos
for each row execute function public.set_updated_at();

alter table public.orcamentos enable row level security;

-- Policies para Orcamentos
drop policy if exists orcamentos_select_by_empresa on public.orcamentos;
create policy orcamentos_select_by_empresa
on public.orcamentos
for select
using (
  auth.role() = 'service_role'
  or (
    auth.jwt() ->> 'empresa_id' is not null
    and empresa_id = (auth.jwt() ->> 'empresa_id')::uuid
  )
);

drop policy if exists orcamentos_write_by_empresa on public.orcamentos;
create policy orcamentos_write_by_empresa
on public.orcamentos
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

-- Trigger function for expiration
create or replace function public.check_orcamento_expirado()
returns trigger as $$
begin
  if new.status = 'Aberto' and new.data_validade < current_date then
    new.status := 'Expirado';
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists before_update_orcamento_expirado on public.orcamentos;
create trigger before_update_orcamento_expirado
before insert or update on public.orcamentos
for each row execute function public.check_orcamento_expirado();
