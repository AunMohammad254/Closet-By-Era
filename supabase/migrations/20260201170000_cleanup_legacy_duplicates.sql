-- =====================================================
-- CLEANUP LEGACY DUPLICATES & FIX MISSING TABLES (FIXED)
-- =====================================================
-- 1. Drops lingering "Admins manage..." and "Anyone can..." policies
-- 2. Implements Split Command policies for 'returns' (using customer_id) and 'promotion_products'

-- =====================================================
-- TABLE: PROMOTIONS (Cleanup)
-- =====================================================
DROP POLICY IF EXISTS "Admins manage promotions" ON promotions;
DROP POLICY IF EXISTS "Anyone can read active promotions" ON promotions;

-- =====================================================
-- TABLE: SHIPPING_RATES (Cleanup)
-- =====================================================
DROP POLICY IF EXISTS "Admins manage shipping rates" ON shipping_rates;
DROP POLICY IF EXISTS "Anyone can read shipping rates" ON shipping_rates;

-- =====================================================
-- TABLE: SHIPPING_ZONES (Cleanup)
-- =====================================================
DROP POLICY IF EXISTS "Admins manage shipping zones" ON shipping_zones;
DROP POLICY IF EXISTS "Anyone can read shipping zones" ON shipping_zones;

-- =====================================================
-- TABLE: TAX_RULES (Cleanup)
-- =====================================================
DROP POLICY IF EXISTS "Admins manage tax rules" ON tax_rules;

-- =====================================================
-- TABLE: PROMOTION_PRODUCTS
-- =====================================================
DROP POLICY IF EXISTS "Admins manage promotion products" ON promotion_products;
DROP POLICY IF EXISTS "Anyone can read promotion products" ON promotion_products;

CREATE POLICY "Anon read promotion_products" ON promotion_products
  FOR SELECT TO anon
  USING (true);

CREATE POLICY "Auth read promotion_products" ON promotion_products
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Auth write promotion_products" ON promotion_products
  FOR INSERT TO authenticated
  WITH CHECK (is_admin_or_super());

CREATE POLICY "Auth update promotion_products" ON promotion_products
  FOR UPDATE TO authenticated
  USING (is_admin_or_super());

CREATE POLICY "Auth delete promotion_products" ON promotion_products
  FOR DELETE TO authenticated
  USING (is_admin_or_super());


-- =====================================================
-- TABLE: RETURNS
-- =====================================================
DROP POLICY IF EXISTS "Admins can manage returns" ON returns;
DROP POLICY IF EXISTS "Admins manage returns" ON returns;
DROP POLICY IF EXISTS "Customers can create returns" ON returns;
DROP POLICY IF EXISTS "Customers create returns" ON returns;
DROP POLICY IF EXISTS "Customers can view own returns" ON returns;
DROP POLICY IF EXISTS "Customers view own returns" ON returns;

-- Auth Read: Admin OR Own
CREATE POLICY "Auth read returns" ON returns
  FOR SELECT TO authenticated
  USING (
    is_admin_or_super()
    OR
    customer_id = (select get_my_customer_id())
  );

-- Auth Insert: Own (Admin can? Maybe system, but usually users initiate)
CREATE POLICY "Auth insert returns" ON returns
  FOR INSERT TO authenticated
  WITH CHECK (
    customer_id = (select get_my_customer_id())
    OR is_admin_or_super()
  );

-- Auth Update: Admin (Process return) OR Own (Maybe cancel?)
CREATE POLICY "Auth update returns" ON returns
  FOR UPDATE TO authenticated
  USING (
    is_admin_or_super()
    OR
    customer_id = (select get_my_customer_id())
  );

-- Auth Delete: Admin Only
CREATE POLICY "Auth delete returns" ON returns
  FOR DELETE TO authenticated
  USING (is_admin_or_super());
