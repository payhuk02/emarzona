-- Bring admin_actions schema in sync with application code
do $$ begin
  -- Ensure table exists
  create table if not exists public.admin_actions (
    id uuid primary key default gen_random_uuid(),
    actor_id uuid,
    action text,
    target_type text,
    target_id text,
    metadata jsonb default '{}'::jsonb,
    created_at timestamptz not null default now()
  );

  -- Rename legacy columns if present
  if exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='admin_actions' and column_name='admin_id'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='admin_actions' and column_name='actor_id'
  ) then
    alter table public.admin_actions rename column admin_id to actor_id;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='admin_actions' and column_name='action_type'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='admin_actions' and column_name='action'
  ) then
    alter table public.admin_actions rename column action_type to action;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='admin_actions' and column_name='details'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='admin_actions' and column_name='metadata'
  ) then
    alter table public.admin_actions rename column details to metadata;
  end if;

  -- Ensure required columns and types
  if not exists (
    select 1 from information_schema.columns where table_schema='public' and table_name='admin_actions' and column_name='actor_id'
  ) then
    alter table public.admin_actions add column actor_id uuid;
  end if;

  if not exists (
    select 1 from information_schema.columns where table_schema='public' and table_name='admin_actions' and column_name='action'
  ) then
    alter table public.admin_actions add column action text;
  end if;

  if not exists (
    select 1 from information_schema.columns where table_schema='public' and table_name='admin_actions' and column_name='metadata'
  ) then
    alter table public.admin_actions add column metadata jsonb default '{}'::jsonb;
  end if;

  -- Add FK on actor_id to auth.users if not present
  if not exists (
    select 1 from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    join pg_namespace n on n.oid = t.relnamespace
    where c.contype='f' and n.nspname='public' and t.relname='admin_actions' and c.conname='admin_actions_actor_id_fkey'
  ) then
    alter table public.admin_actions
      add constraint admin_actions_actor_id_fkey foreign key (actor_id)
      references auth.users(id) on delete cascade;
  end if;

  -- Indexes
  create index if not exists idx_admin_actions_actor on public.admin_actions(actor_id);
  create index if not exists idx_admin_actions_action on public.admin_actions(action);
  create index if not exists idx_admin_actions_created_at on public.admin_actions(created_at);

  -- RLS and policies (idempotent)
  alter table public.admin_actions enable row level security;

  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='admin_actions' and policyname='Allow insert for authenticated'
  ) then
    create policy "Allow insert for authenticated" on public.admin_actions
      for insert to authenticated
      with check (auth.role() = 'authenticated');
  end if;

  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='admin_actions' and policyname='Allow select for admins'
  ) then
    create policy "Allow select for admins" on public.admin_actions
      for select to authenticated
      using (
        exists (
          select 1 from public.profiles p
          where p.user_id = auth.uid() and (p.is_super_admin = true or p.role in ('admin','manager','moderator','support','viewer'))
        )
      );
  end if;
end $$;


