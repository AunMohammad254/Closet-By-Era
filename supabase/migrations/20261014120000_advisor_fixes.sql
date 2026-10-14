-- =============================================================================
-- Database advisor fixes (2026-10-14)
--
-- From the Supabase security and performance advisors, checked against the
-- live database:
--   1. search_products is SECURITY DEFINER and executable by anon through
--      /rest/v1/rpc/search_products, but unlike get_featured_products_fast,
--      get_new_arrivals_fast and get_products_optimized it never filtered on
--      is_active, so hidden products were returned to anyone who called it.
--      The app does not call it; it now hides inactive products like the rest.
--   2. promotion_products.product_id and shipping_rates.zone_id are foreign
--      keys without a covering index.
--   3. pg_graphql exposed every public table and column name in the GraphQL
--      schema. The app only uses the REST API, so the extension is dropped.
--
-- Every statement is idempotent, so re-running it (e.g. `supabase db push`
-- after it was applied from the dashboard) is harmless.
-- =============================================================================

begin;

-- -----------------------------------------------------------------------------
-- 1. search_products: only active products (grants are kept by CREATE OR REPLACE)
-- -----------------------------------------------------------------------------
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
        c.name as category_name,
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
$function$;

-- -----------------------------------------------------------------------------
-- 2. Covering indexes for the two unindexed foreign keys
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_promotion_products_product_id ON public.promotion_products USING btree (product_id);
CREATE INDEX IF NOT EXISTS idx_shipping_rates_zone_id ON public.shipping_rates USING btree (zone_id);

-- -----------------------------------------------------------------------------
-- 3. GraphQL is unused: stop publishing the schema
-- -----------------------------------------------------------------------------
DROP EXTENSION IF EXISTS pg_graphql;

commit;
