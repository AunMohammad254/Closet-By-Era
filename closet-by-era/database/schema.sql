-- Closet By Era - Supabase Database Schema & Seed Data
-- Run this in the Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- Categories Table
-- =============================================
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  image_url TEXT,
  parent_id UUID REFERENCES categories(id),
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- Products Table
-- =============================================
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  short_description VARCHAR(500),
  price DECIMAL(10, 2) NOT NULL,
  original_price DECIMAL(10, 2),
  category_id UUID REFERENCES categories(id),
  sku VARCHAR(100) UNIQUE,
  in_stock BOOLEAN DEFAULT true,
  stock_quantity INT DEFAULT 0,
  featured BOOLEAN DEFAULT false,
  is_new BOOLEAN DEFAULT false,
  is_sale BOOLEAN DEFAULT false,
  images JSONB DEFAULT '[]',
  sizes JSONB DEFAULT '[]',
  colors JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- Banners Table
-- =============================================
CREATE TABLE IF NOT EXISTS banners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  subtitle TEXT,
  image_url TEXT,
  link_url TEXT,
  position VARCHAR(50) DEFAULT 'hero',
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- Customers Table
-- =============================================
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_id UUID UNIQUE, -- Links to Supabase Auth
  email VARCHAR(255) UNIQUE NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone VARCHAR(20),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- Addresses Table
-- =============================================
CREATE TABLE IF NOT EXISTS addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  type VARCHAR(20) DEFAULT 'shipping', -- 'shipping' or 'billing'
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  address_line1 VARCHAR(255) NOT NULL,
  address_line2 VARCHAR(255),
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100),
  postal_code VARCHAR(20),
  country VARCHAR(100) DEFAULT 'Pakistan',
  phone VARCHAR(20),
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- Orders Table
-- =============================================
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number VARCHAR(50) UNIQUE NOT NULL,
  customer_id UUID REFERENCES customers(id),
  status VARCHAR(50) DEFAULT 'pending',
  subtotal DECIMAL(10, 2) NOT NULL,
  discount DECIMAL(10, 2) DEFAULT 0,
  shipping_cost DECIMAL(10, 2) DEFAULT 0,
  tax DECIMAL(10, 2) DEFAULT 0,
  total DECIMAL(10, 2) NOT NULL,
  shipping_address JSONB,
  billing_address JSONB,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- Order Items Table
-- =============================================
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  product_name VARCHAR(255) NOT NULL,
  product_image TEXT,
  quantity INT NOT NULL DEFAULT 1,
  size VARCHAR(20),
  color VARCHAR(50),
  unit_price DECIMAL(10, 2) NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- Wishlist Table
-- =============================================
CREATE TABLE IF NOT EXISTS wishlists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(customer_id, product_id)
);

-- =============================================
-- Cart Table
-- =============================================
CREATE TABLE IF NOT EXISTS carts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  session_id VARCHAR(255), -- For guest carts
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  quantity INT NOT NULL DEFAULT 1,
  size VARCHAR(20),
  color VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- Reviews Table
-- =============================================
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id),
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title VARCHAR(255),
  comment TEXT,
  is_verified BOOLEAN DEFAULT false,
  is_approved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- Coupons Table
-- =============================================
CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  discount_type VARCHAR(20) NOT NULL, -- 'percentage' or 'fixed'
  discount_value DECIMAL(10, 2) NOT NULL,
  min_order_amount DECIMAL(10, 2) DEFAULT 0,
  max_uses INT,
  uses_count INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- Indexes for Performance
-- =============================================
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(featured) WHERE featured = true;
CREATE INDEX IF NOT EXISTS idx_products_new ON products(is_new) WHERE is_new = true;
CREATE INDEX IF NOT EXISTS idx_products_sale ON products(is_sale) WHERE is_sale = true;
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_cart_customer ON carts(customer_id);
CREATE INDEX IF NOT EXISTS idx_cart_session ON carts(session_id);

-- =============================================
-- Row Level Security Policies
-- =============================================

-- Enable RLS
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Public read access for products, categories, banners
CREATE POLICY "Products are viewable by everyone" ON products FOR SELECT USING (true);
CREATE POLICY "Categories are viewable by everyone" ON categories FOR SELECT USING (true);
CREATE POLICY "Banners are viewable by everyone" ON banners FOR SELECT USING (is_active = true);

-- Customers can only view their own data
CREATE POLICY "Customers can view own profile" ON customers FOR SELECT USING (auth.uid() = auth_id);
CREATE POLICY "Customers can update own profile" ON customers FOR UPDATE USING (auth.uid() = auth_id);

-- =============================================
-- SEED DATA
-- =============================================

-- Seed Categories
INSERT INTO categories (name, slug, description, display_order) VALUES
('Women', 'women', 'Premium women''s fashion collection', 1),
('Men', 'men', 'Refined men''s fashion collection', 2),
('Accessories', 'accessories', 'Complete your look with our accessories', 3),
('New Arrivals', 'new-arrivals', 'Latest additions to our collection', 4),
('Sale', 'sale', 'Special discounts on selected items', 5);

-- Sub-categories for Women
INSERT INTO categories (name, slug, description, parent_id, display_order) 
SELECT 'Dresses', 'women-dresses', 'Elegant dresses for every occasion', id, 1 FROM categories WHERE slug = 'women';

INSERT INTO categories (name, slug, description, parent_id, display_order) 
SELECT 'Tops', 'women-tops', 'Stylish tops and blouses', id, 2 FROM categories WHERE slug = 'women';

INSERT INTO categories (name, slug, description, parent_id, display_order) 
SELECT 'Outerwear', 'women-outerwear', 'Coats, jackets and more', id, 3 FROM categories WHERE slug = 'women';

INSERT INTO categories (name, slug, description, parent_id, display_order) 
SELECT 'Pants', 'women-pants', 'Trousers and bottoms', id, 4 FROM categories WHERE slug = 'women';

-- Sub-categories for Men
INSERT INTO categories (name, slug, description, parent_id, display_order) 
SELECT 'Shirts', 'men-shirts', 'Premium shirts and polos', id, 1 FROM categories WHERE slug = 'men';

INSERT INTO categories (name, slug, description, parent_id, display_order) 
SELECT 'Pants', 'men-pants', 'Chinos, trousers and jeans', id, 2 FROM categories WHERE slug = 'men';

INSERT INTO categories (name, slug, description, parent_id, display_order) 
SELECT 'Outerwear', 'men-outerwear', 'Blazers, coats and jackets', id, 3 FROM categories WHERE slug = 'men';

INSERT INTO categories (name, slug, description, parent_id, display_order) 
SELECT 'Knitwear', 'men-knitwear', 'Sweaters and cardigans', id, 4 FROM categories WHERE slug = 'men';

-- Seed Products (Women)
INSERT INTO products (name, slug, description, short_description, price, original_price, category_id, sku, in_stock, stock_quantity, featured, is_new, sizes, colors) VALUES
('Signature Wool Blend Overcoat', 'signature-wool-blend-overcoat', 'A timeless overcoat crafted from premium wool blend fabric. Features a classic silhouette with modern detailing.', 'Premium wool blend overcoat with classic silhouette', 12990.00, 16990.00, (SELECT id FROM categories WHERE slug = 'women-outerwear'), 'WOC-001', true, 50, true, true, '["XS", "S", "M", "L", "XL"]', '["Black", "Camel", "Navy"]'),

('Cashmere Blend Sweater', 'cashmere-blend-sweater', 'Luxuriously soft cashmere blend sweater perfect for layering or wearing alone.', 'Soft cashmere blend sweater', 8990.00, NULL, (SELECT id FROM categories WHERE slug = 'women'), 'WKN-001', true, 75, true, false, '["XS", "S", "M", "L"]', '["Cream", "Grey", "Blush"]'),

('Linen Summer Dress', 'linen-summer-dress', 'Effortlessly elegant linen dress perfect for summer days. Breathable fabric with relaxed fit.', 'Elegant linen summer dress', 6990.00, NULL, (SELECT id FROM categories WHERE slug = 'women-dresses'), 'WDR-001', true, 40, true, true, '["XS", "S", "M", "L", "XL"]', '["White", "Sky Blue", "Sage"]'),

('Silk Blouse', 'silk-blouse', 'Sophisticated silk blouse with delicate draping. Perfect for office or evening wear.', 'Elegant silk blouse', 7490.00, 8990.00, (SELECT id FROM categories WHERE slug = 'women-tops'), 'WTP-001', true, 35, false, false, '["XS", "S", "M", "L"]', '["Ivory", "Blush", "Black"]'),

('High-Waisted Wide Leg Pants', 'high-waisted-wide-leg-pants', 'Flattering high-waisted pants with elegant wide leg. A modern wardrobe essential.', 'High-waisted wide leg pants', 5990.00, NULL, (SELECT id FROM categories WHERE slug = 'women-pants'), 'WPN-001', true, 60, false, true, '["24", "26", "28", "30", "32"]', '["Black", "Navy", "Olive"]');

-- Seed Products (Men)
INSERT INTO products (name, slug, description, short_description, price, original_price, category_id, sku, in_stock, stock_quantity, featured, is_new, sizes, colors) VALUES
('Premium Cotton Oxford Shirt', 'premium-cotton-oxford-shirt', 'Classic Oxford shirt crafted from premium cotton. Versatile style for work and weekend.', 'Classic premium cotton Oxford shirt', 4490.00, NULL, (SELECT id FROM categories WHERE slug = 'men-shirts'), 'MSH-001', true, 100, true, true, '["S", "M", "L", "XL", "XXL"]', '["White", "Light Blue", "Pink"]'),

('Slim Fit Stretch Chinos', 'slim-fit-stretch-chinos', 'Modern slim fit chinos with comfortable stretch. Perfect everyday essential.', 'Comfortable slim fit chinos', 5990.00, 7490.00, (SELECT id FROM categories WHERE slug = 'men-pants'), 'MPN-001', true, 80, true, false, '["28", "30", "32", "34", "36"]', '["Khaki", "Navy", "Olive", "Black"]'),

('Tailored Blazer', 'tailored-blazer', 'Impeccably tailored blazer with refined details. Elevate any outfit instantly.', 'Refined tailored blazer', 14990.00, NULL, (SELECT id FROM categories WHERE slug = 'men-outerwear'), 'MOW-001', true, 30, true, true, '["S", "M", "L", "XL"]', '["Navy", "Charcoal", "Black"]'),

('Relaxed Fit Denim Jeans', 'relaxed-fit-denim-jeans', 'Premium denim jeans with comfortable relaxed fit. Classic style, modern comfort.', 'Comfortable relaxed fit jeans', 6490.00, NULL, (SELECT id FROM categories WHERE slug = 'men-pants'), 'MPN-002', true, 70, false, false, '["28", "30", "32", "34", "36", "38"]', '["Indigo", "Light Wash", "Black"]'),

('Wool Blend Pullover', 'wool-blend-pullover', 'Cozy wool blend pullover with ribbed details. Essential cold weather layer.', 'Cozy wool blend pullover', 7990.00, NULL, (SELECT id FROM categories WHERE slug = 'men-knitwear'), 'MKN-001', true, 55, true, true, '["S", "M", "L", "XL"]', '["Navy", "Burgundy", "Grey"]'),

('Cotton Polo Shirt', 'cotton-polo-shirt', 'Classic polo shirt in premium cotton piqué. Smart casual essential.', 'Premium cotton polo shirt', 3990.00, NULL, (SELECT id FROM categories WHERE slug = 'men-shirts'), 'MSH-002', true, 90, false, false, '["S", "M", "L", "XL", "XXL"]', '["White", "Navy", "Forest Green", "Black"]');

-- Seed Products (Accessories)
INSERT INTO products (name, slug, description, short_description, price, original_price, category_id, sku, in_stock, stock_quantity, featured, is_new, is_sale, sizes, colors) VALUES
('Classic Leather Belt', 'classic-leather-belt', 'Timeless leather belt handcrafted from genuine leather. A wardrobe essential.', 'Genuine leather belt', 2990.00, 3990.00, (SELECT id FROM categories WHERE slug = 'accessories'), 'ACC-001', true, 120, false, false, true, '["S", "M", "L"]', '["Black", "Brown", "Tan"]'),

('Merino Wool Scarf', 'merino-wool-scarf', 'Luxuriously soft merino wool scarf. Perfect for adding warmth and style.', 'Soft merino wool scarf', 3490.00, 4490.00, (SELECT id FROM categories WHERE slug = 'accessories'), 'ACC-002', true, 45, true, false, true, '["One Size"]', '["Grey", "Camel", "Burgundy", "Navy"]'),

('Leather Crossbody Bag', 'leather-crossbody-bag', 'Elegant crossbody bag in premium leather. Compact yet spacious design.', 'Premium leather crossbody bag', 7990.00, 9990.00, (SELECT id FROM categories WHERE slug = 'accessories'), 'ACC-003', true, 25, true, true, true, '["One Size"]', '["Black", "Tan", "Cognac"]'),

('Classic Watch Silver', 'classic-watch-silver', 'Elegant timepiece with stainless steel case and leather strap. Timeless design.', 'Elegant silver watch', 12990.00, NULL, (SELECT id FROM categories WHERE slug = 'accessories'), 'ACC-004', true, 20, true, true, false, '["One Size"]', '["Silver/Black", "Silver/Brown"]'),

('Silk Pocket Square', 'silk-pocket-square', 'Add a refined touch with our pure silk pocket square. Multiple patterns available.', 'Pure silk pocket square', 1490.00, NULL, (SELECT id FROM categories WHERE slug = 'accessories'), 'ACC-005', true, 80, false, false, false, '["One Size"]', '["Burgundy Pattern", "Navy Pattern", "Olive Pattern"]');

-- Seed Banners
INSERT INTO banners (title, subtitle, link_url, position, display_order, is_active) VALUES
('Winter Collection 2024', 'Discover timeless elegance with our latest winter essentials. Crafted for comfort, styled for you.', '/women', 'hero', 1, true),
('New Arrivals', 'Be the first to shop our latest additions', '/new-arrivals', 'hero', 2, true),
('Winter Sale - Up to 50% Off', 'Don''t miss out on our biggest sale of the season', '/sale', 'promo', 1, true);

-- Seed Sample Coupon
INSERT INTO coupons (code, description, discount_type, discount_value, min_order_amount, is_active, ends_at) VALUES
('ERA20', 'Get 20% off on your first order', 'percentage', 20.00, 3000.00, true, '2025-03-31 23:59:59+05:00'),
('WINTER10', 'Winter collection 10% discount', 'percentage', 10.00, 5000.00, true, '2025-02-28 23:59:59+05:00'),
('FREESHIP', 'Free shipping on orders above PKR 5000', 'fixed', 500.00, 5000.00, true, NULL);

-- =============================================
-- Helpful Views
-- =============================================

-- Popular products view
CREATE OR REPLACE VIEW popular_products AS
SELECT p.*, c.name as category_name, c.slug as category_slug
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
WHERE p.in_stock = true AND p.featured = true
ORDER BY p.created_at DESC
LIMIT 20;

-- Sale products view
CREATE OR REPLACE VIEW sale_products AS
SELECT p.*, c.name as category_name, c.slug as category_slug,
       ROUND(((p.original_price - p.price) / p.original_price) * 100) as discount_percent
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
WHERE p.is_sale = true AND p.original_price IS NOT NULL AND p.in_stock = true
ORDER BY discount_percent DESC;

-- New arrivals view
CREATE OR REPLACE VIEW new_arrivals AS
SELECT p.*, c.name as category_name, c.slug as category_slug
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
WHERE p.is_new = true AND p.in_stock = true
ORDER BY p.created_at DESC
LIMIT 20;

-- =============================================
-- Functions
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to tables with updated_at
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_carts_updated_at BEFORE UPDATE ON carts FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
