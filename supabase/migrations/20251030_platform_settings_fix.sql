-- Fix platform_settings schema to ensure column "key" exists and is primary key
do $$ begin
  -- Create table if it does not exist
  create table if not exists public.platform_settings (
    settings jsonb not null default '{}'::jsonb,
    updated_at timestamptz not null default now()
  );

  -- Add column "key" if missing
  if not exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='platform_settings' and column_name='key'
  ) then
    alter table public.platform_settings add column "key" text;
  end if;

  -- Ensure primary key on "key"
  if not exists (
    select 1 from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    join pg_namespace n on n.oid = t.relnamespace
    where c.contype='p' and n.nspname='public' and t.relname='platform_settings'
  ) then
    -- Drop any duplicate rows with null key to allow PK, keeping the latest
    delete from public.platform_settings ps
    using public.platform_settings ps2
    where ps.ctid < ps2.ctid and coalesce(ps.key,'') = coalesce(ps2.key,'');

    alter table public.platform_settings
      add constraint platform_settings_pkey primary key ("key");
  end if;

  -- Seed default admin settings if not present
  insert into public.platform_settings("key", settings)
  values ('admin', jsonb_build_object(
    'require_aal2_routes', jsonb_build_array('/admin/payments', '/admin/audit', '/admin/users', '/admin/products', '/admin/disputes')
  ))
  on conflict ("key") do update set settings =
    case
      when not (public.platform_settings.settings ? 'require_aal2_routes') then
        public.platform_settings.settings || jsonb_build_object(
          'require_aal2_routes', jsonb_build_array('/admin/payments', '/admin/audit', '/admin/users', '/admin/products', '/admin/disputes')
        )
      else public.platform_settings.settings
    end,
    updated_at = now();
end $$;


