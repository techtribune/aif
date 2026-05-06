-- AIF Events + Digital Registration tables
-- Run this in Supabase: SQL Editor

create table if not exists public.aif_events (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  location text,
  event_date date,
  created_at timestamptz not null default now(),
  created_by uuid
);

create table if not exists public.aif_registrations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.aif_events(id) on delete cascade,
  created_at timestamptz not null default now(),

  name text not null,
  contact_number text not null,
  network text,

  business_name text,
  email text,
  address text,
  notes text
);

create index if not exists aif_registrations_event_id_idx on public.aif_registrations(event_id);
create index if not exists aif_registrations_contact_idx on public.aif_registrations(contact_number);

