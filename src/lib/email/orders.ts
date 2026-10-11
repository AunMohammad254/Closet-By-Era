import 'server-only';

import type { Order } from '@/types/database';
import type { ShippingAddress } from '@/types/shared';
import { PAYMENT_METHOD_LABELS, type PaymentDetail } from '@/lib/payments';
import { getSiteUrl } from '@/lib/site-url';
import { sendEmail, type EmailResult } from './transport';
import {
    button, callout, details, esc, heading, itemTable, note, paragraph,
    renderEmail, richParagraph, strong, subheading,
} from './layout';

export type { ShippingAddress };

// Extended Order type for email templates (handles both old and new schema)
type OrderEmailInput = Partial<Order> & {
    order_number?: string;
    subtotal?: number;
    shipping_cost?: number;
    discount?: number;
    total?: number;
};

export interface OrderItem {
    productName: string;
    quantity: number;
    size?: string;
    color?: string;
    unitPrice: number;
    totalPrice: number;
}

export interface OrderEmailData {
    orderNumber: string;
    customerEmail: string;
    customerName: string;
    items: OrderItem[];
    shippingAddress: ShippingAddress;
    subtotal: number;
    shippingCost: number;
    discount?: number;
    total: number;
    paymentMethod: string;
    /** Account details for transfer payments; empty for COD and paid orders. */
    paymentDetails: PaymentDetail[];
    /** True once the order is fully paid (gift card or card payment). */
    paid: boolean;
    orderDate: string;
}

const pkr = (amount: number) => `PKR ${amount.toLocaleString('en-PK')}`;
const ordersUrl = () => `${getSiteUrl()}/account?tab=orders`;

export function formatOrderForEmail(
    order: OrderEmailInput,
    items: OrderItem[],
    customerEmail: string,
    customerName: string,
    shippingAddress: ShippingAddress,
    paymentMethod: string,
    paymentDetails: PaymentDetail[] = [],
    paid = false
): OrderEmailData {
    return {
        orderNumber: order.order_number || '',
        customerEmail,
        customerName,
        items,
        shippingAddress,
        subtotal: order.subtotal || 0,
        shippingCost: order.shipping_cost || 0,
        discount: order.discount || 0,
        total: order.total || 0,
        paymentMethod,
        paymentDetails,
        paid,
        orderDate: new Date().toLocaleDateString('en-PK', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'Asia/Karachi',
        }),
    };
}

export function orderConfirmationEmail(data: OrderEmailData): { subject: string; html: string; text: string } {
    const method = PAYMENT_METHOD_LABELS[data.paymentMethod] ?? data.paymentMethod;
    const a = data.shippingAddress;
    const addressHtml = [
        `${esc(a.firstName)} ${esc(a.lastName)}`,
        esc(a.address),
        a.apartment ? esc(a.apartment) : '',
        `${esc(a.city)}${a.postalCode ? `, ${esc(a.postalCode)}` : ''}`,
        esc(a.country),
        `Phone: ${esc(a.phone)}`,
    ].filter(Boolean).join('<br>');

    const body = [
        heading(data.paid ? 'Thank you, your order is paid' : 'Thank you for your order'),
        richParagraph(`Hi ${esc(data.customerName)}, we have received order ${strong(data.orderNumber)} and are getting it ready.`),
        details([
            { label: 'Order number', value: data.orderNumber },
            { label: 'Date', value: data.orderDate },
            { label: 'Payment', value: data.paid ? `${method} (paid)` : method },
        ]),
        data.paymentDetails.length ? callout([
            `<p style="margin:0 0 10px;font-size:15px;font-weight:600;color:#0f172a;">Complete your payment</p>`,
            richParagraph(`Send ${strong(pkr(data.total))} by ${esc(method)} and use ${strong(data.orderNumber)} as the payment reference. We ship once the payment is confirmed.`),
            details(data.paymentDetails),
        ].join(''), 'warning') : '',
        subheading('Order details'),
        itemTable(data.items.map(item => ({
            name: item.productName,
            detail: [item.size && `Size: ${item.size}`, item.color && `Color: ${item.color}`].filter(Boolean).join(' · ') || undefined,
            quantity: item.quantity,
            price: pkr(item.totalPrice),
        }))),
        details([
            { label: 'Subtotal', value: pkr(data.subtotal) },
            { label: 'Shipping', value: data.shippingCost === 0 ? 'Free' : pkr(data.shippingCost) },
            ...(data.discount ? [{ label: 'Discount', value: `- ${pkr(data.discount)}` }] : []),
            { label: 'Total', value: pkr(data.total), emphasis: true },
        ]),
        subheading('Shipping address'),
        richParagraph(addressHtml),
        button(ordersUrl(), 'View your order'),
        note('Questions? Just reply to this email.'),
    ].join('');

    const text = [
        `Thank you for your order ${data.orderNumber}.`,
        `Total: ${pkr(data.total)} (${method}${data.paid ? ', paid' : ''})`,
        ...(data.paymentDetails.length
            ? ['', `Please send ${pkr(data.total)} using ${data.orderNumber} as the reference:`, ...data.paymentDetails.map(d => `${d.label}: ${d.value}`)]
            : []),
        '',
        `View your order: ${ordersUrl()}`,
    ].join('\n');

    return {
        subject: `Order confirmation - ${data.orderNumber}`,
        html: renderEmail({ preheader: `Order ${data.orderNumber}: ${pkr(data.total)}`, body }),
        text,
    };
}

const STATUS_COPY: Record<string, string> = {
    pending: 'We have your order and will start preparing it shortly.',
    packed: 'Your order is packed and waiting for the courier.',
    shipping: 'Your order is on its way.',
    delivered: 'Your order has been delivered. We hope you love it!',
    cancelled: 'Your order has been cancelled. If you already paid, we will be in touch about your refund.',
};

export function orderStatusEmail(customerName: string, orderNumber: string, status: string, message?: string) {
    const label = status.charAt(0).toUpperCase() + status.slice(1);
    const body = [
        heading(`Order update: ${label}`),
        richParagraph(`Hi ${esc(customerName)}, the status of order ${strong(orderNumber)} is now ${strong(label)}.`),
        paragraph(STATUS_COPY[status] ?? ''),
        message ? callout(paragraph(message)) : '',
        button(ordersUrl(), 'Track your order'),
    ].join('');

    return {
        subject: `Order update - ${orderNumber}`,
        html: renderEmail({ preheader: `Order ${orderNumber} is now ${label}`, body }),
        text: `Your order ${orderNumber} is now ${label}. ${STATUS_COPY[status] ?? ''}\nTrack it: ${ordersUrl()}`,
    };
}

export function sendOrderConfirmationEmail(data: OrderEmailData): Promise<EmailResult> {
    return sendEmail({ to: data.customerEmail, ...orderConfirmationEmail(data) });
}

export function sendOrderStatusEmail(
    customerEmail: string,
    customerName: string,
    orderNumber: string,
    status: string,
    message?: string
): Promise<EmailResult> {
    return sendEmail({ to: customerEmail, ...orderStatusEmail(customerName, orderNumber, status, message) });
}
