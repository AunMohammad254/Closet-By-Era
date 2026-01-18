'use server';

import {
    sendOrderConfirmationEmail as sendNodemailerConfirm,
    formatOrderForEmail as formatNodemailerOrder,
    verifyEmailConnection,
    type OrderEmailData,
    type ShippingAddress,
    type OrderItem
} from '@/lib/nodemailer';
import { type Order } from '@/types/supabase';

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
        console.log('📧 Attempting to send order confirmation email to:', customerEmail); // Debug log

        // 1. Verify connection
        const isConnected = await verifyEmailConnection();
        if (!isConnected) {
            console.error('❌ SMTP Connection failed during checkout');
            return { success: false, message: 'Email service unavailable' };
        }

        // 2. Format data
        const emailData = formatNodemailerOrder(
            order,
            items,
            customerEmail,
            customerName,
            shippingAddress,
            paymentMethod
        );

        // 3. Send email
        const result = await sendNodemailerConfirm(emailData);

        if (result.success) {
            console.log('✅ Order confirmation sent successfully:', result.messageId);
        } else {
            console.error('❌ Failed to send order confirmation:', result.error);
        }

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
