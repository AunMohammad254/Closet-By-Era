/**
 * Helpers for rendering orders. `orders.shipping_address` is a TEXT column
 * holding JSON (written by createOrder), so it must be parsed before use.
 */

export interface ParsedShippingAddress {
    firstName?: string;
    lastName?: string;
    address?: string;
    apartment?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
    phone?: string;
    email?: string;
}

export function parseShippingAddress(raw: unknown): ParsedShippingAddress {
    if (raw && typeof raw === 'object') return raw as ParsedShippingAddress;
    if (typeof raw !== 'string' || !raw.trim()) return {};
    try {
        const parsed: unknown = JSON.parse(raw);
        return parsed && typeof parsed === 'object' ? (parsed as ParsedShippingAddress) : { address: raw };
    } catch {
        return { address: raw }; // legacy free-text address
    }
}

interface CustomerLike {
    first_name?: string | null;
    last_name?: string | null;
    email?: string | null;
}

interface OrderLike {
    customer_name?: string | null;
    customer_email?: string | null;
    shipping_address?: unknown;
    customer?: CustomerLike | null;
    customers?: CustomerLike | null;
}

export function getOrderCustomerName(order: OrderLike): string {
    const fromOrder = order.customer_name?.trim();
    if (fromOrder) return fromOrder;

    const customer = order.customer ?? order.customers;
    const fromCustomer = `${customer?.first_name ?? ''} ${customer?.last_name ?? ''}`.trim();
    if (fromCustomer) return fromCustomer;

    const addr = parseShippingAddress(order.shipping_address);
    const fromAddress = `${addr.firstName ?? ''} ${addr.lastName ?? ''}`.trim();
    return fromAddress || customer?.email || order.customer_email || 'Guest';
}

export function getOrderCustomerEmail(order: OrderLike): string {
    const customer = order.customer ?? order.customers;
    return order.customer_email || customer?.email || parseShippingAddress(order.shipping_address).email || '';
}

/** Quote a CSV cell and neutralise spreadsheet formulas (=, +, -, @). */
export function toCsvCell(value: unknown): string {
    let text = String(value ?? '');
    if (/^[=+\-@]/.test(text)) text = `'${text}`;
    return `"${text.replace(/"/g, '""')}"`;
}
