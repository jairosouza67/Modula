insert into storage.buckets (id, name, public)
values ('checkins', 'checkins', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

do $$
begin
  create policy "Public Access checkins"
    on storage.objects for select
    using ( bucket_id = 'checkins' );
exception when duplicate_object then null;
end $$;

do $$
begin
  create policy "Authenticated users can upload checkins"
    on storage.objects for insert
    with check ( bucket_id = 'checkins' and auth.role() = 'authenticated' );
exception when duplicate_object then null;
end $$;

do $$
begin
  create policy "Public Access avatars"
    on storage.objects for select
    using ( bucket_id = 'avatars' );
exception when duplicate_object then null;
end $$;

do $$
begin
  create policy "Authenticated users can upload avatars"
    on storage.objects for insert
    with check ( bucket_id = 'avatars' and auth.role() = 'authenticated' );
exception when duplicate_object then null;
end $$;
