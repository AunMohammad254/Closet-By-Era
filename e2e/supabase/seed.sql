-- =============================================================================
-- Seed data for the end-to-end test stack. Applied by `supabase db reset` /
-- `supabase start`, and again before every test run by e2e/global.setup.ts.
-- Test users are created by the setup (Auth admin API), not here.
--
-- IDs are fixed so tests can refer to them (mirrored in e2e/data.ts).
-- =============================================================================

-- Categories: the production catalog structure.
insert into public.categories (id, name, slug, description, parent_id, display_order, is_active) values
    ('1d71edea-9f5d-4103-b3cc-b8152eb99489', 'Women', 'women', 'Premium women''s fashion collection', null, 1, true),
    ('ea2cc599-07c4-40cc-b550-59ed46125f54', 'Men', 'men', 'Refined men''s fashion collection', null, 2, true),
    ('f980b71e-dd3c-4e8a-8f23-a78b925359db', 'Accessories', 'accessories', 'Complete your look with our accessories', null, 3, true),
    ('5df4c4e8-8eb0-4167-9808-37e4ca8a204c', 'New Arrivals', 'new-arrivals', 'Latest additions to our collection', null, 4, true),
    ('07ae799b-b020-41d9-b908-534a542a2fe7', 'Sale', 'sale', 'Special discounts on selected items', null, 5, true),
    ('26dc06c0-64ac-4fa8-ad3d-313354711d2d', 'Dresses', 'women-dresses', 'Elegant dresses for every occasion', '1d71edea-9f5d-4103-b3cc-b8152eb99489', 1, true),
    ('86cbe641-e2a5-4dab-836c-750ca08071ad', 'Tops', 'women-tops', 'Stylish tops and blouses', '1d71edea-9f5d-4103-b3cc-b8152eb99489', 2, true),
    ('6e3aa0ee-be20-4395-82c0-f1cf6b697c68', 'Outerwear', 'women-outerwear', 'Coats, jackets and more', '1d71edea-9f5d-4103-b3cc-b8152eb99489', 3, true),
    ('ebfa7b66-74c4-46ef-9de1-6a475c5665ce', 'Pants', 'women-pants', 'Trousers and bottoms', '1d71edea-9f5d-4103-b3cc-b8152eb99489', 4, true),
    ('aacd4745-afac-40cb-b7c9-7fcbe9b8d8e6', 'Shirts', 'men-shirts', 'Premium shirts and polos', 'ea2cc599-07c4-40cc-b550-59ed46125f54', 1, true),
    ('23de2cd5-e92f-425e-b086-8689c40b4e78', 'Pants', 'men-pants', 'Chinos, trousers and jeans', 'ea2cc599-07c4-40cc-b550-59ed46125f54', 2, true),
    ('fcfdc12c-ace5-4b44-9eb4-4bd73c794341', 'Outerwear', 'men-outerwear', 'Blazers, coats and jackets', 'ea2cc599-07c4-40cc-b550-59ed46125f54', 3, true),
    ('7e46a885-3ff3-4cfd-8e09-d7267aa1c849', 'Knitwear', 'men-knitwear', 'Sweaters and cardigans', 'ea2cc599-07c4-40cc-b550-59ed46125f54', 4, true);

-- Products: the production catalog plus items built for specific tests.
-- created_at is fixed so "newest" ordering is deterministic.
insert into public.products
    (id, name, slug, description, price, original_price, stock, category_id, images, image_url,
     is_active, in_stock, is_featured, is_new, is_sale, sizes, colors, created_at)
values
    ('e6db4a4b-1e33-4417-a88a-9ffd0af2ad92', 'Signature Wool Blend Overcoat', 'signature-wool-blend-overcoat', 'A premium wool blend overcoat.',
     12990, null, 25, '1d71edea-9f5d-4103-b3cc-b8152eb99489', '{}', '/products/overcoat.png', true, true, true, true, false, null, null, now() - interval '1 day'),
    ('70cf5c07-023a-4658-b0d5-abeedca103d1', 'Slim Fit Stretch Chinos', 'slim-fit-stretch-chinos', 'Comfortable stretch chinos.',
     5990, null, 25, 'ea2cc599-07c4-40cc-b550-59ed46125f54', '{}', '/products/denim-jeans.png', true, true, false, true, false, null, null, now() - interval '2 days'),
    ('a4be9aee-8b62-4061-9384-a2d61ef0481b', 'Classic Leather Belt', 'classic-leather-belt', 'Genuine leather belt.',
     2990, null, 25, 'f980b71e-dd3c-4e8a-8f23-a78b925359db', '{}', '/products/leather-bag.png', true, true, false, false, true, null, null, now() - interval '3 days'),
    -- No slug: links fall back to /product/<id>.
    ('8ed3d97d-a4fe-445a-b921-f36e080e5b3c', 'Midnight Floral', null, 'Floral print outerwear.',
     2900, null, 10, null, '{}', null, true, true, false, false, false, null, null, now() - interval '4 days'),

    -- Sizes and colours, plenty of stock: the default product for cart/checkout tests.
    ('0e2e0000-0000-4000-8000-000000000001', 'E2E Oxford Shirt', 'e2e-oxford-shirt', 'Crisp cotton oxford shirt.',
     3500, null, 500, 'aacd4745-afac-40cb-b7c9-7fcbe9b8d8e6', '{}', '/products/oxford-shirt.png', true, true, true, false, false,
     '{S,M,L}', '{White,Blue}', now() - interval '5 days'),
    -- Sold out.
    ('0e2e0000-0000-4000-8000-000000000002', 'E2E Cashmere Sweater', 'e2e-cashmere-sweater', 'Soft cashmere sweater.',
     8900, null, 0, '7e46a885-3ff3-4cfd-8e09-d7267aa1c849', '{}', '/products/cashmere-sweater.png', true, false, false, false, false,
     null, null, now() - interval '6 days'),
    -- On sale (20% off).
    ('0e2e0000-0000-4000-8000-000000000003', 'E2E Linen Dress', 'e2e-linen-dress', 'Breezy linen summer dress.',
     4000, 5000, 40, '26dc06c0-64ac-4fa8-ad3d-313354711d2d', '{}', '/products/linen-dress.png', true, true, false, false, true,
     null, null, now() - interval '7 days'),
    -- Only 2 left: the "not enough stock" test.
    ('0e2e0000-0000-4000-8000-000000000004', 'E2E Silk Blouse', 'e2e-silk-blouse', 'Silk blouse with pearl buttons.',
     2500, null, 2, '86cbe641-e2a5-4dab-836c-750ca08071ad', '{}', '/products/silk-blouse.png', true, true, false, false, false,
     null, null, now() - interval '8 days'),
    -- Inactive: must never appear in the shop.
    ('0e2e0000-0000-4000-8000-000000000005', 'E2E Hidden Blazer', 'e2e-hidden-blazer', 'Not for sale yet.',
     9900, null, 10, 'fcfdc12c-ace5-4b44-9eb4-4bd73c794341', '{}', '/products/tailored-blazer.png', false, true, false, false, false,
     null, null, now() - interval '9 days');

-- Store settings: COD, card (Stripe test mode) and two configured transfer methods.
insert into public.store_settings (store_name, support_email, support_phone, currency, payment_methods, content) values (
    'Closet By Era', 'support@closetbyera.test', '+92 300 0000000', 'PKR',
    '{
        "cod": {"enabled": true},
        "card": {"enabled": true},
        "bank_transfer": {"enabled": true, "bank_name": "E2E Test Bank", "account_title": "Closet By Era", "account_number": "0000-1111-2222", "iban": "PK00TEST0000000000000000"},
        "jazzcash": {"enabled": true, "account_title": "Closet By Era", "account_number": "0300-0000000"},
        "easypaisa": {"enabled": false, "account_title": "", "account_number": ""}
    }',
    '{"hero_title": "New Collection", "hero_subtitle": "Discover the latest trends", "announcement_bar": "Free shipping on orders over PKR 5000"}'
);

-- Coupons covering each rule in src/lib/pricing.ts.
insert into public.coupons (code, description, discount_type, discount_value, min_order_amount, max_uses, uses_count, is_active, starts_at, ends_at) values
    ('E2E10', '10% off', 'percentage', 10, 0, null, 0, true, null, null),
    ('E2EFLAT500', 'PKR 500 off', 'fixed', 500, 0, null, 0, true, null, null),
    ('E2EEXPIRED', 'Expired', 'percentage', 50, 0, null, 0, true, now() - interval '30 days', now() - interval '1 day'),
    ('E2EBIGSPEND', 'Needs a big order', 'percentage', 20, 1000000, null, 0, true, null, null),
    ('E2EUSEDUP', 'Already used up', 'percentage', 15, 0, 1, 1, true, null, null),
    ('E2EINACTIVE', 'Switched off', 'percentage', 25, 0, null, 0, false, null, null);

-- Gift cards: partial balance, one that pays a whole order, and an empty one.
insert into public.gift_cards (code, initial_value, balance, is_active, expires_at) values
    ('GIFT-E2E-1000', 1000, 1000, true, null),
    ('GIFT-E2E-FULL', 1000000, 1000000, true, null),
    ('GIFT-E2E-EMPTY', 500, 0, true, null);

-- Admin catalogue pages.
insert into public.shipping_zones (id, name, countries, is_active) values
    ('0e2e0000-0000-4000-8000-0000000000a1', 'Pakistan', '{Pakistan}', true);
insert into public.shipping_rates (zone_id, name, min_order_amount, max_order_amount, rate, estimated_days) values
    ('0e2e0000-0000-4000-8000-0000000000a1', 'Standard', 0, null, 500, '3-5 days');
insert into public.tax_rules (name, region, rate, applies_to, is_active) values
    ('GST', 'Punjab', 17, 'all', true);
insert into public.banners (title, subtitle, image_url, link_url, position, display_order, is_active) values
    ('E2E Winter Edit', 'Coats and knitwear', '/products/overcoat.png', '/women', 'hero', 1, true);
insert into public.faqs (question, answer, category, display_order, is_active) values
    ('How long does delivery take?', 'Three to five working days across Pakistan.', 'shipping', 1, true),
    ('Can I return an item?', 'Yes, within 14 days of delivery.', 'returns', 2, true);
insert into public.promotions (name, type, discount_value, discount_type, start_date, end_date, is_active, min_order_amount) values
    ('E2E Autumn Sale', 'percentage', 15, 'percentage', now() - interval '1 day', now() + interval '30 days', true, 0);
