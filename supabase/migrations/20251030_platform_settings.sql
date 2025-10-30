-- Platform settings key/value store
do $$ begin
  create table if not exists public.platform_settings (
    key text primary key,
    settings jsonb not null default '{}'::jsonb,
    updated_at timestamptz not null default now()
  );

  -- Seed admin settings with default AAL2 protected routes (prefix match)
  insert into public.platform_settings(key, settings)
  values ('admin', jsonb_build_object(
    'require_aal2_routes', jsonb_build_array('/admin/payments', '/admin/audit', '/admin/users', '/admin/products', '/admin/disputes')
  ))
  on conflict (key) do update set settings =
    case
      when not (public.platform_settings.settings ? 'require_aal2_routes') then
        public.platform_settings.settings || jsonb_build_object(
          'require_aal2_routes', jsonb_build_array('/admin/payments', '/admin/audit', '/admin/users', '/admin/products', '/admin/disputes')
        )
      else public.platform_settings.settings
    end,
    updated_at = now();

  alter table public.platform_settings enable row level security;

  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='platform_settings' and policyname='Allow select to authenticated'
  ) then
    create policy "Allow select to authenticated" on public.platform_settings for select to authenticated using (true);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='platform_settings' and policyname='Allow update to admins'
  ) then
    create policy "Allow update to admins" on public.platform_settings for update to authenticated using (
      exists (
        select 1 from public.profiles p
        where p.user_id = auth.uid() and (p.is_super_admin = true or p.role in ('admin'))
      )
    );
  end if;
end $$;


