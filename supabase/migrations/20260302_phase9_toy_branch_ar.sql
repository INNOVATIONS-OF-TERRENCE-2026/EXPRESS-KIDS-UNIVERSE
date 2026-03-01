-- ############################################################################
-- Phase 9 Migration: Toy Products, Branch Decisions, AR Models
-- ############################################################################

-- ── Toy Products ────────────────────────────────────────────────────────────
create table if not exists public.toy_products (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  episode_id    text not null,
  character_id  text not null,
  product_type  text not null check (product_type in (
    'plush','action-figure','puzzle','coloring-book','sticker-pack',
    'poster','backpack-charm','lunchbox','t-shirt','board-game','playset','bedtime-lamp'
  )),
  toy_id        text not null,
  tagline       text,
  visual_prompt text,
  suggested_price_cents  integer not null default 0,
  production_complexity  integer not null default 1 check (production_complexity between 1 and 10),
  estimated_margin       numeric(4,2) not null default 0,
  lucy_approved          boolean not null default false,
  mockup_urls            jsonb default '[]'::jsonb,
  status                 text not null default 'draft' check (status in ('draft','approved','listed','removed')),
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

alter table public.toy_products enable row level security;

create policy "Users can view own toy products"
  on public.toy_products for select
  using (auth.uid() = user_id);

create policy "Users can insert own toy products"
  on public.toy_products for insert
  with check (auth.uid() = user_id);

create policy "Users can update own toy products"
  on public.toy_products for update
  using (auth.uid() = user_id);

create policy "Users can delete own toy products"
  on public.toy_products for delete
  using (auth.uid() = user_id);

create index if not exists idx_toy_products_user on public.toy_products(user_id);
create index if not exists idx_toy_products_episode on public.toy_products(episode_id);

-- ── Branch Decisions ────────────────────────────────────────────────────────
create table if not exists public.branch_decisions (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  episode_id          text not null,
  decision_id         text not null,
  scene_number        integer not null,
  placement           text not null check (placement in ('midpoint','climax','custom')),
  prompt_text         text not null,
  options             jsonb not null default '[]'::jsonb,
  selected_option_id  text,
  branch_content      jsonb,
  is_canon            boolean not null default false,
  total_duration_sec  numeric(8,2),
  created_at          timestamptz not null default now()
);

alter table public.branch_decisions enable row level security;

create policy "Users can view own branch decisions"
  on public.branch_decisions for select
  using (auth.uid() = user_id);

create policy "Users can insert own branch decisions"
  on public.branch_decisions for insert
  with check (auth.uid() = user_id);

create policy "Users can update own branch decisions"
  on public.branch_decisions for update
  using (auth.uid() = user_id);

create index if not exists idx_branch_decisions_user on public.branch_decisions(user_id);
create index if not exists idx_branch_decisions_episode on public.branch_decisions(episode_id);

-- ── AR Models ───────────────────────────────────────────────────────────────
create table if not exists public.ar_models (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  character_id    text not null,
  glb_url         text,
  usdz_url        text,
  texture_urls    jsonb default '[]'::jsonb,
  poly_count      integer not null default 0 check (poly_count <= 50000),
  animations      jsonb default '[]'::jsonb,
  dna_snapshot    jsonb,
  status          text not null default 'pending' check (status in ('pending','generating','ready','failed')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table public.ar_models enable row level security;

create policy "Users can view own AR models"
  on public.ar_models for select
  using (auth.uid() = user_id);

create policy "Users can insert own AR models"
  on public.ar_models for insert
  with check (auth.uid() = user_id);

create policy "Users can update own AR models"
  on public.ar_models for update
  using (auth.uid() = user_id);

create policy "Users can delete own AR models"
  on public.ar_models for delete
  using (auth.uid() = user_id);

create index if not exists idx_ar_models_user on public.ar_models(user_id);
create index if not exists idx_ar_models_character on public.ar_models(character_id);
