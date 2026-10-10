-- Optimizing RLS policies for Reviews, Carts, Cart Items, Wishlists, Audit Logs

BEGIN;

-----------------------------------------------------------------------
-- Audit Logs
-----------------------------------------------------------------------
DROP POLICY IF EXISTS "Admins can view audit logs" ON audit_logs;
DROP POLICY IF EXISTS "Admins/Service can insert audit logs" ON audit_logs;

CREATE POLICY "Admins view audit logs" ON audit_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.auth_id = (select auth.uid())
      AND customers.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins or Service insert audit logs" ON audit_logs
  FOR INSERT
  WITH CHECK (
    (auth.role() = 'service_role') OR
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.auth_id = (select auth.uid())
      AND customers.role IN ('admin', 'super_admin')
    )
  );

-----------------------------------------------------------------------
-- Reviews
-----------------------------------------------------------------------
DROP POLICY IF EXISTS "admin_delete_reviews" ON reviews;
DROP POLICY IF EXISTS "reviews_user_update" ON reviews;
DROP POLICY IF EXISTS "users_create_reviews" ON reviews;
DROP POLICY IF EXISTS "public_read_reviews" ON reviews;
DROP POLICY IF EXISTS "Admins manage reviews" ON reviews;

CREATE POLICY "Admins manage reviews" ON reviews
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.auth_id = (select auth.uid())
      AND customers.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Users insert reviews" ON reviews
  FOR INSERT
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users update own reviews" ON reviews
  FOR UPDATE
  USING (user_id = (select auth.uid()));

CREATE POLICY "Public read reviews" ON reviews
  FOR SELECT
  USING (true);

-----------------------------------------------------------------------
-- Carts
-----------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can delete own cart" ON carts;
DROP POLICY IF EXISTS "Users can insert to own cart" ON carts;
DROP POLICY IF EXISTS "Users can update own cart" ON carts;
DROP POLICY IF EXISTS "Users can view own cart" ON carts;
DROP POLICY IF EXISTS "Users manage own cart" ON carts;

CREATE POLICY "Users manage own cart" ON carts
  FOR ALL
  USING (
     customer_id IN (
       SELECT id FROM customers WHERE auth_id = (select auth.uid())
     )
  );

-----------------------------------------------------------------------
-- Cart Items
-----------------------------------------------------------------------
DROP POLICY IF EXISTS "users_manage_own_cart" ON cart_items;
DROP POLICY IF EXISTS "Users manage own cart items" ON cart_items;

CREATE POLICY "Users manage own cart items" ON cart_items
  FOR ALL
  USING (user_id = (select auth.uid()));

-----------------------------------------------------------------------
-- Wishlists
-----------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can delete own wishlist" ON wishlists;
DROP POLICY IF EXISTS "Users can insert to own wishlist" ON wishlists;
DROP POLICY IF EXISTS "Users can update own wishlist" ON wishlists;
DROP POLICY IF EXISTS "Users can view own wishlist" ON wishlists;
DROP POLICY IF EXISTS "Users manage own wishlist" ON wishlists;

CREATE POLICY "Users manage own wishlist" ON wishlists
  FOR ALL
  USING (
     customer_id IN (
       SELECT id FROM customers WHERE auth_id = (select auth.uid())
     )
  );

COMMIT;
