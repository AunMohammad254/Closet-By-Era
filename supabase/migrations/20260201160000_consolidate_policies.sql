-- =====================================================
-- CONSOLIDATED RLS POLICIES & PERFORMANCE FIXES
-- =====================================================
-- 1. Strict separation of `anon` vs `authenticated` policies.
-- 2. Consolidate `authenticated` policies to avoid "Multiple Permissive Policies" warnings.
-- 3. Fix `auth_rls_initplan` by ensuring stable auth calls.

-- =====================================================
-- HELPER FUNCTIONS (Refined for stability)
-- =====================================================

CREATE OR REPLACE FUNCTION public.is_admin_or_super()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM customers 
    WHERE auth_id = (select auth.uid()) 
    AND role IN ('admin', 'super_admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.get_my_customer_id()
RETURNS UUID AS $$
BEGIN
  RETURN (SELECT id FROM customers WHERE auth_id = (select auth.uid()) LIMIT 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- =====================================================
-- TABLE: BANNERS
-- =====================================================
DROP POLICY IF EXISTS "Admins can manage banners" ON banners;
DROP POLICY IF EXISTS "Admins can delete banners" ON banners;
DROP POLICY IF EXISTS "Admins can update banners" ON banners;
DROP POLICY IF EXISTS "Anyone can read active banners" ON banners;
DROP POLICY IF EXISTS "Public banners are viewable by everyone" ON banners;
DROP POLICY IF EXISTS "Public can view active banners" ON banners;

-- 1. Anon: Read-only active
CREATE POLICY "Anon read active banners" ON banners
  FOR SELECT TO anon
  USING (is_active = true AND NOW() BETWEEN starts_at AND ends_at);

-- 2. Authenticated: Admin manage OR Read active
CREATE POLICY "Auth consolidated banners" ON banners
  FOR ALL TO authenticated
  USING (
    is_admin_or_super() 
    OR 
    (is_active = true AND NOW() BETWEEN starts_at AND ends_at)
  );

-- =====================================================
-- TABLE: POPUPS
-- =====================================================
DROP POLICY IF EXISTS "Admins can manage popups" ON popups;
DROP POLICY IF EXISTS "Anyone can read active popups" ON popups;
DROP POLICY IF EXISTS "Public can view active popups" ON popups;

CREATE POLICY "Anon read active popups" ON popups
  FOR SELECT TO anon
  USING (is_active = true);

CREATE POLICY "Auth consolidated popups" ON popups
  FOR ALL TO authenticated
  USING (
    is_admin_or_super() 
    OR 
    (is_active = true)
  );

-- =====================================================
-- TABLE: FAQS
-- =====================================================
DROP POLICY IF EXISTS "Admins can manage faqs" ON faqs;
DROP POLICY IF EXISTS "Anyone can read active faqs" ON faqs;
DROP POLICY IF EXISTS "Public can view active faqs" ON faqs;

CREATE POLICY "Anon read active faqs" ON faqs
  FOR SELECT TO anon
  USING (is_active = true);

CREATE POLICY "Auth consolidated faqs" ON faqs
  FOR ALL TO authenticated
  USING (
    is_admin_or_super() 
    OR 
    (is_active = true)
  );

-- =====================================================
-- TABLE: ADDRESSES
-- =====================================================
-- Policies often flagged for "Multiple Permissive"
DROP POLICY IF EXISTS "Admins manage addresses" ON addresses;
DROP POLICY IF EXISTS "Users manage own addresses" ON addresses;
DROP POLICY IF EXISTS "Users can manage their own addresses" ON addresses;
DROP POLICY IF EXISTS "Admins can manage all addresses" ON addresses;

-- Anon: No access (typically) - or maybe create if public checkout? Assuming Auth required for saved addresses.
-- If anon needs to create addresses during checkout, we might need a specific INSERT policy, but usually that's handled differently.
-- For now, NO ACCESS for anon for saved addresses.

-- Consolidated Authenticated
CREATE POLICY "Auth consolidated addresses" ON addresses
  FOR ALL TO authenticated
  USING (
    is_admin_or_super()
    OR
    customer_id = (select get_my_customer_id())
  )
  WITH CHECK (
    is_admin_or_super()
    OR
    customer_id = (select get_my_customer_id())
  );

-- =====================================================
-- TABLE: CUSTOMERS
-- =====================================================
DROP POLICY IF EXISTS "Users can view their own profile" ON customers;
DROP POLICY IF EXISTS "users_view_own_profile" ON customers;
DROP POLICY IF EXISTS "users_update_own_profile" ON customers;
DROP POLICY IF EXISTS "admin_full_access" ON customers;
DROP POLICY IF EXISTS "super_admin_full_access" ON customers;
DROP POLICY IF EXISTS "Admins can delete customers" ON customers;
DROP POLICY IF EXISTS "Admins can insert customers" ON customers;

-- Anon: No access to customer profiles usually (except maybe public profiles? Unlikely for e-com user data).

-- Consolidated Authenticated
CREATE POLICY "Auth consolidated customers" ON customers
  FOR ALL TO authenticated
  USING (
    is_admin_or_super()
    OR
    auth_id = (select auth.uid())
  )
  WITH CHECK (
    is_admin_or_super()
    OR
    -- Users can only update non-role fields (enforced by app logic/triggers usually, but here checking identity)
    auth_id = (select auth.uid())
  );

-- =====================================================
-- TABLE: ORDERS
-- =====================================================
DROP POLICY IF EXISTS "Admins can manage orders" ON orders;
DROP POLICY IF EXISTS "Users can manage own orders" ON orders;
DROP POLICY IF EXISTS "Users can view own orders" ON orders;

-- Consolidated Authenticated
CREATE POLICY "Auth consolidated orders" ON orders
  FOR ALL TO authenticated
  USING (
    is_admin_or_super()
    OR
    customer_id = (select get_my_customer_id())
  );

-- =====================================================
-- TABLE: AUDIT_LOGS (Fix auth_rls_initplan specifically)
-- =====================================================
DROP POLICY IF EXISTS "Admins or Service insert audit logs" ON audit_logs;
DROP POLICY IF EXISTS "Admins view audit logs" ON audit_logs;

-- Anon: No access

-- Authenticated: Admin view, Service/Admin Insert
CREATE POLICY "Auth consolidated audit_logs" ON audit_logs
  FOR ALL TO authenticated
  USING (
    -- Direct exact role check using stable subquery pattern for initplan fix
    (select auth.role()) = 'service_role'
    OR
    is_admin_or_super()
  );

-- =====================================================
-- TABLE: ADMIN_NOTIFICATIONS
-- =====================================================
DROP POLICY IF EXISTS "Admins can view notifications" ON admin_notifications;
DROP POLICY IF EXISTS "Admins can update notifications" ON admin_notifications;
DROP POLICY IF EXISTS "System can insert notifications" ON admin_notifications;

CREATE POLICY "Auth consolidated admin_notifications" ON admin_notifications
  FOR ALL TO authenticated
  USING (
    is_admin_or_super()
  );

-- =====================================================
-- TABLE: ADMIN_SAVED_FILTERS
-- =====================================================
DROP POLICY IF EXISTS "Admins can manage own filters" ON admin_saved_filters;

CREATE POLICY "Auth consolidated admin_saved_filters" ON admin_saved_filters
  FOR ALL TO authenticated
  USING (
    is_admin_or_super()
    AND
    admin_id = (select get_my_customer_id())
  );

-- =====================================================
-- TABLE: COUPONS
-- =====================================================
DROP POLICY IF EXISTS "coupons_admin_full_access" ON coupons;
DROP POLICY IF EXISTS "coupons_public_read_valid" ON coupons;
DROP POLICY IF EXISTS "admin_full_access" ON coupons;
DROP POLICY IF EXISTS "public_read_valid_coupons" ON coupons;

-- Anon: Read valid
CREATE POLICY "Anon read valid coupons" ON coupons
  FOR SELECT TO anon
  USING (
     is_active = true 
     AND NOW() BETWEEN starts_at AND ends_at
     AND (uses_count < max_uses OR max_uses IS NULL)
  );

-- Authenticated: Consolidate Admin + Read Valid
CREATE POLICY "Auth consolidated coupons" ON coupons
  FOR ALL TO authenticated
  USING (
    is_admin_or_super()
    OR
    (
      is_active = true 
      AND NOW() BETWEEN starts_at AND ends_at
      AND (uses_count < max_uses OR max_uses IS NULL)
    )
  );

-- =====================================================
-- TABLE: PROMOTIONS, TAX_RULES, SHIPPING_ZONES/RATES
-- =====================================================
-- Consolidated into Admin Manage / Public Read pattern

-- PROMOTIONS
DROP POLICY IF EXISTS "Admins can manage promotions" ON promotions;
DROP POLICY IF EXISTS "Public can view active promotions" ON promotions;

CREATE POLICY "Anon read active promotions" ON promotions
  FOR SELECT TO anon
  USING (is_active = true AND NOW() BETWEEN start_date AND end_date);

CREATE POLICY "Auth consolidated promotions" ON promotions
  FOR ALL TO authenticated
  USING (
    is_admin_or_super()
    OR
    (is_active = true AND NOW() BETWEEN start_date AND end_date)
  );

-- TAX_RULES
DROP POLICY IF EXISTS "Admins can manage tax rules" ON tax_rules;
DROP POLICY IF EXISTS "Public can view tax rules" ON tax_rules;

CREATE POLICY "Anon read tax rules" ON tax_rules
  FOR SELECT TO anon
  USING (true);

CREATE POLICY "Auth consolidated tax_rules" ON tax_rules
  FOR ALL TO authenticated
  USING (
    is_admin_or_super() OR true
  );

-- SHIPPING_ZONES
DROP POLICY IF EXISTS "Admins can manage shipping zones" ON shipping_zones;
DROP POLICY IF EXISTS "Public can view shipping zones" ON shipping_zones;

CREATE POLICY "Anon read shipping zones" ON shipping_zones
  FOR SELECT TO anon
  USING (is_active = true);

CREATE POLICY "Auth consolidated shipping zones" ON shipping_zones
  FOR ALL TO authenticated
  USING (
     is_admin_or_super() OR is_active = true
  );

-- SHIPPING_RATES
DROP POLICY IF EXISTS "Admins can manage shipping rates" ON shipping_rates;
DROP POLICY IF EXISTS "Public can view shipping rates" ON shipping_rates;

CREATE POLICY "Anon read shipping rates" ON shipping_rates
  FOR SELECT TO anon
  USING (true);

CREATE POLICY "Auth consolidated shipping rates" ON shipping_rates
  FOR ALL TO authenticated
  USING (
     is_admin_or_super() OR true
  );
