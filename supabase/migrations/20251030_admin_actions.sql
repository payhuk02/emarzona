-- Admin actions audit table
create table if not exists public.admin_actions (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null references auth.users(id) on delete cascade,
  action text not null,
  target_type text,
  target_id text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_admin_actions_actor on public.admin_actions(actor_id);
create index if not exists idx_admin_actions_action on public.admin_actions(action);
create index if not exists idx_admin_actions_created_at on public.admin_actions(created_at);

alter table public.admin_actions enable row level security;

-- Basic policies: allow insert for authenticated; allow select for authenticated admins
do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'admin_actions' and policyname = 'Allow insert for authenticated'
  ) then
    create policy "Allow insert for authenticated" on public.admin_actions
      for insert to authenticated
      with check (auth.role() = 'authenticated');
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'admin_actions' and policyname = 'Allow select for admins'
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


