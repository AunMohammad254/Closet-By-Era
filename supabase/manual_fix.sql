-- Part 1: Create login_history table (was missing)
CREATE TABLE IF NOT EXISTS login_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE login_history ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'login_history' AND policyname = 'Users can view their own login history') THEN
        CREATE POLICY "Users can view their own login history" ON login_history FOR SELECT USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'login_history' AND policyname = 'Users can insert their own login history') THEN
        CREATE POLICY "Users can insert their own login history" ON login_history FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_login_history_user_id ON login_history(user_id);
CREATE INDEX IF NOT EXISTS idx_login_history_created_at ON login_history(created_at);


-- Part 2: Fix RLS Recursion on customers table
-- This fixes the "Access denied" and 500 error for Super Admins

-- Drop potential recursive policies
DROP POLICY IF EXISTS "Super admins can view all customers" ON customers;
DROP POLICY IF EXISTS "Customers can view their own profile" ON customers;

-- Secure, non-recursive policy for viewing own profile
CREATE POLICY "Users can view their own profile"
    ON customers FOR SELECT
    USING (auth.uid() = auth_id);

-- Security Definer function to safely check admin status without recursion
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM customers
    WHERE auth_id = auth.uid()
    AND role = 'super_admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- New admin policy using the safe function
CREATE POLICY "Super admins can view all customers"
    ON customers FOR SELECT
    USING (public.is_super_admin());

-- Re-grant access for admin (if needed, adjust role name if 'admin' is distinct from 'super_admin')
-- Assuming 'admin' role logic is similar, we can add:
-- CREATE POLICY "Admins can view all customers" ON customers FOR SELECT USING (public.is_admin()); 
-- (Skipping for now to focus on Super Admin fix)
