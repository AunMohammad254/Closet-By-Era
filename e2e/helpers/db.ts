/**
 * Direct access to the local test database: SQL for setup and assertions, and
 * the Auth admin API for creating users. Never points at production (see e2e/env.ts).
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import pg from 'pg';
import { PASSWORD, ROOT, supabaseStatus, USERS, type Role } from '../env';

let pool: pg.Pool | null = null;

function getPool(): pg.Pool {
    pool ??= new pg.Pool({ connectionString: supabaseStatus().DB_URL, max: 4, allowExitOnIdle: true });
    return pool;
}

export async function sql<T extends pg.QueryResultRow = Record<string, unknown>>(text: string, params: unknown[] = []): Promise<T[]> {
    const { rows } = await getPool().query<T>(text, params);
    return rows;
}

export async function one<T extends pg.QueryResultRow = Record<string, unknown>>(text: string, params: unknown[] = []): Promise<T> {
    const rows = await sql<T>(text, params);
    if (rows.length !== 1) throw new Error(`Expected one row, got ${rows.length}: ${text}`);
    return rows[0];
}

export async function closeDb(): Promise<void> {
    await pool?.end();
    pool = null;
}

/**
 * Empties every public table and auth user, then re-applies seed.sql, so each
 * run starts from the same data no matter what earlier runs left behind.
 */
export async function resetDatabase(): Promise<void> {
    const tables = await sql<{ tablename: string }>(
        `select tablename from pg_tables where schemaname = 'public'`
    );
    const client = await getPool().connect();
    try {
        await client.query('begin');
        await client.query(`truncate ${tables.map(t => `public."${t.tablename}"`).join(', ')} restart identity cascade`);
        await client.query('delete from auth.users');
        // Uploaded test images stay in storage: Supabase forbids deleting
        // storage rows directly, and nothing reads files that are not linked.
        await client.query(readFileSync(path.join(ROOT, 'e2e', 'supabase', 'seed.sql'), 'utf8'));
        await client.query('refresh materialized view public.mv_product_stats');
        await client.query('commit');
    } catch (error) {
        await client.query('rollback');
        throw error;
    } finally {
        client.release();
    }
}

async function authAdmin<T>(method: string, route: string, body?: unknown): Promise<T> {
    const sb = supabaseStatus();
    const res = await fetch(`${sb.API_URL}/auth/v1/admin${route}`, {
        method,
        headers: {
            apikey: sb.SERVICE_ROLE_KEY,
            Authorization: `Bearer ${sb.SERVICE_ROLE_KEY}`,
            'Content-Type': 'application/json',
        },
        body: body === undefined ? undefined : JSON.stringify(body),
    });
    const text = await res.text();
    if (!res.ok) throw new Error(`Auth admin ${method} ${route} failed: ${res.status} ${text}`);
    return (text ? JSON.parse(text) : {}) as T;
}

export interface TestUser {
    authId: string;
    customerId: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
}

/**
 * Creates a confirmed user (the handle_new_user trigger adds its customers row)
 * and gives it a role. Roles are set in SQL, as only staff can change them.
 */
export async function createUser(opts: {
    email?: string;
    firstName?: string;
    lastName?: string;
    role?: 'customer' | 'admin' | 'super_admin';
} = {}): Promise<TestUser> {
    const email = opts.email ?? `shopper-${randomUUID().slice(0, 8)}@closetbyera.test`;
    const firstName = opts.firstName ?? 'Test';
    const lastName = opts.lastName ?? 'Shopper';
    const user = await authAdmin<{ id: string }>('POST', '/users', {
        email,
        password: PASSWORD,
        email_confirm: true,
        user_metadata: { first_name: firstName, last_name: lastName },
    });
    if (opts.role && opts.role !== 'customer') {
        await sql('update public.customers set role = $1 where auth_id = $2', [opts.role, user.id]);
    }
    const customer = await one<{ id: string }>('select id from public.customers where auth_id = $1', [user.id]);
    return { authId: user.id, customerId: customer.id, email, password: PASSWORD, firstName, lastName };
}

/** A one-time email token (what an emailed link carries) without sending any email. */
export async function generateEmailToken(type: 'magiclink' | 'recovery', email: string): Promise<string> {
    const res = await authAdmin<{ hashed_token?: string; properties?: { hashed_token: string } }>(
        'POST', '/generate_link', { type, email }
    );
    const token = res.properties?.hashed_token ?? res.hashed_token;
    if (!token) throw new Error(`generate_link returned no token for ${email}`);
    return token;
}

export async function createRoleUser(role: Role): Promise<TestUser> {
    const u = USERS[role];
    return createUser({ email: u.email, firstName: u.firstName, lastName: u.lastName, role: u.role });
}

export async function userByEmail(email: string): Promise<TestUser> {
    const row = await one<{ auth_id: string; id: string; first_name: string; last_name: string }>(
        'select auth_id, id, first_name, last_name from public.customers where email = $1', [email]
    );
    return { authId: row.auth_id, customerId: row.id, email, password: PASSWORD, firstName: row.first_name, lastName: row.last_name };
}

export async function productStock(productId: string): Promise<{ stock: number; in_stock: boolean }> {
    return one('select stock, in_stock from public.products where id = $1', [productId]);
}

export async function setProductStock(productId: string, stock: number): Promise<void> {
    await sql('update public.products set stock = $2, in_stock = $2 > 0 where id = $1', [productId, stock]);
}

export interface OrderRow {
    id: string;
    order_number: string;
    status: string;
    payment_status: string;
    payment_method: string;
    total_amount: string;
    subtotal: string;
    discount: string;
    shipping_cost: string;
    customer_email: string;
    stock_reserved: boolean | null;
    notes: string | null;
}

export async function latestOrderFor(customerId: string): Promise<OrderRow> {
    return one<OrderRow>(
        'select * from public.orders where customer_id = $1 order by created_at desc limit 1', [customerId]
    );
}

export async function orderByNumber(orderNumber: string): Promise<OrderRow> {
    return one<OrderRow>('select * from public.orders where order_number = $1', [orderNumber]);
}

const uniqueCode = (prefix: string) => `${prefix}-${randomUUID().slice(0, 6).toUpperCase()}`;

/** A coupon only this test uses (seeded coupons are shared). */
export async function createCoupon(opts: {
    type?: 'percentage' | 'fixed';
    value: number;
    minOrder?: number;
    maxUses?: number | null;
    usesCount?: number;
}): Promise<{ id: string; code: string }> {
    const code = uniqueCode('CPN');
    const row = await one<{ id: string }>(
        `insert into public.coupons (code, description, discount_type, discount_value, min_order_amount, max_uses, uses_count, is_active)
         values ($1, 'e2e', $2, $3, $4, $5, $6, true) returning id`,
        [code, opts.type ?? 'percentage', opts.value, opts.minOrder ?? 0, opts.maxUses ?? null, opts.usesCount ?? 0]
    );
    return { id: row.id, code };
}

/** A gift card only this test uses. */
export async function createGiftCard(balance: number): Promise<{ id: string; code: string }> {
    const code = uniqueCode('GIFT');
    const row = await one<{ id: string }>(
        `insert into public.gift_cards (code, initial_value, balance, is_active) values ($1, $2, $2, true) returning id`,
        [code, balance]
    );
    return { id: row.id, code };
}

/** A product only this test uses (deleted again by deleteProducts / the next reset). */
export async function createProduct(opts: { name?: string; price?: number; stock?: number; categoryId?: string | null; sizes?: string[] | null } = {}): Promise<{ id: string; name: string; slug: string; price: number }> {
    const name = opts.name ?? `E2E Temp ${randomUUID().slice(0, 6)}`;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const price = opts.price ?? 1000;
    const row = await one<{ id: string }>(
        `insert into public.products (name, slug, description, price, stock, in_stock, is_active, category_id, image_url, images, sizes)
         values ($1, $2, 'Temporary product for one test.', $3, $4, $4 > 0, true, $5, '/products/placeholder.png', '{}', $6) returning id`,
        [name, slug, price, opts.stock ?? 10, opts.categoryId ?? null, opts.sizes ?? null]
    );
    return { id: row.id, name, slug, price };
}

export async function deleteProducts(ids: string[]): Promise<void> {
    if (ids.length) await sql('delete from public.products where id = any($1::uuid[])', [ids]);
}

/** Inserts an order (with items) directly, for tests that need existing orders. */
export async function insertOrder(opts: {
    customer: TestUser;
    items: { productId: string; name: string; price: number; quantity: number }[];
    status?: string;
    paymentMethod?: string;
    paymentStatus?: string;
    stockReserved?: boolean | null;
}): Promise<OrderRow> {
    const subtotal = opts.items.reduce((s, i) => s + i.price * i.quantity, 0);
    const orderNumber = `CBE-E2E-${randomUUID().slice(0, 6).toUpperCase()}`;
    const address = JSON.stringify({
        firstName: opts.customer.firstName, lastName: opts.customer.lastName, address: '1 Test Street',
        city: 'Lahore', postalCode: '54000', country: 'Pakistan', phone: '+923000000000',
    });
    const order = await one<OrderRow>(
        `insert into public.orders (order_number, customer_id, customer_email, customer_name, shipping_address,
            subtotal, discount, shipping_cost, total_amount, payment_method, payment_status, status, stock_reserved)
         values ($1, $2, $3, $4, $5, $6, 0, 0, $6, $7, $8, $9, $10) returning *`,
        [orderNumber, opts.customer.customerId, opts.customer.email, `${opts.customer.firstName} ${opts.customer.lastName}`,
            address, subtotal, opts.paymentMethod ?? 'cod', opts.paymentStatus ?? 'pending', opts.status ?? 'pending',
            opts.stockReserved ?? null]
    );
    for (const item of opts.items) {
        await sql(
            `insert into public.order_items (order_id, product_id, product_name, quantity, price_at_purchase)
             values ($1, $2, $3, $4, $5)`,
            [order.id, item.productId, item.name, item.quantity, item.price]
        );
    }
    return order;
}
