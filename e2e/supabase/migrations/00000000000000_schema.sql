-- =============================================================================
-- Schema snapshot of the production database (generated 2026-10-11 from the
-- system catalogs; no data). Used ONLY by the local end-to-end test stack:
-- `supabase start --workdir e2e`. It is not part of supabase/migrations and
-- is never pushed to the hosted project.
--
-- Keep it in step with supabase/migrations (see "End-to-end tests" in README.md).
-- =============================================================================

set check_function_bodies = off;
set search_path = public, extensions;

create extension if not exists "uuid-ossp" with schema extensions;
create extension if not exists pgcrypto with schema extensions;
create extension if not exists pg_trgm with schema extensions;
-- Production has GraphQL turned off (supabase/migrations/20261014120000_advisor_fixes.sql).
drop extension if exists pg_graphql;

-- -----------------------------------------------------------------------------
-- Enums
-- -----------------------------------------------------------------------------

create type public.discount_type as enum ('percentage', 'fixed');

create type public.order_status as enum ('pending', 'packed', 'shipping', 'delivered', 'cancelled');

create type public.payment_method as enum ('cod', 'bank_transfer', 'card', 'jazzcash', 'easypaisa');

create type public.payment_status as enum ('pending', 'paid', 'failed', 'refunded');


-- -----------------------------------------------------------------------------
-- Tables
-- -----------------------------------------------------------------------------

create table public.addresses (
    id uuid default uuid_generate_v4() not null,
    customer_id uuid,
    type character varying(20) default 'shipping'::character varying,
    first_name character varying(100),
    last_name character varying(100),
    address_line1 character varying(255) not null,
    address_line2 character varying(255),
    city character varying(100) not null,
    state character varying(100),
    postal_code character varying(20),
    country character varying(100) default 'Pakistan'::character varying,
    phone character varying(20),
    is_default boolean default false,
    created_at timestamp with time zone default now()
);

create table public.admin_notifications (
    id uuid default gen_random_uuid() not null,
    type text not null,
    title text not null,
    message text not null,
    entity_id uuid,
    entity_type text,
    is_read boolean default false,
    created_at timestamp with time zone default now() not null
);

create table public.admin_saved_filters (
    id uuid default gen_random_uuid() not null,
    admin_id uuid not null,
    name text not null,
    page text not null,
    filters jsonb default '{}'::jsonb not null,
    created_at timestamp with time zone default now() not null,
    is_default boolean default false not null
);

create table public.analytics_events (
    id uuid default gen_random_uuid() not null,
    event_type text not null,
    page_path text,
    product_id text,
    user_id uuid,
    meta jsonb default '{}'::jsonb,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table public.audit_logs (
    id uuid default gen_random_uuid() not null,
    created_at timestamp with time zone default now() not null,
    admin_id uuid,
    action text not null,
    entity text not null,
    entity_id text,
    details jsonb,
    ip_address text
);

create table public.banners (
    id uuid default uuid_generate_v4() not null,
    title character varying(255) not null,
    subtitle text,
    image_url text,
    link_url text,
    "position" character varying(50) default 'hero'::character varying,
    display_order integer default 0,
    is_active boolean default true,
    starts_at timestamp with time zone,
    ends_at timestamp with time zone,
    created_at timestamp with time zone default now()
);

create table public.cart_items (
    id uuid default gen_random_uuid() not null,
    user_id uuid not null,
    product_id text not null,
    product_name text not null,
    product_price numeric(10,2) not null,
    product_image text,
    size text default ''::text not null,
    color text default ''::text not null,
    quantity integer default 1 not null,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

create table public.carts (
    id uuid default uuid_generate_v4() not null,
    customer_id uuid,
    session_id character varying(255),
    product_id uuid,
    quantity integer default 1 not null,
    size character varying(20),
    color character varying(50),
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

create table public.categories (
    id uuid default uuid_generate_v4() not null,
    name character varying(100) not null,
    slug character varying(100) not null,
    description text,
    image_url text,
    parent_id uuid,
    display_order integer default 0,
    is_active boolean default true,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

create table public.coupons (
    id uuid default uuid_generate_v4() not null,
    code character varying(50) not null,
    description text,
    discount_type character varying(20) not null,
    discount_value numeric(10,2) not null,
    min_order_amount numeric(10,2) default 0,
    max_uses integer,
    uses_count integer default 0,
    is_active boolean default true,
    starts_at timestamp with time zone,
    ends_at timestamp with time zone,
    created_at timestamp with time zone default now()
);

create table public.customers (
    id uuid default uuid_generate_v4() not null,
    auth_id uuid,
    email character varying(255) not null,
    first_name character varying(100),
    last_name character varying(100),
    phone character varying(20),
    avatar_url text,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now(),
    role text default 'customer'::text,
    loyalty_points integer default 0
);

create table public.faqs (
    id uuid default gen_random_uuid() not null,
    question text not null,
    answer text not null,
    category text default 'general'::text,
    display_order integer default 0,
    is_active boolean default true,
    created_at timestamp with time zone default now() not null
);

create table public.gift_card_usage (
    id uuid default gen_random_uuid() not null,
    gift_card_id uuid not null,
    order_id uuid not null,
    amount_used numeric not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table public.gift_cards (
    id uuid default gen_random_uuid() not null,
    code text not null,
    balance numeric default 0 not null,
    initial_value numeric not null,
    is_active boolean default true,
    expires_at timestamp with time zone,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table public.login_history (
    id uuid default gen_random_uuid() not null,
    user_id uuid,
    ip_address text,
    user_agent text,
    created_at timestamp with time zone default now() not null
);

create table public.loyalty_history (
    id uuid default gen_random_uuid() not null,
    user_id uuid,
    points integer not null,
    reason text,
    created_at timestamp with time zone default now()
);

create table public.order_items (
    id uuid default gen_random_uuid() not null,
    order_id uuid not null,
    product_id uuid not null,
    quantity integer not null,
    price_at_purchase numeric(10,2) not null,
    product_name text,
    product_image text,
    size text,
    color text
);

create table public.orders (
    id uuid default gen_random_uuid() not null,
    created_at timestamp with time zone default now() not null,
    customer_name text not null,
    customer_email text not null,
    shipping_address text not null,
    total_amount numeric(10,2) not null,
    status order_status default 'pending'::order_status not null,
    payment_status payment_status default 'pending'::payment_status not null,
    payment_method payment_method not null,
    customer_id uuid,
    order_number text,
    subtotal numeric default 0,
    shipping_cost numeric default 0,
    discount numeric default 0,
    total numeric generated always as (total_amount) stored,
    notes text,
    stock_reserved boolean
);

create table public.popups (
    id uuid default gen_random_uuid() not null,
    title text not null,
    content text not null,
    image_url text,
    trigger_type text default 'time'::text,
    trigger_value integer default 5,
    target_pages text[] default '{}'::text[],
    show_once boolean default true,
    is_active boolean default true,
    created_at timestamp with time zone default now() not null
);

create table public.product_images (
    id uuid default gen_random_uuid() not null,
    product_id uuid,
    image_url text not null,
    alt_text text,
    is_primary boolean default false,
    display_order integer default 0,
    created_at timestamp with time zone default now()
);

create table public.product_variants (
    id uuid default gen_random_uuid() not null,
    product_id uuid,
    size text not null,
    color text not null,
    stock_quantity integer default 0,
    created_at timestamp with time zone default now()
);

create table public.products (
    id uuid default gen_random_uuid() not null,
    created_at timestamp with time zone default now() not null,
    name text not null,
    description text,
    price numeric(10,2) not null,
    stock integer default 0 not null,
    category text,
    images text[] default '{}'::text[],
    is_active boolean default true not null,
    category_id uuid,
    slug text,
    in_stock boolean default true,
    is_featured boolean default false,
    is_new boolean default false,
    is_sale boolean default false,
    image_url text,
    sizes text[],
    colors text[],
    short_description text,
    original_price numeric
);

create table public.profiles (
    id uuid not null,
    role text default 'customer'::text,
    loyalty_points integer default 0,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

create table public.promotion_products (
    id uuid default gen_random_uuid() not null,
    promotion_id uuid not null,
    product_id uuid not null
);

create table public.promotions (
    id uuid default gen_random_uuid() not null,
    name text not null,
    type text not null,
    discount_value numeric(10,2) not null,
    start_date timestamp with time zone not null,
    end_date timestamp with time zone not null,
    is_active boolean default true,
    min_order_amount numeric(10,2) default 0,
    max_uses integer,
    current_uses integer default 0,
    created_at timestamp with time zone default now() not null,
    discount_type text default 'percentage'::text not null
);

create table public.returns (
    id uuid default gen_random_uuid() not null,
    order_id uuid not null,
    customer_id uuid not null,
    reason text not null,
    status text default 'pending'::text not null,
    refund_amount numeric(10,2) default 0,
    admin_notes text,
    created_at timestamp with time zone default now() not null,
    updated_at timestamp with time zone default now() not null
);

create table public.reviews (
    id uuid default gen_random_uuid() not null,
    product_id uuid not null,
    user_id uuid not null,
    rating integer not null,
    comment text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    images text[],
    is_approved boolean default false not null
);

create table public.shipping_rates (
    id uuid default gen_random_uuid() not null,
    zone_id uuid not null,
    name text not null,
    min_order_amount numeric(10,2) default 0,
    max_order_amount numeric(10,2),
    rate numeric(10,2) not null,
    estimated_days text,
    created_at timestamp with time zone default now() not null
);

create table public.shipping_zones (
    id uuid default gen_random_uuid() not null,
    name text not null,
    countries text[] default '{}'::text[],
    is_active boolean default true,
    created_at timestamp with time zone default now() not null
);

create table public.store_settings (
    id uuid default gen_random_uuid() not null,
    store_name text default 'Closet By Era'::text not null,
    support_email text default 'support@closetbyera.com'::text not null,
    support_phone text,
    currency text default 'PKR'::text not null,
    payment_methods jsonb default '{"cod": true, "stripe": true}'::jsonb,
    content jsonb default '{"hero_title": "New Collection", "hero_subtitle": "Discover the latest trends", "announcement_bar": "Free shipping on orders over PKR 5000"}'::jsonb,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table public.support_messages (
    id uuid default gen_random_uuid() not null,
    ticket_id uuid,
    sender_id uuid,
    message text not null,
    is_admin_reply boolean default false,
    created_at timestamp with time zone default now()
);

create table public.support_tickets (
    id uuid default gen_random_uuid() not null,
    user_id uuid,
    status text default 'open'::text,
    last_message text,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

create table public.tax_rules (
    id uuid default gen_random_uuid() not null,
    name text not null,
    region text,
    rate numeric(5,2) not null,
    applies_to text default 'all'::text,
    is_active boolean default true,
    created_at timestamp with time zone default now() not null
);

create table public.wishlist_items (
    id uuid default gen_random_uuid() not null,
    user_id uuid not null,
    product_id text not null,
    product_name text not null,
    product_price numeric(10,2) not null,
    product_image text,
    category text,
    created_at timestamp with time zone default now()
);

create table public.wishlists (
    id uuid default uuid_generate_v4() not null,
    customer_id uuid,
    product_id uuid,
    created_at timestamp with time zone default now()
);


-- -----------------------------------------------------------------------------
-- Primary keys, unique and check constraints
-- -----------------------------------------------------------------------------

alter table only public.addresses add constraint addresses_pkey PRIMARY KEY (id);

alter table only public.admin_notifications add constraint admin_notifications_pkey PRIMARY KEY (id);

alter table only public.admin_notifications add constraint admin_notifications_type_check CHECK ((type = ANY (ARRAY['order'::text, 'stock'::text, 'review'::text, 'return'::text, 'system'::text])));

alter table only public.admin_saved_filters add constraint admin_saved_filters_pkey PRIMARY KEY (id);

alter table only public.analytics_events add constraint analytics_events_pkey PRIMARY KEY (id);

alter table only public.audit_logs add constraint audit_logs_pkey PRIMARY KEY (id);

alter table only public.banners add constraint banners_pkey PRIMARY KEY (id);

alter table only public.cart_items add constraint cart_items_pkey PRIMARY KEY (id);

alter table only public.cart_items add constraint cart_items_user_product_variant_unique UNIQUE (user_id, product_id, size, color);

alter table only public.carts add constraint carts_pkey PRIMARY KEY (id);

alter table only public.categories add constraint categories_pkey PRIMARY KEY (id);

alter table only public.categories add constraint categories_slug_key UNIQUE (slug);

alter table only public.coupons add constraint coupons_code_key UNIQUE (code);

alter table only public.coupons add constraint coupons_pkey PRIMARY KEY (id);

alter table only public.customers add constraint customers_auth_id_key UNIQUE (auth_id);

alter table only public.customers add constraint customers_email_key UNIQUE (email);

alter table only public.customers add constraint customers_pkey PRIMARY KEY (id);

alter table only public.customers add constraint customers_role_check CHECK ((role = ANY (ARRAY['customer'::text, 'admin'::text, 'super_admin'::text])));

alter table only public.faqs add constraint faqs_pkey PRIMARY KEY (id);

alter table only public.gift_card_usage add constraint gift_card_usage_pkey PRIMARY KEY (id);

alter table only public.gift_cards add constraint gift_cards_code_key UNIQUE (code);

alter table only public.gift_cards add constraint gift_cards_pkey PRIMARY KEY (id);

alter table only public.login_history add constraint login_history_pkey PRIMARY KEY (id);

alter table only public.loyalty_history add constraint loyalty_history_pkey PRIMARY KEY (id);

alter table only public.order_items add constraint order_items_pkey PRIMARY KEY (id);

alter table only public.order_items add constraint order_items_price_at_purchase_check CHECK ((price_at_purchase >= (0)::numeric));

alter table only public.order_items add constraint order_items_quantity_check CHECK ((quantity > 0));

alter table only public.orders add constraint orders_pkey PRIMARY KEY (id);

alter table only public.orders add constraint orders_total_amount_check CHECK ((total_amount >= (0)::numeric));

alter table only public.popups add constraint popups_pkey PRIMARY KEY (id);

alter table only public.popups add constraint popups_trigger_type_check CHECK ((trigger_type = ANY (ARRAY['time'::text, 'scroll'::text, 'exit_intent'::text, 'page_load'::text])));

alter table only public.product_images add constraint product_images_pkey PRIMARY KEY (id);

alter table only public.product_variants add constraint product_variants_pkey PRIMARY KEY (id);

alter table only public.products add constraint products_pkey PRIMARY KEY (id);

alter table only public.products add constraint products_price_check CHECK ((price >= (0)::numeric));

alter table only public.products add constraint products_slug_key UNIQUE (slug);

alter table only public.products add constraint products_stock_check CHECK ((stock >= 0));

alter table only public.profiles add constraint profiles_pkey PRIMARY KEY (id);

alter table only public.promotion_products add constraint promotion_products_pkey PRIMARY KEY (id);

alter table only public.promotion_products add constraint promotion_products_promotion_id_product_id_key UNIQUE (promotion_id, product_id);

alter table only public.promotions add constraint promotions_discount_type_check CHECK ((discount_type = ANY (ARRAY['percentage'::text, 'fixed'::text])));

alter table only public.promotions add constraint promotions_pkey PRIMARY KEY (id);

alter table only public.promotions add constraint promotions_type_check CHECK ((type = ANY (ARRAY['flash_sale'::text, 'bundle'::text, 'bogo'::text, 'percentage'::text, 'fixed'::text])));

alter table only public.returns add constraint returns_pkey PRIMARY KEY (id);

alter table only public.returns add constraint returns_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text, 'refunded'::text])));

alter table only public.reviews add constraint reviews_pkey PRIMARY KEY (id);

alter table only public.reviews add constraint reviews_rating_check CHECK (((rating >= 1) AND (rating <= 5)));

alter table only public.shipping_rates add constraint shipping_rates_pkey PRIMARY KEY (id);

alter table only public.shipping_zones add constraint shipping_zones_name_key UNIQUE (name);

alter table only public.shipping_zones add constraint shipping_zones_pkey PRIMARY KEY (id);

alter table only public.store_settings add constraint store_settings_pkey PRIMARY KEY (id);

alter table only public.support_messages add constraint support_messages_pkey PRIMARY KEY (id);

alter table only public.support_tickets add constraint support_tickets_pkey PRIMARY KEY (id);

alter table only public.support_tickets add constraint support_tickets_status_check CHECK ((status = ANY (ARRAY['open'::text, 'closed'::text])));

alter table only public.tax_rules add constraint tax_rules_applies_to_check CHECK ((applies_to = ANY (ARRAY['all'::text, 'products'::text, 'shipping'::text])));

alter table only public.tax_rules add constraint tax_rules_pkey PRIMARY KEY (id);

alter table only public.wishlist_items add constraint wishlist_items_pkey PRIMARY KEY (id);

alter table only public.wishlists add constraint wishlists_customer_id_product_id_key UNIQUE (customer_id, product_id);

alter table only public.wishlists add constraint wishlists_pkey PRIMARY KEY (id);


-- -----------------------------------------------------------------------------
-- Foreign keys
-- -----------------------------------------------------------------------------

alter table only public.addresses add constraint addresses_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE;

alter table only public.admin_saved_filters add constraint admin_saved_filters_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES customers(id) ON DELETE CASCADE;

alter table only public.analytics_events add constraint analytics_events_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);

alter table only public.audit_logs add constraint audit_logs_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES auth.users(id);

alter table only public.cart_items add constraint cart_items_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

alter table only public.carts add constraint carts_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE;

alter table only public.categories add constraint categories_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES categories(id);

alter table only public.gift_card_usage add constraint gift_card_usage_gift_card_id_fkey FOREIGN KEY (gift_card_id) REFERENCES gift_cards(id);

alter table only public.gift_card_usage add constraint gift_card_usage_order_id_fkey FOREIGN KEY (order_id) REFERENCES orders(id);

alter table only public.login_history add constraint login_history_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

alter table only public.loyalty_history add constraint loyalty_history_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

alter table only public.order_items add constraint order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;

alter table only public.order_items add constraint order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT;

alter table only public.orders add constraint orders_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES customers(id);

alter table only public.product_images add constraint product_images_product_id_fkey FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;

alter table only public.products add constraint products_category_id_fkey FOREIGN KEY (category_id) REFERENCES categories(id);

alter table only public.profiles add constraint profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

alter table only public.promotion_products add constraint promotion_products_product_id_fkey FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;

alter table only public.promotion_products add constraint promotion_products_promotion_id_fkey FOREIGN KEY (promotion_id) REFERENCES promotions(id) ON DELETE CASCADE;

alter table only public.returns add constraint returns_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE;

alter table only public.returns add constraint returns_order_id_fkey FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;

alter table only public.reviews add constraint reviews_product_id_fkey FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;

alter table only public.reviews add constraint reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);

alter table only public.shipping_rates add constraint shipping_rates_zone_id_fkey FOREIGN KEY (zone_id) REFERENCES shipping_zones(id) ON DELETE CASCADE;

alter table only public.support_messages add constraint support_messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES auth.users(id) ON DELETE CASCADE;

alter table only public.support_messages add constraint support_messages_ticket_id_fkey FOREIGN KEY (ticket_id) REFERENCES support_tickets(id) ON DELETE CASCADE;

alter table only public.support_tickets add constraint support_tickets_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

alter table only public.wishlists add constraint wishlists_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE;


-- -----------------------------------------------------------------------------
-- Indexes
-- -----------------------------------------------------------------------------

CREATE UNIQUE INDEX admin_saved_filters_one_default ON public.admin_saved_filters USING btree (admin_id, page) WHERE is_default;

CREATE INDEX idx_addresses_customer_id ON public.addresses USING btree (customer_id);

CREATE INDEX idx_admin_notifications_created_at ON public.admin_notifications USING btree (created_at DESC);

CREATE INDEX idx_admin_notifications_is_read ON public.admin_notifications USING btree (is_read) WHERE (is_read = false);

CREATE INDEX idx_admin_notifications_type ON public.admin_notifications USING btree (type);

CREATE INDEX idx_admin_saved_filters_admin_id ON public.admin_saved_filters USING btree (admin_id);

CREATE INDEX idx_admin_saved_filters_admin_page ON public.admin_saved_filters USING btree (admin_id, page);

CREATE INDEX idx_analytics_created_at ON public.analytics_events USING btree (created_at);

CREATE INDEX idx_analytics_event_type ON public.analytics_events USING btree (event_type);

CREATE INDEX idx_analytics_event_type_time ON public.analytics_events USING btree (event_type, created_at DESC);

CREATE INDEX idx_analytics_events_user_id ON public.analytics_events USING btree (user_id);

CREATE INDEX idx_analytics_product_created ON public.analytics_events USING btree (product_id, created_at DESC) WHERE (product_id IS NOT NULL);

CREATE INDEX idx_analytics_product_id ON public.analytics_events USING btree (product_id);

CREATE INDEX idx_analytics_product_views ON public.analytics_events USING btree (product_id, created_at DESC) WHERE (event_type = 'view_product'::text);

CREATE INDEX idx_analytics_user_created ON public.analytics_events USING btree (user_id, created_at DESC) WHERE (user_id IS NOT NULL);

CREATE INDEX idx_audit_logs_admin_id ON public.audit_logs USING btree (admin_id);

CREATE INDEX idx_banners_active_dates ON public.banners USING btree (is_active, starts_at, ends_at) WHERE (is_active = true);

CREATE INDEX idx_banners_is_active ON public.banners USING btree (is_active) WHERE (is_active = true);

CREATE INDEX idx_banners_position ON public.banners USING btree ("position");

CREATE INDEX idx_cart_customer ON public.carts USING btree (customer_id);

CREATE INDEX idx_cart_items_product_id ON public.cart_items USING btree (product_id);

CREATE INDEX idx_cart_items_user_id ON public.cart_items USING btree (user_id);

CREATE INDEX idx_cart_session ON public.carts USING btree (session_id);

CREATE INDEX idx_categories_active_order ON public.categories USING btree (is_active, display_order) WHERE (is_active = true);

CREATE INDEX idx_categories_is_active ON public.categories USING btree (is_active);

CREATE INDEX idx_categories_parent_id ON public.categories USING btree (parent_id);

CREATE INDEX idx_categories_slug ON public.categories USING btree (slug);

CREATE INDEX idx_coupons_active_dates ON public.coupons USING btree (is_active, starts_at, ends_at) WHERE (is_active = true);

CREATE INDEX idx_coupons_code ON public.coupons USING btree (code);

CREATE INDEX idx_coupons_is_active ON public.coupons USING btree (is_active) WHERE (is_active = true);

CREATE INDEX idx_customers_auth_id ON public.customers USING btree (auth_id);

CREATE INDEX idx_customers_auth_id_role ON public.customers USING btree (auth_id, role);

CREATE INDEX idx_customers_email ON public.customers USING btree (email);

CREATE INDEX idx_customers_role ON public.customers USING btree (role);

CREATE INDEX idx_faqs_active ON public.faqs USING btree (is_active) WHERE (is_active = true);

CREATE INDEX idx_faqs_category ON public.faqs USING btree (category);

CREATE INDEX idx_gift_card_usage_gift_card_id ON public.gift_card_usage USING btree (gift_card_id);

CREATE INDEX idx_gift_card_usage_order_id ON public.gift_card_usage USING btree (order_id);

CREATE INDEX idx_login_history_created_at ON public.login_history USING btree (created_at);

CREATE INDEX idx_login_history_user_id ON public.login_history USING btree (user_id);

CREATE INDEX idx_loyalty_history_user_id ON public.loyalty_history USING btree (user_id);

CREATE INDEX idx_order_items_order_id ON public.order_items USING btree (order_id);

CREATE INDEX idx_order_items_product_id ON public.order_items USING btree (product_id);

CREATE INDEX idx_orders_created_at ON public.orders USING btree (created_at DESC);

CREATE INDEX idx_orders_customer_created ON public.orders USING btree (customer_id, created_at DESC) WHERE (customer_id IS NOT NULL);

CREATE INDEX idx_orders_customer_id ON public.orders USING btree (customer_id);

CREATE INDEX idx_orders_customer_id_created ON public.orders USING btree (customer_id, created_at DESC);

CREATE INDEX idx_orders_customer_status ON public.orders USING btree (customer_id, status, created_at DESC);

CREATE INDEX idx_orders_order_number ON public.orders USING btree (order_number);

CREATE INDEX idx_orders_payment_status ON public.orders USING btree (payment_status);

CREATE INDEX idx_orders_status ON public.orders USING btree (status);

CREATE INDEX idx_orders_status_created ON public.orders USING btree (status, created_at DESC);

CREATE INDEX idx_popups_active ON public.popups USING btree (is_active) WHERE (is_active = true);

CREATE INDEX idx_product_images_product_id ON public.product_images USING btree (product_id);

CREATE INDEX idx_products_active_category ON public.products USING btree (is_active, category_id) WHERE (is_active = true);

CREATE INDEX idx_products_active_featured ON public.products USING btree (is_featured, in_stock, is_active, created_at DESC) WHERE ((is_featured = true) AND (in_stock = true) AND (is_active = true));

CREATE INDEX idx_products_active_new ON public.products USING btree (is_new, in_stock, is_active, created_at DESC) WHERE ((is_new = true) AND (in_stock = true) AND (is_active = true));

CREATE INDEX idx_products_category ON public.products USING btree (category);

CREATE INDEX idx_products_category_id ON public.products USING btree (category_id);

CREATE INDEX idx_products_category_instock ON public.products USING btree (category_id, in_stock) WHERE (in_stock = true);

CREATE INDEX idx_products_created_at ON public.products USING btree (created_at DESC);

CREATE INDEX idx_products_featured_in_stock ON public.products USING btree (is_featured, in_stock) WHERE ((is_featured = true) AND (in_stock = true));

CREATE INDEX idx_products_in_stock ON public.products USING btree (in_stock) WHERE (in_stock = true);

CREATE INDEX idx_products_in_stock_created_at ON public.products USING btree (in_stock, created_at DESC) WHERE (in_stock = true);

CREATE INDEX idx_products_is_active ON public.products USING btree (is_active);

CREATE INDEX idx_products_is_featured ON public.products USING btree (is_featured) WHERE (is_featured = true);

CREATE INDEX idx_products_is_new ON public.products USING btree (is_new);

CREATE INDEX idx_products_is_sale ON public.products USING btree (is_sale);

CREATE INDEX idx_products_new_arrivals ON public.products USING btree (is_new, in_stock, created_at DESC) WHERE ((is_new = true) AND (in_stock = true));

CREATE INDEX idx_products_price ON public.products USING btree (price);

CREATE INDEX idx_products_sale_in_stock ON public.products USING btree (is_sale, in_stock) WHERE ((is_sale = true) AND (in_stock = true));

CREATE INDEX idx_products_slug ON public.products USING btree (slug);

CREATE INDEX idx_profiles_role ON public.profiles USING btree (role);

CREATE INDEX idx_promotion_products_product_id ON public.promotion_products USING btree (product_id);

CREATE INDEX idx_promotions_active ON public.promotions USING btree (is_active) WHERE (is_active = true);

CREATE INDEX idx_promotions_active_dates ON public.promotions USING btree (is_active, start_date, end_date) WHERE (is_active = true);

CREATE INDEX idx_promotions_dates ON public.promotions USING btree (start_date, end_date);

CREATE INDEX idx_returns_created_at ON public.returns USING btree (created_at DESC);

CREATE INDEX idx_returns_customer_id ON public.returns USING btree (customer_id);

CREATE INDEX idx_returns_order_id ON public.returns USING btree (order_id);

CREATE INDEX idx_returns_status ON public.returns USING btree (status);

CREATE INDEX idx_reviews_pending ON public.reviews USING btree (created_at DESC) WHERE (NOT is_approved);

CREATE INDEX idx_reviews_product_approved ON public.reviews USING btree (product_id, created_at DESC) WHERE is_approved;

CREATE INDEX idx_reviews_product_id ON public.reviews USING btree (product_id);

CREATE INDEX idx_reviews_rating ON public.reviews USING btree (rating);

CREATE INDEX idx_reviews_user_id ON public.reviews USING btree (user_id);

CREATE INDEX idx_shipping_rates_zone_id ON public.shipping_rates USING btree (zone_id);

CREATE INDEX idx_support_messages_sender_id ON public.support_messages USING btree (sender_id);

CREATE INDEX idx_support_messages_ticket_id ON public.support_messages USING btree (ticket_id);

CREATE INDEX idx_support_tickets_status ON public.support_tickets USING btree (status);

CREATE INDEX idx_support_tickets_user_id ON public.support_tickets USING btree (user_id);

CREATE INDEX idx_wishlist_items_user_id ON public.wishlist_items USING btree (user_id);

CREATE INDEX idx_wishlist_items_user_product ON public.wishlist_items USING btree (user_id, product_id);

CREATE UNIQUE INDEX only_one_row ON public.store_settings USING btree ((true));

CREATE UNIQUE INDEX orders_order_number_key ON public.orders USING btree (order_number) WHERE (order_number IS NOT NULL);

CREATE INDEX products_name_trgm_idx ON public.products USING gin (name gin_trgm_ops);


-- -----------------------------------------------------------------------------
-- Materialized views
-- -----------------------------------------------------------------------------

create materialized view public.mv_product_stats as
 SELECT count(*) AS total_products,
    count(*) FILTER (WHERE (in_stock = true)) AS in_stock_count,
    count(*) FILTER (WHERE (is_featured = true)) AS featured_count,
    count(*) FILTER (WHERE (is_new = true)) AS new_count,
    count(*) FILTER (WHERE (is_sale = true)) AS sale_count,
    avg(price) AS avg_price,
    min(price) AS min_price,
    max(price) AS max_price
   FROM products
  WHERE (is_active = true)
with data;


-- -----------------------------------------------------------------------------
-- Materialized view indexes
-- -----------------------------------------------------------------------------

CREATE UNIQUE INDEX mv_product_stats_unique ON public.mv_product_stats USING btree (total_products);


-- -----------------------------------------------------------------------------
-- Functions
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.apply_order_stock(p_order_id uuid, p_direction integer)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
    r record;
begin
    -- Sorted by product id so concurrent orders lock product rows in the same order.
    for r in
        select oi.product_id, sum(oi.quantity)::integer as qty, min(oi.product_name) as product_name
        from order_items oi
        where oi.order_id = p_order_id
        group by oi.product_id
        order by oi.product_id
    loop
        if p_direction < 0 then
            update products
            set stock = stock - r.qty,
                in_stock = case when stock - r.qty <= 0 then false else in_stock end
            where id = r.product_id and stock >= r.qty;

            if not found then
                raise exception 'Insufficient stock for %', coalesce(r.product_name, r.product_id::text)
                    using errcode = 'P0001', hint = 'insufficient_stock';
            end if;
        else
            update products
            set stock = stock + r.qty,
                -- Re-list products that had sold out; leave manual hides alone.
                in_stock = case when stock <= 0 then true else in_stock end
            where id = r.product_id;
        end if;
    end loop;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.cancel_order(p_order_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_current_status TEXT;
BEGIN
    SELECT status::text INTO v_current_status 
    FROM orders 
    WHERE id = p_order_id;
    
    IF v_current_status IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Order not found');
    END IF;
    
    IF v_current_status NOT IN ('pending', 'packed') THEN
        RETURN jsonb_build_object(
            'success', false, 
            'error', 'Cannot cancel order with status: ' || v_current_status
        );
    END IF;
    
    UPDATE orders 
    SET status = 'cancelled'
    WHERE id = p_order_id;
    
    RETURN jsonb_build_object('success', true, 'cancelled_order_id', p_order_id);
    
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'error', SQLERRM
    );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.create_order_with_items(p_customer_name text, p_customer_email text, p_shipping_address text, p_total_amount numeric, p_payment_method text, p_items jsonb, p_customer_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_order_id UUID;
    v_item JSONB;
    v_result JSONB;
BEGIN
    -- Insert order
    INSERT INTO orders (
        customer_name,
        customer_email,
        shipping_address,
        total_amount,
        status,
        payment_status,
        payment_method,
        customer_id
    ) VALUES (
        p_customer_name,
        p_customer_email,
        p_shipping_address,
        p_total_amount,
        'pending',
        'pending',
        p_payment_method::payment_method,
        p_customer_id
    )
    RETURNING id INTO v_order_id;
    
    -- Insert all order items
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        INSERT INTO order_items (
            order_id,
            product_id,
            quantity,
            price_at_purchase
        ) VALUES (
            v_order_id,
            (v_item->>'product_id')::UUID,
            (v_item->>'quantity')::INTEGER,
            (v_item->>'price_at_purchase')::NUMERIC
        );
    END LOOP;
    
    -- Return success with order ID
    v_result := jsonb_build_object(
        'success', true,
        'order_id', v_order_id
    );
    
    RETURN v_result;
    
EXCEPTION WHEN OTHERS THEN
    -- Rollback is automatic, return error
    RETURN jsonb_build_object(
        'success', false,
        'error', SQLERRM,
        'error_code', SQLSTATE
    );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.current_customer_id()
 RETURNS uuid
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN (SELECT id FROM customers WHERE auth_id = auth.uid() LIMIT 1);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.debug_storage_upload()
 RETURNS TABLE(current_auth_uid uuid, has_customer boolean, customer_role text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        auth.uid() as current_auth_uid,
        EXISTS(SELECT 1 FROM customers WHERE auth_id = auth.uid()) as has_customer,
        (SELECT role FROM customers WHERE auth_id = auth.uid()) as customer_role;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_admin_stats()
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
declare
    total_revenue numeric;
    active_orders_count integer;
    products_count integer;
    customers_count integer;
begin
    select coalesce(sum(total), 0) into total_revenue
    from orders
    where status in ('packed', 'shipping', 'delivered');

    select count(*) into active_orders_count
    from orders
    where status in ('pending', 'packed', 'shipping');

    select count(*) into products_count from products;
    select count(*) into customers_count from customers;

    return json_build_object(
        'totalRevenue', total_revenue,
        'activeOrders', active_orders_count,
        'totalProducts', products_count,
        'totalCustomers', customers_count
    );
end;
$function$
;

CREATE OR REPLACE FUNCTION public.get_analytics_summary(days_back integer DEFAULT 7)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'timeline', (
            SELECT COALESCE(json_agg(day_stats), '[]'::json)
            FROM (
                SELECT 
                    to_char(date_trunc('day', created_at), 'Dy') as name,
                    COUNT(*) as views
                FROM analytics_events 
                WHERE event_type = 'view_product' 
                    AND created_at >= NOW() - (days_back || ' days')::INTERVAL
                GROUP BY date_trunc('day', created_at)
                ORDER BY date_trunc('day', created_at)
            ) day_stats
        ),
        'topProducts', (
            SELECT COALESCE(json_agg(top_prods), '[]'::json)
            FROM (
                SELECT 
                    p.name,
                    COUNT(ae.id) as views
                FROM analytics_events ae
                JOIN products p ON ae.product_id::uuid = p.id
                WHERE ae.event_type = 'view_product'
                    AND ae.created_at >= NOW() - (days_back || ' days')::INTERVAL
                GROUP BY p.id, p.name
                ORDER BY COUNT(ae.id) DESC
                LIMIT 5
            ) top_prods
        ),
        'totalViews', (
            SELECT COUNT(*)
            FROM analytics_events
            WHERE event_type = 'view_product'
                AND created_at >= NOW() - (days_back || ' days')::INTERVAL
        )
    ) INTO result;
    
    RETURN result;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_featured_products_fast(p_limit integer DEFAULT 8)
 RETURNS json
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
    SELECT COALESCE(json_agg(row_to_json(p)), '[]'::json)
    FROM (
        SELECT 
            id,
            name,
            slug,
            price,
            original_price,
            COALESCE(image_url, images[1]) as image,
            is_new,
            is_sale
        FROM products
        WHERE is_featured = true 
          AND in_stock = true 
          AND is_active = true
        ORDER BY created_at DESC
        LIMIT p_limit
    ) p;
$function$
;

CREATE OR REPLACE FUNCTION public.get_is_admin()
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM customers
    WHERE auth_id = auth.uid()
    AND role = 'admin'
    LIMIT 1
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_my_customer_id()
 RETURNS uuid
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN (SELECT id FROM customers WHERE auth_id = (select auth.uid()) LIMIT 1);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_new_arrivals_fast(p_limit integer DEFAULT 8)
 RETURNS json
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
    SELECT COALESCE(json_agg(row_to_json(p)), '[]'::json)
    FROM (
        SELECT 
            id,
            name,
            slug,
            price,
            original_price,
            COALESCE(image_url, images[1]) as image,
            is_new,
            is_sale
        FROM products
        WHERE is_new = true 
          AND in_stock = true 
          AND is_active = true
        ORDER BY created_at DESC
        LIMIT p_limit
    ) p;
$function$
;

CREATE OR REPLACE FUNCTION public.get_orders_paginated(p_page integer DEFAULT 1, p_page_size integer DEFAULT 10, p_status text DEFAULT NULL::text)
 RETURNS json
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_offset integer;
    v_result json;
BEGIN
    v_offset := (p_page - 1) * p_page_size;
    
    WITH filtered_orders AS (
        SELECT 
            o.*,
            (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id) as items_count
        FROM orders o
        WHERE p_status IS NULL OR p_status = 'All' OR o.status::text = lower(p_status)
    )
    SELECT json_build_object(
        'data', COALESCE((
            SELECT json_agg(row_to_json(fo))
            FROM (
                SELECT * FROM filtered_orders
                ORDER BY created_at DESC
                LIMIT p_page_size OFFSET v_offset
            ) fo
        ), '[]'::json),
        'count', (SELECT COUNT(*) FROM filtered_orders)
    ) INTO v_result;
    
    RETURN v_result;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_products_optimized(p_page integer DEFAULT 1, p_page_size integer DEFAULT 10, p_search text DEFAULT NULL::text, p_category_ids uuid[] DEFAULT NULL::uuid[], p_min_price numeric DEFAULT NULL::numeric, p_max_price numeric DEFAULT NULL::numeric, p_sort text DEFAULT 'newest'::text)
 RETURNS json
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_offset integer;
    v_result json;
BEGIN
    v_offset := (p_page - 1) * p_page_size;
    
    WITH filtered_products AS (
        SELECT 
            p.id,
            p.name,
            p.slug,
            p.price,
            p.stock,
            p.images,
            p.is_active,
            p.in_stock,
            p.created_at,
            c.name as category_name
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE 
            (p_search IS NULL OR p.name ILIKE '%' || p_search || '%')
            AND (p_category_ids IS NULL OR p.category_id = ANY(p_category_ids))
            AND (p_min_price IS NULL OR p.price >= p_min_price)
            AND (p_max_price IS NULL OR p.price <= p_max_price)
    ),
    sorted_products AS (
        SELECT *
        FROM filtered_products
        ORDER BY
            CASE WHEN p_sort = 'price_asc' THEN price END ASC,
            CASE WHEN p_sort = 'price_desc' THEN price END DESC,
            CASE WHEN p_sort = 'newest' OR p_sort IS NULL THEN created_at END DESC
        LIMIT p_page_size
        OFFSET v_offset
    ),
    total_count AS (
        SELECT COUNT(*) as cnt FROM filtered_products
    )
    SELECT json_build_object(
        'data', COALESCE((SELECT json_agg(row_to_json(sp)) FROM sorted_products sp), '[]'::json),
        'count', (SELECT cnt FROM total_count)
    ) INTO v_result;
    
    RETURN v_result;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_system_stats_optimized()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_total_users INTEGER;
    v_total_admins INTEGER;
    v_total_super_admins INTEGER;
    v_total_orders INTEGER;
    v_total_revenue NUMERIC;
    v_total_products INTEGER;
BEGIN
    -- Count users by role in a single query
    SELECT 
        COUNT(*),
        COUNT(*) FILTER (WHERE role = 'admin'),
        COUNT(*) FILTER (WHERE role = 'super_admin')
    INTO v_total_users, v_total_admins, v_total_super_admins
    FROM public.customers;

    -- Get order stats with aggregation
    SELECT 
        COUNT(*),
        COALESCE(SUM(total_amount), 0)
    INTO v_total_orders, v_total_revenue
    FROM public.orders;

    -- Count products
    SELECT COUNT(*) INTO v_total_products FROM public.products;

    RETURN jsonb_build_object(
        'totalUsers', v_total_users,
        'totalAdmins', v_total_admins,
        'totalSuperAdmins', v_total_super_admins,
        'totalOrders', v_total_orders,
        'totalRevenue', v_total_revenue,
        'totalProducts', v_total_products
    );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  insert into public.customers (auth_id, email, first_name, last_name)
  values (new.id, new.email, new.raw_user_meta_data->>'first_name', new.raw_user_meta_data->>'last_name');
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.is_admin()
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM customers 
    WHERE auth_id = auth.uid() 
    AND role = 'admin'
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.is_admin_or_super()
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM customers 
    WHERE auth_id = (select auth.uid()) 
    AND role IN ('admin', 'super_admin')
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.is_admin_via_jwt()
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
    -- First check JWT claims (zero latency)
    IF (auth.jwt() ->> 'role')::text = 'admin' THEN
        RETURN TRUE;
    END IF;
    
    -- Fallback to checking app_metadata
    IF (auth.jwt() -> 'app_metadata' ->> 'role')::text = 'admin' THEN
        RETURN TRUE;
    END IF;
    
    -- Service role always passes
    IF auth.role() = 'service_role' THEN
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.is_super_admin()
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM customers 
    WHERE auth_id = auth.uid() 
    AND role = 'super_admin'
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.log_product_changes()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  action_type TEXT;
  details_json JSONB;
BEGIN
  IF TG_OP = 'INSERT' THEN
    action_type := 'CREATE_PRODUCT';
    details_json := jsonb_build_object('name', NEW.name, 'price', NEW.price);
    INSERT INTO audit_logs (admin_id, action, entity, entity_id, details)
    VALUES (auth.uid(), action_type, 'products', NEW.id::text, details_json);
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    action_type := 'UPDATE_PRODUCT';
    details_json := jsonb_build_object('name', NEW.name, 'old_name', OLD.name, 'price', NEW.price, 'old_price', OLD.price);
    INSERT INTO audit_logs (admin_id, action, entity, entity_id, details)
    VALUES (auth.uid(), action_type, 'products', NEW.id::text, details_json);
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    action_type := 'DELETE_PRODUCT';
    details_json := jsonb_build_object('name', OLD.name, 'price', OLD.price);
    INSERT INTO audit_logs (admin_id, action, entity, entity_id, details)
    VALUES (auth.uid(), action_type, 'products', OLD.id::text, details_json);
    RETURN OLD;
  END IF;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.promote_user_to_admin(user_email text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  target_user_id uuid;
BEGIN
  -- Find user in auth.users
  SELECT id INTO target_user_id FROM auth.users WHERE email = user_email;
  
  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Update customers table
  UPDATE public.customers 
  SET role = 'admin' 
  WHERE auth_id = target_user_id;
  
  -- If no customer record exists, create one (safety net)
  IF NOT FOUND THEN
    INSERT INTO public.customers (auth_id, email, first_name, last_name, role)
    VALUES (target_user_id, user_email, 'Admin', 'User', 'admin');
  END IF;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.protect_customer_privileged_columns()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
begin
    if current_user not in ('anon', 'authenticated') then
        return new;
    end if;

    if tg_op = 'INSERT' then
        if not public.is_super_admin() then
            new.role := 'customer';
        end if;
        if not public.is_admin_or_super() then
            new.loyalty_points := 0;
        end if;
        return new;
    end if;

    if new.role is distinct from old.role and not public.is_super_admin() then
        raise exception 'Only super admins can change roles' using errcode = '42501';
    end if;
    if new.loyalty_points is distinct from old.loyalty_points and not public.is_admin_or_super() then
        raise exception 'Loyalty points can only be changed by staff' using errcode = '42501';
    end if;
    if new.auth_id is distinct from old.auth_id and not public.is_admin_or_super() then
        raise exception 'auth_id cannot be changed' using errcode = '42501';
    end if;

    return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.protect_review_moderation()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
begin
    if current_user not in ('anon', 'authenticated') or public.is_admin_or_super() then
        return new;
    end if;
    new.is_approved := false;
    return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.redeem_gift_card_atomic(p_code text, p_amount numeric, p_order_id uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_gift_card RECORD;
    v_new_balance NUMERIC;
    v_amount_to_redeem NUMERIC;
BEGIN
    -- Lock the gift card row to prevent concurrent modifications
    SELECT id, balance, is_active, expires_at
    INTO v_gift_card
    FROM gift_cards
    WHERE code = p_code
    FOR UPDATE;

    -- Validate gift card exists
    IF v_gift_card IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Gift card not found'
        );
    END IF;

    -- Validate gift card is active
    IF v_gift_card.is_active IS NOT TRUE THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Gift card is not active'
        );
    END IF;

    -- Validate gift card is not expired
    IF v_gift_card.expires_at IS NOT NULL AND v_gift_card.expires_at < NOW() THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Gift card has expired'
        );
    END IF;

    -- Validate sufficient balance
    IF v_gift_card.balance < p_amount THEN
        v_amount_to_redeem := v_gift_card.balance;
    ELSE
        v_amount_to_redeem := p_amount;
    END IF;

    -- Calculate new balance
    v_new_balance := v_gift_card.balance - v_amount_to_redeem;

    -- Update gift card balance
    UPDATE gift_cards
    SET balance = v_new_balance
    WHERE id = v_gift_card.id;

    -- Record usage
    INSERT INTO gift_card_usage (gift_card_id, order_id, amount_used)
    VALUES (v_gift_card.id, p_order_id, v_amount_to_redeem);

    RETURN json_build_object(
        'success', true,
        'message', 'Gift card redeemed successfully',
        'new_balance', v_new_balance,
        'amount_redeemed', v_amount_to_redeem
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'message', 'An error occurred: ' || SQLERRM
        );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.refresh_product_stats()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_product_stats;
EXCEPTION WHEN OTHERS THEN
    -- If concurrent refresh fails (first run), do regular refresh
    REFRESH MATERIALIZED VIEW mv_product_stats;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.reserve_order_stock(p_order_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
    -- Row lock: a second concurrent call waits, then sees stock_reserved = true.
    perform 1 from orders where id = p_order_id and stock_reserved is not true for update;
    if not found then
        return;
    end if;

    perform public.apply_order_stock(p_order_id, -1);
    update orders set stock_reserved = true where id = p_order_id;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.search_products(search_query text DEFAULT NULL::text, category_ids uuid[] DEFAULT NULL::uuid[], min_price numeric DEFAULT NULL::numeric, max_price numeric DEFAULT NULL::numeric, sizes_filter text[] DEFAULT NULL::text[], colors_filter text[] DEFAULT NULL::text[], in_stock_only boolean DEFAULT false, sort_by text DEFAULT 'created_at'::text, sort_order text DEFAULT 'desc'::text, page_limit integer DEFAULT 20, page_offset integer DEFAULT 0)
 RETURNS TABLE(id uuid, name text, slug text, description text, price numeric, original_price numeric, category_id uuid, image_url text, images text[], sizes text[], colors text[], in_stock boolean, is_featured boolean, is_new boolean, is_sale boolean, created_at timestamp with time zone, category_name text, total_count bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.name,
        p.slug,
        p.description,
        p.price,
        p.original_price,
        p.category_id,
        p.image_url,
        p.images,
        p.sizes,
        p.colors,
        p.in_stock,
        p.is_featured,
        p.is_new,
        p.is_sale,
        p.created_at,
        c.name::text as category_name,
        COUNT(*) OVER() as total_count
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE
        p.is_active = true
        AND (search_query IS NULL OR
         p.name ILIKE '%' || search_query || '%' OR
         p.description ILIKE '%' || search_query || '%')
        AND (category_ids IS NULL OR p.category_id = ANY(category_ids))
        AND (min_price IS NULL OR p.price >= min_price)
        AND (max_price IS NULL OR p.price <= max_price)
        AND (sizes_filter IS NULL OR p.sizes && sizes_filter)
        AND (colors_filter IS NULL OR p.colors && colors_filter)
        AND (in_stock_only = FALSE OR p.in_stock = TRUE)
    ORDER BY 
        CASE WHEN sort_by = 'price' AND sort_order = 'asc' THEN p.price END ASC,
        CASE WHEN sort_by = 'price' AND sort_order = 'desc' THEN p.price END DESC,
        CASE WHEN sort_by = 'name' AND sort_order = 'asc' THEN p.name END ASC,
        CASE WHEN sort_by = 'name' AND sort_order = 'desc' THEN p.name END DESC,
        CASE WHEN sort_by = 'created_at' AND sort_order = 'asc' THEN p.created_at END ASC,
        CASE WHEN sort_by = 'created_at' AND sort_order = 'desc' THEN p.created_at END DESC
    LIMIT page_limit
    OFFSET page_offset;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.sync_customer_role()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  -- Update the auth.users metadata with the new role
  update auth.users
  set raw_app_meta_data = 
    jsonb_set(
      coalesce(raw_app_meta_data, '{}'::jsonb),
      '{role}',
      to_jsonb(new.role)
    )
  where id = new.auth_id;
  
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.sync_order_stock()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
    if tg_op = 'DELETE' then
        -- Goods that never left the warehouse go back on the shelf.
        if old.stock_reserved is true and old.status in ('pending', 'packed') then
            perform public.apply_order_stock(old.id, 1);
        end if;
        return old;
    end if;

    if new.status is not distinct from old.status then
        return new;
    end if;

    if new.status = 'cancelled' and old.stock_reserved is true then
        perform public.apply_order_stock(new.id, 1);
        new.stock_reserved := false;
    elsif old.status = 'cancelled' and old.stock_reserved is false then
        -- Reinstating a cancelled order takes the stock again (or fails).
        perform public.apply_order_stock(new.id, -1);
        new.stock_reserved := true;
    end if;

    return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.sync_user_role()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  UPDATE auth.users
  SET raw_app_meta_data = 
    COALESCE(raw_app_meta_data, '{}'::jsonb) || 
    json_build_object('role', NEW.role)::jsonb
  WHERE id = NEW.auth_id;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.validate_gift_card(code_input text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
declare
  card_record record;
begin
  select * into card_record from gift_cards where code = code_input;
  
  if not found then
    return json_build_object('valid', false, 'message', 'Invalid code');
  end if;

  if not card_record.is_active then
    return json_build_object('valid', false, 'message', 'Card is inactive');
  end if;

  if card_record.expires_at is not null and card_record.expires_at < now() then
    return json_build_object('valid', false, 'message', 'Card has expired');
  end if;

  if card_record.balance <= 0 then
    return json_build_object('valid', false, 'message', 'Card has no balance');
  end if;

  return json_build_object(
    'valid', true,
    'id', card_record.id,
    'code', card_record.code,
    'balance', card_record.balance,
    'initial_value', card_record.initial_value
  );
end;
$function$
;


-- -----------------------------------------------------------------------------
-- Triggers
-- -----------------------------------------------------------------------------

CREATE TRIGGER update_carts_updated_at BEFORE UPDATE ON public.carts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER on_customer_role_change AFTER INSERT OR UPDATE OF role ON public.customers FOR EACH ROW EXECUTE FUNCTION sync_customer_role();

CREATE TRIGGER on_role_change AFTER INSERT OR UPDATE OF role ON public.customers FOR EACH ROW EXECUTE FUNCTION sync_user_role();

CREATE TRIGGER protect_customer_privileged_columns BEFORE INSERT OR UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION protect_customer_privileged_columns();

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER sync_order_stock BEFORE DELETE OR UPDATE OF status ON public.orders FOR EACH ROW EXECUTE FUNCTION sync_order_stock();

CREATE TRIGGER audit_product_changes AFTER INSERT OR DELETE OR UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION log_product_changes();

CREATE TRIGGER protect_review_moderation BEFORE INSERT OR UPDATE ON public.reviews FOR EACH ROW EXECUTE FUNCTION protect_review_moderation();

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();


-- -----------------------------------------------------------------------------
-- Row level security
-- -----------------------------------------------------------------------------

alter table public.addresses enable row level security;

alter table public.admin_notifications enable row level security;

alter table public.admin_saved_filters enable row level security;

alter table public.analytics_events enable row level security;

alter table public.audit_logs enable row level security;

alter table public.banners enable row level security;

alter table public.cart_items enable row level security;

alter table public.carts enable row level security;

alter table public.categories enable row level security;

alter table public.coupons enable row level security;

alter table public.customers enable row level security;

alter table public.faqs enable row level security;

alter table public.gift_card_usage enable row level security;

alter table public.gift_cards enable row level security;

alter table public.login_history enable row level security;

alter table public.loyalty_history enable row level security;

alter table public.order_items enable row level security;

alter table public.orders enable row level security;

alter table public.popups enable row level security;

alter table public.product_images enable row level security;

alter table public.product_variants enable row level security;

alter table public.products enable row level security;

alter table public.profiles enable row level security;

alter table public.promotion_products enable row level security;

alter table public.promotions enable row level security;

alter table public.returns enable row level security;

alter table public.reviews enable row level security;

alter table public.shipping_rates enable row level security;

alter table public.shipping_zones enable row level security;

alter table public.store_settings enable row level security;

alter table public.support_messages enable row level security;

alter table public.support_tickets enable row level security;

alter table public.tax_rules enable row level security;

alter table public.wishlist_items enable row level security;

alter table public.wishlists enable row level security;


-- -----------------------------------------------------------------------------
-- Policies (public and storage)
-- -----------------------------------------------------------------------------

create policy "Auth consolidated addresses" on public.addresses as permissive for all to authenticated
    using ((is_admin_or_super() OR (customer_id = ( SELECT get_my_customer_id() AS get_my_customer_id))))
    with check ((is_admin_or_super() OR (customer_id = ( SELECT get_my_customer_id() AS get_my_customer_id))));

create policy "Auth consolidated admin_notifications" on public.admin_notifications as permissive for all to authenticated
    using (is_admin_or_super());

create policy "Auth consolidated admin_saved_filters" on public.admin_saved_filters as permissive for all to authenticated
    using ((is_admin_or_super() AND (admin_id = ( SELECT get_my_customer_id() AS get_my_customer_id))));

create policy "Analytics read own or staff" on public.analytics_events as permissive for select to authenticated
    using ((is_admin_or_super() OR (user_id = ( SELECT auth.uid() AS uid))));

create policy "Public insert to analytics" on public.analytics_events as permissive for insert to public
    with check (((( SELECT auth.role() AS role) = 'anon'::text) OR (( SELECT auth.role() AS role) = 'authenticated'::text)));

create policy "Auth consolidated audit_logs" on public.audit_logs as permissive for all to authenticated
    using (((( SELECT auth.role() AS role) = 'service_role'::text) OR is_admin_or_super()));

create policy "Anon read active banners" on public.banners as permissive for select to anon
    using (((is_active = true) AND ((now() >= starts_at) AND (now() <= ends_at))));

create policy "Auth delete banners" on public.banners as permissive for delete to authenticated
    using (is_admin_or_super());

create policy "Auth read banners" on public.banners as permissive for select to authenticated
    using ((is_admin_or_super() OR ((is_active = true) AND ((now() >= starts_at) AND (now() <= ends_at)))));

create policy "Auth update banners" on public.banners as permissive for update to authenticated
    using (is_admin_or_super())
    with check (is_admin_or_super());

create policy "Auth write banners" on public.banners as permissive for insert to authenticated
    with check (is_admin_or_super());

create policy "Users manage own cart items" on public.cart_items as permissive for all to public
    using ((user_id = ( SELECT auth.uid() AS uid)));

create policy "Users manage own cart" on public.carts as permissive for all to public
    using ((customer_id IN ( SELECT customers.id
   FROM customers
  WHERE (customers.auth_id = ( SELECT auth.uid() AS uid)))));

create policy "Anon read categories" on public.categories as permissive for select to anon
    using (true);

create policy "Auth delete categories" on public.categories as permissive for delete to authenticated
    using (is_admin_or_super());

create policy "Auth read categories" on public.categories as permissive for select to authenticated
    using (true);

create policy "Auth update categories" on public.categories as permissive for update to authenticated
    using (is_admin_or_super());

create policy "Auth write categories" on public.categories as permissive for insert to authenticated
    with check (is_admin_or_super());

create policy "Staff manage coupons" on public.coupons as permissive for all to authenticated
    using (is_admin_or_super())
    with check (is_admin_or_super());

create policy "Customers insert own" on public.customers as permissive for insert to authenticated
    with check ((is_admin_or_super() OR (auth_id = ( SELECT auth.uid() AS uid))));

create policy "Customers read own or staff all" on public.customers as permissive for select to authenticated
    using ((is_admin_or_super() OR (auth_id = ( SELECT auth.uid() AS uid))));

create policy "Customers update own or staff" on public.customers as permissive for update to authenticated
    using ((is_admin_or_super() OR (auth_id = ( SELECT auth.uid() AS uid))))
    with check ((is_admin_or_super() OR (auth_id = ( SELECT auth.uid() AS uid))));

create policy "Super admins delete customers" on public.customers as permissive for delete to authenticated
    using (is_super_admin());

create policy "Anon read active faqs" on public.faqs as permissive for select to anon
    using ((is_active = true));

create policy "Auth delete faqs" on public.faqs as permissive for delete to authenticated
    using (is_admin_or_super());

create policy "Auth read faqs" on public.faqs as permissive for select to authenticated
    using ((is_admin_or_super() OR (is_active = true)));

create policy "Auth update faqs" on public.faqs as permissive for update to authenticated
    using (is_admin_or_super());

create policy "Auth write faqs" on public.faqs as permissive for insert to authenticated
    with check (is_admin_or_super());

create policy "Staff view gift card usage" on public.gift_card_usage as permissive for select to authenticated
    using (is_admin_or_super());

create policy "Staff manage gift cards" on public.gift_cards as permissive for all to authenticated
    using (is_admin_or_super())
    with check (is_admin_or_super());

create policy "Users can insert their own login history" on public.login_history as permissive for insert to public
    with check ((user_id = ( SELECT auth.uid() AS uid)));

create policy "Users can view their own login history" on public.login_history as permissive for select to public
    using ((user_id = ( SELECT auth.uid() AS uid)));

create policy loyalty_user_read on public.loyalty_history as permissive for select to authenticated
    using ((user_id = ( SELECT auth.uid() AS uid)));

create policy "Auth read order_items" on public.order_items as permissive for select to authenticated
    using ((is_admin_or_super() OR (EXISTS ( SELECT 1
   FROM orders
  WHERE ((orders.id = order_items.order_id) AND (orders.customer_id = ( SELECT get_my_customer_id() AS get_my_customer_id)))))));

create policy "Staff delete order_items" on public.order_items as permissive for delete to authenticated
    using (is_admin_or_super());

create policy "Staff insert order_items" on public.order_items as permissive for insert to authenticated
    with check (is_admin_or_super());

create policy "Staff update order_items" on public.order_items as permissive for update to authenticated
    using (is_admin_or_super())
    with check (is_admin_or_super());

create policy "Orders read own or staff" on public.orders as permissive for select to authenticated
    using ((is_admin_or_super() OR (customer_id = ( SELECT get_my_customer_id() AS get_my_customer_id))));

create policy "Staff delete orders" on public.orders as permissive for delete to authenticated
    using (is_admin_or_super());

create policy "Staff insert orders" on public.orders as permissive for insert to authenticated
    with check (is_admin_or_super());

create policy "Staff update orders" on public.orders as permissive for update to authenticated
    using (is_admin_or_super())
    with check (is_admin_or_super());

create policy "Anon read active popups" on public.popups as permissive for select to anon
    using ((is_active = true));

create policy "Auth delete popups" on public.popups as permissive for delete to authenticated
    using (is_admin_or_super());

create policy "Auth read popups" on public.popups as permissive for select to authenticated
    using ((is_admin_or_super() OR (is_active = true)));

create policy "Auth update popups" on public.popups as permissive for update to authenticated
    using (is_admin_or_super());

create policy "Auth write popups" on public.popups as permissive for insert to authenticated
    with check (is_admin_or_super());

create policy "Anon read product_images" on public.product_images as permissive for select to anon
    using (true);

create policy "Auth delete product_images" on public.product_images as permissive for delete to authenticated
    using (is_admin_or_super());

create policy "Auth read product_images" on public.product_images as permissive for select to authenticated
    using (true);

create policy "Auth update product_images" on public.product_images as permissive for update to authenticated
    using (is_admin_or_super());

create policy "Auth write product_images" on public.product_images as permissive for insert to authenticated
    with check (is_admin_or_super());

create policy "Anon read product_variants" on public.product_variants as permissive for select to anon
    using (true);

create policy "Auth delete product_variants" on public.product_variants as permissive for delete to authenticated
    using (is_admin_or_super());

create policy "Auth read product_variants" on public.product_variants as permissive for select to authenticated
    using (true);

create policy "Auth update product_variants" on public.product_variants as permissive for update to authenticated
    using (is_admin_or_super());

create policy "Auth write product_variants" on public.product_variants as permissive for insert to authenticated
    with check (is_admin_or_super());

create policy "Anon read products" on public.products as permissive for select to anon
    using ((is_active = true));

create policy "Auth delete products" on public.products as permissive for delete to authenticated
    using (is_admin_or_super());

create policy "Auth read products" on public.products as permissive for select to authenticated
    using ((is_admin_or_super() OR (is_active = true)));

create policy "Auth update products" on public.products as permissive for update to authenticated
    using (is_admin_or_super());

create policy "Auth write products" on public.products as permissive for insert to authenticated
    with check (is_admin_or_super());

create policy profiles_user_access on public.profiles as permissive for all to authenticated
    using ((id = ( SELECT auth.uid() AS uid)))
    with check ((id = ( SELECT auth.uid() AS uid)));

create policy "Anon read promotion_products" on public.promotion_products as permissive for select to anon
    using (true);

create policy "Auth delete promotion_products" on public.promotion_products as permissive for delete to authenticated
    using (is_admin_or_super());

create policy "Auth read promotion_products" on public.promotion_products as permissive for select to authenticated
    using (true);

create policy "Auth update promotion_products" on public.promotion_products as permissive for update to authenticated
    using (is_admin_or_super());

create policy "Auth write promotion_products" on public.promotion_products as permissive for insert to authenticated
    with check (is_admin_or_super());

create policy "Anon read active promotions" on public.promotions as permissive for select to anon
    using (((is_active = true) AND ((now() >= start_date) AND (now() <= end_date))));

create policy "Auth delete promotions" on public.promotions as permissive for delete to authenticated
    using (is_admin_or_super());

create policy "Auth read promotions" on public.promotions as permissive for select to authenticated
    using ((is_admin_or_super() OR ((is_active = true) AND ((now() >= start_date) AND (now() <= end_date)))));

create policy "Auth update promotions" on public.promotions as permissive for update to authenticated
    using (is_admin_or_super());

create policy "Auth write promotions" on public.promotions as permissive for insert to authenticated
    with check (is_admin_or_super());

create policy "Auth delete returns" on public.returns as permissive for delete to authenticated
    using (is_admin_or_super());

create policy "Auth insert returns" on public.returns as permissive for insert to authenticated
    with check (((customer_id = ( SELECT get_my_customer_id() AS get_my_customer_id)) OR is_admin_or_super()));

create policy "Auth read returns" on public.returns as permissive for select to authenticated
    using ((is_admin_or_super() OR (customer_id = ( SELECT get_my_customer_id() AS get_my_customer_id))));

create policy "Staff update returns" on public.returns as permissive for update to authenticated
    using (is_admin_or_super())
    with check (is_admin_or_super());

create policy "Anon read approved reviews" on public.reviews as permissive for select to anon
    using (is_approved);

create policy "Auth delete reviews" on public.reviews as permissive for delete to authenticated
    using (is_admin_or_super());

create policy "Auth insert reviews" on public.reviews as permissive for insert to authenticated
    with check ((is_admin_or_super() OR (user_id = ( SELECT auth.uid() AS uid))));

create policy "Auth read approved own or staff reviews" on public.reviews as permissive for select to authenticated
    using ((is_approved OR (user_id = ( SELECT auth.uid() AS uid)) OR is_admin_or_super()));

create policy "Auth update reviews" on public.reviews as permissive for update to authenticated
    using ((is_admin_or_super() OR (user_id = ( SELECT auth.uid() AS uid))));

create policy "Anon read shipping rates" on public.shipping_rates as permissive for select to anon
    using (true);

create policy "Auth delete shipping rates" on public.shipping_rates as permissive for delete to authenticated
    using (is_admin_or_super());

create policy "Auth read shipping rates" on public.shipping_rates as permissive for select to authenticated
    using (true);

create policy "Auth update shipping rates" on public.shipping_rates as permissive for update to authenticated
    using (is_admin_or_super());

create policy "Auth write shipping rates" on public.shipping_rates as permissive for insert to authenticated
    with check (is_admin_or_super());

create policy "Anon read shipping zones" on public.shipping_zones as permissive for select to anon
    using ((is_active = true));

create policy "Auth delete shipping zones" on public.shipping_zones as permissive for delete to authenticated
    using (is_admin_or_super());

create policy "Auth read shipping zones" on public.shipping_zones as permissive for select to authenticated
    using ((is_admin_or_super() OR (is_active = true)));

create policy "Auth update shipping zones" on public.shipping_zones as permissive for update to authenticated
    using (is_admin_or_super());

create policy "Auth write shipping zones" on public.shipping_zones as permissive for insert to authenticated
    with check (is_admin_or_super());

create policy "Staff update settings" on public.store_settings as permissive for update to authenticated
    using (is_admin_or_super())
    with check (is_admin_or_super());

create policy public_read_settings on public.store_settings as permissive for select to public
    using (true);

create policy "Staff manage support messages" on public.support_messages as permissive for all to authenticated
    using (is_admin_or_super())
    with check (is_admin_or_super());

create policy "Users access own ticket messages" on public.support_messages as permissive for all to authenticated
    using ((EXISTS ( SELECT 1
   FROM support_tickets t
  WHERE ((t.id = support_messages.ticket_id) AND (t.user_id = ( SELECT auth.uid() AS uid))))))
    with check (((sender_id = ( SELECT auth.uid() AS uid)) AND (COALESCE(is_admin_reply, false) = false) AND (EXISTS ( SELECT 1
   FROM support_tickets t
  WHERE ((t.id = support_messages.ticket_id) AND (t.user_id = ( SELECT auth.uid() AS uid)))))));

create policy "Staff manage support tickets" on public.support_tickets as permissive for all to authenticated
    using (is_admin_or_super())
    with check (is_admin_or_super());

create policy tickets_user_access on public.support_tickets as permissive for all to authenticated
    using ((user_id = ( SELECT auth.uid() AS uid)))
    with check ((user_id = ( SELECT auth.uid() AS uid)));

create policy "Anon read tax rules" on public.tax_rules as permissive for select to anon
    using (true);

create policy "Auth delete tax_rules" on public.tax_rules as permissive for delete to authenticated
    using (is_admin_or_super());

create policy "Auth read tax_rules" on public.tax_rules as permissive for select to authenticated
    using (true);

create policy "Auth update tax_rules" on public.tax_rules as permissive for update to authenticated
    using (is_admin_or_super());

create policy "Auth write tax_rules" on public.tax_rules as permissive for insert to authenticated
    with check (is_admin_or_super());

create policy "Users can manage their own wishlist" on public.wishlist_items as permissive for all to public
    using ((user_id = ( SELECT auth.uid() AS uid)))
    with check ((user_id = ( SELECT auth.uid() AS uid)));

create policy "Users manage own wishlist" on public.wishlists as permissive for all to public
    using ((customer_id IN ( SELECT customers.id
   FROM customers
  WHERE (customers.auth_id = ( SELECT auth.uid() AS uid)))));

create policy "Authenticated Upload" on storage.objects as permissive for insert to authenticated
    with check ((bucket_id = 'review-images'::text));

create policy "Public Access" on storage.objects as permissive for select to public
    using ((bucket_id = 'review-images'::text));

create policy "Public Read Products" on storage.objects as permissive for select to public
    using ((bucket_id = 'products'::text));

create policy "Staff manage product images" on storage.objects as permissive for all to authenticated
    using (((bucket_id = 'products'::text) AND is_admin_or_super()))
    with check (((bucket_id = 'products'::text) AND is_admin_or_super()));


-- -----------------------------------------------------------------------------
-- Function privileges
-- -----------------------------------------------------------------------------

revoke execute on function public.apply_order_stock(p_order_id uuid, p_direction integer) from public, anon, authenticated, service_role;
grant execute on function public.apply_order_stock(p_order_id uuid, p_direction integer) to service_role;

revoke execute on function public.cancel_order(p_order_id uuid) from public, anon, authenticated, service_role;
grant execute on function public.cancel_order(p_order_id uuid) to service_role;

revoke execute on function public.create_order_with_items(p_customer_name text, p_customer_email text, p_shipping_address text, p_total_amount numeric, p_payment_method text, p_items jsonb, p_customer_id uuid) from public, anon, authenticated, service_role;
grant execute on function public.create_order_with_items(p_customer_name text, p_customer_email text, p_shipping_address text, p_total_amount numeric, p_payment_method text, p_items jsonb, p_customer_id uuid) to service_role;

revoke execute on function public.current_customer_id() from public, anon, authenticated, service_role;
grant execute on function public.current_customer_id() to anon, authenticated, service_role;

revoke execute on function public.debug_storage_upload() from public, anon, authenticated, service_role;
grant execute on function public.debug_storage_upload() to service_role;

revoke execute on function public.get_admin_stats() from public, anon, authenticated, service_role;
grant execute on function public.get_admin_stats() to service_role;

revoke execute on function public.get_analytics_summary(days_back integer) from public, anon, authenticated, service_role;
grant execute on function public.get_analytics_summary(days_back integer) to service_role;

revoke execute on function public.get_featured_products_fast(p_limit integer) from public, anon, authenticated, service_role;
grant execute on function public.get_featured_products_fast(p_limit integer) to anon, authenticated, service_role;

revoke execute on function public.get_is_admin() from public, anon, authenticated, service_role;
grant execute on function public.get_is_admin() to anon, authenticated, service_role;

revoke execute on function public.get_my_customer_id() from public, anon, authenticated, service_role;
grant execute on function public.get_my_customer_id() to anon, authenticated, service_role;

revoke execute on function public.get_new_arrivals_fast(p_limit integer) from public, anon, authenticated, service_role;
grant execute on function public.get_new_arrivals_fast(p_limit integer) to anon, authenticated, service_role;

revoke execute on function public.get_orders_paginated(p_page integer, p_page_size integer, p_status text) from public, anon, authenticated, service_role;
grant execute on function public.get_orders_paginated(p_page integer, p_page_size integer, p_status text) to service_role;

revoke execute on function public.get_products_optimized(p_page integer, p_page_size integer, p_search text, p_category_ids uuid[], p_min_price numeric, p_max_price numeric, p_sort text) from public, anon, authenticated, service_role;
grant execute on function public.get_products_optimized(p_page integer, p_page_size integer, p_search text, p_category_ids uuid[], p_min_price numeric, p_max_price numeric, p_sort text) to anon, authenticated, service_role;

revoke execute on function public.get_system_stats_optimized() from public, anon, authenticated, service_role;
grant execute on function public.get_system_stats_optimized() to service_role;

revoke execute on function public.handle_new_user() from public, anon, authenticated, service_role;
grant execute on function public.handle_new_user() to service_role;

revoke execute on function public.is_admin() from public, anon, authenticated, service_role;
grant execute on function public.is_admin() to anon, authenticated, service_role;

revoke execute on function public.is_admin_or_super() from public, anon, authenticated, service_role;
grant execute on function public.is_admin_or_super() to anon, authenticated, service_role;

revoke execute on function public.is_admin_via_jwt() from public, anon, authenticated, service_role;
grant execute on function public.is_admin_via_jwt() to anon, authenticated, service_role;

revoke execute on function public.is_super_admin() from public, anon, authenticated, service_role;
grant execute on function public.is_super_admin() to anon, authenticated, service_role;

revoke execute on function public.log_product_changes() from public, anon, authenticated, service_role;
grant execute on function public.log_product_changes() to service_role;

revoke execute on function public.promote_user_to_admin(user_email text) from public, anon, authenticated, service_role;
grant execute on function public.promote_user_to_admin(user_email text) to service_role;

revoke execute on function public.protect_customer_privileged_columns() from public, anon, authenticated, service_role;
grant execute on function public.protect_customer_privileged_columns() to anon, authenticated, service_role;

revoke execute on function public.protect_review_moderation() from public, anon, authenticated, service_role;
grant execute on function public.protect_review_moderation() to service_role;

revoke execute on function public.redeem_gift_card_atomic(p_code text, p_amount numeric, p_order_id uuid) from public, anon, authenticated, service_role;
grant execute on function public.redeem_gift_card_atomic(p_code text, p_amount numeric, p_order_id uuid) to service_role;

revoke execute on function public.refresh_product_stats() from public, anon, authenticated, service_role;
grant execute on function public.refresh_product_stats() to service_role;

revoke execute on function public.reserve_order_stock(p_order_id uuid) from public, anon, authenticated, service_role;
grant execute on function public.reserve_order_stock(p_order_id uuid) to service_role;

revoke execute on function public.search_products(search_query text, category_ids uuid[], min_price numeric, max_price numeric, sizes_filter text[], colors_filter text[], in_stock_only boolean, sort_by text, sort_order text, page_limit integer, page_offset integer) from public, anon, authenticated, service_role;
grant execute on function public.search_products(search_query text, category_ids uuid[], min_price numeric, max_price numeric, sizes_filter text[], colors_filter text[], in_stock_only boolean, sort_by text, sort_order text, page_limit integer, page_offset integer) to anon, authenticated, service_role;

revoke execute on function public.sync_customer_role() from public, anon, authenticated, service_role;
grant execute on function public.sync_customer_role() to service_role;

revoke execute on function public.sync_order_stock() from public, anon, authenticated, service_role;
grant execute on function public.sync_order_stock() to service_role;

revoke execute on function public.sync_user_role() from public, anon, authenticated, service_role;
grant execute on function public.sync_user_role() to service_role;

revoke execute on function public.update_updated_at_column() from public, anon, authenticated, service_role;
grant execute on function public.update_updated_at_column() to anon, authenticated, service_role;

revoke execute on function public.validate_gift_card(code_input text) from public, anon, authenticated, service_role;
grant execute on function public.validate_gift_card(code_input text) to service_role;


-- -----------------------------------------------------------------------------
-- Storage buckets
-- -----------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values ('products', 'products', true, 5242880, '{image/jpeg,image/png,image/webp,image/avif,image/gif}') on conflict (id) do nothing;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values ('review-images', 'review-images', true, 5242880, '{image/jpeg,image/png,image/webp,image/avif,image/gif}') on conflict (id) do nothing;
