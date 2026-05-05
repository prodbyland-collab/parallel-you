create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  country text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.life_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  anonymous_id text,
  input_snapshot jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.parallel_versions (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.life_sessions(id) on delete cascade,
  archetype text not null,
  title text not null,
  version_snapshot jsonb not null,
  scores jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.saved_timelines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  session_id uuid references public.life_sessions(id) on delete set null,
  version_id uuid references public.parallel_versions(id) on delete set null,
  title text not null,
  input_snapshot jsonb not null,
  version_snapshot jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.life_sessions enable row level security;
alter table public.parallel_versions enable row level security;
alter table public.saved_timelines enable row level security;

create policy "Profiles are readable by owner"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Profiles are editable by owner"
  on public.profiles for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Users can manage own life sessions"
  on public.life_sessions for all
  using (auth.uid() = user_id or user_id is null)
  with check (auth.uid() = user_id or user_id is null);

create policy "Users can manage versions from own sessions"
  on public.parallel_versions for all
  using (
    exists (
      select 1 from public.life_sessions
      where life_sessions.id = parallel_versions.session_id
      and (life_sessions.user_id = auth.uid() or life_sessions.user_id is null)
    )
  )
  with check (
    exists (
      select 1 from public.life_sessions
      where life_sessions.id = parallel_versions.session_id
      and (life_sessions.user_id = auth.uid() or life_sessions.user_id is null)
    )
  );

create policy "Users can manage own saved timelines"
  on public.saved_timelines for all
  using (auth.uid() = user_id or user_id is null)
  with check (auth.uid() = user_id or user_id is null);
