create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  first_name text not null default '',
  surname text not null default '',
  country text not null default '',
  state_region text not null default '',
  occupation text,
  phone text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

revoke all on table public.profiles from anon, public;
grant select, update on public.profiles to authenticated;
grant insert on public.profiles to authenticated;

drop policy if exists "Users can read their own profile" on public.profiles;
create policy "Users can read their own profile"
on public.profiles
for select
to authenticated
using ((select auth.uid()) = id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
on public.profiles
for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

drop policy if exists "Users can create their own profile" on public.profiles;
create policy "Users can create their own profile"
on public.profiles
for insert
to authenticated
with check ((select auth.uid()) = id);

create or replace function public.set_profile_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

revoke all on function public.set_profile_updated_at() from public, anon, authenticated;
grant execute on function public.set_profile_updated_at() to authenticated;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_profile_updated_at();

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (
    id,
    first_name,
    surname,
    country,
    state_region,
    occupation,
    phone
  )
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'first_name'), ''), ''),
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'surname'), ''), ''),
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'country'), ''), ''),
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'state_region'), ''), ''),
    nullif(trim(new.raw_user_meta_data ->> 'occupation'), ''),
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'phone'), ''), '')
  )
  on conflict (id) do update set
    first_name = excluded.first_name,
    surname = excluded.surname,
    country = excluded.country,
    state_region = excluded.state_region,
    occupation = excluded.occupation,
    phone = excluded.phone;

  return new;
end;
$$;

revoke all on function public.handle_new_auth_user() from public, anon, authenticated;
grant execute on function public.handle_new_auth_user() to supabase_auth_admin;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_auth_user();

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  payment_provider text not null default 'flutterwave'
    check (payment_provider in ('flutterwave', 'legacy')),
  payment_customer_id text,
  payment_subscription_id text unique,
  payment_transaction_id text,
  payment_plan_id text,
  plan_key text not null default 'legacy',
  status text not null default 'incomplete'
    check (status in ('incomplete', 'incomplete_expired', 'trialing', 'active', 'past_due', 'canceled', 'unpaid', 'paused')),
  trial_end timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.subscriptions
  add column if not exists payment_provider text,
  add column if not exists payment_customer_id text,
  add column if not exists payment_subscription_id text,
  add column if not exists payment_transaction_id text,
  add column if not exists payment_plan_id text,
  add column if not exists plan_key text;

update public.subscriptions
set payment_provider = coalesce(payment_provider, 'legacy'),
    plan_key = coalesce(plan_key, 'legacy');

alter table public.subscriptions
  alter column payment_provider set default 'flutterwave',
  alter column payment_provider set not null,
  alter column plan_key set default 'legacy',
  alter column plan_key set not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'subscriptions_payment_provider_check'
      and conrelid = 'public.subscriptions'::regclass
  ) then
    alter table public.subscriptions
      add constraint subscriptions_payment_provider_check
      check (payment_provider in ('flutterwave', 'legacy'));
  end if;
end;
$$;

create unique index if not exists subscriptions_payment_subscription_id_key
  on public.subscriptions (payment_subscription_id)
  where payment_subscription_id is not null;

alter table public.subscriptions enable row level security;
revoke all on table public.subscriptions from anon, public;
grant select on table public.subscriptions to authenticated;

drop policy if exists "Users can read their own subscription" on public.subscriptions;
create policy "Users can read their own subscription"
on public.subscriptions
for select
to authenticated
using ((select auth.uid()) = user_id);

create index if not exists subscriptions_payment_customer_id_idx
  on public.subscriptions (payment_customer_id);

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
    and not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'subscriptions'
    ) then
    alter publication supabase_realtime add table public.subscriptions;
  end if;
end;
$$;

create table if not exists public.payment_attempts (
  tx_ref text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  plan_key text not null check (plan_key in ('weekly', 'monthly', 'yearly')),
  status text not null default 'pending' check (status in ('pending', 'completed')),
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

alter table public.payment_attempts enable row level security;
revoke all on table public.payment_attempts from anon, public, authenticated;
