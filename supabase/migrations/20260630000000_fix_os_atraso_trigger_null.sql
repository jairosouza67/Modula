-- Corrige trigger de atraso de OS para nao falhar quando data_previsao e nula
-- A migration 20260626000100_rls_audit_fixes.sql recriou a funcao sem o IS NOT NULL,
-- fazendo com que atualizacoes em ordens_servico (ex: atribuir tecnico) retornassem 400.

create or replace function public.trg_avaliar_atraso_os()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  NEW.is_atrasada := (NEW.data_previsao is not null)
                     and (NEW.data_previsao < current_date)
                     and (NEW.status <> 'Concluido');
  return NEW;
end;
$$;

create or replace function public.marcar_os_atrasadas()
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.ordens_servico
  set is_atrasada = (data_previsao is not null and data_previsao < current_date)
  where status not in ('Concluido')
    and deleted_at is null;
end;
$$;
