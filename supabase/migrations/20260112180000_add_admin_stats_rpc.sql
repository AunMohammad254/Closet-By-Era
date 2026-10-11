-- Function to calculate dashboard stats efficiently in SQL
-- Avoids fetching thousands of rows to JS just to count them
create or replace function get_admin_stats()
returns json
language plpgsql
security definer -- Runs with privileges of the creator (postgres/admin), bypassing RLS if needed, or stick to invoker if RLS is fine. Default to invoker usually better unless public needs this. Admin only area, so definer is safe if restricted.
as $$
declare
    total_revenue numeric;
    active_orders_count integer;
    products_count integer;
    customers_count integer;
begin
    -- 1. Total Revenue
    -- Sum total of orders that are confirmed, shipped, delivered, or processing
    select coalesce(sum(total), 0)
    into total_revenue
    from orders
    where status in ('confirmed', 'shipped', 'delivered', 'processing');

    -- 2. Active Orders
    -- Count pending or processing
    select count(*)
    into active_orders_count
    from orders
    where status in ('pending', 'processing');

    -- 3. Total Products
    select count(*)
    into products_count
    from products;

    -- 4. Total Customers
    -- Estimate via unique emails in orders for now (since guest checkout is primary)
    -- Or count customers table if populated
    -- Let's try customers table first, fallback to 0
    select count(*)
    into customers_count
    from customers;

    return json_build_object(
        'totalRevenue', total_revenue,
        'activeOrders', active_orders_count,
        'totalProducts', products_count,
        'totalCustomers', customers_count
    );
end;
$$;
