-- Permite que el panel reciba reservas nuevas al instante (Supabase Realtime).
do $$
begin
  execute 'alter publication supabase_realtime add table public.reservations';
exception
  when duplicate_object then
    null;
end $$;
