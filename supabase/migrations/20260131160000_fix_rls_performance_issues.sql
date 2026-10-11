-- Migration: Fix RLS Performance Issues
-- Date: 2026-01-31
-- Issues Fixed:
-- 1. Auth RLS Initialization Plan warnings (auth functions re-evaluated per row)
-- 2. Multiple permissive policies on coupons table causing performance degradation

-- =============================================================================
-- PART 1: Fix auth.uid() re-evaluation in RLS policies
-- =============================================================================

-- Drop existing policies that have performance issues
DROP POLICY IF EXISTS "Admins can update settings" ON public.store_settings;
DROP POLICY IF EXISTS "Admins can manage coupons" ON public.coupons;
DROP POLICY IF EXISTS "Admins can insert coupons" ON public.coupons;
DROP POLICY IF EXISTS "Admins can update coupons" ON public.coupons;
DROP POLICY IF EXISTS "Admins can delete coupons" ON public.coupons;
DROP POLICY IF EXISTS "Read coupons" ON public.coupons;

-- =============================================================================
-- PART 2: Create optimized policies with SELECT subqueries
-- =============================================================================

-- Store Settings: Optimized admin update policy
CREATE POLICY "Admins can update settings" ON public.store_settings 
    FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM public.customers 
            WHERE customers.auth_id = (SELECT auth.uid()) 
            AND customers.role = 'admin'
        )
    );

-- =============================================================================
-- PART 3: Consolidate coupons policies (remove duplicates)
-- =============================================================================

-- Single comprehensive admin policy for ALL operations (INSERT, UPDATE, DELETE, SELECT)
CREATE POLICY "Admins can manage coupons" ON public.coupons 
    FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM public.customers 
            WHERE customers.auth_id = (SELECT auth.uid()) 
            AND customers.role = 'admin'
        )
    );

-- Public read policy for active coupons only (kept separate for different logic)
-- This is the ONLY other SELECT policy - consolidated from multiple read policies
CREATE POLICY "Public can read active coupons" ON public.coupons 
    FOR SELECT 
    USING (is_active = true);

-- =============================================================================
-- PART 4: Add indexes for improved RLS policy performance
-- =============================================================================

-- Index on customers.auth_id for faster admin checks
CREATE INDEX IF NOT EXISTS idx_customers_auth_id_role 
    ON public.customers(auth_id, role);

-- Index on coupons.is_active for public read policy
CREATE INDEX IF NOT EXISTS idx_coupons_is_active 
    ON public.coupons(is_active) WHERE is_active = true;

-- Index on coupons.code for faster lookups
CREATE INDEX IF NOT EXISTS idx_coupons_code 
    ON public.coupons(code);

-- Index on coupons.expires_at for active coupon queries
CREATE INDEX IF NOT EXISTS idx_coupons_expires_at 
    ON public.coupons(expires_at) WHERE is_active = true;

-- =============================================================================
-- PART 5: Verification comments
-- =============================================================================

-- Verify the changes:
-- 1. Run: SELECT * FROM pg_policies WHERE tablename IN ('store_settings', 'coupons');
-- 2. Check that there are no duplicate policies per operation
-- 3. Confirm auth.uid() is wrapped in SELECT subquery
-- 4. Test with: EXPLAIN ANALYZE SELECT * FROM coupons WHERE is_active = true;

COMMENT ON POLICY "Admins can manage coupons" ON public.coupons IS 
    'Consolidated admin policy for all CRUD operations. Uses SELECT subquery for auth.uid() to prevent per-row re-evaluation.';

COMMENT ON POLICY "Public can read active coupons" ON public.coupons IS 
    'Allows public read access to active coupons only. Optimized with partial index.';

COMMENT ON POLICY "Admins can update settings" ON public.store_settings IS 
    'Admin-only update policy with optimized auth check using SELECT subquery.';
