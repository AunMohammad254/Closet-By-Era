-- Fix RLS recursion on customers table

-- 1. Drop the problematic policy (assuming similar name, or drop by logic)
DROP POLICY IF EXISTS "Super admins can view all customers" ON customers;
DROP POLICY IF EXISTS "Customers can view their own profile" ON customers;

-- 2. Create specific non-recursive policy for viewing own profile
-- This is critical: accessing your own role must not depend on checking if you are an admin
CREATE POLICY "Users can view their own profile"
    ON customers FOR SELECT
    USING (auth.uid() = auth_id);

-- 3. Create admin policy using a safer check or existing pattern, but now the own-profile policy handles the "check if I am admin" part safely?
-- Actually, the recursion happens when Policy A says "You can see X if you are Admin" and "Being Admin" means "Scanning customers table".
-- If we try to scan customers table to see if we are admin, we trigger the policy again.

-- SOLUTION: Use a SECURITY DEFINER function to check role, bypassing RLS.

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

-- 4. Re-create the admin policy using the security definer function
CREATE POLICY "Super admins can view all customers"
    ON customers FOR SELECT
    USING (public.is_super_admin());
