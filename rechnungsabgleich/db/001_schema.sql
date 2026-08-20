/*
  Rechnungsabgleich — schema
  Paste this into the Supabase SQL editor and run it.

  WHY A SEPARATE SCHEMA
  ---------------------
  der Stern already owns public.suppliers (company_name/contact_person, NOT NULL,
  per-user RLS). Creating a second `suppliers` in public would collide with it, so
  everything here lives in the `rechnungsabgleich` schema. Nothing der Stern uses is
  touched, and the seed statement in the README works verbatim.

  AFTER RUNNING THIS, TWO MANUAL STEPS:
    1. Dashboard -> Settings -> API -> Exposed schemas: add `rechnungsabgleich`.
       Without this PostgREST returns 404 for every table below.
    2. Dashboard -> Storage: create a PRIVATE bucket named `invoices`.
       Then run 004 (storage policies) at the bottom of this file.

  The one cross-schema link is deliberate: article_mappings.article_id and
  invoice_lines.article_id both point at public.products(artikel_nr). Joining on the
  Artikel-Nr is the whole point — 225407 stays 225407 while the name flips between
  "Butter Bohnen" and "Monte Castello".
*/

create schema if not exists rechnungsabgleich;
grant usage on schema rechnungsabgleich to anon, authenticated, service_role;

set search_path = rechnungsabgleich, public;

-- ---------------------------------------------------------------------------
-- 001 Suppliers
-- ---------------------------------------------------------------------------

-- layout_key tells the extractor which invoice layout it is looking at
-- ('hamberger' prints Bons with subtotals, 'gemex' is a one-page Lieferschein).
create table if not exists rechnungsabgleich.suppliers (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  layout_key  text not null,
  -- Optional link to the der Stern supplier this maps to, so the review screen
  -- can show the same company the rest of the app knows.
  stern_supplier_id uuid,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 002 Invoices and lines
-- ---------------------------------------------------------------------------

create table if not exists rechnungsabgleich.invoices (
  id            uuid primary key default gen_random_uuid(),
  supplier_id   uuid not null references rechnungsabgleich.suppliers(id) on delete restrict,
  invoice_no    text,
  invoice_date  date,

  -- Ordered page photos in the private `invoices` bucket, page 1 first.
  storage_paths text[] not null check (array_length(storage_paths, 1) >= 1),

  status text not null default 'uploaded'
    check (status in ('uploaded','extracting','needs_rescan','review','applied','failed')),

  -- What the paper says vs. what the lines add up to. Both kept, so a mismatch
  -- stays visible after the fact instead of being resolved silently.
  warenwert_printed  numeric(12,2),
  warenwert_computed numeric(12,2),

  -- Pages to re-shoot when status = 'needs_rescan'.
  rescan_pages int[] not null default '{}',

  -- The full VerificationReport from shared/verifier.ts, verbatim.
  verification jsonb,

  extraction_error text,
  extracted_at     timestamptz,
  applied_at       timestamptz,

  created_by uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_ra_invoices_status  on rechnungsabgleich.invoices (status, created_at desc);
create index if not exists idx_ra_invoices_supplier on rechnungsabgleich.invoices (supplier_id, invoice_date desc);

create table if not exists rechnungsabgleich.invoice_lines (
  id         uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references rechnungsabgleich.invoices(id) on delete cascade,

  page   int  not null,
  bon_nr text,
  pos    int,

  -- The join key. Never the description.
  supplier_article_nr text not null,
  description         text not null,

  a_kolli   numeric(12,3),
  inh_kolli numeric(12,3),
  einheit   text,
  menge     numeric(12,3),
  -- Three decimals: suppliers price at 0,625 and rounding here loses money.
  preis     numeric(12,3),
  betrag    numeric(12,2),
  is_pfand  boolean not null default false,

  -- Verifier verdict, stored so the review screen never re-derives it.
  line_ok    boolean,
  line_issue text,

  -- Resolved from article_mappings at extraction time; null means "ask the human".
  article_id text references public.products(artikel_nr) on delete set null,

  created_at timestamptz not null default now()
);

create index if not exists idx_ra_lines_invoice on rechnungsabgleich.invoice_lines (invoice_id, page, pos);
create index if not exists idx_ra_lines_article on rechnungsabgleich.invoice_lines (supplier_article_nr);

-- ---------------------------------------------------------------------------
-- 003 Mappings and the apply audit
-- ---------------------------------------------------------------------------

-- The table that removes the daily work: one confirmed link per supplier article.
create table if not exists rechnungsabgleich.article_mappings (
  id          uuid primary key default gen_random_uuid(),
  supplier_id uuid not null references rechnungsabgleich.suppliers(id) on delete cascade,
  supplier_article_nr text not null,
  article_id  text not null references public.products(artikel_nr) on delete cascade,
  -- Last description seen for this article number, for display only.
  last_description text,
  confirmed_by uuid not null default auth.uid() references auth.users(id),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (supplier_id, supplier_article_nr)
);

create index if not exists idx_ra_mappings_lookup on rechnungsabgleich.article_mappings (supplier_id, supplier_article_nr);

-- Every price ever written to public.products by this app, with the old value.
create table if not exists rechnungsabgleich.price_applications (
  id         uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references rechnungsabgleich.invoices(id) on delete cascade,
  line_id    uuid references rechnungsabgleich.invoice_lines(id) on delete set null,
  article_id text not null,
  supplier_article_nr text,
  old_ek_price numeric(10,2),
  -- What the invoice printed, at full precision, before public.products rounds it.
  invoice_price numeric(12,3),
  new_ek_price  numeric(10,2) not null,
  applied_by    uuid not null default auth.uid() references auth.users(id),
  applied_at    timestamptz not null default now()
);

create index if not exists idx_ra_applications_article on rechnungsabgleich.price_applications (article_id, applied_at desc);

-- ---------------------------------------------------------------------------
-- Timestamps
-- ---------------------------------------------------------------------------

create or replace function rechnungsabgleich.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_ra_invoices_touch on rechnungsabgleich.invoices;
create trigger trg_ra_invoices_touch before update on rechnungsabgleich.invoices
  for each row execute function rechnungsabgleich.touch_updated_at();

drop trigger if exists trg_ra_mappings_touch on rechnungsabgleich.article_mappings;
create trigger trg_ra_mappings_touch before update on rechnungsabgleich.article_mappings
  for each row execute function rechnungsabgleich.touch_updated_at();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
/*
  These mirror what der Stern uses on public.products: any authenticated user of
  the account may read and write. der Stern is a single-operator app, so this is
  the policy that matches the rest of the system rather than the strictest one
  available. To scope per user instead, replace the `using (true)` clauses with
  `using (auth.uid() = created_by)` (and `confirmed_by` / `applied_by`).

  The edge function uses the service role key and bypasses all of these.
*/

alter table rechnungsabgleich.suppliers          enable row level security;
alter table rechnungsabgleich.invoices           enable row level security;
alter table rechnungsabgleich.invoice_lines      enable row level security;
alter table rechnungsabgleich.article_mappings   enable row level security;
alter table rechnungsabgleich.price_applications enable row level security;

do $$
declare t text;
begin
  foreach t in array array['suppliers','invoices','invoice_lines','article_mappings','price_applications']
  loop
    execute format('drop policy if exists "authenticated read %1$s" on rechnungsabgleich.%1$I', t);
    execute format(
      'create policy "authenticated read %1$s" on rechnungsabgleich.%1$I for select to authenticated using (true)', t);

    execute format('drop policy if exists "authenticated write %1$s" on rechnungsabgleich.%1$I', t);
    execute format(
      'create policy "authenticated write %1$s" on rechnungsabgleich.%1$I for all to authenticated using (true) with check (true)', t);
  end loop;
end;
$$;

grant select, insert, update, delete on all tables in schema rechnungsabgleich to authenticated;
grant usage, select on all sequences in schema rechnungsabgleich to authenticated;

-- ---------------------------------------------------------------------------
-- 004 Storage policies — run AFTER creating the private `invoices` bucket
-- ---------------------------------------------------------------------------

drop policy if exists "authenticated read invoice scans"   on storage.objects;
create policy "authenticated read invoice scans" on storage.objects
  for select to authenticated using (bucket_id = 'invoices');

drop policy if exists "authenticated upload invoice scans" on storage.objects;
create policy "authenticated upload invoice scans" on storage.objects
  for insert to authenticated with check (bucket_id = 'invoices');

drop policy if exists "authenticated delete invoice scans" on storage.objects;
create policy "authenticated delete invoice scans" on storage.objects
  for delete to authenticated using (bucket_id = 'invoices');

-- ---------------------------------------------------------------------------
-- Seed
-- ---------------------------------------------------------------------------

insert into rechnungsabgleich.suppliers (name, layout_key) values
  ('Hamberger Großmarkt Berlin', 'hamberger'),
  ('Gemex Handels GmbH',         'gemex')
on conflict (name) do nothing;
