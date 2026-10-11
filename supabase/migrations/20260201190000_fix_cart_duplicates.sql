-- Migration: Fix Cart Duplicates and Enforce Uniqueness
-- Date: 2026-02-01
-- Description: Removes duplicate cart items caused by NULL handling in unique constraints,
--              normalizes size/color to empty strings, and creates a strict unique index.

BEGIN;

-- 1. Clean up duplicate cart items, keeping the most recently updated/created one
-- Using CTE to identify duplicates based on user_id, product_id, and normalized size/color
WITH duplicates AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY user_id, product_id, COALESCE(size, ''), COALESCE(color, '')
           ORDER BY COALESCE(updated_at, created_at) DESC, id DESC
         ) as rn
  FROM public.cart_items
)
DELETE FROM public.cart_items
WHERE id IN (SELECT id FROM duplicates WHERE rn > 1);

-- 2. Normalize NULLs to empty strings for existing data
UPDATE public.cart_items SET size = '' WHERE size IS NULL;
UPDATE public.cart_items SET color = '' WHERE color IS NULL;

-- 3. Set Defaults to empty string to prevent future NULLs
ALTER TABLE public.cart_items ALTER COLUMN size SET DEFAULT '';
ALTER TABLE public.cart_items ALTER COLUMN color SET DEFAULT '';

-- 4. Drop old index if it exists (it might be named differently, but we try common names or the one from previous migration)
DROP INDEX IF EXISTS idx_cart_items_unique_item;
-- Also drop any other potential unique indexes on these columns to be safe
DROP INDEX IF EXISTS cart_items_user_id_product_id_size_color_key;

-- 5. Create new strict unique index
-- This ensures that (user, product, size, color) tuple is unique.
-- '' (empty string) is a concrete value in SQL, unlike NULL which doesn't equal NULL.
CREATE UNIQUE INDEX idx_cart_items_user_product_variant
ON public.cart_items (user_id, product_id, size, color);

COMMIT;
