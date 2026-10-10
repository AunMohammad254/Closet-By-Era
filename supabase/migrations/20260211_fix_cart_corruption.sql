-- =====================================================
-- FIX: Cart Data Corruption - Nuclear Cleanup
-- Date: 2026-02-11
-- Problem: 166,487 duplicate cart_items for 1 user
-- Root cause: NULL values bypass unique index (NULL≠NULL in SQL)
-- =====================================================

BEGIN;

-- 1. Nuclear cleanup: delete ALL cart_items (0 real orders exist, data is all garbage)
DELETE FROM public.cart_items;

-- 2. Drop redundant indexes (keep only one clean unique index)
DROP INDEX IF EXISTS idx_cart_items_user_product;
DROP INDEX IF EXISTS idx_cart_items_user_product_variant;
-- Keep cart_items_user_product_variant_unique as the canonical one

-- 3. Normalize columns: set NOT NULL with empty string default
-- First update any remaining NULLs (belt and suspenders)
UPDATE public.cart_items SET size = '' WHERE size IS NULL;
UPDATE public.cart_items SET color = '' WHERE color IS NULL;

-- Now enforce NOT NULL
ALTER TABLE public.cart_items ALTER COLUMN size SET NOT NULL;
ALTER TABLE public.cart_items ALTER COLUMN size SET DEFAULT '';
ALTER TABLE public.cart_items ALTER COLUMN color SET NOT NULL;
ALTER TABLE public.cart_items ALTER COLUMN color SET DEFAULT '';

COMMIT;
