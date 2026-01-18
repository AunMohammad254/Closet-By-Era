/**
 * Nodemailer Email Service
 * 
 * Supports multiple SMTP providers:
 * - Gmail (default)
 * - Outlook/Hotmail
 * - Custom SMTP
 * - Brevo (Sendinblue)
 * 
 * Configure via environment variables in .env:
 * - SMTP_HOST
 * - SMTP_PORT
 * - SMTP_USER
 * - SMTP_PASSWORD
 * - SMTP_FROM_EMAIL
 * - SMTP_FROM_NAME
 */

import nodemailer from 'nodemailer';
import { Order } from './supabase';

// SMTP Configuration from environment variables
const smtpConfig = {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASSWORD || '',
    },
};

// Create reusable transporter
const transporter = nodemailer.createTransport(smtpConfig);

// Default sender info
const defaultFrom = {
    name: process.env.SMTP_FROM_NAME || 'Closet By Era',
    email: process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || 'noreply@closetbyera.com',
};

// Types
export interface OrderItem {
    productName: string;
    quantity: number;
    size?: string;
    color?: string;
    unitPrice: number;
    totalPrice: number;
}

export interface ShippingAddress {
    firstName: string;
    lastName: string;
    address: string;
    apartment?: string;
    city: string;
    postalCode?: string;
    country: string;
    phone: string;
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
    orderDate: string;
}

interface EmailResult {
    success: boolean;
    message: string;
    messageId?: string;
    error?: string;
}

/**
 * Verify SMTP connection
 */
export async function verifyEmailConnection(): Promise<boolean> {
    try {
        await transporter.verify();
        console.log('✅ SMTP connection verified');
        return true;
    } catch (error) {
        console.error('❌ SMTP connection failed:', error);
        return false;
    }
}

/**
 * Send a generic email
 */
export async function sendEmail(
    to: string,
    subject: string,
    html: string,
    text?: string
): Promise<EmailResult> {
    try {
        // Check if SMTP is configured
        if (!smtpConfig.auth.user || !smtpConfig.auth.pass) {
            console.warn('SMTP not configured. Email not sent.');
            return {
                success: false,
                message: 'SMTP not configured',
                error: 'Missing SMTP credentials in environment variables'
            };
        }

        const info = await transporter.sendMail({
            from: `"${defaultFrom.name}" <${defaultFrom.email}>`,
            to,
            subject,
            text: text || subject,
            html,
        });

        console.log('✅ Email sent:', info.messageId);
        return {
            success: true,
            message: 'Email sent successfully',
            messageId: info.messageId,
        };
    } catch (error) {
        console.error('❌ Error sending email:', error);
        return {
            success: false,
            message: 'Failed to send email',
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

/**
 * Send order confirmation email
 */
export async function sendOrderConfirmationEmail(
    emailData: OrderEmailData
): Promise<EmailResult> {
    const html = generateOrderEmailHtml(emailData);
    const text = `Thank you for your order ${emailData.orderNumber}! Total: PKR ${emailData.total.toLocaleString()}`;

    return sendEmail(
        emailData.customerEmail,
        `Order Confirmation - ${emailData.orderNumber}`,
        html,
        text
    );
}

/**
 * Send order status update email
 */
export async function sendOrderStatusEmail(
    customerEmail: string,
    customerName: string,
    orderNumber: string,
    status: string,
    message?: string
): Promise<EmailResult> {
    const html = generateStatusEmailHtml(customerName, orderNumber, status, message);
    const text = `Your order ${orderNumber} status has been updated to: ${status}`;

    return sendEmail(
        customerEmail,
        `Order Update - ${orderNumber}`,
        html,
        text
    );
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
    email: string,
    resetLink: string
): Promise<EmailResult> {
    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Reset Your Password</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', sans-serif; background-color: #f3f4f6;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #1e293b 0%, #334155 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 2px;">CLOSET<span style="color: #e11d48;">BY</span>ERA</h1>
        </div>
        <div style="background-color: #ffffff; padding: 40px 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h2 style="color: #1f2937; text-align: center; margin-bottom: 20px;">Reset Your Password</h2>
            <p style="color: #4b5563; text-align: center; font-size: 16px; margin-bottom: 30px;">
                We received a request to reset your password. Click the button below to create a new password:
            </p>
            <div style="text-align: center; margin-bottom: 30px;">
                <a href="${resetLink}" style="display: inline-block; padding: 14px 30px; background-color: #e11d48; color: white; text-decoration: none; border-radius: 50px; font-weight: 500;">
                    Reset Password
                </a>
            </div>
            <p style="color: #9ca3af; text-align: center; font-size: 14px;">
                If you didn't request this, you can safely ignore this email.
            </p>
            <p style="color: #9ca3af; text-align: center; font-size: 12px;">
                This link expires in 1 hour.
            </p>
        </div>
        <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
            <p>© 2024 Closet By Era. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
    `;

    return sendEmail(email, 'Reset Your Password - Closet By Era', html);
}

/**
 * Send welcome email for new customers
 */
export async function sendWelcomeEmail(
    email: string,
    firstName: string
): Promise<EmailResult> {
    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Welcome to Closet By Era</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', sans-serif; background-color: #f3f4f6;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #1e293b 0%, #334155 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 2px;">CLOSET<span style="color: #e11d48;">BY</span>ERA</h1>
        </div>
        <div style="background-color: #ffffff; padding: 40px 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h2 style="color: #1f2937; text-align: center; margin-bottom: 20px;">Welcome, ${firstName}! 🎉</h2>
            <p style="color: #4b5563; text-align: center; font-size: 16px; margin-bottom: 20px;">
                Thank you for joining Closet By Era! We're excited to have you as part of our fashion community.
            </p>
            <p style="color: #4b5563; text-align: center; font-size: 16px; margin-bottom: 30px;">
                Explore our latest collections and find your perfect style.
            </p>
            <div style="text-align: center; margin-bottom: 30px;">
                <a href="https://closetbyera.com/shop" style="display: inline-block; padding: 14px 30px; background-color: #1e293b; color: white; text-decoration: none; border-radius: 50px; font-weight: 500;">
                    Start Shopping
                </a>
            </div>
        </div>
        <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
            <p>© 2024 Closet By Era. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
    `;

    return sendEmail(email, 'Welcome to Closet By Era! 🛍️', html);
}

/**
 * Format order data for email template
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
        discount: order.discount || 0,
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
 * Generate HTML for Order Status Updates
 */
export function generateStatusEmailHtml(
    customerName: string,
    orderNumber: string,
    status: string,
    message?: string
): string {
    const statusColor =
        status === 'shipped' ? '#3b82f6' :
            status === 'delivered' ? '#10b981' :
                status === 'cancelled' ? '#ef4444' : '#6b7280';

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Order Update - ${orderNumber}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', sans-serif; background-color: #f3f4f6;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #1e293b 0%, #334155 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 2px;">CLOSET<span style="color: #e11d48;">BY</span>ERA</h1>
        </div>
        <div style="background-color: #ffffff; padding: 40px 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h2 style="color: #1f2937; text-align: center; margin-bottom: 20px;">Order Update</h2>
            <p style="color: #4b5563; text-align: center; font-size: 16px;">
                Hi ${customerName},<br>
                The status of your order <strong>${orderNumber}</strong> has been updated to:
            </p>
            <div style="text-align: center; margin: 30px 0;">
                <span style="
                    display: inline-block; 
                    padding: 10px 24px; 
                    background-color: ${statusColor}; 
                    color: white; 
                    font-weight: bold; 
                    border-radius: 50px; 
                    text-transform: capitalize;
                ">
                    ${status}
                </span>
            </div>
            ${message ? `<p style="color: #6b7280; text-align: center; margin-bottom: 30px; font-style: italic;">"${message}"</p>` : ''}
            <div style="text-align: center;">
                <a href="https://closetbyera.com/account/orders" style="display: inline-block; padding: 12px 24px; background-color: #1f2937; color: white; text-decoration: none; border-radius: 6px; font-size: 14px;">Track Order</a>
            </div>
        </div>
        <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
            <p>© 2024 Closet By Era. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
    `;
}

/**
 * Generate HTML email template for order confirmation
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
