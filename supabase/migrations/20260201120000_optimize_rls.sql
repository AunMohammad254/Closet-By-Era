-- Optimizing RLS policies to fix performance issues and remove redundancies
-- Fixed version: login_history.user_id, coupons.starts_at/ends_at

BEGIN;

-----------------------------------------------------------------------
-- Banners
-----------------------------------------------------------------------
DROP POLICY IF EXISTS "Admins can manage banners" ON banners;
DROP POLICY IF EXISTS "Admins can delete banners" ON banners;
DROP POLICY IF EXISTS "Anyone can read active banners" ON banners;
DROP POLICY IF EXISTS "Public banners are viewable by everyone" ON banners;
DROP POLICY IF EXISTS "Admins can update banners" ON banners;

CREATE POLICY "Admins can manage banners" ON banners
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.auth_id = (select auth.uid())
      AND customers.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Anyone can read active banners" ON banners
  FOR SELECT
  USING (is_active = true);

-----------------------------------------------------------------------
-- Popups
-----------------------------------------------------------------------
DROP POLICY IF EXISTS "Admins can manage popups" ON popups;
DROP POLICY IF EXISTS "Anyone can read active popups" ON popups;

CREATE POLICY "Admins can manage popups" ON popups
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.auth_id = (select auth.uid())
      AND customers.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Anyone can read active popups" ON popups
  FOR SELECT
  USING (is_active = true);

-----------------------------------------------------------------------
-- FAQs
-----------------------------------------------------------------------
DROP POLICY IF EXISTS "Admins can manage faqs" ON faqs;
DROP POLICY IF EXISTS "Anyone can read active faqs" ON faqs;

CREATE POLICY "Admins can manage faqs" ON faqs
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.auth_id = (select auth.uid())
      AND customers.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Anyone can read active faqs" ON faqs
  FOR SELECT
  USING (is_active = true);

-----------------------------------------------------------------------
-- Login History
-----------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view their own login history" ON login_history;
DROP POLICY IF EXISTS "Users can insert their own login history" ON login_history;

CREATE POLICY "Users can view their own login history" ON login_history
  FOR SELECT
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert their own login history" ON login_history
  FOR INSERT
  WITH CHECK (user_id = (select auth.uid()));

-----------------------------------------------------------------------
-- Customers
-----------------------------------------------------------------------
DROP POLICY IF EXISTS "super_admin_full_access_customers" ON customers;
DROP POLICY IF EXISTS "Admins can delete customers" ON customers;
DROP POLICY IF EXISTS "Admins can insert customers" ON customers;
DROP POLICY IF EXISTS "Super admins can view all customers" ON customers;
DROP POLICY IF EXISTS "Users can view their own profile" ON customers;
DROP POLICY IF EXISTS "admin_view_all_customers" ON customers;
DROP POLICY IF EXISTS "users_view_own_customer" ON customers;
DROP POLICY IF EXISTS "users_update_own_customer" ON customers;
DROP POLICY IF EXISTS "super_admin_manage_roles" ON customers;
DROP POLICY IF EXISTS "View customers" ON customers;

-- 1. Super Admin Full Access
CREATE POLICY "Super admins full access" ON customers
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM customers c
      WHERE c.auth_id = (select auth.uid())
      AND c.role = 'super_admin'
    )
  );

-- 2. Admins View All
CREATE POLICY "Admins view all" ON customers
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM customers c
      WHERE c.auth_id = (select auth.uid())
      AND c.role IN ('admin', 'super_admin')
    )
  );

-- 3. Admins Create (e.g. creating users manually)
CREATE POLICY "Admins insert customers" ON customers
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM customers c
      WHERE c.auth_id = (select auth.uid())
      AND c.role IN ('admin', 'super_admin')
    )
  );

-- 4. Admins Delete (e.g. deleting users)
CREATE POLICY "Admins delete customers" ON customers
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM customers c
      WHERE c.auth_id = (select auth.uid())
      AND c.role IN ('admin', 'super_admin')
    )
  );

-- 5. Users View Own
CREATE POLICY "Users view own profile" ON customers
  FOR SELECT
  USING (auth_id = (select auth.uid()));

-- 6. Users Update Own
CREATE POLICY "Users update own profile" ON customers
  FOR UPDATE
  USING (auth_id = (select auth.uid()));

-----------------------------------------------------------------------
-- Admin Notifications
-----------------------------------------------------------------------
DROP POLICY IF EXISTS "Admins can view notifications" ON admin_notifications;
DROP POLICY IF EXISTS "Admins can update notifications" ON admin_notifications;
DROP POLICY IF EXISTS "System can insert notifications" ON admin_notifications;

CREATE POLICY "Admins manage notifications" ON admin_notifications
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.auth_id = (select auth.uid())
      AND customers.role IN ('admin', 'super_admin')
    )
  );

-----------------------------------------------------------------------
-- Admin Saved Filters
-----------------------------------------------------------------------
DROP POLICY IF EXISTS "Admins can manage own filters" ON admin_saved_filters;

CREATE POLICY "Admins manage own filters" ON admin_saved_filters
  FOR ALL
  USING (
    admin_id = (select auth.uid())
    AND EXISTS (
      SELECT 1 FROM customers
      WHERE customers.auth_id = (select auth.uid())
      AND customers.role IN ('admin', 'super_admin')
    )
  );

-----------------------------------------------------------------------
-- Returns
-----------------------------------------------------------------------
DROP POLICY IF EXISTS "Customers can view own returns" ON returns;
DROP POLICY IF EXISTS "Customers can create returns" ON returns;
DROP POLICY IF EXISTS "Admins can manage returns" ON returns;

CREATE POLICY "Admins manage returns" ON returns
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.auth_id = (select auth.uid())
      AND customers.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Customers view own returns" ON returns
  FOR SELECT
  USING (
    customer_id IN (
      SELECT id FROM customers WHERE auth_id = (select auth.uid())
    )
  );

CREATE POLICY "Customers create returns" ON returns
  FOR INSERT
  WITH CHECK (
    customer_id IN (
      SELECT id FROM customers WHERE auth_id = (select auth.uid())
    )
  );

-----------------------------------------------------------------------
-- Shipping Zones & Rates & Tax Rules
-----------------------------------------------------------------------
-- (Shipping Zones)
DROP POLICY IF EXISTS "Admins can manage shipping zones" ON shipping_zones;
DROP POLICY IF EXISTS "Anyone can read shipping zones" ON shipping_zones;

CREATE POLICY "Admins manage shipping zones" ON shipping_zones
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.auth_id = (select auth.uid())
      AND customers.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Anyone can read shipping zones" ON shipping_zones
  FOR SELECT
  USING (true);

-- (Shipping Rates)
DROP POLICY IF EXISTS "Admins can manage shipping rates" ON shipping_rates;
DROP POLICY IF EXISTS "Anyone can read shipping rates" ON shipping_rates;

CREATE POLICY "Admins manage shipping rates" ON shipping_rates
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.auth_id = (select auth.uid())
      AND customers.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Anyone can read shipping rates" ON shipping_rates
  FOR SELECT
  USING (true);

-- (Tax Rules)
DROP POLICY IF EXISTS "Admins can manage tax rules" ON tax_rules;
DROP POLICY IF EXISTS "Anyone can read tax rules" ON tax_rules;

CREATE POLICY "Admins manage tax rules" ON tax_rules
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.auth_id = (select auth.uid())
      AND customers.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Anyone can read tax rules" ON tax_rules
  FOR SELECT
  USING (true);

-----------------------------------------------------------------------
-- Promotions
-----------------------------------------------------------------------
DROP POLICY IF EXISTS "Admins can manage promotions" ON promotions;
DROP POLICY IF EXISTS "Anyone can read active promotions" ON promotions;

CREATE POLICY "Admins manage promotions" ON promotions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.auth_id = (select auth.uid())
      AND customers.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Anyone can read active promotions" ON promotions
  FOR SELECT
  USING (is_active = true);

-----------------------------------------------------------------------
-- Promotion Products
-----------------------------------------------------------------------
DROP POLICY IF EXISTS "Admins can manage promotion products" ON promotion_products;
DROP POLICY IF EXISTS "Anyone can read promotion products" ON promotion_products;

CREATE POLICY "Admins manage promotion products" ON promotion_products
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.auth_id = (select auth.uid())
      AND customers.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Anyone can read promotion products" ON promotion_products
  FOR SELECT
  USING (true);

-----------------------------------------------------------------------
-- Orders
-----------------------------------------------------------------------
DROP POLICY IF EXISTS "admin_manage_orders" ON orders;
DROP POLICY IF EXISTS "users_create_orders" ON orders;
DROP POLICY IF EXISTS "users_view_own_orders" ON orders;
DROP POLICY IF EXISTS "admin_full_access" ON orders;

CREATE POLICY "Admins manage orders" ON orders
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.auth_id = (select auth.uid())
      AND customers.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Users create orders" ON orders
  FOR INSERT
  WITH CHECK (
    customer_id IN (
      SELECT id FROM customers WHERE auth_id = (select auth.uid())
    )
  );

CREATE POLICY "Users view own orders" ON orders
  FOR SELECT
  USING (
    customer_id IN (
      SELECT id FROM customers WHERE auth_id = (select auth.uid())
    )
  );

-----------------------------------------------------------------------
-- Coupons
-----------------------------------------------------------------------
DROP POLICY IF EXISTS "Admins can delete coupons" ON coupons;
DROP POLICY IF EXISTS "Admins can insert coupons" ON coupons;
DROP POLICY IF EXISTS "Admins manage coupons" ON coupons; -- drop self if exists
DROP POLICY IF EXISTS "admin_full_access" ON coupons;
DROP POLICY IF EXISTS "public_read_valid_coupons" ON coupons;
DROP POLICY IF EXISTS "Public read valid coupons" ON coupons;

CREATE POLICY "Admins manage coupons" ON coupons
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.auth_id = (select auth.uid())
      AND customers.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Public read valid coupons" ON coupons
  FOR SELECT
  USING (
    is_active = true 
    AND (starts_at IS NULL OR starts_at <= now())
    AND (ends_at IS NULL OR ends_at >= now())
  );

COMMIT;
