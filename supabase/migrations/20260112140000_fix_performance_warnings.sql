-- Migration: Fix Performance Warnings (auth_rls_initplan) and Duplicates
-- Date: 2026-01-12

-- UTILITY: Optimizing auth calls by wrapping in (select ...) prevents re-evaluation per row.

-- ==========================================
-- 1. ADDRESSES
-- ==========================================
DROP POLICY IF EXISTS "Users can view own addresses" ON addresses;
DROP POLICY IF EXISTS "Users can insert own addresses" ON addresses;
DROP POLICY IF EXISTS "Users can update own addresses" ON addresses;
DROP POLICY IF EXISTS "Users can delete own addresses" ON addresses;

CREATE POLICY "Users can view own addresses" ON addresses FOR SELECT
USING (customer_id IN (SELECT id FROM customers WHERE auth_id = (select auth.uid())));

CREATE POLICY "Users can insert own addresses" ON addresses FOR INSERT
WITH CHECK (customer_id IN (SELECT id FROM customers WHERE auth_id = (select auth.uid())));

CREATE POLICY "Users can update own addresses" ON addresses FOR UPDATE
USING (customer_id IN (SELECT id FROM customers WHERE auth_id = (select auth.uid())));

CREATE POLICY "Users can delete own addresses" ON addresses FOR DELETE
USING (customer_id IN (SELECT id FROM customers WHERE auth_id = (select auth.uid())));


-- ==========================================
-- 2. ANALYTICS_EVENTS
-- ==========================================
DROP POLICY IF EXISTS "Allow public insert to analytics" ON analytics_events;
DROP POLICY IF EXISTS "Public insert to analytics" ON analytics_events;
DROP POLICY IF EXISTS "Allow admin select analytics" ON analytics_events;

CREATE POLICY "Public insert to analytics" ON analytics_events FOR INSERT
WITH CHECK ((select auth.role()) = 'anon' OR (select auth.role()) = 'authenticated');

CREATE POLICY "Allow admin select analytics" ON analytics_events FOR SELECT
USING ((select auth.role()) = 'service_role');


-- ==========================================
-- 3. BANNERS
-- ==========================================
-- Fix duplicates: "Banners are viewable by everyone", "Public banners are viewable by everyone."
DROP POLICY IF EXISTS "Banners are viewable by everyone" ON banners;
DROP POLICY IF EXISTS "Public banners are viewable by everyone." ON banners;

CREATE POLICY "Public banners are viewable by everyone" ON banners FOR SELECT USING (true);


-- ==========================================
-- 4. CARTS
-- ==========================================
DROP POLICY IF EXISTS "Users can view own cart" ON carts;
DROP POLICY IF EXISTS "Users can insert to own cart" ON carts;
DROP POLICY IF EXISTS "Users can update own cart" ON carts;
DROP POLICY IF EXISTS "Users can delete own cart" ON carts;

CREATE POLICY "Users can view own cart" ON carts FOR SELECT
USING (customer_id IN (SELECT id FROM customers WHERE auth_id = (select auth.uid())));

CREATE POLICY "Users can insert to own cart" ON carts FOR INSERT
WITH CHECK (customer_id IN (SELECT id FROM customers WHERE auth_id = (select auth.uid())));

CREATE POLICY "Users can update own cart" ON carts FOR UPDATE
USING (customer_id IN (SELECT id FROM customers WHERE auth_id = (select auth.uid())));

CREATE POLICY "Users can delete own cart" ON carts FOR DELETE
USING (customer_id IN (SELECT id FROM customers WHERE auth_id = (select auth.uid())));


-- ==========================================
-- 5. CATEGORIES
-- ==========================================
DROP POLICY IF EXISTS "Categories are viewable by everyone" ON categories;
DROP POLICY IF EXISTS "Public categories are viewable by everyone." ON categories;
DROP POLICY IF EXISTS "Admins can insert categories." ON categories;
DROP POLICY IF EXISTS "Admins can update categories." ON categories;

CREATE POLICY "Public categories are viewable by everyone" ON categories FOR SELECT USING (true);

CREATE POLICY "Admins can insert categories" ON categories FOR INSERT
WITH CHECK ((select auth.role()) = 'service_role');

CREATE POLICY "Admins can update categories" ON categories FOR UPDATE
USING ((select auth.role()) = 'service_role');


-- ==========================================
-- 6. CUSTOMERS
-- ==========================================
DROP POLICY IF EXISTS "Users can view own profile." ON customers;
DROP POLICY IF EXISTS "Customers can view own profile" ON customers;
DROP POLICY IF EXISTS "Admins can view all profiles." ON customers;
DROP POLICY IF EXISTS "Users can update own profile." ON customers;
DROP POLICY IF EXISTS "Customers can update own profile" ON customers;

CREATE POLICY "Users can view own profile" ON customers FOR SELECT
USING (auth_id = (select auth.uid()));

CREATE POLICY "Users can update own profile" ON customers FOR UPDATE
USING (auth_id = (select auth.uid()));

CREATE POLICY "Admins can view all profiles" ON customers FOR SELECT
USING (
  EXISTS (SELECT 1 FROM customers WHERE auth_id = (select auth.uid()) AND role = 'admin')
  OR (select auth.role()) = 'service_role'
);


-- ==========================================
-- 7. ORDERS
-- ==========================================
DROP POLICY IF EXISTS "Allow authenticated users full access to orders" ON orders;
DROP POLICY IF EXISTS "Admins can view all orders." ON orders;
DROP POLICY IF EXISTS "Users can read own orders" ON orders;
DROP POLICY IF EXISTS "Users can view own orders." ON orders; -- Variation
DROP POLICY IF EXISTS "Users can create own orders" ON orders;

CREATE POLICY "Users can view own orders" ON orders FOR SELECT
USING (customer_id IN (SELECT id FROM customers WHERE auth_id = (select auth.uid())));

CREATE POLICY "Users can create own orders" ON orders FOR INSERT
WITH CHECK (customer_id IN (SELECT id FROM customers WHERE auth_id = (select auth.uid())));

CREATE POLICY "Admins can view all orders" ON orders FOR SELECT
USING (
  EXISTS (SELECT 1 FROM customers WHERE auth_id = (select auth.uid()) AND role = 'admin')
  OR (select auth.role()) = 'service_role'
);


-- ==========================================
-- 8. ORDER ITEMS
-- ==========================================
DROP POLICY IF EXISTS "Allow authenticated users full access to order_items" ON order_items;
DROP POLICY IF EXISTS "Users can read own order items" ON order_items; -- Variation
DROP POLICY IF EXISTS "Users can view own order items." ON order_items; -- Variation
DROP POLICY IF EXISTS "Users can insert own order items" ON order_items;

CREATE POLICY "Users can view own order items" ON order_items FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM orders
    JOIN customers ON orders.customer_id = customers.id
    WHERE orders.id = order_items.order_id
    AND customers.auth_id = (select auth.uid())
  )
);

CREATE POLICY "Users can insert own order items" ON order_items FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM orders
    JOIN customers ON orders.customer_id = customers.id
    WHERE orders.id = order_items.order_id
    AND customers.auth_id = (select auth.uid())
  )
);


-- ==========================================
-- 9. PRODUCTS
-- ==========================================
DROP POLICY IF EXISTS "Allow authenticated users full access to products" ON products;
DROP POLICY IF EXISTS "Public products are viewable by everyone." ON products;
DROP POLICY IF EXISTS "Public read products" ON products;
DROP POLICY IF EXISTS "Admins can insert products." ON products;
DROP POLICY IF EXISTS "Admins can update products." ON products;
DROP POLICY IF EXISTS "Admins can delete products." ON products;

CREATE POLICY "Public products are viewable by everyone" ON products FOR SELECT USING (true);

CREATE POLICY "Admins can insert products" ON products FOR INSERT
WITH CHECK ((select auth.role()) = 'service_role');

CREATE POLICY "Admins can update products" ON products FOR UPDATE
USING ((select auth.role()) = 'service_role');

CREATE POLICY "Admins can delete products" ON products FOR DELETE
USING ((select auth.role()) = 'service_role');


-- ==========================================
-- 10. REVIEWS
-- ==========================================
DROP POLICY IF EXISTS "Users can insert their own reviews" ON reviews;
DROP POLICY IF EXISTS "Reviews are viewable by everyone" ON reviews;

CREATE POLICY "Reviews are viewable by everyone" ON reviews FOR SELECT USING (true);

CREATE POLICY "Users can insert their own reviews" ON reviews FOR INSERT
WITH CHECK ((select auth.uid()) = user_id);


-- ==========================================
-- 11. WISHLISTS
-- ==========================================
DROP POLICY IF EXISTS "Users can view own wishlist" ON wishlists;
DROP POLICY IF EXISTS "Users can insert to own wishlist" ON wishlists;
DROP POLICY IF EXISTS "Users can update own wishlist" ON wishlists;
DROP POLICY IF EXISTS "Users can delete own wishlist" ON wishlists;

CREATE POLICY "Users can view own wishlist" ON wishlists FOR SELECT
USING (customer_id IN (SELECT id FROM customers WHERE auth_id = (select auth.uid())));

CREATE POLICY "Users can insert to own wishlist" ON wishlists FOR INSERT
WITH CHECK (customer_id IN (SELECT id FROM customers WHERE auth_id = (select auth.uid())));

CREATE POLICY "Users can update own wishlist" ON wishlists FOR UPDATE
USING (customer_id IN (SELECT id FROM customers WHERE auth_id = (select auth.uid())));

CREATE POLICY "Users can delete own wishlist" ON wishlists FOR DELETE
USING (customer_id IN (SELECT id FROM customers WHERE auth_id = (select auth.uid())));
