-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles (all users)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('pro', 'client')),
  full_name text not null,
  email text not null unique,
  phone text,
  avatar_url text,
  created_at timestamptz default now()
);

-- Pro profiles
create table pro_profiles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade unique,
  business_name text not null,
  bio text,
  location text not null,
  specialties text[] default '{}',
  rating numeric(3,2) default 0,
  review_count int default 0,
  is_verified boolean default false,
  deposit_mode text default 'full' check (deposit_mode in ('full', 'partial', 'none')),
  stripe_account_id text,
  subscription_active boolean default false,
  created_at timestamptz default now()
);

-- Services
create table services (
  id uuid primary key default uuid_generate_v4(),
  pro_id uuid not null references pro_profiles(id) on delete cascade,
  name text not null,
  duration_minutes int not null,
  price_cents int not null,
  is_active boolean default true
);

-- Availability
create table availability (
  id uuid primary key default uuid_generate_v4(),
  pro_id uuid not null references pro_profiles(id) on delete cascade,
  day_of_week int not null check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time not null,
  is_active boolean default true,
  unique(pro_id, day_of_week)
);

-- Portfolio photos
create table portfolio_photos (
  id uuid primary key default uuid_generate_v4(),
  pro_id uuid not null references pro_profiles(id) on delete cascade,
  storage_path text not null,
  url text not null,
  created_at timestamptz default now()
);

-- Bookings
create table bookings (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid not null references profiles(id),
  pro_id uuid not null references pro_profiles(id),
  service_id uuid not null references services(id),
  status text not null default 'requested'
    check (status in ('requested','accepted','declined','completed','cancelled')),
  scheduled_at timestamptz not null,
  duration_minutes int not null,
  price_cents int not null,
  deposit_amount_cents int not null default 0,
  stripe_payment_intent_id text,
  stripe_charge_id text,
  tip_cents int default 0,
  cancellation_reason text,
  cancelled_at timestamptz,
  created_at timestamptz default now()
);

-- Reviews
create table reviews (
  id uuid primary key default uuid_generate_v4(),
  booking_id uuid not null references bookings(id) unique,
  reviewer_id uuid not null references profiles(id),
  reviewee_id uuid not null references profiles(id),
  rating int not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz default now()
);

-- Messages
create table messages (
  id uuid primary key default uuid_generate_v4(),
  booking_id uuid not null references bookings(id) on delete cascade,
  sender_id uuid not null references profiles(id),
  text text not null,
  created_at timestamptz default now()
);

-- Loyalty config (set by pro)
create table loyalty_configs (
  id uuid primary key default uuid_generate_v4(),
  pro_id uuid not null references pro_profiles(id) on delete cascade unique,
  visits_required int not null default 10,
  reward_description text not null,
  is_active boolean default true
);

-- Loyalty progress (per client/pro pair)
create table loyalty_progress (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid not null references profiles(id),
  pro_id uuid not null references pro_profiles(id),
  visit_count int default 0,
  reward_redeemed boolean default false,
  unique(client_id, pro_id)
);

-- Referrals
create table referrals (
  id uuid primary key default uuid_generate_v4(),
  referrer_id uuid not null references profiles(id),
  referee_id uuid references profiles(id),
  code text not null unique,
  credit_cents int default 1500,
  redeemed boolean default false,
  created_at timestamptz default now()
);

-- Client reputation
create table client_reputations (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid not null references profiles(id) unique,
  reliability_score numeric(3,2) default 5.0,
  payment_score numeric(3,2) default 5.0,
  no_show_count int default 0,
  total_bookings int default 0
);

-- Indexes for common queries
create index on bookings (client_id, status);
create index on bookings (pro_id, status);
create index on bookings (scheduled_at);
create index on messages (booking_id, created_at);
create index on pro_profiles (location);
create index on services (pro_id, is_active);

-- RLS policies
alter table profiles enable row level security;
alter table pro_profiles enable row level security;
alter table services enable row level security;
alter table availability enable row level security;
alter table portfolio_photos enable row level security;
alter table bookings enable row level security;
alter table reviews enable row level security;
alter table messages enable row level security;
alter table loyalty_configs enable row level security;
alter table loyalty_progress enable row level security;
alter table referrals enable row level security;
alter table client_reputations enable row level security;

-- Profiles: users can read all, update own
create policy "Public profiles are viewable by everyone" on profiles for select using (true);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

-- Bookings: client or pro on the booking can read/write
create policy "Booking participants can view" on bookings for select
  using (auth.uid() = client_id or auth.uid() = (select user_id from pro_profiles where id = pro_id));
create policy "Clients can create bookings" on bookings for insert with check (auth.uid() = client_id);
create policy "Participants can update bookings" on bookings for update
  using (auth.uid() = client_id or auth.uid() = (select user_id from pro_profiles where id = pro_id));

-- Messages: booking participants only
create policy "Booking participants can read messages" on messages for select
  using (exists (select 1 from bookings b where b.id = booking_id and (b.client_id = auth.uid() or (select user_id from pro_profiles where id = b.pro_id) = auth.uid())));
create policy "Booking participants can send messages" on messages for insert
  with check (auth.uid() = sender_id and exists (select 1 from bookings b where b.id = booking_id and (b.client_id = auth.uid() or (select user_id from pro_profiles where id = b.pro_id) = auth.uid())));
