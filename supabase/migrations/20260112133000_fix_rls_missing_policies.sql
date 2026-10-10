-- Migration: Fix "RLS Enabled No Policy" Warnings
-- Date: 2026-01-12

-- 1. Secure 'addresses' table
-- Linked via customer_id -> customers(id) -> auth_id -> auth.users(id)
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own addresses" ON addresses;
CREATE POLICY "Users can view own addresses" ON addresses FOR SELECT
USING (
  customer_id IN (SELECT id FROM customers WHERE auth_id = auth.uid())
);

DROP POLICY IF EXISTS "Users can insert own addresses" ON addresses;
CREATE POLICY "Users can insert own addresses" ON addresses FOR INSERT
WITH CHECK (
  customer_id IN (SELECT id FROM customers WHERE auth_id = auth.uid())
);

DROP POLICY IF EXISTS "Users can update own addresses" ON addresses;
CREATE POLICY "Users can update own addresses" ON addresses FOR UPDATE
USING (
  customer_id IN (SELECT id FROM customers WHERE auth_id = auth.uid())
);

DROP POLICY IF EXISTS "Users can delete own addresses" ON addresses;
CREATE POLICY "Users can delete own addresses" ON addresses FOR DELETE
USING (
  customer_id IN (SELECT id FROM customers WHERE auth_id = auth.uid())
);


-- 2. Secure 'carts' table
-- Assumes carts are for authenticated users (customer_id).
-- If anonymous carts are stored here via 'session_id', we might need a broader policy or just client-side logic.
-- For now, securing for authenticated users to resolve warning.
ALTER TABLE carts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own cart" ON carts;
CREATE POLICY "Users can view own cart" ON carts FOR SELECT
USING (
  customer_id IN (SELECT id FROM customers WHERE auth_id = auth.uid())
);

DROP POLICY IF EXISTS "Users can insert to own cart" ON carts;
CREATE POLICY "Users can insert to own cart" ON carts FOR INSERT
WITH CHECK (
  customer_id IN (SELECT id FROM customers WHERE auth_id = auth.uid())
);

DROP POLICY IF EXISTS "Users can update own cart" ON carts;
CREATE POLICY "Users can update own cart" ON carts FOR UPDATE
USING (
  customer_id IN (SELECT id FROM customers WHERE auth_id = auth.uid())
);

DROP POLICY IF EXISTS "Users can delete own cart" ON carts;
CREATE POLICY "Users can delete own cart" ON carts FOR DELETE
USING (
  customer_id IN (SELECT id FROM customers WHERE auth_id = auth.uid())
);


-- 3. Secure 'coupons' table
-- Global table, usually Admin managed, Users view.
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public view coupons" ON coupons;
CREATE POLICY "Public view coupons" ON coupons FOR SELECT
USING (true);

-- Admin only write (Service Role bypasses, so just don't add Auth write policy)


-- 4. Secure 'wishlists' table
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own wishlist" ON wishlists;
CREATE POLICY "Users can view own wishlist" ON wishlists FOR SELECT
USING (
  customer_id IN (SELECT id FROM customers WHERE auth_id = auth.uid())
);

DROP POLICY IF EXISTS "Users can insert to own wishlist" ON wishlists;
CREATE POLICY "Users can insert to own wishlist" ON wishlists FOR INSERT
WITH CHECK (
  customer_id IN (SELECT id FROM customers WHERE auth_id = auth.uid())
);

DROP POLICY IF EXISTS "Users can update own wishlist" ON wishlists;
CREATE POLICY "Users can update own wishlist" ON wishlists FOR UPDATE
USING (
  customer_id IN (SELECT id FROM customers WHERE auth_id = auth.uid())
);

DROP POLICY IF EXISTS "Users can delete own wishlist" ON wishlists;
CREATE POLICY "Users can delete own wishlist" ON wishlists FOR DELETE
USING (
  customer_id IN (SELECT id FROM customers WHERE auth_id = auth.uid())
);
