/**
 * Email Test API Route
 * POST /api/email/test
 * 
 * Use this to test your SMTP configuration
 */

import { NextRequest, NextResponse } from 'next/server';
import { sendEmail, verifyEmailConnection } from '@/lib/nodemailer';

export async function POST(request: NextRequest) {
    try {
        // Verify connection first
        const isConnected = await verifyEmailConnection();

        if (!isConnected) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'SMTP connection failed. Check your credentials.'
                },
                { status: 500 }
            );
        }

        const body = await request.json();
        const { to, subject, message } = body;

        if (!to) {
            return NextResponse.json(
                { success: false, message: 'Email address is required' },
                { status: 400 }
            );
        }

        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #1f2937;">Test Email from Closet By Era</h2>
                <p style="color: #4b5563;">${message || 'This is a test email to verify your SMTP configuration is working correctly.'}</p>
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
                <p style="color: #9ca3af; font-size: 12px;">
                    Sent at: ${new Date().toLocaleString()}
                </p>
            </div>
        `;

        const result = await sendEmail(
            to,
            subject || 'Test Email - Closet By Era',
            html
        );

        return NextResponse.json(result);
    } catch (error) {
        console.error('Email test error:', error);
        return NextResponse.json(
            {
                success: false,
                message: 'Failed to send test email',
                error: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

export async function GET() {
    // Verify SMTP connection status
    const isConnected = await verifyEmailConnection();

    return NextResponse.json({
        smtpConfigured: !!(process.env.SMTP_USER && process.env.SMTP_PASSWORD),
        connectionStatus: isConnected ? 'connected' : 'disconnected',
        host: process.env.SMTP_HOST || 'not set',
        port: process.env.SMTP_PORT || 'not set',
    });
}
