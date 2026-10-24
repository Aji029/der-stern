-- Rechnungsabgleich / invoice reconciliation
--
-- Run this in the SQL editor of the RECHNUNGSABGLEICH project — the new, empty
-- one. NOT der Stern's project. der Stern's database is never modified by this
-- app: no table, no policy, no migration. It is only ever read, anonymously,
-- through a separate client.
--
-- Because this is a project of its own, the tables live in `public` here and
-- there is nothing to add under Settings -> API -> Exposed schemas.
--
-- `article_id` is TEXT and carries no foreign key: it holds der Stern's
-- `products.artikel_nr`, which lives in a different database entirely. That
-- missing constraint is the decoupling made concrete.

-- ---------------------------------------------------------------
-- Suppliers (this app's own, with the layout hint for extraction)
-- ---------------------------------------------------------------
create table if not exists suppliers (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  -- how this supplier's invoice is laid out; used to pick the extraction prompt
  layout_key    text not null default 'generic',
  -- der Stern's public.suppliers.id, in the OTHER project. A plain uuid
  -- column: there is no cross-database foreign key to enforce it.
  stern_supplier_id uuid,
  created_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------
-- Invoices (one row per physical invoice, however many photo pages)
-- ---------------------------------------------------------------
create table if not exists supplier_invoices (
  id                  uuid primary key default gen_random_uuid(),
  supplier_id         uuid not null references suppliers(id),
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
create table if not exists invoice_lines (
  id               uuid primary key default gen_random_uuid(),
  invoice_id       uuid not null
                     references supplier_invoices(id)
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
  on invoice_lines (supplier_art_nr);

create index if not exists invoice_lines_invoice_idx
  on invoice_lines (invoice_id);

-- ---------------------------------------------------------------
-- Article mapping: the table that kills the repetition
-- Learned once per supplier article, then permanent.
-- ---------------------------------------------------------------
create table if not exists article_mappings (
  id               uuid primary key default gen_random_uuid(),
  supplier_id      uuid not null references suppliers(id),
  supplier_art_nr  text not null,
  -- der Stern's products.artikel_nr, from the OTHER project. A deleted article
  -- leaves a stale mapping here, which is harmless: the review screen simply
  -- shows it as unmapped again.
  article_id       text not null,
  -- how many of YOUR units one invoice unit contains.
  -- 1 for a straight match. 12 when the invoice bills a Karton
  -- and you stock the single Stueck.
  unit_factor      numeric(12,4) not null default 1,
  note             text,
  confirmed_at     timestamptz not null default now(),
  unique (supplier_id, supplier_art_nr)
);

-- ---------------------------------------------------------------
-- Approved prices.
--
-- This app never writes to der Stern, so this table is not a log of changes
-- made elsewhere — it IS the record. Approving a price here means "I have seen
-- this and accept it"; the newest row per article becomes the baseline the next
-- invoice is compared against, so an accepted price stops resurfacing.
--
-- new_price keeps four decimals. der Stern's own ek_price column holds two, so
-- transcribing a price across by hand will round it — that rounding happens
-- there, not here.
-- ---------------------------------------------------------------
create table if not exists price_change_log (
  id            uuid primary key default gen_random_uuid(),
  invoice_id    uuid not null references supplier_invoices(id),
  article_id    text not null,
  old_price     numeric(12,4),
  new_price     numeric(12,4) not null,
  applied_by    uuid,
  applied_at    timestamptz not null default now()
);

create index if not exists price_change_log_article_idx
  on price_change_log (article_id, applied_at desc);

-- ---------------------------------------------------------------
-- RLS. This project has exactly one user — you — so signed in means allowed.
-- ---------------------------------------------------------------
alter table suppliers          enable row level security;
alter table supplier_invoices  enable row level security;
alter table invoice_lines      enable row level security;
alter table article_mappings   enable row level security;
alter table price_change_log   enable row level security;

do $$
declare t text;
begin
  foreach t in array array[
    'suppliers','supplier_invoices','invoice_lines',
    'article_mappings','price_change_log'
  ] loop
    execute format(
      'create policy %I on %I
         for all to authenticated using (true) with check (true)',
      t || '_authenticated', t
    );
  end loop;
exception when duplicate_object then null;
end $$;

grant usage on schema public to authenticated;
grant all on all tables in schema public to authenticated;

-- ---------------------------------------------------------------
-- Seed the suppliers
-- ---------------------------------------------------------------
insert into suppliers (name, layout_key)
values ('Hamberger Großmarkt Berlin', 'hamberger'),
       ('Gemex Handels GmbH',         'gemex')
on conflict do nothing;
