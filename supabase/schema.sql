-- RupeePilot schema. Run in Supabase SQL Editor.
create extension if not exists pgcrypto;

create type public.allocation_category as enum (
  'home', 'sip', 'savings', 'bills', 'personal', 'buffer', 'other'
);

create type public.transaction_kind as enum ('income', 'expense');

create type public.transaction_source as enum ('manual', 'csv', 'account_aggregator');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  currency_code text not null default 'INR' check (currency_code = 'INR'),
  month_start_day smallint not null default 1 check (month_start_day between 1 and 28),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.monthly_budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  budget_month date not null,
  income_paise bigint not null default 0 check (income_paise >= 0),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, budget_month),
  check (extract(day from budget_month) = 1)
);

create table public.budget_allocations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  budget_id uuid not null references public.monthly_budgets(id) on delete cascade,
  category public.allocation_category not null,
  planned_paise bigint not null default 0 check (planned_paise >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (budget_id, category)
);

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  budget_id uuid references public.monthly_budgets(id) on delete set null,
  kind public.transaction_kind not null,
  amount_paise bigint not null check (amount_paise > 0),
  category public.allocation_category not null default 'other',
  description text not null check (char_length(description) between 1 and 180),
  transaction_date date not null default current_date,
  source public.transaction_source not null default 'manual',
  external_transaction_id text,
  dedupe_key text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index transactions_user_date_idx
  on public.transactions (user_id, transaction_date desc);

create index allocations_user_budget_idx
  on public.budget_allocations (user_id, budget_id);

-- Import placeholders. Do not populate these until provider integration is implemented.
create table public.bank_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null,
  provider_connection_id text,
  consent_status text not null default 'not_connected'
    check (consent_status in ('not_connected', 'pending', 'active', 'expired', 'revoked', 'error')),
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.import_batches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  connection_id uuid references public.bank_connections(id) on delete set null,
  source text not null check (source in ('csv', 'account_aggregator')),
  status text not null default 'pending'
    check (status in ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  total_rows integer not null default 0 check (total_rows >= 0),
  imported_rows integer not null default 0 check (imported_rows >= 0),
  error_summary text,
  created_at timestamptz not null default now()
);

-- Create a profile automatically after Supabase Auth creates a user.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Enable RLS on every user-owned table.
alter table public.profiles enable row level security;
alter table public.monthly_budgets enable row level security;
alter table public.budget_allocations enable row level security;
alter table public.transactions enable row level security;
alter table public.bank_connections enable row level security;
alter table public.import_batches enable row level security;

create policy "profiles_select_own" on public.profiles
  for select to authenticated using (id = (select auth.uid()));
create policy "profiles_update_own" on public.profiles
  for update to authenticated using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create policy "budgets_select_own" on public.monthly_budgets
  for select to authenticated using (user_id = (select auth.uid()));
create policy "budgets_insert_own" on public.monthly_budgets
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "budgets_update_own" on public.monthly_budgets
  for update to authenticated using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy "budgets_delete_own" on public.monthly_budgets
  for delete to authenticated using (user_id = (select auth.uid()));

create policy "allocations_select_own" on public.budget_allocations
  for select to authenticated using (user_id = (select auth.uid()));
create policy "allocations_insert_own" on public.budget_allocations
  for insert to authenticated with check (
    user_id = (select auth.uid()) and exists (
      select 1 from public.monthly_budgets b
      where b.id = budget_id and b.user_id = (select auth.uid())
    )
  );
create policy "allocations_update_own" on public.budget_allocations
  for update to authenticated using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid()) and exists (
      select 1 from public.monthly_budgets b
      where b.id = budget_id and b.user_id = (select auth.uid())
    )
  );
create policy "allocations_delete_own" on public.budget_allocations
  for delete to authenticated using (user_id = (select auth.uid()));

create policy "transactions_select_own" on public.transactions
  for select to authenticated using (user_id = (select auth.uid()));
create policy "transactions_insert_own" on public.transactions
  for insert to authenticated with check (
    user_id = (select auth.uid()) and (
      budget_id is null or exists (
        select 1 from public.monthly_budgets b
        where b.id = budget_id and b.user_id = (select auth.uid())
      )
    )
  );
create policy "transactions_update_own" on public.transactions
  for update to authenticated using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy "transactions_delete_own" on public.transactions
  for delete to authenticated using (user_id = (select auth.uid()));

create policy "connections_select_own" on public.bank_connections
  for select to authenticated using (user_id = (select auth.uid()));
create policy "connections_insert_own" on public.bank_connections
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "connections_update_own" on public.bank_connections
  for update to authenticated using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy "connections_delete_own" on public.bank_connections
  for delete to authenticated using (user_id = (select auth.uid()));

create policy "batches_select_own" on public.import_batches
  for select to authenticated using (user_id = (select auth.uid()));
create policy "batches_insert_own" on public.import_batches
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "batches_update_own" on public.import_batches
  for update to authenticated using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- Grant only the normal authenticated role access to app tables.
grant usage on schema public to authenticated;
grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.monthly_budgets to authenticated;
grant select, insert, update, delete on public.budget_allocations to authenticated;
grant select, insert, update, delete on public.transactions to authenticated;
grant select, insert, update, delete on public.bank_connections to authenticated;
grant select, insert, update on public.import_batches to authenticated;
