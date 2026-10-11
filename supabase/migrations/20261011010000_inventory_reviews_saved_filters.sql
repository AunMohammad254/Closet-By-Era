-- =============================================================================
-- Inventory, review moderation and saved filters (2026-10-11)
--
--   1. Stock was never reduced when an order was placed. createOrder now calls
--      reserve_order_stock (service role) after inserting the items; the call
--      fails atomically if any line is short. Cancelling or deleting an order
--      that has not shipped puts the stock back (trigger sync_order_stock).
--   2. Reviews had no moderation state, so "approve" changed nothing, and no FK
--      to products, so the admin list (products!inner embed) always errored.
--      New reviews now wait for staff approval; only approved ones are public.
--   3. Saved filter presets were written to a filter_presets table that never
--      existed. The app now uses admin_saved_filters, which gains is_default.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Inventory
-- -----------------------------------------------------------------------------
-- NULL: the order predates stock tracking and is never adjusted.
-- true: the order holds stock. false: stock was taken, then given back.
alter table public.orders
    add column if not exists stock_reserved boolean;

comment on column public.orders.stock_reserved is
    'NULL = untracked (before 2026-10-11), true = holds stock, false = stock released.';

-- Moves stock for every line of an order: p_direction -1 takes it, +1 returns it.
create or replace function public.apply_order_stock(p_order_id uuid, p_direction integer)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
    r record;
begin
    -- Sorted by product id so concurrent orders lock product rows in the same order.
    for r in
        select oi.product_id, sum(oi.quantity)::integer as qty, min(oi.product_name) as product_name
        from order_items oi
        where oi.order_id = p_order_id
        group by oi.product_id
        order by oi.product_id
    loop
        if p_direction < 0 then
            update products
            set stock = stock - r.qty,
                in_stock = case when stock - r.qty <= 0 then false else in_stock end
            where id = r.product_id and stock >= r.qty;

            if not found then
                raise exception 'Insufficient stock for %', coalesce(r.product_name, r.product_id::text)
                    using errcode = 'P0001', hint = 'insufficient_stock';
            end if;
        else
            update products
            set stock = stock + r.qty,
                -- Re-list products that had sold out; leave manual hides alone.
                in_stock = case when stock <= 0 then true else in_stock end
            where id = r.product_id;
        end if;
    end loop;
end;
$$;

create or replace function public.reserve_order_stock(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
    -- Row lock: a second concurrent call waits, then sees stock_reserved = true.
    perform 1 from orders where id = p_order_id and stock_reserved is not true for update;
    if not found then
        return;
    end if;

    perform public.apply_order_stock(p_order_id, -1);
    update orders set stock_reserved = true where id = p_order_id;
end;
$$;

create or replace function public.sync_order_stock()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    if tg_op = 'DELETE' then
        -- Goods that never left the warehouse go back on the shelf.
        if old.stock_reserved is true and old.status in ('pending', 'packed') then
            perform public.apply_order_stock(old.id, 1);
        end if;
        return old;
    end if;

    if new.status is not distinct from old.status then
        return new;
    end if;

    if new.status = 'cancelled' and old.stock_reserved is true then
        perform public.apply_order_stock(new.id, 1);
        new.stock_reserved := false;
    elsif old.status = 'cancelled' and old.stock_reserved is false then
        -- Reinstating a cancelled order takes the stock again (or fails).
        perform public.apply_order_stock(new.id, -1);
        new.stock_reserved := true;
    end if;

    return new;
end;
$$;

drop trigger if exists sync_order_stock on public.orders;
create trigger sync_order_stock
    before update of status or delete on public.orders
    for each row execute function public.sync_order_stock();

revoke execute on function public.apply_order_stock(uuid, integer) from public, anon, authenticated;
revoke execute on function public.reserve_order_stock(uuid) from public, anon, authenticated;
revoke execute on function public.sync_order_stock() from public, anon, authenticated;
grant execute on function public.reserve_order_stock(uuid) to service_role;

-- -----------------------------------------------------------------------------
-- 2. Reviews
-- -----------------------------------------------------------------------------
-- product_id held product uuids as TEXT with no FK.
alter table public.reviews
    alter column product_id type uuid using product_id::uuid;

do $$
begin
    if not exists (select 1 from pg_constraint where conname = 'reviews_product_id_fkey') then
        alter table public.reviews
            add constraint reviews_product_id_fkey
            foreign key (product_id) references public.products (id) on delete cascade;
    end if;
end $$;

alter table public.reviews
    add column if not exists is_approved boolean not null default false;

create index if not exists idx_reviews_product_approved
    on public.reviews (product_id, created_at desc) where is_approved;
create index if not exists idx_reviews_pending
    on public.reviews (created_at desc) where not is_approved;

-- Customers cannot approve their own reviews, and editing one sends it back
-- to the moderation queue.
create or replace function public.protect_review_moderation()
returns trigger
language plpgsql
set search_path = public
as $$
begin
    if current_user not in ('anon', 'authenticated') or public.is_admin_or_super() then
        return new;
    end if;
    new.is_approved := false;
    return new;
end;
$$;

drop trigger if exists protect_review_moderation on public.reviews;
create trigger protect_review_moderation
    before insert or update on public.reviews
    for each row execute function public.protect_review_moderation();

revoke execute on function public.protect_review_moderation() from public, anon, authenticated;

drop policy if exists "Anon read reviews" on public.reviews;
create policy "Anon read approved reviews" on public.reviews
    for select to anon
    using (is_approved);

drop policy if exists "Auth read reviews" on public.reviews;
create policy "Auth read approved own or staff reviews" on public.reviews
    for select to authenticated
    using (is_approved or user_id = (select auth.uid()) or public.is_admin_or_super());

-- -----------------------------------------------------------------------------
-- 3. Saved filter presets
-- -----------------------------------------------------------------------------
alter table public.admin_saved_filters
    add column if not exists is_default boolean not null default false;

create unique index if not exists admin_saved_filters_one_default
    on public.admin_saved_filters (admin_id, page) where is_default;
