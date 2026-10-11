alter table public.subscriptions
  add column if not exists payment_provider text,
  add column if not exists payment_customer_id text,
  add column if not exists payment_subscription_id text,
  add column if not exists payment_transaction_id text,
  add column if not exists payment_plan_id text,
  add column if not exists plan_key text;

update public.subscriptions
set payment_provider = coalesce(payment_provider, 'legacy'),
    payment_customer_id = coalesce(payment_customer_id, stripe_customer_id),
    payment_subscription_id = coalesce(payment_subscription_id, stripe_subscription_id),
    payment_plan_id = coalesce(payment_plan_id, stripe_price_id),
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

drop index if exists public.subscriptions_stripe_customer_id_idx;
alter table public.subscriptions
  drop column if exists stripe_customer_id,
  drop column if exists stripe_subscription_id,
  drop column if exists stripe_price_id;

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
