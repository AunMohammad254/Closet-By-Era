-- =====================================================
-- SUPABASE RLS PERFORMANCE OPTIMIZATION
-- =====================================================
-- This migration fixes two main performance issues:
-- 1. Auth RLS Initplan: Wraps auth functions in SELECT to prevent re-evaluation per row
-- 2. Multiple Permissive Policies: Consolidates duplicate policies
-- =====================================================

-- =====================================================
-- PART 1: FIX AUTH RLS INITPLAN ISSUES
-- =====================================================
-- Replace auth.uid() with (select auth.uid()) and similar patterns
-- to prevent function re-evaluation for each row

-- -----------------------------------------------------
-- BANNERS TABLE
-- -----------------------------------------------------
DROP POLICY IF EXISTS "Admins can manage banners" ON banners;
CREATE POLICY "Admins can manage banners" ON banners
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM customers 
      WHERE auth_id = (select auth.uid()) 
      AND role IN ('admin', 'super_admin')
    )
  );

-- -----------------------------------------------------
-- POPUPS TABLE
-- -----------------------------------------------------
DROP POLICY IF EXISTS "Admins can manage popups" ON popups;
CREATE POLICY "Admins can manage popups" ON popups
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM customers 
      WHERE auth_id = (select auth.uid()) 
      AND role IN ('admin', 'super_admin')
    )
  );

-- -----------------------------------------------------
-- FAQS TABLE
-- -----------------------------------------------------
DROP POLICY IF EXISTS "Admins can manage faqs" ON faqs;
CREATE POLICY "Admins can manage faqs" ON faqs
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM customers 
      WHERE auth_id = (select auth.uid()) 
      AND role IN ('admin', 'super_admin')
    )
  );

-- -----------------------------------------------------
-- LOGIN_HISTORY TABLE
-- -----------------------------------------------------
DROP POLICY IF EXISTS "Users can view their own login history" ON login_history;
CREATE POLICY "Users can view their own login history" ON login_history
  FOR SELECT
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert their own login history" ON login_history;
CREATE POLICY "Users can insert their own login history" ON login_history
  FOR INSERT
  WITH CHECK (user_id = (select auth.uid()));

-- -----------------------------------------------------
-- CUSTOMERS TABLE
-- -----------------------------------------------------
DROP POLICY IF EXISTS "Users can view their own profile" ON customers;
CREATE POLICY "Users can view their own profile" ON customers
  FOR SELECT
  USING (auth_id = (select auth.uid()));

-- -----------------------------------------------------
-- ADMIN_NOTIFICATIONS TABLE
-- -----------------------------------------------------
DROP POLICY IF EXISTS "Admins can view notifications" ON admin_notifications;
CREATE POLICY "Admins can view notifications" ON admin_notifications
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM customers 
      WHERE auth_id = (select auth.uid()) 
      AND role IN ('admin', 'super_admin')
    )
  );

DROP POLICY IF EXISTS "Admins can update notifications" ON admin_notifications;
CREATE POLICY "Admins can update notifications" ON admin_notifications
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM customers 
      WHERE auth_id = (select auth.uid()) 
      AND role IN ('admin', 'super_admin')
    )
  );

DROP POLICY IF EXISTS "System can insert notifications" ON admin_notifications;
CREATE POLICY "System can insert notifications" ON admin_notifications
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM customers 
      WHERE auth_id = (select auth.uid()) 
      AND role IN ('admin', 'super_admin')
    )
  );

-- -----------------------------------------------------
-- ADMIN_SAVED_FILTERS TABLE
-- -----------------------------------------------------
DROP POLICY IF EXISTS "Admins can manage own filters" ON admin_saved_filters;
CREATE POLICY "Admins can manage own filters" ON admin_saved_filters
  FOR ALL
  USING (
    admin_id IN (
      SELECT id FROM customers 
      WHERE auth_id = (select auth.uid()) 
      AND role IN ('admin', 'super_admin')
    )
  );

-- -----------------------------------------------------
-- RETURNS TABLE
-- -----------------------------------------------------
DROP POLICY IF EXISTS "Customers can view own returns" ON returns;
CREATE POLICY "Customers can view own returns" ON returns
  FOR SELECT
  USING (
    customer_id IN (
      SELECT id FROM customers WHERE auth_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Customers can create returns" ON returns;
CREATE POLICY "Customers can create returns" ON returns
  FOR INSERT
  WITH CHECK (
    customer_id IN (
      SELECT id FROM customers WHERE auth_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Admins can manage returns" ON returns;
CREATE POLICY "Admins can manage returns" ON returns
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM customers 
      WHERE auth_id = (select auth.uid()) 
      AND role IN ('admin', 'super_admin')
    )
  );

-- -----------------------------------------------------
-- SHIPPING_ZONES TABLE
-- -----------------------------------------------------
DROP POLICY IF EXISTS "Admins can manage shipping zones" ON shipping_zones;
CREATE POLICY "Admins can manage shipping zones" ON shipping_zones
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM customers 
      WHERE auth_id = (select auth.uid()) 
      AND role IN ('admin', 'super_admin')
    )
  );

-- -----------------------------------------------------
-- SHIPPING_RATES TABLE
-- -----------------------------------------------------
DROP POLICY IF EXISTS "Admins can manage shipping rates" ON shipping_rates;
CREATE POLICY "Admins can manage shipping rates" ON shipping_rates
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM customers 
      WHERE auth_id = (select auth.uid()) 
      AND role IN ('admin', 'super_admin')
    )
  );

-- -----------------------------------------------------
-- TAX_RULES TABLE
-- -----------------------------------------------------
DROP POLICY IF EXISTS "Admins can manage tax rules" ON tax_rules;
CREATE POLICY "Admins can manage tax rules" ON tax_rules
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM customers 
      WHERE auth_id = (select auth.uid()) 
      AND role IN ('admin', 'super_admin')
    )
  );

-- -----------------------------------------------------
-- PROMOTIONS TABLE
-- -----------------------------------------------------
DROP POLICY IF EXISTS "Admins can manage promotions" ON promotions;
CREATE POLICY "Admins can manage promotions" ON promotions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM customers 
      WHERE auth_id = (select auth.uid()) 
      AND role IN ('admin', 'super_admin')
    )
  );

-- -----------------------------------------------------
-- PROMOTION_PRODUCTS TABLE
-- -----------------------------------------------------
DROP POLICY IF EXISTS "Admins can manage promotion products" ON promotion_products;
CREATE POLICY "Admins can manage promotion products" ON promotion_products
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM customers 
      WHERE auth_id = (select auth.uid()) 
      AND role IN ('admin', 'super_admin')
    )
  );

-- =====================================================
-- PART 2: FIX MULTIPLE PERMISSIVE POLICIES
-- =====================================================
-- Consolidate multiple policies into single, efficient policies

-- -----------------------------------------------------
-- BANNERS TABLE - Consolidate policies
-- -----------------------------------------------------
-- Drop duplicate/redundant policies
DROP POLICY IF EXISTS "Admins can delete banners" ON banners;
DROP POLICY IF EXISTS "Admins can update banners" ON banners;
DROP POLICY IF EXISTS "Anyone can read active banners" ON banners;
DROP POLICY IF EXISTS "Public banners are viewable by everyone" ON banners;

-- Keep the comprehensive admin policy (already recreated above)
-- Create single public read policy
CREATE POLICY "Public can view active banners" ON banners
  FOR SELECT
  USING (is_active = true AND NOW() BETWEEN starts_at AND ends_at);

-- -----------------------------------------------------
-- POPUPS TABLE - Consolidate policies
-- -----------------------------------------------------
-- Already consolidated with "Admins can manage popups" above
-- Add public read policy
DROP POLICY IF EXISTS "Anyone can read active popups" ON popups;
CREATE POLICY "Public can view active popups" ON popups
  FOR SELECT
  USING (is_active = true);

-- -----------------------------------------------------
-- FAQS TABLE - Consolidate policies
-- -----------------------------------------------------
DROP POLICY IF EXISTS "Anyone can read active faqs" ON faqs;
CREATE POLICY "Public can view active faqs" ON faqs
  FOR SELECT
  USING (is_active = true);

-- -----------------------------------------------------
-- CUSTOMERS TABLE - Consolidate policies
-- -----------------------------------------------------
-- Drop redundant policies
DROP POLICY IF EXISTS "Admins can delete customers" ON customers;
DROP POLICY IF EXISTS "Admins can insert customers" ON customers;
DROP POLICY IF EXISTS "Super admins can view all customers" ON customers;
DROP POLICY IF EXISTS "super_admin_full_access_customers" ON customers;
DROP POLICY IF EXISTS "admin_view_all_customers" ON customers;
DROP POLICY IF EXISTS "users_view_own_customer" ON customers;
DROP POLICY IF EXISTS "users_update_own_customer" ON customers;
DROP POLICY IF EXISTS "super_admin_manage_roles" ON customers;

-- Create consolidated policies
CREATE POLICY "users_view_own_profile" ON customers
  FOR SELECT
  USING (auth_id = (select auth.uid()));

CREATE POLICY "users_update_own_profile" ON customers
  FOR UPDATE
  USING (auth_id = (select auth.uid()))
  WITH CHECK (
    auth_id = (select auth.uid()) 
    AND role = (SELECT role FROM customers WHERE auth_id = (select auth.uid()))
  );

CREATE POLICY "admin_full_access" ON customers
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM customers 
      WHERE auth_id = (select auth.uid()) 
      AND role = 'admin'
    )
  );

CREATE POLICY "super_admin_full_access" ON customers
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM customers 
      WHERE auth_id = (select auth.uid()) 
      AND role = 'super_admin'
    )
  );

-- -----------------------------------------------------
-- COUPONS TABLE - Consolidate policies
-- -----------------------------------------------------
DROP POLICY IF EXISTS "admin_full_access" ON coupons;
DROP POLICY IF EXISTS "public_read_valid_coupons" ON coupons;

CREATE POLICY "coupons_admin_full_access" ON coupons
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM customers 
      WHERE auth_id = (select auth.uid()) 
      AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "coupons_public_read_valid" ON coupons
  FOR SELECT
  USING (
    is_active = true 
    AND NOW() BETWEEN starts_at AND ends_at
    AND (uses_count < max_uses OR max_uses IS NULL)
  );

-- -----------------------------------------------------
-- TAX_RULES TABLE - Add public read policy
-- -----------------------------------------------------
DROP POLICY IF EXISTS "Anyone can read tax rules" ON tax_rules;
CREATE POLICY "Public can view tax rules" ON tax_rules
  FOR SELECT
  USING (true);

-- -----------------------------------------------------
-- SHIPPING_ZONES TABLE - Add public read policy
-- -----------------------------------------------------
CREATE POLICY "Public can view shipping zones" ON shipping_zones
  FOR SELECT
  USING (is_active = true);

-- -----------------------------------------------------
-- SHIPPING_RATES TABLE - Add public read policy
-- -----------------------------------------------------
CREATE POLICY "Public can view shipping rates" ON shipping_rates
  FOR SELECT
  USING (true);

-- -----------------------------------------------------
-- PROMOTIONS TABLE - Add public read policy
-- -----------------------------------------------------
CREATE POLICY "Public can view active promotions" ON promotions
  FOR SELECT
  USING (
    is_active = true 
    AND NOW() BETWEEN start_date AND end_date
  );

-- =====================================================
-- PART 3: CREATE HELPER FUNCTIONS FOR ROLE CHECKS
-- =====================================================
-- These functions improve performance by avoiding repeated subqueries

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM customers 
    WHERE auth_id = auth.uid() 
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM customers 
    WHERE auth_id = auth.uid() 
    AND role = 'super_admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_admin_or_super()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM customers 
    WHERE auth_id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.current_customer_id()
RETURNS UUID AS $$
BEGIN
  RETURN (SELECT id FROM customers WHERE auth_id = auth.uid() LIMIT 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- =====================================================
-- PART 4: CREATE INDEXES FOR PERFORMANCE
-- =====================================================
-- Add indexes to support the RLS policies efficiently

CREATE INDEX IF NOT EXISTS idx_customers_auth_id_role 
  ON customers(auth_id, role);

CREATE INDEX IF NOT EXISTS idx_banners_active_dates 
  ON banners(is_active, starts_at, ends_at) 
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_popups_active 
  ON popups(is_active) 
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_faqs_active 
  ON faqs(is_active) 
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_coupons_active_dates 
  ON coupons(is_active, starts_at, ends_at) 
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_promotions_active_dates 
  ON promotions(is_active, start_date, end_date) 
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_returns_customer_id 
  ON returns(customer_id);

CREATE INDEX IF NOT EXISTS idx_admin_saved_filters_admin_id 
  ON admin_saved_filters(admin_id);

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
-- Run these to verify the fixes

-- Check for remaining auth RLS initplan issues
-- SELECT tablename, policyname 
-- FROM pg_policies 
-- WHERE definition LIKE '%auth.uid()%' 
-- AND definition NOT LIKE '%(select auth.uid())%'
-- AND schemaname = 'public';

-- Check for multiple permissive policies
-- SELECT tablename, cmd, COUNT(*) as policy_count
-- FROM pg_policies 
-- WHERE schemaname = 'public' 
-- AND permissive = 't'
-- GROUP BY tablename, cmd, roles
-- HAVING COUNT(*) > 1;

COMMENT ON FUNCTION public.is_admin() IS 'Efficiently checks if current user is an admin';
COMMENT ON FUNCTION public.is_super_admin() IS 'Efficiently checks if current user is a super admin';
COMMENT ON FUNCTION public.is_admin_or_super() IS 'Efficiently checks if current user is admin or super admin';
COMMENT ON FUNCTION public.current_customer_id() IS 'Returns the customer ID for the current authenticated user';
