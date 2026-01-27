import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface OrderItem {
    name: string;
    quantity: number;
    price: number;
}

interface OrderEmailData {
    orderNumber: string;
    customerEmail: string;
    customerName: string;
    items: OrderItem[];
    shippingAddress: object;
    subtotal: number;
    shippingCost: number;
    discount?: number;
    total: number;
    paymentMethod: string;
    orderDate: string;
}

serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { to, subject, html, orderData }: { to: string; subject: string; html?: string; orderData?: OrderEmailData } = await req.json()

        if (!RESEND_API_KEY) {
            console.error('RESEND_API_KEY is not set')
            // For development without API key, we simulate success but log error
            return new Response(
                JSON.stringify({
                    message: 'Email simulation: RESEND_API_KEY missing. Logged payload.',
                    payload: { to, subject }
                }),
                {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    status: 200,
                },
            )
        }

        let emailHtml = html;

        // Backward compatibility: Generate HTML if not provided but orderData is
        if (!emailHtml && orderData) {
            emailHtml = `
                <h1>Order Confirmation ${orderData.orderNumber}</h1>
                <p>Thank you for your order, ${orderData.customerName}!</p>
                <p>Total: PKR ${orderData.total}</p>
            `;
        }

        const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify({
                from: 'Closet By Era <orders@closetbyera.com>', // Replace with your verified domain
                to: [to],
                subject: subject,
                html: emailHtml,
            }),
        })

        const data = await res.json()

        return new Response(
            JSON.stringify(data),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            },
        )
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return new Response(
            JSON.stringify({ error: errorMessage }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            },
        )
    }
})
