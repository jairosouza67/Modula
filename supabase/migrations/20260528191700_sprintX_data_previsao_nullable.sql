-- Permitir que data_previsao seja nula para que OS canceladas sumam do calendário
ALTER TABLE public.ordens_servico ALTER COLUMN data_previsao DROP NOT NULL;

-- Atualizar funções para não quebrarem com data nula (is_atrasada not null)
create or replace function public.trg_avaliar_atraso_os()
returns trigger language plpgsql security definer as $$
begin
  NEW.is_atrasada := (NEW.data_previsao IS NOT NULL) and (NEW.data_previsao < current_date) and (NEW.status <> 'Concluido');
  return NEW;
end;
$$;

create or replace function public.marcar_os_atrasadas()
returns void language plpgsql security definer as $$
begin
  update public.ordens_servico
  set is_atrasada = (data_previsao IS NOT NULL and data_previsao < current_date)
  where status not in ('Concluido')
    and deleted_at is null;
end;
$$;
