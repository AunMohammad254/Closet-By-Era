import Link from 'next/link';

type Tone = 'success' | 'pending' | 'neutral';

const ICONS: Record<Tone, { bg: string; fg: string; path: string }> = {
    success: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', fg: 'text-emerald-600 dark:text-emerald-400', path: 'M5 13l4 4L19 7' },
    pending: { bg: 'bg-amber-100 dark:bg-amber-900/30', fg: 'text-amber-600 dark:text-amber-400', path: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
    neutral: { bg: 'bg-muted', fg: 'text-muted-foreground', path: 'M6 18L18 6M6 6l12 12' },
};

/** Shared layout for the pages Stripe Checkout returns to. */
export default function CheckoutResult({
    tone,
    title,
    message,
    orderNumber,
    primary,
    secondary,
    children,
}: {
    tone: Tone;
    title: string;
    message: string;
    orderNumber?: string;
    primary: { href: string; label: string };
    secondary?: { href: string; label: string };
    children?: React.ReactNode;
}) {
    const icon = ICONS[tone];
    return (
        <main className="min-h-screen bg-background">
            <section className="pt-32 pb-20">
                <div className="max-w-lg mx-auto px-4 text-center py-12">
                    <div className={`w-20 h-20 mx-auto ${icon.bg} rounded-full flex items-center justify-center mb-8`}>
                        <svg className={`w-10 h-10 ${icon.fg}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon.path} />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-bold text-foreground mb-4">{title}</h1>
                    <p className="text-muted-foreground mb-2">{message}</p>
                    {orderNumber && (
                        <p className="text-muted-foreground mb-8">
                            Order number: <span className="font-semibold text-foreground">{orderNumber}</span>
                        </p>
                    )}
                    {children}
                    <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
                        <Link href={primary.href} className="px-8 py-4 bg-primary text-primary-foreground font-medium rounded-full hover:bg-primary/90 transition-colors">
                            {primary.label}
                        </Link>
                        {secondary && (
                            <Link href={secondary.href} className="px-8 py-4 border border-border text-foreground font-medium rounded-full hover:bg-accent hover:text-accent-foreground transition-colors">
                                {secondary.label}
                            </Link>
                        )}
                    </div>
                </div>
            </section>
        </main>
    );
}
