-- Sprint 4 (complemento): trigger de OS atrasada + coluna is_atrasada
-- Adiciona coluna para controle de atraso na tabela de OS

alter table public.ordens_servico
  add column if not exists is_atrasada boolean not null default false;

-- Função que marca OS como atrasada quando data_previsao < now
create or replace function public.marcar_os_atrasadas()
returns void language plpgsql security definer as $$
begin
  update public.ordens_servico
  set is_atrasada = (data_previsao < current_date)
  where status not in ('Concluido')
    and deleted_at is null;
end;
$$;

-- Trigger que avalia atraso a cada update
create or replace function public.trg_avaliar_atraso_os()
returns trigger language plpgsql security definer as $$
begin
  NEW.is_atrasada := (NEW.data_previsao < current_date) and (NEW.status <> 'Concluido');
  return NEW;
end;
$$;

drop trigger if exists trg_os_check_atrasada on public.ordens_servico;
create trigger trg_os_check_atrasada
before insert or update on public.ordens_servico
for each row execute function public.trg_avaliar_atraso_os();

-- View: OS em atraso para dashboard
create or replace view public.os_atrasadas as
  select
    os.id,
    os.empresa_id,
    os.numero,
    os.status,
    os.data_previsao,
    os.tecnico_id,
    os.is_atrasada,
    extract(day from now() - os.data_previsao::timestamptz)::int as dias_atraso
  from public.ordens_servico os
  where os.deleted_at is null
    and os.is_atrasada = true;
