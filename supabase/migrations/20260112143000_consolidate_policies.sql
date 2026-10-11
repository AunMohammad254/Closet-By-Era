-- Migration: Consolidate RLS Policies to Fix "Multiple Permissive Policies" Warnings
-- Date: 2026-01-12

-- PROBLEM: Having separate "User View" and "Admin View" policies means Postgres checks BOTH for every query.
-- SOLUTION: Combine them into a single "View" policy with OR logic.

-- ==========================================
-- 1. CUSTOMERS (Consolidate SELECT)
-- ==========================================
DROP POLICY IF EXISTS "Users can view own profile" ON customers;
DROP POLICY IF EXISTS "Customers can view own profile" ON customers;
DROP POLICY IF EXISTS "Admins can view all profiles" ON customers;

CREATE POLICY "View profiles" ON customers FOR SELECT
USING (
  -- User viewing own profile
  auth_id = (select auth.uid())
  OR
  -- Admin viewing all profiles
  EXISTS (SELECT 1 FROM customers WHERE auth_id = (select auth.uid()) AND role = 'admin')
  OR
  -- Service role
  (select auth.role()) = 'service_role'
);

-- ==========================================
-- 2. ORDERS (Consolidate SELECT)
-- ==========================================
DROP POLICY IF EXISTS "Users can view own orders" ON orders;
DROP POLICY IF EXISTS "Admins can view all orders" ON orders;

CREATE POLICY "View orders" ON orders FOR SELECT
USING (
  -- User viewing own orders
  customer_id IN (SELECT id FROM customers WHERE auth_id = (select auth.uid()))
  OR
  -- Admin viewing all orders
  EXISTS (SELECT 1 FROM customers WHERE auth_id = (select auth.uid()) AND role = 'admin')
  OR
  -- Service role
  (select auth.role()) = 'service_role'
);
