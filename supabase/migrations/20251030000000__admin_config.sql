-- Create isolated admin_config KV table to avoid conflicts with existing platform_settings
do $$ begin
  create table if not exists public.admin_config (
    key text primary key,
    settings jsonb not null default '{}'::jsonb,
    updated_at timestamptz not null default now()
  );

  -- Seed default AAL2 protected routes
  insert into public.admin_config(key, settings)
  values ('admin', jsonb_build_object(
    'require_aal2_routes', jsonb_build_array('/admin/payments', '/admin/audit', '/admin/users', '/admin/products', '/admin/disputes')
  ))
  on conflict (key) do nothing;

  alter table public.admin_config enable row level security;

  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='admin_config' and policyname='Allow select to authenticated'
  ) then
    create policy "Allow select to authenticated" on public.admin_config for select to authenticated using (true);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='admin_config' and policyname='Allow update to admins'
  ) then
    create policy "Allow update to admins" on public.admin_config for update to authenticated using (
      exists (
        select 1 from public.profiles p
        where p.user_id = auth.uid() and (p.is_super_admin = true or p.role in ('admin'))
      )
    );
  end if;
end $$;


