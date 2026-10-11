-- =============================================================================
-- Security hardening (2026-10-11)
--
-- Fixes verified against the live database:
--   1. Any signed-in user could UPDATE their own customers row, including
--      role (-> admin/super_admin, synced into app_metadata) and loyalty_points.
--   2. SECURITY DEFINER RPCs callable by anon with no caller check:
--      promote_user_to_admin (instant admin for any email), get_orders_paginated
--      (dumps every order incl. PII), cancel_order, create_order_with_items, ...
--   3. orders / order_items: customers could UPDATE/DELETE their own orders
--      (e.g. payment_status = 'paid', price_at_purchase = 1).
--   4. coupons: any signed-in user could UPDATE/DELETE any active coupon, and
--      anon could list every active coupon code.
--   5. returns: customers could set status/refund_amount on their own returns.
--   6. support chat: staff could not read tickets; customers could post into
--      other customers' tickets.
--   7. store_settings / gift cards / product images were gated on tables or
--      role values that exclude super_admin (profiles is empty).
--   8. Storage buckets accept any file type and size.
--   9. get_admin_stats counted order statuses that do not exist.
--
-- The app (src/actions/*) now authorizes every admin action itself and calls
-- privileged RPCs with the service role, so revoking API access below does not
-- break any feature. Review, then apply with `supabase db push` or the SQL editor.
-- =============================================================================

begin;

-- -----------------------------------------------------------------------------
-- 1. Customers: only staff may change role / loyalty_points / auth_id
-- -----------------------------------------------------------------------------
create or replace function public.protect_customer_privileged_columns()
returns trigger
language plpgsql
set search_path = public
as $$
begin
    -- Only restrict requests coming through the Data API. Service role,
    -- migrations and SECURITY DEFINER triggers (handle_new_user) pass through.
    if current_user not in ('anon', 'authenticated') then
        return new;
    end if;

    if tg_op = 'INSERT' then
        if not public.is_super_admin() then
            new.role := 'customer';
        end if;
        if not public.is_admin_or_super() then
            new.loyalty_points := 0;
        end if;
        return new;
    end if;

    if new.role is distinct from old.role and not public.is_super_admin() then
        raise exception 'Only super admins can change roles' using errcode = '42501';
    end if;
    if new.loyalty_points is distinct from old.loyalty_points and not public.is_admin_or_super() then
        raise exception 'Loyalty points can only be changed by staff' using errcode = '42501';
    end if;
    if new.auth_id is distinct from old.auth_id and not public.is_admin_or_super() then
        raise exception 'auth_id cannot be changed' using errcode = '42501';
    end if;

    return new;
end;
$$;

drop trigger if exists protect_customer_privileged_columns on public.customers;
create trigger protect_customer_privileged_columns
    before insert or update on public.customers
    for each row execute function public.protect_customer_privileged_columns();

drop policy if exists "Auth consolidated customers" on public.customers;
create policy "Customers read own or staff all" on public.customers
    for select to authenticated
    using (public.is_admin_or_super() or auth_id = (select auth.uid()));
create policy "Customers insert own" on public.customers
    for insert to authenticated
    with check (public.is_admin_or_super() or auth_id = (select auth.uid()));
create policy "Customers update own or staff" on public.customers
    for update to authenticated
    using (public.is_admin_or_super() or auth_id = (select auth.uid()))
    with check (public.is_admin_or_super() or auth_id = (select auth.uid()));
create policy "Super admins delete customers" on public.customers
    for delete to authenticated
    using (public.is_super_admin());

-- -----------------------------------------------------------------------------
-- 2. Lock down SECURITY DEFINER functions exposed via /rest/v1/rpc
-- -----------------------------------------------------------------------------
-- Not used by the app at all:
revoke execute on function public.promote_user_to_admin(text) from public, anon, authenticated;
revoke execute on function public.debug_storage_upload() from public, anon, authenticated;
revoke execute on function public.get_orders_paginated(integer, integer, text) from public, anon, authenticated;
revoke execute on function public.cancel_order(uuid) from public, anon, authenticated;
revoke execute on function public.create_order_with_items(text, text, text, numeric, text, jsonb, uuid) from public, anon, authenticated;
revoke execute on function public.get_system_stats_optimized() from public, anon, authenticated;
revoke execute on function public.refresh_product_stats() from public, anon, authenticated;

-- Called by the app with the service role after its own checks:
revoke execute on function public.get_admin_stats() from public, anon, authenticated;
revoke execute on function public.get_analytics_summary(integer) from public, anon, authenticated;
revoke execute on function public.redeem_gift_card_atomic(text, numeric, uuid) from public, anon, authenticated;
revoke execute on function public.validate_gift_card(text) from public, anon, authenticated;

-- Trigger functions never need to be callable over the API:
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.sync_customer_role() from public, anon, authenticated;
revoke execute on function public.sync_user_role() from public, anon, authenticated;
revoke execute on function public.log_product_changes() from public, anon, authenticated;

grant execute on function
    public.get_admin_stats(),
    public.get_analytics_summary(integer),
    public.redeem_gift_card_atomic(text, numeric, uuid),
    public.validate_gift_card(text)
to service_role;

-- get_admin_stats used statuses that are not in the order_status enum.
create or replace function public.get_admin_stats()
returns json
language plpgsql
security definer
set search_path to 'public', 'pg_catalog'
as $$
declare
    total_revenue numeric;
    active_orders_count integer;
    products_count integer;
    customers_count integer;
begin
    select coalesce(sum(total), 0) into total_revenue
    from orders
    where status in ('packed', 'shipping', 'delivered');

    select count(*) into active_orders_count
    from orders
    where status in ('pending', 'packed', 'shipping');

    select count(*) into products_count from products;
    select count(*) into customers_count from customers;

    return json_build_object(
        'totalRevenue', total_revenue,
        'activeOrders', active_orders_count,
        'totalProducts', products_count,
        'totalCustomers', customers_count
    );
end;
$$;
revoke execute on function public.get_admin_stats() from public, anon, authenticated;

-- -----------------------------------------------------------------------------
-- 3. Orders / order items: customers read their own; only staff write.
--    Checkout inserts with the service role (src/actions/orders.ts).
-- -----------------------------------------------------------------------------
drop policy if exists "Auth consolidated orders" on public.orders;
create policy "Orders read own or staff" on public.orders
    for select to authenticated
    using (public.is_admin_or_super() or customer_id = (select public.get_my_customer_id()));
create policy "Staff insert orders" on public.orders
    for insert to authenticated with check (public.is_admin_or_super());
create policy "Staff update orders" on public.orders
    for update to authenticated
    using (public.is_admin_or_super()) with check (public.is_admin_or_super());
create policy "Staff delete orders" on public.orders
    for delete to authenticated using (public.is_admin_or_super());

drop policy if exists "Auth insert order_items" on public.order_items;
drop policy if exists "Auth update order_items" on public.order_items;
drop policy if exists "Auth delete order_items" on public.order_items;
create policy "Staff insert order_items" on public.order_items
    for insert to authenticated with check (public.is_admin_or_super());
create policy "Staff update order_items" on public.order_items
    for update to authenticated
    using (public.is_admin_or_super()) with check (public.is_admin_or_super());
create policy "Staff delete order_items" on public.order_items
    for delete to authenticated using (public.is_admin_or_super());

create unique index if not exists orders_order_number_key
    on public.orders (order_number) where order_number is not null;

-- -----------------------------------------------------------------------------
-- 4. Coupons: staff only. Checkout validates codes with the service role,
--    so nobody else needs to read the table (anon could list every code).
-- -----------------------------------------------------------------------------
drop policy if exists "Auth consolidated coupons" on public.coupons;
drop policy if exists "Anon read valid coupons" on public.coupons;
create policy "Staff manage coupons" on public.coupons
    for all to authenticated
    using (public.is_admin_or_super()) with check (public.is_admin_or_super());

-- -----------------------------------------------------------------------------
-- 5. Gift cards: include super_admin, authenticated only.
-- -----------------------------------------------------------------------------
drop policy if exists "Admins can manage gift cards" on public.gift_cards;
create policy "Staff manage gift cards" on public.gift_cards
    for all to authenticated
    using (public.is_admin_or_super()) with check (public.is_admin_or_super());

drop policy if exists "Admins can view usage" on public.gift_card_usage;
create policy "Staff view gift card usage" on public.gift_card_usage
    for select to authenticated using (public.is_admin_or_super());

-- -----------------------------------------------------------------------------
-- 6. Returns: customers create/read their own; only staff change status/refund.
-- -----------------------------------------------------------------------------
drop policy if exists "Auth update returns" on public.returns;
create policy "Staff update returns" on public.returns
    for update to authenticated
    using (public.is_admin_or_super()) with check (public.is_admin_or_super());

-- -----------------------------------------------------------------------------
-- 7. Support chat
-- -----------------------------------------------------------------------------
drop policy if exists "messages_access" on public.support_messages;
create policy "Users access own ticket messages" on public.support_messages
    for all to authenticated
    using (exists (
        select 1 from public.support_tickets t
        where t.id = support_messages.ticket_id and t.user_id = (select auth.uid())
    ))
    with check (
        sender_id = (select auth.uid())
        and coalesce(is_admin_reply, false) = false
        and exists (
            select 1 from public.support_tickets t
            where t.id = support_messages.ticket_id and t.user_id = (select auth.uid())
        )
    );
create policy "Staff manage support messages" on public.support_messages
    for all to authenticated
    using (public.is_admin_or_super()) with check (public.is_admin_or_super());
create policy "Staff manage support tickets" on public.support_tickets
    for all to authenticated
    using (public.is_admin_or_super()) with check (public.is_admin_or_super());

-- -----------------------------------------------------------------------------
-- 8. Store settings: the old policy checked `profiles`, which is empty, so
--    admin saves silently updated 0 rows.
-- -----------------------------------------------------------------------------
drop policy if exists "admin_update_settings" on public.store_settings;
create policy "Staff update settings" on public.store_settings
    for update to authenticated
    using (public.is_admin_or_super()) with check (public.is_admin_or_super());

-- -----------------------------------------------------------------------------
-- 9. Analytics: signed-in users could read every anonymous event.
-- -----------------------------------------------------------------------------
drop policy if exists "analytics_user_read" on public.analytics_events;
create policy "Analytics read own or staff" on public.analytics_events
    for select to authenticated
    using (public.is_admin_or_super() or user_id = (select auth.uid()));

-- -----------------------------------------------------------------------------
-- 10. Promotions: the admin UI supports fixed vs percentage discounts.
-- -----------------------------------------------------------------------------
alter table public.promotions
    add column if not exists discount_type text not null default 'percentage';
do $$
begin
    if not exists (select 1 from pg_constraint where conname = 'promotions_discount_type_check') then
        alter table public.promotions
            add constraint promotions_discount_type_check check (discount_type in ('percentage', 'fixed'));
    end if;
end $$;

commit;

-- -----------------------------------------------------------------------------
-- 11. Storage (outside the transaction: on some projects storage.objects is owned
--     by supabase_storage_admin and policy changes must be made in the dashboard).
--     Products uploads for all staff; size/type limits on buckets.
-- -----------------------------------------------------------------------------
drop policy if exists "Admin Manage Products" on storage.objects;
create policy "Staff manage product images" on storage.objects
    for all to authenticated
    using (bucket_id = 'products' and public.is_admin_or_super())
    with check (bucket_id = 'products' and public.is_admin_or_super());

update storage.buckets
set file_size_limit = 5 * 1024 * 1024,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif']
where id in ('products', 'review-images');


-- -----------------------------------------------------------------------------
-- Not covered here (dashboard settings / manual):
--   * Enable leaked password protection (Auth > Providers > Email).
--   * Undeploy or lock down the `Confirmation-Email` edge function: it sends
--     arbitrary HTML to arbitrary recipients for anyone with the anon key.
-- -----------------------------------------------------------------------------
