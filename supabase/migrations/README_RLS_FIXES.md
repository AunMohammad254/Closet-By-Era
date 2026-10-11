# RLS Performance Fixes - Apply Migration

## Option 1: Using Supabase CLI (Recommended)

```bash
# Apply the migration using Supabase CLI
supabase db push

# Or apply specific migration
supabase migration up --db-url "your-database-url"
```

## Option 2: Using Supabase Dashboard (Manual)

1. Open your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Copy the entire contents of `supabase/migrations/20260131160000_fix_rls_performance_issues.sql`
4. Paste into the SQL Editor
5. Click **Run** to execute

## Option 3: Using Node Script

```bash
# Ensure environment variables are set
# NEXT_PUBLIC_SUPABASE_URL=your-url
# SUPABASE_SERVICE_ROLE_KEY=your-service-key

npx tsx scripts/apply-rls-fixes.mts
```

## What This Migration Fixes

### 1. Auth RLS Initialization Plan Issues
- **Problem**: `auth.uid()` and `auth.<function>()` calls were being re-evaluated for each row
- **Solution**: Wrapped in `(SELECT auth.uid())` to evaluate once per query
- **Impact**: Significant performance improvement on tables with many rows

### 2. Multiple Permissive Policies
- **Problem**: `coupons` table had duplicate policies causing each to be evaluated
- **Solution**: Consolidated policies - one admin policy for ALL operations, one public read policy
- **Impact**: Reduced policy evaluation overhead

### 3. Added Performance Indexes
- `idx_customers_auth_id_role` - Faster admin checks
- `idx_coupons_is_active` - Partial index for active coupons
- `idx_coupons_code` - Faster code lookups
- `idx_coupons_expires_at` - Optimized expiration checks

## Verification

After applying, run this query in SQL Editor to verify:

```sql
-- Check policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename IN ('store_settings', 'coupons')
ORDER BY tablename, cmd, policyname;

-- Check indexes
SELECT 
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename IN ('customers', 'coupons')
ORDER BY tablename, indexname;
```

Expected Results:
- **store_settings**: 2 policies (Public read, Admin update)
- **coupons**: 2 policies (Admin manage ALL, Public read active)
- No duplicate policies for same role+action combination

## Performance Testing

Test before and after:

```sql
-- Test query performance
EXPLAIN ANALYZE 
SELECT * FROM coupons 
WHERE is_active = true;

-- Should show index usage and fast execution time
```

## Rollback (If Needed)

If you need to rollback, run:

```sql
-- Restore original policies from previous migration
-- Copy from: supabase/migrations/20260131120000_add_settings_and_coupons.sql
```
