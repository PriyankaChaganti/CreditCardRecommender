-- cards_catalog table
create table if not exists public.cards_catalog (
  id text primary key,
  issuer text not null,
  card_name text not null,
  network text not null,
  annual_fee numeric not null default 0,
  reward_type text not null,
  point_value numeric not null default 0.01,
  image text,
  reward_rules jsonb not null default '[]'::jsonb
);
alter table public.cards_catalog enable row level security;
create policy "Public read" on public.cards_catalog for select using (true);

-- merchant_categories table
create table if not exists public.merchant_categories (
  merchant_key text primary key,
  category text not null
);
alter table public.merchant_categories enable row level security;
create policy "Public read" on public.merchant_categories for select using (true);

-- user_cards table
create table if not exists public.user_cards (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  card_name text not null,
  issuer text not null,
  network text not null,
  reward_type text not null,
  annual_fee numeric not null default 0,
  point_value numeric not null default 0.01,
  reward_rules jsonb not null default '[]'::jsonb,
  created_at timestamptz default now()
);
alter table public.user_cards enable row level security;
create policy "Users manage own cards" on public.user_cards for all using (auth.uid() = user_id);

-- user_transactions table
create table if not exists public.user_transactions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  merchant    text not null,
  amount      numeric not null,
  date        date not null default current_date,
  category    text not null,
  card_id     uuid references public.user_cards(id) on delete set null,
  card_name   text,
  mcc_code    text,
  notes       text,
  created_at  timestamptz not null default now()
);
alter table public.user_transactions enable row level security;
create policy "Users manage own transactions" on public.user_transactions for all using (auth.uid() = user_id);
create index if not exists user_transactions_user_date_idx on public.user_transactions (user_id, date desc);

-- user_preferences table
create table if not exists public.user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  point_valuation numeric not null default 0.01,
  reward_pref text not null default 'all',
  updated_at timestamptz default now()
);
alter table public.user_preferences enable row level security;
create policy "Users manage own prefs" on public.user_preferences for all using (auth.uid() = user_id);
