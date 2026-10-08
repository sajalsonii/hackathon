-- ====================================================================
-- Code Slayer - Profiles & Player Progress Schema
-- ====================================================================

-- 1. Create profiles table
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  slayer_name text not null,
  email text,
  xp integer not null default 0,
  slayer_rank text not null default 'Rookie Slayer',
  streak integer not null default 0,
  combo integer not null default 0,
  bugs_slain integer not null default 0,
  current_world text not null default '01',
  achievements jsonb not null default '[]'::jsonb,
  challenge_progress jsonb not null default '[]'::jsonb,
  dna_stats jsonb not null default '{"Syntax": 50, "Logic": 50, "Loops": 50, "Arrays": 50, "Functions": 50, "Runtime": 50, "Conditionals": 50, "Off-by-One": 50}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Enable Row Level Security (RLS)
alter table public.profiles enable row level security;

-- 3. RLS Policies (Users can only read, insert, and update their own profile)
create policy "Users can view own profile"
  on public.profiles
  for select
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles
  for insert
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles
  for update
  using (auth.uid() = id);

-- 4. Automatic profile initialization trigger upon Supabase Auth sign up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (
    id,
    user_id,
    slayer_name,
    email,
    xp,
    slayer_rank,
    streak,
    combo,
    bugs_slain,
    current_world,
    achievements,
    challenge_progress,
    dna_stats
  )
  values (
    new.id,
    new.id,
    coalesce(new.raw_user_meta_data->>'slayer_name', split_part(new.email, '@', 1)),
    new.email,
    0,
    'Rookie Slayer',
    0,
    0,
    0,
    '01',
    '[]'::jsonb,
    '[]'::jsonb,
    '{"Syntax": 50, "Logic": 50, "Loops": 50, "Arrays": 50, "Functions": 50, "Runtime": 50, "Conditionals": 50, "Off-by-One": 50}'::jsonb
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

-- Trigger execution
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
