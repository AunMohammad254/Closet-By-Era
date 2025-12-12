/**
 * Email utility module for sending order confirmation emails
 * Uses Supabase Edge Functions with Resend email service
 */

import { supabase, Order } from './supabase';

interface OrderItem {
    productName: string;
    quantity: number;
    size?: string;
    color?: string;
    unitPrice: number;
    totalPrice: number;
}

interface ShippingAddress {
    firstName: string;
    lastName: string;
    address: string;
    apartment?: string;
    city: string;
    postalCode?: string;
    country: string;
    phone: string;
}

interface OrderEmailData {
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
    orderDate: string;
}

/**
 * Send order confirmation email via Supabase Edge Function
 * 
 * @param emailData - Order details for the confirmation email
 * @returns Promise with success status and message
 */
export async function sendOrderConfirmationEmail(emailData: OrderEmailData): Promise<{
    success: boolean;
    message: string;
    error?: string;
}> {
    try {
        // Call Supabase Edge Function to send email
        const { data, error } = await supabase.functions.invoke('Confirmation-Email', {
            body: {
                to: emailData.customerEmail,
                subject: `Order Confirmation - ${emailData.orderNumber}`,
                orderData: emailData,
            },
        });

        if (error) {
            console.error('Error sending order email:', error);
            return {
                success: false,
                message: 'Failed to send confirmation email',
                error: error.message,
            };
        }

        return {
            success: true,
            message: 'Order confirmation email sent successfully',
        };
    } catch (err) {
        console.error('Email sending error:', err);
        return {
            success: false,
            message: 'An error occurred while sending the email',
            error: err instanceof Error ? err.message : 'Unknown error',
        };
    }
}

/**
 * Format order data for email template
 * 
 * @param order - Order object from database
 * @param items - Order items array
 * @param customerEmail - Customer's email address
 * @returns Formatted OrderEmailData object
 */
export function formatOrderForEmail(
    order: Partial<Order>,
    items: OrderItem[],
    customerEmail: string,
    customerName: string,
    shippingAddress: ShippingAddress,
    paymentMethod: string
): OrderEmailData {
    return {
        orderNumber: order.order_number || '',
        customerEmail,
        customerName,
        items,
        shippingAddress,
        subtotal: order.subtotal || 0,
        shippingCost: order.shipping_cost || 0,
        discount: order.discount,
        total: order.total || 0,
        paymentMethod,
        orderDate: new Date().toLocaleDateString('en-PK', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        }),
    };
}

/**
 * Generate HTML email template for order confirmation
 * This can be used by the Edge Function
 */
export function generateOrderEmailHtml(data: OrderEmailData): string {
    const itemsHtml = data.items.map(item => `
        <tr>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
                <strong>${item.productName}</strong>
                ${item.size ? `<br><span style="color: #6b7280; font-size: 14px;">Size: ${item.size}</span>` : ''}
                ${item.color ? `<span style="color: #6b7280; font-size: 14px;"> | Color: ${item.color}</span>` : ''}
            </td>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">PKR ${item.totalPrice.toLocaleString()}</td>
        </tr>
    `).join('');

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Order Confirmation - ${data.orderNumber}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #1e293b 0%, #334155 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 300; letter-spacing: 2px;">
                CLOSET<span style="color: #e11d48;">BY</span>ERA
            </h1>
        </div>

        <!-- Main Content -->
        <div style="background-color: #ffffff; padding: 40px 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <!-- Success Icon -->
            <div style="text-align: center; margin-bottom: 30px;">
                <div style="width: 60px; height: 60px; background-color: #d1fae5; border-radius: 50%; margin: 0 auto; display: flex; align-items: center; justify-content: center;">
                    <span style="color: #10b981; font-size: 30px;">✓</span>
                </div>
            </div>

            <h2 style="text-align: center; color: #1f2937; margin: 0 0 10px 0;">Thank You for Your Order!</h2>
            <p style="text-align: center; color: #6b7280; margin: 0 0 30px 0;">
                Hi ${data.customerName}, we've received your order and it's being processed.
            </p>

            <!-- Order Info -->
            <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 5px 0; color: #6b7280;">Order Number:</td>
                        <td style="padding: 5px 0; text-align: right; font-weight: 600; color: #1f2937;">${data.orderNumber}</td>
                    </tr>
                    <tr>
                        <td style="padding: 5px 0; color: #6b7280;">Order Date:</td>
                        <td style="padding: 5px 0; text-align: right; color: #1f2937;">${data.orderDate}</td>
                    </tr>
                    <tr>
                        <td style="padding: 5px 0; color: #6b7280;">Payment Method:</td>
                        <td style="padding: 5px 0; text-align: right; color: #1f2937;">${data.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Credit/Debit Card'}</td>
                    </tr>
                </table>
            </div>

            <!-- Order Items -->
            <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 16px;">Order Details</h3>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                <thead>
                    <tr style="background-color: #f9fafb;">
                        <th style="padding: 12px; text-align: left; color: #6b7280; font-weight: 500;">Item</th>
                        <th style="padding: 12px; text-align: center; color: #6b7280; font-weight: 500;">Qty</th>
                        <th style="padding: 12px; text-align: right; color: #6b7280; font-weight: 500;">Price</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsHtml}
                </tbody>
            </table>

            <!-- Totals -->
            <div style="border-top: 2px solid #e5e7eb; padding-top: 20px;">
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 8px 0; color: #6b7280;">Subtotal</td>
                        <td style="padding: 8px 0; text-align: right; color: #1f2937;">PKR ${data.subtotal.toLocaleString()}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #6b7280;">Shipping</td>
                        <td style="padding: 8px 0; text-align: right; color: #1f2937;">${data.shippingCost === 0 ? 'Free' : `PKR ${data.shippingCost.toLocaleString()}`}</td>
                    </tr>
                    ${data.discount ? `
                    <tr>
                        <td style="padding: 8px 0; color: #10b981;">Discount</td>
                        <td style="padding: 8px 0; text-align: right; color: #10b981;">-PKR ${data.discount.toLocaleString()}</td>
                    </tr>
                    ` : ''}
                    <tr>
                        <td style="padding: 12px 0; font-size: 18px; font-weight: 600; color: #1f2937;">Total</td>
                        <td style="padding: 12px 0; text-align: right; font-size: 18px; font-weight: 600; color: #1f2937;">PKR ${data.total.toLocaleString()}</td>
                    </tr>
                </table>
            </div>

            <!-- Shipping Address -->
            <div style="margin-top: 30px; padding: 20px; background-color: #f9fafb; border-radius: 8px;">
                <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 16px;">Shipping Address</h3>
                <p style="color: #4b5563; margin: 0; line-height: 1.6;">
                    ${data.shippingAddress.firstName} ${data.shippingAddress.lastName}<br>
                    ${data.shippingAddress.address}<br>
                    ${data.shippingAddress.apartment ? `${data.shippingAddress.apartment}<br>` : ''}
                    ${data.shippingAddress.city}${data.shippingAddress.postalCode ? `, ${data.shippingAddress.postalCode}` : ''}<br>
                    ${data.shippingAddress.country}<br>
                    <strong>Phone:</strong> ${data.shippingAddress.phone}
                </p>
            </div>

            <!-- CTA Button -->
            <div style="text-align: center; margin-top: 30px;">
                <a href="https://closetbyera.com/account/orders" style="display: inline-block; padding: 14px 30px; background-color: #1e293b; color: #ffffff; text-decoration: none; border-radius: 50px; font-weight: 500;">
                    Track Your Order
                </a>
            </div>
        </div>

        <!-- Footer -->
        <div style="text-align: center; padding: 30px; color: #6b7280; font-size: 14px;">
            <p style="margin: 0 0 10px 0;">
                Questions? Contact us at <a href="mailto:support@closetbyera.com" style="color: #e11d48;">support@closetbyera.com</a>
            </p>
            <p style="margin: 0;">
                © 2024 Closet By Era. All rights reserved.
            </p>
        </div>
    </div>
</body>
</html>
    `;
}
