-- Optimizing RLS policies for Products, Categories, Variants, Images, Order Items, Addresses

BEGIN;

-----------------------------------------------------------------------
-- Categories
-----------------------------------------------------------------------
DROP POLICY IF EXISTS "Admins can delete categories" ON categories;
DROP POLICY IF EXISTS "Admins can manage categories" ON categories;
DROP POLICY IF EXISTS "Admins can update categories" ON categories;
DROP POLICY IF EXISTS "Public categories are viewable by everyone" ON categories;

CREATE POLICY "Admins manage categories" ON categories
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.auth_id = (select auth.uid())
      AND customers.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Public read categories" ON categories
  FOR SELECT
  USING (true);

-----------------------------------------------------------------------
-- Products
-----------------------------------------------------------------------
DROP POLICY IF EXISTS "Admins can delete products" ON products;
DROP POLICY IF EXISTS "Admins can manage products" ON products;
DROP POLICY IF EXISTS "Admins can update products" ON products;
DROP POLICY IF EXISTS "Public products are viewable by everyone" ON products;

CREATE POLICY "Admins manage products" ON products
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.auth_id = (select auth.uid())
      AND customers.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Public read products" ON products
  FOR SELECT
  USING (true);

-----------------------------------------------------------------------
-- Product Variants
-----------------------------------------------------------------------
DROP POLICY IF EXISTS "Admins can delete product_variants" ON product_variants;
DROP POLICY IF EXISTS "Admins can insert product_variants" ON product_variants;
DROP POLICY IF EXISTS "Admins can update product_variants" ON product_variants;
DROP POLICY IF EXISTS "Allow public read access on variants" ON product_variants;

CREATE POLICY "Admins manage product_variants" ON product_variants
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.auth_id = (select auth.uid())
      AND customers.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Public read product_variants" ON product_variants
  FOR SELECT
  USING (true);

-----------------------------------------------------------------------
-- Product Images
-----------------------------------------------------------------------
DROP POLICY IF EXISTS "Admins can delete product_images" ON product_images;
DROP POLICY IF EXISTS "Admins can insert product_images" ON product_images;
DROP POLICY IF EXISTS "Admins can update product_images" ON product_images;
DROP POLICY IF EXISTS "Allow public read access on images" ON product_images;

CREATE POLICY "Admins manage product_images" ON product_images
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.auth_id = (select auth.uid())
      AND customers.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Public read product_images" ON product_images
  FOR SELECT
  USING (true);

-----------------------------------------------------------------------
-- Order Items
-----------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can insert own order items" ON order_items;
DROP POLICY IF EXISTS "Users can view own order items" ON order_items;

CREATE POLICY "Admins manage order items" ON order_items
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.auth_id = (select auth.uid())
      AND customers.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Users manage own order items" ON order_items
  FOR ALL
  USING (
    order_id IN (
      SELECT id FROM orders WHERE customer_id IN (
        SELECT id FROM customers WHERE auth_id = (select auth.uid())
      )
    )
  );

-----------------------------------------------------------------------
-- Addresses
-----------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can delete own addresses" ON addresses;
DROP POLICY IF EXISTS "Users can insert own addresses" ON addresses;
DROP POLICY IF EXISTS "Users can update own addresses" ON addresses;
DROP POLICY IF EXISTS "Users can view own addresses" ON addresses;

CREATE POLICY "Admins manage addresses" ON addresses
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.auth_id = (select auth.uid())
      AND customers.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Users manage own addresses" ON addresses
  FOR ALL
  USING (
     customer_id IN (
       SELECT id FROM customers WHERE auth_id = (select auth.uid())
     )
  );

COMMIT;
