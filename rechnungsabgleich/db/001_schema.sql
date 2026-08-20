-- Rechnungsabgleich / invoice reconciliation
-- Run in Supabase SQL editor, against the same project as der Stern.
--
-- ADAPTED FOR DER STERN — two changes from the standalone version:
--
--   1. Everything lives in its own `rechnungsabgleich` schema. der Stern
--      already owns `public.suppliers`, so a bare `create table suppliers`
--      would silently no-op against a table with completely different
--      columns and every query would fail in a confusing way.
--
--   2. `article_id` is TEXT, not uuid, because der Stern's articles are keyed
--      by `public.products.artikel_nr TEXT PRIMARY KEY` — there is no uuid id.
--
-- After running this, add `rechnungsabgleich` under
-- Settings -> API -> Exposed schemas, or every query returns 404.

create schema if not exists rechnungsabgleich;

-- ---------------------------------------------------------------
-- Suppliers (this app's own, with the layout hint for extraction)
-- ---------------------------------------------------------------
create table if not exists rechnungsabgleich.suppliers (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  -- how this supplier's invoice is laid out; used to pick the extraction prompt
  layout_key    text not null default 'generic',
  -- optional link to der Stern's own public.suppliers row
  stern_supplier_id uuid,
  created_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------
-- Invoices (one row per physical invoice, however many photo pages)
-- ---------------------------------------------------------------
create table if not exists rechnungsabgleich.supplier_invoices (
  id                  uuid primary key default gen_random_uuid(),
  supplier_id         uuid not null references rechnungsabgleich.suppliers(id),
  invoice_no          text,
  invoice_date        date,
  page_paths          text[] not null default '{}',   -- storage paths of the photos
  -- totals as PRINTED on the invoice (extracted, then used to verify)
  printed_warenwert   numeric(12,2),
  printed_endbetrag   numeric(12,2),
  -- verification outcome
  status              text not null default 'uploaded',
    -- uploaded | extracting | needs_rescan | verified | applied | failed
  verify_report       jsonb,
  created_at          timestamptz not null default now(),
  unique (supplier_id, invoice_no)
);

-- ---------------------------------------------------------------
-- Extracted lines
-- ---------------------------------------------------------------
create table if not exists rechnungsabgleich.invoice_lines (
  id               uuid primary key default gen_random_uuid(),
  invoice_id       uuid not null
                     references rechnungsabgleich.supplier_invoices(id)
                     on delete cascade,
  page_no          int  not null,
  line_no          int  not null,          -- order within the page
  bon              text,                   -- Hamberger Bon number, null elsewhere
  supplier_art_nr  text,                   -- THE join key. Never join on name.
  description      text not null,
  a_kolli          numeric(12,3),          -- outer count
  inh_kolli        numeric(12,3),          -- inner count OR weight in kg
  einheit          text,
  preis            numeric(12,4) not null, -- price per unit, 3-4 decimals
  betrag           numeric(12,2) not null, -- line total as printed
  ust_code         text,
  is_leergut       boolean not null default false,
  -- filled by the verifier
  effective_menge  numeric(12,3),          -- a_kolli * inh_kolli
  math_ok          boolean,
  created_at       timestamptz not null default now(),
  unique (invoice_id, page_no, line_no)
);

create index if not exists invoice_lines_artnr_idx
  on rechnungsabgleich.invoice_lines (supplier_art_nr);

create index if not exists invoice_lines_invoice_idx
  on rechnungsabgleich.invoice_lines (invoice_id);

-- ---------------------------------------------------------------
-- Article mapping: the table that kills the repetition
-- Learned once per supplier article, then permanent.
-- ---------------------------------------------------------------
create table if not exists rechnungsabgleich.article_mappings (
  id               uuid primary key default gen_random_uuid(),
  supplier_id      uuid not null references rechnungsabgleich.suppliers(id),
  supplier_art_nr  text not null,
  -- der Stern's articles are keyed by artikel_nr (TEXT), not a uuid.
  article_id       text not null
                     references public.products(artikel_nr)
                     on update cascade
                     on delete cascade,
  -- how many of YOUR units one invoice unit contains.
  -- 1 for a straight match. 12 when the invoice bills a Karton
  -- and you stock the single Stueck.
  unit_factor      numeric(12,4) not null default 1,
  note             text,
  confirmed_at     timestamptz not null default now(),
  unique (supplier_id, supplier_art_nr)
);

-- ---------------------------------------------------------------
-- Audit: every price change ever applied
-- ---------------------------------------------------------------
create table if not exists rechnungsabgleich.price_change_log (
  id            uuid primary key default gen_random_uuid(),
  invoice_id    uuid not null references rechnungsabgleich.supplier_invoices(id),
  article_id    text not null,
  old_price     numeric(12,4),
  new_price     numeric(12,4) not null,
  applied_by    uuid,
  applied_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------
-- RLS. der Stern's own tables are readable by any authenticated user,
-- so these match that: signed in means allowed.
-- ---------------------------------------------------------------
alter table rechnungsabgleich.suppliers          enable row level security;
alter table rechnungsabgleich.supplier_invoices  enable row level security;
alter table rechnungsabgleich.invoice_lines      enable row level security;
alter table rechnungsabgleich.article_mappings   enable row level security;
alter table rechnungsabgleich.price_change_log   enable row level security;

do $$
declare t text;
begin
  foreach t in array array[
    'suppliers','supplier_invoices','invoice_lines',
    'article_mappings','price_change_log'
  ] loop
    execute format(
      'create policy %I on rechnungsabgleich.%I
         for all to authenticated using (true) with check (true)',
      t || '_authenticated', t
    );
  end loop;
exception when duplicate_object then null;
end $$;

grant usage on schema rechnungsabgleich to authenticated;
grant all on all tables in schema rechnungsabgleich to authenticated;

-- ---------------------------------------------------------------
-- Seed the suppliers
-- ---------------------------------------------------------------
insert into rechnungsabgleich.suppliers (name, layout_key)
values ('Hamberger Großmarkt Berlin', 'hamberger'),
       ('Gemex Handels GmbH',         'gemex')
on conflict do nothing;
