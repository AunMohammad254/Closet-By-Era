-- Store Settings Table
CREATE TABLE IF NOT EXISTS public.store_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_name TEXT NOT NULL DEFAULT 'Closet By Era',
    support_email TEXT NOT NULL DEFAULT 'support@closetbyera.com',
    support_phone TEXT,
    currency TEXT NOT NULL DEFAULT 'PKR',
    payment_methods JSONB DEFAULT '{"stripe": true, "cod": true}'::jsonb,
    content JSONB DEFAULT '{"hero_title": "New Collection", "hero_subtitle": "Discover the latest trends", "announcement_bar": "Free shipping on orders over PKR 5000"}'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ensure only one row exists (Singleton pattern)
CREATE UNIQUE INDEX IF NOT EXISTS only_one_row ON public.store_settings ((true));

-- Initial seed if empty
INSERT INTO public.store_settings (store_name)
SELECT 'Closet By Era'
WHERE NOT EXISTS (SELECT 1 FROM public.store_settings);

-- Coupons Table
CREATE TABLE IF NOT EXISTS public.coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
    value NUMERIC NOT NULL CHECK (value > 0),
    min_order_amount NUMERIC DEFAULT 0,
    usage_limit INTEGER,
    used_count INTEGER DEFAULT 0,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS Policies
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    -- Settings Policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'store_settings' AND policyname = 'Public can read settings') THEN
        CREATE POLICY "Public can read settings" ON public.store_settings FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'store_settings' AND policyname = 'Admins can update settings') THEN
        CREATE POLICY "Admins can update settings" ON public.store_settings FOR UPDATE USING (
            EXISTS (SELECT 1 FROM public.customers WHERE customers.auth_id = auth.uid() AND customers.role = 'admin')
        );
    END IF;

    -- Coupons Policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'coupons' AND policyname = 'Admins can manage coupons') THEN
        CREATE POLICY "Admins can manage coupons" ON public.coupons FOR ALL USING (
            EXISTS (SELECT 1 FROM public.customers WHERE customers.auth_id = auth.uid() AND customers.role = 'admin')
        );
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'coupons' AND policyname = 'Public can read valid coupons') THEN
        CREATE POLICY "Public can read valid coupons" ON public.coupons FOR SELECT USING (is_active = true);
    END IF;
END
$$;
