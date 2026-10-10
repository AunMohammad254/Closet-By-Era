-- =============================================================================
-- SQL Aggregation Optimization Migration
-- Date: 2026-02-01
-- Adds RPC functions for efficient system statistics retrieval
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Optimized System Stats RPC (uses SQL aggregation instead of fetching all rows)
-- Used by super-admin dashboard for fast loading
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_system_stats_optimized()
RETURNS JSONB AS $$
DECLARE
    v_total_users INTEGER;
    v_total_admins INTEGER;
    v_total_super_admins INTEGER;
    v_total_orders INTEGER;
    v_total_revenue NUMERIC;
    v_total_products INTEGER;
BEGIN
    -- Count users by role in a single query
    SELECT 
        COUNT(*),
        COUNT(*) FILTER (WHERE role = 'admin'),
        COUNT(*) FILTER (WHERE role = 'super_admin')
    INTO v_total_users, v_total_admins, v_total_super_admins
    FROM public.customers;

    -- Get order stats with aggregation
    SELECT 
        COUNT(*),
        COALESCE(SUM(total_amount), 0)
    INTO v_total_orders, v_total_revenue
    FROM public.orders;

    -- Count products
    SELECT COUNT(*) INTO v_total_products FROM public.products;

    RETURN jsonb_build_object(
        'totalUsers', v_total_users,
        'totalAdmins', v_total_admins,
        'totalSuperAdmins', v_total_super_admins,
        'totalOrders', v_total_orders,
        'totalRevenue', v_total_revenue,
        'totalProducts', v_total_products
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.get_system_stats_optimized() IS 
'Returns system-wide statistics using SQL aggregation for optimal performance';

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_system_stats_optimized() TO authenticated;

-- -----------------------------------------------------------------------------
-- 2. Admin Notifications Table
-- Stores real-time notifications for admins
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    type TEXT NOT NULL CHECK (type IN ('order', 'stock', 'review', 'return', 'system')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    entity_id UUID,
    entity_type TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

-- Admins can view all notifications
DROP POLICY IF EXISTS "Admins can view notifications" ON public.admin_notifications;
CREATE POLICY "Admins can view notifications" ON public.admin_notifications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.customers 
            WHERE auth_id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

-- Admins can update (mark as read)
DROP POLICY IF EXISTS "Admins can update notifications" ON public.admin_notifications;
CREATE POLICY "Admins can update notifications" ON public.admin_notifications
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.customers 
            WHERE auth_id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

-- System can insert notifications
DROP POLICY IF EXISTS "System can insert notifications" ON public.admin_notifications;
CREATE POLICY "System can insert notifications" ON public.admin_notifications
    FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_admin_notifications_created_at ON public.admin_notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_is_read ON public.admin_notifications(is_read) WHERE is_read = FALSE;
CREATE INDEX IF NOT EXISTS idx_admin_notifications_type ON public.admin_notifications(type);

-- -----------------------------------------------------------------------------
-- 3. Saved Filters Table
-- Allows admins to save filter presets for list pages
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_saved_filters (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_id UUID REFERENCES public.customers(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    page TEXT NOT NULL, -- e.g., 'orders', 'products', 'customers'
    filters JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE public.admin_saved_filters ENABLE ROW LEVEL SECURITY;

-- Admins can manage their own filters
DROP POLICY IF EXISTS "Admins can manage own filters" ON public.admin_saved_filters;
CREATE POLICY "Admins can manage own filters" ON public.admin_saved_filters
    FOR ALL USING (
        admin_id IN (
            SELECT id FROM public.customers WHERE auth_id = auth.uid()
        )
    );

-- Index for quick lookup
CREATE INDEX IF NOT EXISTS idx_admin_saved_filters_admin_page 
ON public.admin_saved_filters(admin_id, page);

-- -----------------------------------------------------------------------------
-- 4. Returns Table
-- Manages customer return requests
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.returns (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
    customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE NOT NULL,
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'refunded')),
    refund_amount NUMERIC(10,2) DEFAULT 0,
    admin_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE public.returns ENABLE ROW LEVEL SECURITY;

-- Customers can view their own returns
DROP POLICY IF EXISTS "Customers can view own returns" ON public.returns;
CREATE POLICY "Customers can view own returns" ON public.returns
    FOR SELECT USING (
        customer_id IN (SELECT id FROM public.customers WHERE auth_id = auth.uid())
    );

-- Customers can create returns for their orders
DROP POLICY IF EXISTS "Customers can create returns" ON public.returns;
CREATE POLICY "Customers can create returns" ON public.returns
    FOR INSERT WITH CHECK (
        customer_id IN (SELECT id FROM public.customers WHERE auth_id = auth.uid())
    );

-- Admins can view and manage all returns
DROP POLICY IF EXISTS "Admins can manage returns" ON public.returns;
CREATE POLICY "Admins can manage returns" ON public.returns
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.customers 
            WHERE auth_id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_returns_order_id ON public.returns(order_id);
CREATE INDEX IF NOT EXISTS idx_returns_customer_id ON public.returns(customer_id);
CREATE INDEX IF NOT EXISTS idx_returns_status ON public.returns(status);
CREATE INDEX IF NOT EXISTS idx_returns_created_at ON public.returns(created_at DESC);

-- -----------------------------------------------------------------------------
-- 5. Shipping Zones and Rates Tables
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.shipping_zones (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    countries TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.shipping_rates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    zone_id UUID REFERENCES public.shipping_zones(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    min_order_amount NUMERIC(10,2) DEFAULT 0,
    max_order_amount NUMERIC(10,2),
    rate NUMERIC(10,2) NOT NULL,
    estimated_days TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE public.shipping_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipping_rates ENABLE ROW LEVEL SECURITY;

-- Everyone can read shipping zones/rates (for checkout)
DROP POLICY IF EXISTS "Anyone can read shipping zones" ON public.shipping_zones;
CREATE POLICY "Anyone can read shipping zones" ON public.shipping_zones
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can read shipping rates" ON public.shipping_rates;
CREATE POLICY "Anyone can read shipping rates" ON public.shipping_rates
    FOR SELECT USING (true);

-- Admins can manage shipping
DROP POLICY IF EXISTS "Admins can manage shipping zones" ON public.shipping_zones;
CREATE POLICY "Admins can manage shipping zones" ON public.shipping_zones
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.customers 
            WHERE auth_id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

DROP POLICY IF EXISTS "Admins can manage shipping rates" ON public.shipping_rates;
CREATE POLICY "Admins can manage shipping rates" ON public.shipping_rates
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.customers 
            WHERE auth_id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

-- -----------------------------------------------------------------------------
-- 6. Tax Rules Table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tax_rules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    region TEXT, -- NULL means applies globally
    rate NUMERIC(5,2) NOT NULL, -- Percentage rate
    applies_to TEXT DEFAULT 'all' CHECK (applies_to IN ('all', 'products', 'shipping')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE public.tax_rules ENABLE ROW LEVEL SECURITY;

-- Everyone can read tax rules (for checkout)
DROP POLICY IF EXISTS "Anyone can read tax rules" ON public.tax_rules;
CREATE POLICY "Anyone can read tax rules" ON public.tax_rules
    FOR SELECT USING (true);

-- Admins can manage tax rules
DROP POLICY IF EXISTS "Admins can manage tax rules" ON public.tax_rules;
CREATE POLICY "Admins can manage tax rules" ON public.tax_rules
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.customers 
            WHERE auth_id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

-- -----------------------------------------------------------------------------
-- 7. Promotions Tables
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.promotions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('flash_sale', 'bundle', 'bogo', 'percentage', 'fixed')),
    discount_value NUMERIC(10,2) NOT NULL,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    min_order_amount NUMERIC(10,2) DEFAULT 0,
    max_uses INTEGER,
    current_uses INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.promotion_products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    promotion_id UUID REFERENCES public.promotions(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    UNIQUE(promotion_id, product_id)
);

-- Enable RLS
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotion_products ENABLE ROW LEVEL SECURITY;

-- Everyone can read active promotions (for storefront)
DROP POLICY IF EXISTS "Anyone can read active promotions" ON public.promotions;
CREATE POLICY "Anyone can read active promotions" ON public.promotions
    FOR SELECT USING (is_active = true AND NOW() BETWEEN start_date AND end_date);

DROP POLICY IF EXISTS "Anyone can read promotion products" ON public.promotion_products;
CREATE POLICY "Anyone can read promotion products" ON public.promotion_products
    FOR SELECT USING (true);

-- Admins can manage promotions
DROP POLICY IF EXISTS "Admins can manage promotions" ON public.promotions;
CREATE POLICY "Admins can manage promotions" ON public.promotions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.customers 
            WHERE auth_id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

DROP POLICY IF EXISTS "Admins can manage promotion products" ON public.promotion_products;
CREATE POLICY "Admins can manage promotion products" ON public.promotion_products
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.customers 
            WHERE auth_id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_promotions_dates ON public.promotions(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_promotions_active ON public.promotions(is_active) WHERE is_active = true;

-- -----------------------------------------------------------------------------
-- 8. CMS Tables (Banners, Popups, FAQs)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.banners (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    subtitle TEXT,
    image_url TEXT,
    link_url TEXT,
    position TEXT DEFAULT 'homepage' CHECK (position IN ('homepage', 'category', 'product', 'checkout')),
    display_order INTEGER DEFAULT 0,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.popups (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    image_url TEXT,
    trigger_type TEXT DEFAULT 'time' CHECK (trigger_type IN ('time', 'scroll', 'exit_intent', 'page_load')),
    trigger_value INTEGER DEFAULT 5, -- seconds or scroll percentage
    target_pages TEXT[] DEFAULT '{}', -- empty = all pages
    show_once BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.faqs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    category TEXT DEFAULT 'general',
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.popups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;

-- Everyone can read active CMS content
DROP POLICY IF EXISTS "Anyone can read active banners" ON public.banners;
CREATE POLICY "Anyone can read active banners" ON public.banners
    FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Anyone can read active popups" ON public.popups;
CREATE POLICY "Anyone can read active popups" ON public.popups
    FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Anyone can read active faqs" ON public.faqs;
CREATE POLICY "Anyone can read active faqs" ON public.faqs
    FOR SELECT USING (is_active = true);

-- Admins can manage CMS content
DROP POLICY IF EXISTS "Admins can manage banners" ON public.banners;
CREATE POLICY "Admins can manage banners" ON public.banners
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.customers 
            WHERE auth_id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

DROP POLICY IF EXISTS "Admins can manage popups" ON public.popups;
CREATE POLICY "Admins can manage popups" ON public.popups
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.customers 
            WHERE auth_id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

DROP POLICY IF EXISTS "Admins can manage faqs" ON public.faqs;
CREATE POLICY "Admins can manage faqs" ON public.faqs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.customers 
            WHERE auth_id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_banners_position ON public.banners(position);
CREATE INDEX IF NOT EXISTS idx_faqs_category ON public.faqs(category);
