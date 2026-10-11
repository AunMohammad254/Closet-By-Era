import type { PaymentDetail } from '@/lib/payments';

interface PaymentInstructionsProps {
    details: PaymentDetail[];
    amount: number;
    /** Known only after the order is placed. */
    orderNumber?: string;
    whatsappNumber: string | null;
    supportEmail: string;
    className?: string;
}

/** Account details and steps for paying by bank transfer or mobile wallet. */
export default function PaymentInstructions({
    details,
    amount,
    orderNumber,
    whatsappNumber,
    supportEmail,
    className = '',
}: PaymentInstructionsProps) {
    const proofMessage = orderNumber ? `Payment for order ${orderNumber}` : 'Payment for my order';

    return (
        <div className={`p-4 bg-muted/50 rounded-xl border border-border text-left ${className}`}>
            <dl className="text-sm space-y-1 mb-3">
                {details.map(d => (
                    <div key={d.label} className="flex justify-between gap-4">
                        <dt className="text-muted-foreground">{d.label}</dt>
                        <dd className="font-medium text-foreground font-mono break-all text-right">{d.value}</dd>
                    </div>
                ))}
            </dl>
            <ol className="text-sm text-muted-foreground list-decimal list-inside space-y-1">
                <li>
                    Send <span className="font-medium text-foreground">PKR {amount.toLocaleString()}</span> to the account above.
                </li>
                <li>
                    {orderNumber ? (
                        <>Use <span className="font-semibold text-foreground">{orderNumber}</span> as the payment reference.</>
                    ) : (
                        'Use your order number (shown after you place the order) as the payment reference.'
                    )}
                </li>
                <li>
                    Send us a screenshot of the payment{' '}
                    {whatsappNumber ? (
                        <a
                            href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(proofMessage)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary underline underline-offset-2"
                        >
                            on WhatsApp
                        </a>
                    ) : (
                        <>
                            at{' '}
                            <a href={`mailto:${supportEmail}`} className="text-primary underline underline-offset-2">
                                {supportEmail}
                            </a>
                        </>
                    )}
                    . We ship once it is confirmed.
                </li>
            </ol>
        </div>
    );
}
