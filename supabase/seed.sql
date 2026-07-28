insert into public.empresas (
  id,
  nome_fantasia,
  razao_social,
  cnpj,
  endereco,
  cidade,
  telefone,
  certificado_digital
)
values (
  '00000000-0000-0000-0000-000000000001',
  'ModulaAPP',
  'ModulaAPP Ltda',
  '12.345.678/0001-90',
  'Av. Principal, 1000 - Sao Paulo / SP',
  'Sao Paulo - SP',
  '(11) 99999-9999',
  'A1 - valido ate 12/2026'
)
on conflict (id) do update
set
  nome_fantasia = excluded.nome_fantasia,
  razao_social = excluded.razao_social,
  cnpj = excluded.cnpj,
  endereco = excluded.endereco,
  cidade = excluded.cidade,
  telefone = excluded.telefone,
  certificado_digital = excluded.certificado_digital;

insert into public.config_precos (empresa_id, categoria, descricao, valor)
values
  ('00000000-0000-0000-0000-000000000001', 'vidro', 'Incolor 4mm', 95.00),
  ('00000000-0000-0000-0000-000000000001', 'vidro', 'Fume 6mm', 138.50),
  ('00000000-0000-0000-0000-000000000001', 'vidro', 'Laminado 8mm', 214.90),
  ('00000000-0000-0000-0000-000000000001', 'processamento', 'Lapidacao', 12.00),
  ('00000000-0000-0000-0000-000000000001', 'processamento', 'Furo', 8.50),
  ('00000000-0000-0000-0000-000000000001', 'processamento', 'Jateamento', 24.00)
on conflict (empresa_id, categoria, descricao) do update
set valor = excluded.valor;

insert into public.perfis_usuario (empresa_id, user_id, nome, email, role)
select
  '00000000-0000-0000-0000-000000000001',
  users.id,
  coalesce(users.raw_user_meta_data ->> 'name', split_part(users.email, '@', 1)),
  users.email,
  coalesce(users.raw_user_meta_data ->> 'role', 'vendedor')
from auth.users as users
on conflict (empresa_id, user_id) do update
set
  nome = excluded.nome,
  email = excluded.email,
  role = excluded.role;

insert into public.formas_pagamento (id, codigo, descricao, aplicacao, ativo)
values 
  ('11111111-1111-1111-1111-111111111111', 'BANCARIO', 'Boleto Bancário', 'ambos', true),
  ('22222222-2222-2222-2222-222222222222', 'PIX', 'PIX', 'ambos', true),
  ('33333333-3333-3333-3333-333333333333', 'CREDITO', 'Cartão de Crédito', 'ambos', true),
  ('44444444-4444-4444-4444-444444444444', 'DINHEIRO', 'Dinheiro', 'ambos', true)
on conflict (id) do update set descricao = excluded.descricao, ativo = excluded.ativo;

insert into public.condicoes_pagamento (id, codigo, descricao, prazos_dias, desconto_pct, acrescimo_pct, aplicacao, ativo)
values 
  ('55555555-5555-5555-5555-555555555555', 'AVISTA', 'À Vista', array[0]::integer[], 5.00, 0.00, 'ambos', true),
  ('66666666-6666-6666-6666-666666666666', '30DD', '30 Dias', array[30]::integer[], 0.00, 0.00, 'ambos', true),
  ('77777777-7777-7777-7777-777777777777', '306090DD', '30/60/90 Dias', array[30, 60, 90]::integer[], 0.00, 3.00, 'ambos', true)
on conflict (id) do update set descricao = excluded.descricao, prazos_dias = excluded.prazos_dias;
