-- ============================================================
-- Outlet Authority — cached monthly DR scores
-- Apply in Supabase SQL editor (project uavbphkhomblzkjfuaot)
-- Safe / additive.
-- ============================================================

create table if not exists public.outlet_authority (
  id            bigserial primary key,
  domain        text unique,
  outlet_name   text,
  authority_score integer not null check (authority_score between 0 and 100),
  source        text not null default 'manual',  -- ahrefs | manual
  updated_at    timestamptz not null default now()
);

create index if not exists outlet_authority_name_idx
  on public.outlet_authority (lower(outlet_name));

alter table public.outlet_authority enable row level security;

drop policy if exists "outlet_authority readable by all" on public.outlet_authority;
create policy "outlet_authority readable by all"
  on public.outlet_authority for select
  using (true);

-- Optional seed (high-profile outlets, manual baseline).
insert into public.outlet_authority (domain, outlet_name, authority_score, source) values
  ('nytimes.com',       'The New York Times',  95, 'manual'),
  ('washingtonpost.com','The Washington Post', 94, 'manual'),
  ('wsj.com',           'The Wall Street Journal', 93, 'manual'),
  ('bbc.com',           'BBC',                 95, 'manual'),
  ('bbc.co.uk',         'BBC',                 94, 'manual'),
  ('cnn.com',           'CNN',                 94, 'manual'),
  ('reuters.com',       'Reuters',             93, 'manual'),
  ('bloomberg.com',     'Bloomberg',           93, 'manual'),
  ('ft.com',            'Financial Times',     92, 'manual'),
  ('economist.com',     'The Economist',       92, 'manual'),
  ('forbes.com',        'Forbes',              94, 'manual'),
  ('techcrunch.com',    'TechCrunch',          92, 'manual'),
  ('theverge.com',      'The Verge',           92, 'manual'),
  ('wired.com',         'Wired',               92, 'manual'),
  ('engadget.com',      'Engadget',            91, 'manual'),
  ('mashable.com',      'Mashable',            92, 'manual'),
  ('businessinsider.com','Business Insider',   92, 'manual'),
  ('cnbc.com',          'CNBC',                93, 'manual'),
  ('axios.com',         'Axios',               89, 'manual'),
  ('vox.com',           'Vox',                 91, 'manual'),
  ('theguardian.com',   'The Guardian',        94, 'manual'),
  ('telegraph.co.uk',   'The Telegraph',       91, 'manual'),
  ('thetimes.co.uk',    'The Times',           90, 'manual'),
  ('huffpost.com',      'HuffPost',            92, 'manual'),
  ('buzzfeed.com',      'BuzzFeed',            92, 'manual'),
  ('vice.com',          'Vice',                91, 'manual'),
  ('fastcompany.com',   'Fast Company',        90, 'manual'),
  ('inc.com',           'Inc.',                90, 'manual'),
  ('entrepreneur.com',  'Entrepreneur',        90, 'manual'),
  ('venturebeat.com',   'VentureBeat',         89, 'manual'),
  ('theinformation.com','The Information',     85, 'manual'),
  ('protocol.com',      'Protocol',            82, 'manual'),
  ('arstechnica.com',   'Ars Technica',        90, 'manual'),
  ('gizmodo.com',       'Gizmodo',             91, 'manual'),
  ('thenextweb.com',    'The Next Web',        89, 'manual'),
  ('digitaltrends.com', 'Digital Trends',      90, 'manual'),
  ('adweek.com',        'Adweek',              87, 'manual'),
  ('marketingweek.com', 'Marketing Week',      82, 'manual'),
  ('prweek.com',        'PRWeek',              80, 'manual'),
  ('campaignlive.co.uk','Campaign',            82, 'manual'),
  ('rollingstone.com',  'Rolling Stone',       91, 'manual'),
  ('variety.com',       'Variety',             90, 'manual'),
  ('hollywoodreporter.com','The Hollywood Reporter', 90, 'manual'),
  ('billboard.com',     'Billboard',           89, 'manual'),
  ('vogue.com',         'Vogue',               92, 'manual'),
  ('elle.com',          'Elle',                90, 'manual'),
  ('gq.com',            'GQ',                  90, 'manual'),
  ('esquire.com',       'Esquire',             89, 'manual')
on conflict (domain) do update
  set authority_score = excluded.authority_score,
      outlet_name     = excluded.outlet_name,
      source          = excluded.source,
      updated_at      = now();
