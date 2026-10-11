-- Comprehensive Schema for Closet By Era
-- Includes: Auth, Products, Analytics, Reviews

-- 1. Enable UUID extension
create extension if not exists "uuid-ossp";

-- 2. Products & Categories (Existing Schema assumed, but ensuring indexes)
-- We do NOT drop products/categories as they contain core data
create index if not exists idx_products_slug on products(slug);
create index if not exists idx_products_category on products(category_id);
create index if not exists idx_products_is_new on products(is_new);
create index if not exists idx_products_is_sale on products(is_sale);

-- 3. Analytics (Phase 3)
-- Drop to ensure fresh schema if it exists in a bad state
drop table if exists analytics_events cascade;

create table analytics_events (
  id uuid default gen_random_uuid() primary key,
  event_type text not null, -- e.g., 'view_product', 'add_to_cart'
  page_path text,
  product_id text,
  user_id uuid references auth.users(id),
  meta jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index idx_analytics_event_type on analytics_events(event_type);
create index idx_analytics_product_id on analytics_events(product_id);
create index idx_analytics_created_at on analytics_events(created_at);

alter table analytics_events enable row level security;

create policy "Allow public insert to analytics" on analytics_events for insert with check (true);
create policy "Allow admin select analytics" on analytics_events for select using (auth.role() = 'service_role');


-- 4. User Reviews (Phase 4)
-- Drop to ensure fresh schema
drop table if exists reviews cascade;

create table reviews (
  id uuid default gen_random_uuid() primary key,
  product_id text not null,
  user_id uuid references auth.users(id) not null,
  rating integer not null check (rating >= 1 and rating <= 5),
  comment text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index idx_reviews_product_id on reviews(product_id);
create index idx_reviews_user_id on reviews(user_id);

alter table reviews enable row level security;

create policy "Reviews are viewable by everyone" on reviews for select using (true);
create policy "Users can insert their own reviews" on reviews for insert with check (auth.uid() = user_id);
