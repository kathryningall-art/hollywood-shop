-- Product proposal pipeline: Serper-fed candidate finder + Pinterest review queue.
--
-- Tables added:
--   product_proposals  pending tiles in the review grid (deleted on save)
--   product_sightings  slim cross-look history powering "seen before" badges
--   proposal_jobs      progress row for the background fetch (polled by the modal)
--   serper_cache       query-hash cache, 7-day TTL
-- Columns added:
--   products.slot_label  free-text slot the product belongs to ("Dress", "Shoes"…)

-- ─────────────────────────────────────────────
-- products.slot_label
-- ─────────────────────────────────────────────
alter table products
  add column slot_label text not null default '';

-- ─────────────────────────────────────────────
-- product_proposals
-- ─────────────────────────────────────────────
create type proposal_source as enum ('serper', 'extension', 'manual');
create type proposal_status as enum ('pending', 'shortlisted');

create table product_proposals (
  id              uuid primary key default gen_random_uuid(),
  look_id         uuid not null references looks(id) on delete cascade,
  slot_label      text not null,
  product_url     text not null,
  image_url       text not null,
  title           text not null default '',
  price           text not null default '',
  retailer        text not null default '',
  source_queries  text[] not null default '{}',
  source          proposal_source not null default 'serper',
  status          proposal_status not null default 'pending',
  raw_data        jsonb not null default '{}'::jsonb,
  created_at      timestamptz not null default now(),

  -- One proposal per (look, slot, url) — within-run dedupe sticks across re-runs too.
  unique (look_id, slot_label, product_url)
);

create index product_proposals_look_status_idx
  on product_proposals (look_id, status);

create index product_proposals_product_url_idx
  on product_proposals (product_url);

-- ─────────────────────────────────────────────
-- product_sightings — written when proposals are saved/deleted,
-- preserves cross-look history for "seen before" badges.
-- ─────────────────────────────────────────────
create table product_sightings (
  id              uuid primary key default gen_random_uuid(),
  product_url     text not null,
  look_id         uuid not null references looks(id) on delete cascade,
  surfaced_at     timestamptz not null default now(),
  was_shortlisted boolean not null default false
);

create index product_sightings_product_url_idx
  on product_sightings (product_url);

create index product_sightings_look_idx
  on product_sightings (look_id);

-- ─────────────────────────────────────────────
-- proposal_jobs — progress row for background fetch
-- ─────────────────────────────────────────────
create type proposal_job_status as enum ('queued', 'running', 'done', 'error');

create table proposal_jobs (
  id              uuid primary key default gen_random_uuid(),
  look_id         uuid not null references looks(id) on delete cascade,
  status          proposal_job_status not null default 'queued',
  -- plan: [{ slot_label, queries: [string] }]
  plan            jsonb not null default '[]'::jsonb,
  -- progress: { current_slot, current_query_index, total_queries, completed_queries, results_count, per_query: [{slot, query, status, count}] }
  progress        jsonb not null default '{}'::jsonb,
  error_message   text not null default '',
  created_at      timestamptz not null default now(),
  finished_at     timestamptz
);

create index proposal_jobs_look_idx
  on proposal_jobs (look_id, created_at desc);

-- ─────────────────────────────────────────────
-- serper_cache — 7-day TTL, keyed by sha256(query|num)
-- ─────────────────────────────────────────────
create table serper_cache (
  query_hash   text primary key,
  query        text not null,
  num_results  integer not null,
  response     jsonb not null,
  cached_at    timestamptz not null default now()
);

-- ─────────────────────────────────────────────
-- RLS — admin write, no public read needed for any of these
-- ─────────────────────────────────────────────
alter table product_proposals enable row level security;
alter table product_sightings enable row level security;
alter table proposal_jobs     enable row level security;
alter table serper_cache      enable row level security;

create policy "admin all product_proposals" on product_proposals
  for all using (auth.role() = 'authenticated');
create policy "admin all product_sightings" on product_sightings
  for all using (auth.role() = 'authenticated');
create policy "admin all proposal_jobs" on proposal_jobs
  for all using (auth.role() = 'authenticated');
create policy "admin all serper_cache" on serper_cache
  for all using (auth.role() = 'authenticated');
