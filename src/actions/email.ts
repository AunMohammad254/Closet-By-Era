'use server';

import {
    sendOrderConfirmationEmail as sendNodemailerConfirm,
    formatOrderForEmail as formatNodemailerOrder,
    verifyEmailConnection,
    type OrderEmailData,
    type ShippingAddress,
    type OrderItem
} from '@/lib/nodemailer';
import { type Order } from '@/types/database';

/**
 * Server action to send order confirmation email using Nodemailer
 */
export async function sendOrderConfirmation(
    order: Partial<Order>,
    items: OrderItem[],
    customerEmail: string,
    customerName: string,
    shippingAddress: ShippingAddress,
    paymentMethod: string
) {
    try {
        // 1. Verify connection
        const isConnected = await verifyEmailConnection();
        if (!isConnected) {
            console.error('❌ SMTP Connection failed during checkout');
            return { success: false, message: 'Email service unavailable' };
        }

        // 2. Format data
        const emailData = formatNodemailerOrder(
            order as Parameters<typeof formatNodemailerOrder>[0],
            items,
            customerEmail,
            customerName,
            shippingAddress,
            paymentMethod
        );

        // 3. Send email
        const result = await sendNodemailerConfirm(emailData);

        // Result is logged at the nodemailer level

        return result;
    } catch (error) {
        console.error('❌ Exception sending order confirmation:', error);
        return {
            success: false,
            message: 'Failed to send email',
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}
