-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- PROFILES: Extended user data
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text,
  is_pro boolean default false,
  storage_limit bigint default 1073741824, -- 1GB default
  used_storage bigint default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- PROJECTS: Music projects
create table public.projects (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  bpm integer,
  key_signature text,
  is_public boolean default false,
  cover_image_path text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- STEMS: Audio files
create table public.stems (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  name text not null, -- e.g., "Vocal", "Drum"
  file_path text not null, -- R2 path
  file_size bigint not null,
  file_type text, -- mime type
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS POLICIES
alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.stems enable row level security;

-- Profiles: Users can read own data
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

-- Projects: Users can read own projects (and public ones if needed later)
create policy "Users can view own projects" on public.projects
  for select using (auth.uid() = user_id);

create policy "Users can create own projects" on public.projects
  for insert with check (auth.uid() = user_id);

create policy "Users can update own projects" on public.projects
  for update using (auth.uid() = user_id);

create policy "Users can delete own projects" on public.projects
  for delete using (auth.uid() = user_id);

-- Stems: Users can access stems of their own projects
create policy "Users can view own stems" on public.stems
  for select using (
    exists (
      select 1 from public.projects
      where projects.id = stems.project_id
      and projects.user_id = auth.uid()
    )
  );

create policy "Users can insert stems to own projects" on public.stems
  for insert with check (
    exists (
      select 1 from public.projects
      where projects.id = stems.project_id
      and projects.user_id = auth.uid()
    )
  );

create policy "Users can delete own stems" on public.stems
  for delete using (
    exists (
      select 1 from public.projects
      where projects.id = stems.project_id
      and projects.user_id = auth.uid()
    )
  );

-- TRIGGER: Create profile on signup
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
