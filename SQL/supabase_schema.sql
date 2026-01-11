-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- -----------------------------------------------------------------------------
-- 1. Categories Table
-- -----------------------------------------------------------------------------
create table if not exists categories (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  slug text not null unique,
  image_url text,
  description text,
  parent_id uuid references categories(id),
  display_order integer default 0,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS
alter table categories enable row level security;
drop policy if exists "Public categories are viewable by everyone." on categories;
create policy "Public categories are viewable by everyone." on categories for select using (true);

drop policy if exists "Admins can insert categories." on categories;
create policy "Admins can insert categories." on categories for insert with check (auth.role() = 'service_role');

drop policy if exists "Admins can update categories." on categories;
create policy "Admins can update categories." on categories for update using (auth.role() = 'service_role');

-- -----------------------------------------------------------------------------
-- 2. Products Table
-- -----------------------------------------------------------------------------
create table if not exists products (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  slug text not null unique,
  description text,
  short_description text,
  price numeric not null,
  original_price numeric,
  category_id uuid references categories(id),
  image_url text,
  images text[],
  sizes text[],
  colors text[],
  in_stock boolean default true,
  is_featured boolean default false,
  is_new boolean default false,
  is_sale boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS
alter table products enable row level security;
drop policy if exists "Public products are viewable by everyone." on products;
create policy "Public products are viewable by everyone." on products for select using (true);

drop policy if exists "Admins can insert products." on products;
create policy "Admins can insert products." on products for insert with check (auth.role() = 'service_role');

drop policy if exists "Admins can update products." on products;
create policy "Admins can update products." on products for update using (auth.role() = 'service_role');

drop policy if exists "Admins can delete products." on products;
create policy "Admins can delete products." on products for delete using (auth.role() = 'service_role');

-- -----------------------------------------------------------------------------
-- 3. Customers (Profiles) Table
-- Linked to auth.users
-- -----------------------------------------------------------------------------
create table if not exists customers (
  id uuid default uuid_generate_v4() primary key,
  auth_id uuid references auth.users(id) unique, -- Link to Supabase Auth
  email text,
  first_name text,
  last_name text,
  phone text,
  avatar_url text,
  role text default 'customer' check (role in ('customer', 'admin')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Ensure role column exists if table already existed without it
do $$
begin
  if not exists (select 1 from information_schema.columns where table_name = 'customers' and column_name = 'role') then
    alter table customers add column role text default 'customer' check (role in ('customer', 'admin'));
  end if;
end $$;

-- RLS
alter table customers enable row level security;
drop policy if exists "Users can view own profile." on customers;
create policy "Users can view own profile." on customers for select using (auth.uid() = auth_id);

drop policy if exists "Users can update own profile." on customers;
create policy "Users can update own profile." on customers for update using (auth.uid() = auth_id);

drop policy if exists "Admins can view all profiles." on customers;
create policy "Admins can view all profiles." on customers for select using (
  exists (select 1 from customers where auth_id = auth.uid() and role = 'admin')
  or auth.role() = 'service_role'
);

-- Trigger to create customer profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.customers (auth_id, email, first_name, last_name)
  values (new.id, new.email, new.raw_user_meta_data->>'first_name', new.raw_user_meta_data->>'last_name');
  return new;
end;
$$ language plpgsql security definer;

-- Drop trigger if exists to avoid error on replay
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- -----------------------------------------------------------------------------
-- 4. Banners Table
-- -----------------------------------------------------------------------------
create table if not exists banners (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  subtitle text,
  image_url text not null,
  link_url text,
  position text default 'home_hero',
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS
alter table banners enable row level security;
drop policy if exists "Public banners are viewable by everyone." on banners;
create policy "Public banners are viewable by everyone." on banners for select using (true);

-- -----------------------------------------------------------------------------
-- 5. Orders Table
-- -----------------------------------------------------------------------------
create table if not exists orders (
  id uuid default uuid_generate_v4() primary key,
  order_number text not null unique, -- e.g. ORD-1001
  customer_id uuid references customers(id), -- Nullable for guest checkout if needed
  status text default 'pending' check (status in ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
  subtotal numeric not null,
  discount numeric default 0,
  shipping_cost numeric default 0,
  total numeric not null,
  shipping_address jsonb, -- Store snapshot of address
  billing_address jsonb,
  payment_method text,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Ensure customer_id column exists if table already existed without it
do $$
begin
  if not exists (select 1 from information_schema.columns where table_name = 'orders' and column_name = 'customer_id') then
    alter table orders add column customer_id uuid references customers(id);
  end if;
end $$;

-- Check and ensure other potential missing generic columns in other tables
do $$
begin
  -- products reference to categories
  if not exists (select 1 from information_schema.columns where table_name = 'products' and column_name = 'category_id') then
    alter table products add column category_id uuid references categories(id);
  end if;

  -- Ensure slug exists
  if not exists (select 1 from information_schema.columns where table_name = 'products' and column_name = 'slug') then
    alter table products add column slug text unique;
  end if;

  -- Ensure other product fields exist
  if not exists (select 1 from information_schema.columns where table_name = 'products' and column_name = 'in_stock') then
    alter table products add column in_stock boolean default true;
  end if;

  if not exists (select 1 from information_schema.columns where table_name = 'products' and column_name = 'is_featured') then
    alter table products add column is_featured boolean default false;
  end if;

  if not exists (select 1 from information_schema.columns where table_name = 'products' and column_name = 'is_new') then
    alter table products add column is_new boolean default false;
  end if;

  if not exists (select 1 from information_schema.columns where table_name = 'products' and column_name = 'is_sale') then
    alter table products add column is_sale boolean default false;
  end if;

  -- Ensure remaining product fields exist (fixing image_url error and others)
  if not exists (select 1 from information_schema.columns where table_name = 'products' and column_name = 'image_url') then
    alter table products add column image_url text;
  end if;

  if not exists (select 1 from information_schema.columns where table_name = 'products' and column_name = 'images') then
    alter table products add column images text[];
  end if;

  if not exists (select 1 from information_schema.columns where table_name = 'products' and column_name = 'sizes') then
    alter table products add column sizes text[];
  end if;

  if not exists (select 1 from information_schema.columns where table_name = 'products' and column_name = 'colors') then
    alter table products add column colors text[];
  end if;

   if not exists (select 1 from information_schema.columns where table_name = 'products' and column_name = 'description') then
    alter table products add column description text;
  end if;

   if not exists (select 1 from information_schema.columns where table_name = 'products' and column_name = 'short_description') then
    alter table products add column short_description text;
  end if;
  
  if not exists (select 1 from information_schema.columns where table_name = 'products' and column_name = 'original_price') then
    alter table products add column original_price numeric;
  end if;

  -- Remove NOT NULL constraint from legacy 'category' column if it exists
  if exists (select 1 from information_schema.columns where table_name = 'products' and column_name = 'category') then
    alter table products alter column category drop not null;
  end if;
end $$;

-- RLS
alter table orders enable row level security;
drop policy if exists "Users can view own orders." on orders;
create policy "Users can view own orders." on orders for select using (
  auth.uid() in (select auth_id from customers where id = customer_id)
);

drop policy if exists "Admins can view all orders." on orders;
create policy "Admins can view all orders." on orders for select using (
  exists (select 1 from customers where auth_id = auth.uid() and role = 'admin')
  or auth.role() = 'service_role'
);

-- -----------------------------------------------------------------------------
-- 6. Order Items Table
-- -----------------------------------------------------------------------------
create table if not exists order_items (
  id uuid default uuid_generate_v4() primary key,
  order_id uuid references orders(id) on delete cascade not null,
  product_id uuid references products(id), -- Nullable if product deleted, keep record
  product_name text not null, -- Snapshot
  size text,
  color text,
  quantity integer not null default 1,
  unit_price numeric not null,
  total_price numeric not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS
alter table order_items enable row level security;
drop policy if exists "Users can view own order items." on order_items;
create policy "Users can view own order items." on order_items for select using (
  exists (select 1 from orders where orders.id = order_items.order_id and 
    auth.uid() in (select auth_id from customers where id = orders.customer_id))
);

-- -----------------------------------------------------------------------------
-- 7. Seed Data
-- -----------------------------------------------------------------------------

-- Insert Categories
insert into categories (name, slug, display_order) values
('Women', 'women', 1),
('Men', 'men', 2),
('Accessories', 'accessories', 3),
('Sale', 'sale', 4),
('New Arrivals', 'new-arrivals', 5)
on conflict (slug) do nothing;

-- Insert Sample Products (fetching category IDs first would be dynamic, here assuming UUIDs or manual entry usually, 
-- but for script stability we use subqueries)

-- Sample Woman Product
insert into products (name, slug, description, price, category_id, image_url, in_stock, is_featured, is_new)
select 'Signature Wool Blend Overcoat', 'signature-wool-blend-overcoat', 'A premium wool blend overcoat.', 12990, id, '/products/overcoat.png', true, true, true
from categories where slug = 'women'
on conflict (slug) do nothing;

-- Sample Man Product
insert into products (name, slug, description, price, category_id, image_url, in_stock, is_featured, is_new)
select 'Slim Fit Stretch Chinos', 'slim-fit-stretch-chinos', 'Comfortable stretch chinos.', 5990, id, '/products/denim-jeans.png', true, false, true
from categories where slug = 'men'
on conflict (slug) do nothing;

-- Sample Accessory
insert into products (name, slug, description, price, category_id, image_url, in_stock, is_featured, is_sale)
select 'Classic Leather Belt', 'classic-leather-belt', 'Genuine leather belt.', 2990, id, '/products/leather-bag.png', true, false, true
from categories where slug = 'accessories'
on conflict (slug) do nothing;

