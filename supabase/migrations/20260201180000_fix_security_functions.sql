-- =====================================================
-- FIX SECURITY: FUNCTION SEARCH PATH MUTABLE
-- =====================================================
-- Securing functions by setting a fixed search_path to 'public'.
-- This prevents malicious users from hijacking the search path
-- to execute arbitrary code or access shadowed tables.

-- 1. get_system_stats_optimized
ALTER FUNCTION public.get_system_stats_optimized() SET search_path = public;

-- 2. is_admin
ALTER FUNCTION public.is_admin() SET search_path = public;

-- 3. is_super_admin
ALTER FUNCTION public.is_super_admin() SET search_path = public;

-- 4. current_customer_id
ALTER FUNCTION public.current_customer_id() SET search_path = public;

-- 5. is_admin_or_super
ALTER FUNCTION public.is_admin_or_super() SET search_path = public;

-- 6. get_my_customer_id
ALTER FUNCTION public.get_my_customer_id() SET search_path = public;
