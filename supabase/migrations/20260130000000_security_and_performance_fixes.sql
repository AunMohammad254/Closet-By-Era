-- =============================================================================
-- Security & Performance Fixes Migration
-- Date: 2026-01-30
-- Includes: Atomic gift card redemption, missing indexes, admin helper function
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Helper Function: Check if current user is admin
-- Used in RLS policies for proper admin authorization
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.customers 
        WHERE auth_id = auth.uid() 
        AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.is_admin() IS 'Returns true if the current authenticated user has admin role';

-- -----------------------------------------------------------------------------
-- 2. Atomic Gift Card Redemption Function
-- Prevents race conditions by using row-level locking
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.redeem_gift_card_atomic(
    p_code TEXT,
    p_amount NUMERIC,
    p_order_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_card_id UUID;
    v_current_balance NUMERIC;
    v_new_balance NUMERIC;
BEGIN
    -- Lock the row and check conditions in a single query
    SELECT id, balance INTO v_card_id, v_current_balance
    FROM public.gift_cards
    WHERE code = p_code
      AND is_active = true
      AND (expires_at IS NULL OR expires_at > NOW())
    FOR UPDATE; -- Row-level lock prevents concurrent modifications

    -- Card not found or inactive/expired
    IF v_card_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Gift card not found, inactive, or expired'
        );
    END IF;

    -- Check sufficient balance
    IF v_current_balance < p_amount THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Insufficient balance'
        );
    END IF;

    -- Calculate new balance
    v_new_balance := v_current_balance - p_amount;

    -- Update balance
    UPDATE public.gift_cards
    SET balance = v_new_balance
    WHERE id = v_card_id;

    -- Record usage
    INSERT INTO public.gift_card_usage (gift_card_id, order_id, amount_used)
    VALUES (v_card_id, p_order_id, p_amount);

    RETURN jsonb_build_object(
        'success', true,
        'new_balance', v_new_balance,
        'amount_redeemed', p_amount
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.redeem_gift_card_atomic(TEXT, NUMERIC, UUID) IS 
'Atomically redeems a gift card with row-level locking to prevent race conditions';

-- -----------------------------------------------------------------------------
-- 3. Missing Indexes for Performance
-- Based on common query patterns in the application
-- -----------------------------------------------------------------------------

-- Orders table indexes
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at_desc ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders(order_number);

-- Customers table indexes
CREATE INDEX IF NOT EXISTS idx_customers_auth_id ON public.customers(auth_id);
CREATE INDEX IF NOT EXISTS idx_customers_email ON public.customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_role ON public.customers(role) WHERE role = 'admin';

-- Products table indexes (additional to existing)
CREATE INDEX IF NOT EXISTS idx_products_active_featured ON public.products(is_featured) 
    WHERE in_stock = true;
CREATE INDEX IF NOT EXISTS idx_products_active_new ON public.products(is_new) 
    WHERE in_stock = true;
CREATE INDEX IF NOT EXISTS idx_products_active_sale ON public.products(is_sale) 
    WHERE in_stock = true;

-- Cart items composite index for upsert operations
CREATE UNIQUE INDEX IF NOT EXISTS idx_cart_items_unique_item 
ON public.cart_items(user_id, product_id, COALESCE(size, ''), COALESCE(color, ''));

-- Gift cards indexes
CREATE INDEX IF NOT EXISTS idx_gift_cards_code ON public.gift_cards(code);
CREATE INDEX IF NOT EXISTS idx_gift_cards_active ON public.gift_cards(is_active) WHERE is_active = true;

-- Gift card usage
CREATE INDEX IF NOT EXISTS idx_gift_card_usage_card_id ON public.gift_card_usage(gift_card_id);
CREATE INDEX IF NOT EXISTS idx_gift_card_usage_order_id ON public.gift_card_usage(order_id);

-- Loyalty history
CREATE INDEX IF NOT EXISTS idx_loyalty_history_customer_id ON public.loyalty_history(customer_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_history_created_at ON public.loyalty_history(created_at DESC);

-- -----------------------------------------------------------------------------
-- 4. Add loyalty_points column to customers if not exists
-- Required for loyalty system
-- -----------------------------------------------------------------------------
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'customers' 
        AND column_name = 'loyalty_points'
    ) THEN
        ALTER TABLE public.customers ADD COLUMN loyalty_points INTEGER DEFAULT 0;
    END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 5. Create loyalty_history table if not exists
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.loyalty_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE NOT NULL,
    points INTEGER NOT NULL,
    reason TEXT NOT NULL,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE public.loyalty_history ENABLE ROW LEVEL SECURITY;

-- Users can view their own loyalty history
DROP POLICY IF EXISTS "Users can view own loyalty history" ON public.loyalty_history;
CREATE POLICY "Users can view own loyalty history" ON public.loyalty_history
    FOR SELECT USING (
        customer_id IN (
            SELECT id FROM public.customers WHERE auth_id = auth.uid()
        )
    );

-- Admins can view all loyalty history
DROP POLICY IF EXISTS "Admins can view all loyalty history" ON public.loyalty_history;
CREATE POLICY "Admins can view all loyalty history" ON public.loyalty_history
    FOR SELECT USING (public.is_admin() OR auth.role() = 'service_role');

-- System can insert loyalty history (via service role or triggers)
DROP POLICY IF EXISTS "System can insert loyalty history" ON public.loyalty_history;
CREATE POLICY "System can insert loyalty history" ON public.loyalty_history
    FOR INSERT WITH CHECK (auth.role() = 'service_role' OR public.is_admin());

-- -----------------------------------------------------------------------------
-- 6. Update RLS policies to use is_admin() function where appropriate
-- -----------------------------------------------------------------------------

-- Categories admin policies
DROP POLICY IF EXISTS "Admins can insert categories." ON public.categories;
CREATE POLICY "Admins can insert categories." ON public.categories 
    FOR INSERT WITH CHECK (public.is_admin() OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Admins can update categories." ON public.categories;
CREATE POLICY "Admins can update categories." ON public.categories 
    FOR UPDATE USING (public.is_admin() OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Admins can delete categories." ON public.categories;
CREATE POLICY "Admins can delete categories." ON public.categories 
    FOR DELETE USING (public.is_admin() OR auth.role() = 'service_role');

-- Products admin policies
DROP POLICY IF EXISTS "Admins can insert products." ON public.products;
CREATE POLICY "Admins can insert products." ON public.products 
    FOR INSERT WITH CHECK (public.is_admin() OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Admins can update products." ON public.products;
CREATE POLICY "Admins can update products." ON public.products 
    FOR UPDATE USING (public.is_admin() OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Admins can delete products." ON public.products;
CREATE POLICY "Admins can delete products." ON public.products 
    FOR DELETE USING (public.is_admin() OR auth.role() = 'service_role');

-- Grant execute permission on functions
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.redeem_gift_card_atomic(TEXT, NUMERIC, UUID) TO authenticated;
