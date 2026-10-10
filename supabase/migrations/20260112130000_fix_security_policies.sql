-- Migration: Fix Security Warnings and Tighten RLS (Corrected)
-- Date: 2026-01-12

-- 1. Fix Function Search Path Mutable
ALTER FUNCTION public.handle_new_user() SET search_path = public;

-- 2. Fix Permissive Analytics Policy
DROP POLICY IF EXISTS "Allow public insert to analytics" ON analytics_events;
CREATE POLICY "Public insert to analytics"
ON analytics_events
FOR INSERT
WITH CHECK (
  auth.role() = 'anon' OR auth.role() = 'authenticated'
);

-- 3. Fix Permissive Products Policy
-- Removing the dangerous "full access" policy
DROP POLICY IF EXISTS "Allow authenticated users full access to products" ON products;

-- Ensure Public Read
DROP POLICY IF EXISTS "Public read products" ON products; 
CREATE POLICY "Public read products"
ON products
FOR SELECT
USING (true);

-- 4. Fix Permissive Orders Policy
DROP POLICY IF EXISTS "Allow authenticated users full access to orders" ON orders;

-- Users can read their own orders via customers table lookup
CREATE POLICY "Users can read own orders"
ON orders
FOR SELECT
USING (
  customer_id IN (
    SELECT id FROM customers WHERE auth_id = auth.uid()
  )
);

-- Users can create orders if they map to the correct customer
CREATE POLICY "Users can create own orders"
ON orders
FOR INSERT
WITH CHECK (
  customer_id IN (
    SELECT id FROM customers WHERE auth_id = auth.uid()
  )
);


-- 5. Fix Permissive Order Items Policy
DROP POLICY IF EXISTS "Allow authenticated users full access to order_items" ON order_items;

-- Users can read items if they own the parent order
CREATE POLICY "Users can read own order items"
ON order_items
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM orders
    JOIN customers ON orders.customer_id = customers.id
    WHERE orders.id = order_items.order_id
    AND customers.auth_id = auth.uid()
  )
);

-- Users can insert items (usually handled by backend, but if client does it):
CREATE POLICY "Users can insert own order items"
ON order_items
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM orders
    JOIN customers ON orders.customer_id = customers.id
    WHERE orders.id = order_items.order_id
    AND customers.auth_id = auth.uid()
  )
);
