-- 008_user_settings.sql
-- User Settings Table + Recording Compliance + Extended Call Fields

-- 1. User Settings Table
create table if not exists public.user_settings (
    id uuid primary key default gen_random_uuid(),
    user_id uuid unique references auth.users(id) on delete cascade not null,

    -- Recording Configuration
    recording_mode text default 'always' check (recording_mode in ('always', 'manual', 'never')),
    recording_disclaimer boolean default true,
    recording_retention_days integer default 30,
    recording_pause_on_dtmf boolean default true,
    recording_auto_delete_short boolean default true,

    -- AI Toggles
    ai_auto_transcribe boolean default true,
    ai_auto_summarize boolean default true,
    ai_detect_sentiment boolean default true,
    ai_extract_talking_points boolean default true,

    created_at timestamp with time zone default now() not null,
    updated_at timestamp with time zone default now() not null
);

-- 2. Extend calls table with recording + compliance fields
alter table public.calls
    add column if not exists recording_supabase_path text,
    add column if not exists transcript text,
    add column if not exists ai_processed boolean default false,
    add column if not exists ai_processed_at timestamp with time zone,
    add column if not exists was_recorded boolean default false,
    add column if not exists compliance_warning text;

-- 3. Auto-create user settings on auth.users insert
create or replace function public.create_default_user_settings()
returns trigger as $$
begin
    insert into public.user_settings (user_id)
    values (new.id)
    on conflict (user_id) do nothing;
    return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created_settings on auth.users;
create trigger on_auth_user_created_settings
    after insert on auth.users
    for each row execute function public.create_default_user_settings();

-- 4. Backfill settings for existing users
insert into public.user_settings (user_id)
select id from auth.users
on conflict (user_id) do nothing;

-- 5. RLS
alter table public.user_settings enable row level security;

drop policy if exists "Users can manage own settings" on public.user_settings;
create policy "Users can manage own settings" on public.user_settings
    for all using (auth.uid() = user_id);

-- 6. updated_at trigger
create or replace function public.set_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

drop trigger if exists set_user_settings_updated_at on public.user_settings;
create trigger set_user_settings_updated_at
    before update on public.user_settings
    for each row execute function public.set_updated_at();
