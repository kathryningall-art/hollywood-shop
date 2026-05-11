-- Dressed in Silver — Supabase schema
-- Run this in: Supabase dashboard → SQL Editor → New query → Paste → Run

-- ─────────────────────────────────────────────
-- STARS
-- ─────────────────────────────────────────────
create type publicity_rights_risk as enum ('low', 'medium', 'high', 'blocked');

create table stars (
  id                     uuid primary key default gen_random_uuid(),
  name                   text not null,
  slug                   text not null unique,
  bio                    text not null default '',
  hero_image_url         text not null,
  hero_image_credit      text not null default '',
  death_year             integer,
  publicity_rights_risk  publicity_rights_risk not null default 'medium',
  publicity_rights_notes text not null default '',
  created_at             timestamptz not null default now()
);

-- ─────────────────────────────────────────────
-- LOOKS
-- ─────────────────────────────────────────────
create type affiliate_network as enum (
  'amazon', 'etsy', 'nordstrom', 'shareasale', 'impact', 'rakuten', 'direct'
);

create table looks (
  id                         uuid primary key default gen_random_uuid(),
  star_id                    uuid not null references stars(id) on delete cascade,
  slug                       text not null,
  title                      text not null,
  year                       integer not null,
  image_url                  text not null,
  image_credit               text not null default '',
  image_source_url           text not null,
  image_license              text not null,
  license_verified           boolean not null default false,
  license_verification_notes text not null default '',
  editorial_text             text not null default '',
  published                  boolean not null default false,
  created_at                 timestamptz not null default now(),

  unique(star_id, slug),

  -- License must be verified before publishing (single-table check, always valid)
  constraint published_requires_verified
    check (not published or license_verified = true)
);

-- Trigger to block publishing if the parent star is blocked
create or replace function check_look_publishable()
returns trigger as $$
begin
  if new.published = true then
    if (select publicity_rights_risk from stars where id = new.star_id) = 'blocked' then
      raise exception 'Cannot publish: star is blocked due to publicity rights concerns.';
    end if;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger enforce_look_publishable
  before insert or update on looks
  for each row execute function check_look_publishable();

-- ─────────────────────────────────────────────
-- PRODUCTS
-- ─────────────────────────────────────────────
create table products (
  id            uuid primary key default gen_random_uuid(),
  look_id       uuid not null references looks(id) on delete cascade,
  title         text not null,
  retailer      text not null,
  image_url     text not null default '',
  price_display text not null default '',
  affiliate_url text not null,
  network       affiliate_network not null,
  display_order integer not null default 0,
  created_at    timestamptz not null default now()
);

-- ─────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- (public read; write only via authenticated admin)
-- ─────────────────────────────────────────────
alter table stars    enable row level security;
alter table looks    enable row level security;
alter table products enable row level security;

-- Anyone can read published content
create policy "public read stars"    on stars    for select using (true);
create policy "public read looks"    on looks    for select using (published = true);
create policy "public read products" on products for select using (
  exists (select 1 from looks where looks.id = products.look_id and looks.published = true)
);

-- Only authenticated users (the admin) can write
create policy "admin write stars"    on stars    for all using (auth.role() = 'authenticated');
create policy "admin write looks"    on looks    for all using (auth.role() = 'authenticated');
create policy "admin write products" on products for all using (auth.role() = 'authenticated');

-- ─────────────────────────────────────────────
-- HELPFUL INDEXES
-- ─────────────────────────────────────────────
create index looks_star_id_idx      on looks(star_id);
create index products_look_id_idx   on products(look_id, display_order);
