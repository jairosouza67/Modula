create or replace function public.current_empresa_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select p.empresa_id
  from public.perfis_usuario p
  where p.user_id = auth.uid()
  order by p.created_at asc
  limit 1;
$$;

create or replace function public.can_access_empresa(target_empresa_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select (
    auth.role() = 'service_role'
    or (
      auth.jwt() ->> 'empresa_id' is not null
      and target_empresa_id = (auth.jwt() ->> 'empresa_id')::uuid
    )
    or (
      auth.role() = 'authenticated'
      and target_empresa_id = '00000000-0000-0000-0000-000000000001'::uuid
    )
    or exists (
      select 1
      from public.perfis_usuario p
      where p.user_id = auth.uid()
        and p.empresa_id = target_empresa_id
    )
  );
$$;

grant execute on function public.current_empresa_id() to anon, authenticated, service_role;
grant execute on function public.can_access_empresa(uuid) to anon, authenticated, service_role;

drop policy if exists empresas_select_by_empresa on public.empresas;
create policy empresas_select_by_empresa
on public.empresas
for select
using (public.can_access_empresa(id));

drop policy if exists empresas_write_by_empresa on public.empresas;
create policy empresas_write_by_empresa
on public.empresas
for all
using (public.can_access_empresa(id))
with check (public.can_access_empresa(id));

drop policy if exists perfis_usuario_select_by_empresa on public.perfis_usuario;
create policy perfis_usuario_select_by_empresa
on public.perfis_usuario
for select
using (
  public.can_access_empresa(empresa_id)
  or user_id = auth.uid()
);

drop policy if exists perfis_usuario_write_by_empresa on public.perfis_usuario;
create policy perfis_usuario_write_by_empresa
on public.perfis_usuario
for all
using (public.can_access_empresa(empresa_id))
with check (public.can_access_empresa(empresa_id));

drop policy if exists config_precos_select_by_empresa on public.config_precos;
create policy config_precos_select_by_empresa
on public.config_precos
for select
using (public.can_access_empresa(empresa_id));

drop policy if exists config_precos_write_by_empresa on public.config_precos;
create policy config_precos_write_by_empresa
on public.config_precos
for all
using (public.can_access_empresa(empresa_id))
with check (public.can_access_empresa(empresa_id));

drop policy if exists clientes_select_by_empresa on public.clientes;
create policy clientes_select_by_empresa
on public.clientes
for select
using (public.can_access_empresa(empresa_id));

drop policy if exists clientes_write_by_empresa on public.clientes;
create policy clientes_write_by_empresa
on public.clientes
for all
using (public.can_access_empresa(empresa_id))
with check (public.can_access_empresa(empresa_id));

drop policy if exists fornecedores_select_by_empresa on public.fornecedores;
create policy fornecedores_select_by_empresa
on public.fornecedores
for select
using (public.can_access_empresa(empresa_id));

drop policy if exists fornecedores_write_by_empresa on public.fornecedores;
create policy fornecedores_write_by_empresa
on public.fornecedores
for all
using (public.can_access_empresa(empresa_id))
with check (public.can_access_empresa(empresa_id));

drop policy if exists orcamentos_select_by_empresa on public.orcamentos;
create policy orcamentos_select_by_empresa
on public.orcamentos
for select
using (public.can_access_empresa(empresa_id));

drop policy if exists orcamentos_write_by_empresa on public.orcamentos;
create policy orcamentos_write_by_empresa
on public.orcamentos
for all
using (public.can_access_empresa(empresa_id))
with check (public.can_access_empresa(empresa_id));

drop policy if exists ordens_servico_select_by_empresa on public.ordens_servico;
create policy ordens_servico_select_by_empresa
on public.ordens_servico
for select
using (public.can_access_empresa(empresa_id));

drop policy if exists ordens_servico_write_by_empresa on public.ordens_servico;
create policy ordens_servico_write_by_empresa
on public.ordens_servico
for all
using (public.can_access_empresa(empresa_id))
with check (public.can_access_empresa(empresa_id));

drop policy if exists estoque_itens_select on public.estoque_itens;
create policy estoque_itens_select
on public.estoque_itens
for select
using (public.can_access_empresa(empresa_id));

drop policy if exists estoque_itens_write on public.estoque_itens;
create policy estoque_itens_write
on public.estoque_itens
for all
using (public.can_access_empresa(empresa_id))
with check (public.can_access_empresa(empresa_id));

drop policy if exists estoque_mov_select on public.estoque_movimentacoes;
create policy estoque_mov_select
on public.estoque_movimentacoes
for select
using (public.can_access_empresa(empresa_id));

drop policy if exists estoque_mov_write on public.estoque_movimentacoes;
create policy estoque_mov_write
on public.estoque_movimentacoes
for all
using (public.can_access_empresa(empresa_id))
with check (public.can_access_empresa(empresa_id));
