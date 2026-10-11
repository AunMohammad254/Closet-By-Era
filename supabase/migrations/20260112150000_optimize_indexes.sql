-- Migration: Add Missing Indexes for Foreign Keys
-- Date: 2026-01-12

-- Fixes "Unindexed foreign keys" warnings to improve join performance.

-- 1. addresses.customer_id
CREATE INDEX IF NOT EXISTS idx_addresses_customer_id ON addresses(customer_id);

-- 2. analytics_events.user_id
-- Note: Checking if column exists first would be better but standard SQL assumes schema is known.
-- Based on warning: analytics_events_user_id_fkey exists.
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id);

-- 3. cart_items.user_id
CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON cart_items(user_id);

-- 4. categories.parent_id
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);

-- 5. orders.customer_id
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);

-- 6. products.category_id
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);

-- NOTE: Regarding "Unused Index" warnings:
-- It is recommended to KEEP indexes like 'idx_orders_status', 'idx_products_category', etc.
-- even if currently reported as unused. They are essential for filtering products by category,
-- checking order status, and other standard potential queries that will occur as traffic increases.
-- Removing them now would likely cause performance issues later.
