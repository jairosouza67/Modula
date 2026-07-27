-- Tabela de convites para registro invite-only
create table if not exists public.convites (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  role text not null check (role in ('superadmin', 'admin', 'gestor', 'vendedor', 'tecnico', 'financeiro')),
  token text unique not null,
  empresa_id uuid references public.empresas(id) on delete cascade,
  convidado_por uuid references public.perfis_usuario(id) on delete set null,
  expires_at timestamptz not null,
  usado_em timestamptz null,
  created_at timestamptz not null default now()
);

-- Índices úteis
create index if not exists idx_convites_token on public.convites(token);
create index if not exists idx_convites_email on public.convites(email);

-- RLS
alter table if exists public.convites enable row level security;

drop policy if exists convites_select_by_token on public.convites;
create policy convites_select_by_token
  on public.convites
  for select
  using (
    token is not null
    and usado_em is null
    and expires_at > now()
  );

drop policy if exists convites_insert_by_admin on public.convites;
create policy convites_insert_by_admin
  on public.convites
  for insert
  with check (
    exists (
      select 1
      from public.perfis_usuario p
      where p.user_id = auth.uid()
        and p.role in ('superadmin', 'admin')
        and p.empresa_id = convites.empresa_id
    )
  );

drop policy if exists convites_update_by_token on public.convites;
create policy convites_update_by_token
  on public.convites
  for update
  using (token is not null)
  with check (token is not null);
