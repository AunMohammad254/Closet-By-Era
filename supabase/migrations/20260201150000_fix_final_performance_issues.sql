-- =====================================================
-- SUPABASE RLS FINAL PERFORMANCE OPTIMIZATION
-- =====================================================
-- This migration fixes:
-- 1. auth_rls_initplan in audit_logs (wrapping auth functions)
-- 2. multiple_permissive_policies by consolidating policies and restricting roles
-- =====================================================

BEGIN;

-- =====================================================
-- 1. FIX AUDIT LOGS (auth_rls_initplan)
-- =====================================================
DROP POLICY IF EXISTS "Admins view audit logs" ON audit_logs;
DROP POLICY IF EXISTS "Admins or Service insert audit logs" ON audit_logs;

-- Use (select auth.uid()) to prevent re-evaluation
CREATE POLICY "Admins view audit logs" ON audit_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.auth_id = (select auth.uid())
      AND customers.role IN ('admin', 'super_admin')
    )
  );

-- Use (select auth.role()) and (select auth.uid())
CREATE POLICY "Admins or Service insert audit logs" ON audit_logs
  FOR INSERT
  WITH CHECK (
    ((select auth.role()) = 'service_role') OR
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.auth_id = (select auth.uid())
      AND customers.role IN ('admin', 'super_admin')
    )
  );

-- =====================================================
-- 2. FIX MULTIPLE PERMISSIVE POLICIES
--    Strategy: Restrict Admin policies TO authenticated
--    so they don't overlap with ANON policies
-- =====================================================

-- -----------------------------------------------------
-- BANNERS
-- -----------------------------------------------------
DROP POLICY IF EXISTS "Admins can manage banners" ON banners;
CREATE POLICY "Admins can manage banners" ON banners
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.auth_id = (select auth.uid())
      AND customers.role IN ('admin', 'super_admin')
    )
  );

-- -----------------------------------------------------
-- POPUPS
-- -----------------------------------------------------
DROP POLICY IF EXISTS "Admins can manage popups" ON popups;
CREATE POLICY "Admins can manage popups" ON popups
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.auth_id = (select auth.uid())
      AND customers.role IN ('admin', 'super_admin')
    )
  );

-- -----------------------------------------------------
-- FAQS
-- -----------------------------------------------------
DROP POLICY IF EXISTS "Admins can manage faqs" ON faqs;
CREATE POLICY "Admins can manage faqs" ON faqs
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.auth_id = (select auth.uid())
      AND customers.role IN ('admin', 'super_admin')
    )
  );

-- -----------------------------------------------------
-- ADDRESSES (Fixing anon/authenticated multiple policies)
-- -----------------------------------------------------
DROP POLICY IF EXISTS "Admins manage addresses" ON addresses;
CREATE POLICY "Admins manage addresses" ON addresses
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.auth_id = (select auth.uid())
      AND customers.role IN ('admin', 'super_admin')
    )
  );

-- "Users manage own addresses"
DROP POLICY IF EXISTS "Users manage own addresses" ON addresses;
CREATE POLICY "Users manage own addresses" ON addresses
  FOR ALL
  TO authenticated
  USING (
    customer_id IN (
      SELECT id FROM customers WHERE auth_id = (select auth.uid())
    )
  );

-- -----------------------------------------------------
-- ADMIN NOTIFICATIONS
-- -----------------------------------------------------
DROP POLICY IF EXISTS "Admins manage notifications" ON admin_notifications;
DROP POLICY IF EXISTS "Admins can view notifications" ON admin_notifications;
DROP POLICY IF EXISTS "Admins can update notifications" ON admin_notifications;
DROP POLICY IF EXISTS "System can insert notifications" ON admin_notifications;
CREATE POLICY "Admins manage notifications" ON admin_notifications
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.auth_id = (select auth.uid())
      AND customers.role IN ('admin', 'super_admin')
    )
  );

-- -----------------------------------------------------
-- ADMIN SAVED FILTERS
-- -----------------------------------------------------
DROP POLICY IF EXISTS "Admins can manage own filters" ON admin_saved_filters;
DROP POLICY IF EXISTS "Admins manage own filters" ON admin_saved_filters;
CREATE POLICY "Admins manage own filters" ON admin_saved_filters
  FOR ALL
  TO authenticated
  USING (
    admin_id IN (
      SELECT id FROM customers
      WHERE auth_id = (select auth.uid())
      AND role IN ('admin', 'super_admin')
    )
  );

-- -----------------------------------------------------
-- SHIPPING ZONES & RATES & TAX RULES
-- -----------------------------------------------------
DROP POLICY IF EXISTS "Admins can manage shipping zones" ON shipping_zones;
DROP POLICY IF EXISTS "Admins manage shipping zones" ON shipping_zones;
CREATE POLICY "Admins manage shipping zones" ON shipping_zones
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.auth_id = (select auth.uid())
      AND customers.role IN ('admin', 'super_admin')
    )
  );

DROP POLICY IF EXISTS "Admins can manage shipping rates" ON shipping_rates;
DROP POLICY IF EXISTS "Admins manage shipping rates" ON shipping_rates;
CREATE POLICY "Admins manage shipping rates" ON shipping_rates
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.auth_id = (select auth.uid())
      AND customers.role IN ('admin', 'super_admin')
    )
  );

DROP POLICY IF EXISTS "Admins can manage tax rules" ON tax_rules;
DROP POLICY IF EXISTS "Admins manage tax rules" ON tax_rules;
CREATE POLICY "Admins manage tax rules" ON tax_rules
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.auth_id = (select auth.uid())
      AND customers.role IN ('admin', 'super_admin')
    )
  );

-- -----------------------------------------------------
-- PROMOTIONS & PROMOTION PRODUCTS
-- -----------------------------------------------------
DROP POLICY IF EXISTS "Admins can manage promotions" ON promotions;
DROP POLICY IF EXISTS "Admins manage promotions" ON promotions;
CREATE POLICY "Admins manage promotions" ON promotions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.auth_id = (select auth.uid())
      AND customers.role IN ('admin', 'super_admin')
    )
  );

DROP POLICY IF EXISTS "Admins can manage promotion products" ON promotion_products;
DROP POLICY IF EXISTS "Admins manage promotion products" ON promotion_products;
CREATE POLICY "Admins manage promotion products" ON promotion_products
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.auth_id = (select auth.uid())
      AND customers.role IN ('admin', 'super_admin')
    )
  );

-- -----------------------------------------------------
-- ORDERS
-- -----------------------------------------------------
DROP POLICY IF EXISTS "Admins manage orders" ON orders;
CREATE POLICY "Admins manage orders" ON orders
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.auth_id = (select auth.uid())
      AND customers.role IN ('admin', 'super_admin')
    )
  );

-- Users policies
DROP POLICY IF EXISTS "Users create orders" ON orders;
CREATE POLICY "Users create orders" ON orders
  FOR INSERT
  TO authenticated
  WITH CHECK (
    customer_id IN (
      SELECT id FROM customers WHERE auth_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users view own orders" ON orders;
CREATE POLICY "Users view own orders" ON orders
  FOR SELECT
  TO authenticated
  USING (
    customer_id IN (
      SELECT id FROM customers WHERE auth_id = (select auth.uid())
    )
  );

-- -----------------------------------------------------
-- COUPONS
-- -----------------------------------------------------
DROP POLICY IF EXISTS "Admins manage coupons" ON coupons;
DROP POLICY IF EXISTS "coupons_admin_full_access" ON coupons;
CREATE POLICY "Admins manage coupons" ON coupons
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.auth_id = (select auth.uid())
      AND customers.role IN ('admin', 'super_admin')
    )
  );

-- -----------------------------------------------------
-- CUSTOMERS
-- -----------------------------------------------------
DROP POLICY IF EXISTS "Admins view all" ON customers;
DROP POLICY IF EXISTS "admin_full_access" ON customers;
DROP POLICY IF EXISTS "super_admin_full_access" ON customers;
CREATE POLICY "Admins view all" ON customers
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers c
      WHERE c.auth_id = (select auth.uid())
      AND c.role IN ('admin', 'super_admin')
    )
  );

DROP POLICY IF EXISTS "Super admins full access" ON customers;
CREATE POLICY "Super admins full access" ON customers
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers c
      WHERE c.auth_id = (select auth.uid())
      AND c.role = 'super_admin'
    )
  );

DROP POLICY IF EXISTS "Users view own profile" ON customers;
CREATE POLICY "Users view own profile" ON customers
  FOR SELECT
  TO authenticated
  USING (auth_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users update own profile" ON customers;
CREATE POLICY "Users update own profile" ON customers
  FOR UPDATE
  TO authenticated
  USING (auth_id = (select auth.uid()));

-- -----------------------------------------------------
-- RETURNS
-- -----------------------------------------------------
DROP POLICY IF EXISTS "Admins manage returns" ON returns;
CREATE POLICY "Admins manage returns" ON returns
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.auth_id = (select auth.uid())
      AND customers.role IN ('admin', 'super_admin')
    )
  );

COMMIT;
