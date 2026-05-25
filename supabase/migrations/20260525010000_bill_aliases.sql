/*
  # Scan Bill learning memory (cross-device)

  Stores confirmed "invoice text -> our artikel_nr" mappings per supplier so the
  Scan Bill feature recognises each supplier's naming on future scans, synced
  across all of a user's devices. Until this table exists the app falls back to a
  per-device localStorage cache, so it degrades gracefully.

  Run this in the Supabase SQL editor to enable cross-device sync.
*/

create table if not exists public.bill_aliases (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users(id) on delete cascade,
  supplier_id  text not null,
  invoice_text text not null,
  artikel_nr   text not null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (user_id, supplier_id, invoice_text)
);

create index if not exists idx_bill_aliases_lookup
  on public.bill_aliases (user_id, supplier_id);

alter table public.bill_aliases enable row level security;

create policy "Users manage own bill aliases"
  on public.bill_aliases
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
