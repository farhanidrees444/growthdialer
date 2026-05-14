-- Initial GrowthDialer Supabase schema
-- Run this in Supabase SQL editor or migration pipeline.

create extension if not exists pgcrypto;

create table if not exists leads (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  name text,
  first_name text,
  last_name text,
  email text,
  phone text not null,
  company text,
  title text,
  ai_score integer default 0,
  status text default 'new' check (status in ('new','queued','contacted','connected','meeting_booked','not_interested','do_not_call')),
  source text,
  notes text,
  disposition text,
  last_called_at timestamptz,
  next_callback_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists calls (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id),
  lead_id uuid references leads(id),
  twilio_call_sid text unique,
  status text default 'initiated',
  direction text,
  from_number text,
  to_number text,
  duration integer default 0,
  disposition text,
  notes text,
  recording_url text,
  recording_sid text unique,
  recording_duration integer,
  started_at timestamptz default now(),
  ended_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists call_recordings (
  id uuid default gen_random_uuid() primary key,
  call_id uuid references calls(id),
  twilio_recording_sid text unique,
  url text not null,
  duration integer,
  created_at timestamptz default now()
);

create table if not exists sequences (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id),
  name text not null,
  steps jsonb default '[]',
  status text default 'active',
  created_at timestamptz default now()
);

create table if not exists daily_stats (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id),
  date date default current_date,
  calls_made integer default 0,
  connects integer default 0,
  meetings_booked integer default 0,
  pipeline_value numeric default 0,
  avg_call_duration integer default 0,
  unique(user_id, date)
);
