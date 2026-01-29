-- Add avatar_url, bio, and nickname columns to profiles
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists bio text;
alter table public.profiles add column if not exists nickname text;
