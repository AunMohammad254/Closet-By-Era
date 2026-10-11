/**
 * Payment methods offered at checkout:
 * - Cash on delivery.
 * - Card, through Stripe Checkout (test mode; see src/lib/stripe.ts). Offered
 *   only when the store enables it and the server has Stripe keys.
 * - Bank transfer / JazzCash / EasyPaisa to an account the store configures in
 *   Admin > Settings > Payments. Offered only once enabled and filled in, so
 *   the storefront never shows placeholder account numbers.
 *
 * Stored in store_settings.payment_methods (jsonb).
 */

export const CHECKOUT_PAYMENT_METHODS = ['cod', 'card', 'bank_transfer', 'jazzcash', 'easypaisa'] as const;
export type CheckoutPaymentMethod = (typeof CHECKOUT_PAYMENT_METHODS)[number];

export type WalletAccount = {
    enabled: boolean;
    account_title: string;
    account_number: string;
};

export type BankAccount = WalletAccount & {
    bank_name: string;
    iban: string;
};

export type PaymentSettings = {
    cod: { enabled: boolean };
    card: { enabled: boolean };
    bank_transfer: BankAccount;
    jazzcash: WalletAccount;
    easypaisa: WalletAccount;
};

export type PaymentDetail = {
    label: string;
    value: string;
};

/** Server-side facts the stored settings cannot know. */
export type PaymentEnvironment = {
    /** Stripe keys are configured (see isCardPaymentReady). */
    cardReady: boolean;
};

/** What the checkout needs to render payment options; safe to send to the browser. */
export interface CheckoutPaymentOptions {
    methods: CheckoutPaymentMethod[];
    details: Partial<Record<CheckoutPaymentMethod, PaymentDetail[]>>;
    whatsappNumber: string | null;
    supportEmail: string;
    /** Card payments run against Stripe test mode (show test-card hint). */
    cardTestMode: boolean;
}

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
    cod: 'Cash on Delivery',
    card: 'Credit/Debit Card',
    bank_transfer: 'Bank Transfer',
    jazzcash: 'JazzCash',
    easypaisa: 'EasyPaisa',
    gift_card: 'Gift Card',
};

const asRecord = (value: unknown): Record<string, unknown> =>
    value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};

const asText = (value: unknown, max: number): string =>
    typeof value === 'string' ? value.trim().slice(0, max) : '';

function toWallet(value: unknown): WalletAccount {
    const v = asRecord(value);
    return {
        enabled: v.enabled === true,
        account_title: asText(v.account_title, 100),
        account_number: asText(v.account_number, 50),
    };
}

/**
 * Reads untrusted JSON into PaymentSettings. Also accepts the original
 * `{ cod: boolean, stripe: boolean }` shape, which had no transfer accounts
 * (its `stripe` flag never did anything, so card starts disabled).
 */
export function normalizePaymentSettings(raw: unknown): PaymentSettings {
    const src = asRecord(raw);
    const bank = asRecord(src.bank_transfer);
    return {
        cod: { enabled: typeof src.cod === 'boolean' ? src.cod : asRecord(src.cod).enabled !== false },
        card: { enabled: asRecord(src.card).enabled === true },
        bank_transfer: {
            ...toWallet(bank),
            bank_name: asText(bank.bank_name, 100),
            iban: asText(bank.iban, 34).toUpperCase(),
        },
        jazzcash: toWallet(src.jazzcash),
        easypaisa: toWallet(src.easypaisa),
    };
}

export function isPaymentMethodAvailable(
    settings: PaymentSettings,
    method: CheckoutPaymentMethod,
    env: PaymentEnvironment = { cardReady: false }
): boolean {
    switch (method) {
        case 'cod':
            return settings.cod.enabled;
        case 'card':
            return settings.card.enabled && env.cardReady;
        case 'bank_transfer': {
            const b = settings.bank_transfer;
            return b.enabled && !!b.bank_name && !!b.account_title && !!(b.account_number || b.iban);
        }
        case 'jazzcash':
        case 'easypaisa': {
            const w = settings[method];
            return w.enabled && !!w.account_title && !!w.account_number;
        }
    }
}

export function getAvailablePaymentMethods(settings: PaymentSettings, env?: PaymentEnvironment): CheckoutPaymentMethod[] {
    return CHECKOUT_PAYMENT_METHODS.filter(m => isPaymentMethodAvailable(settings, m, env));
}

/** Account details a customer needs to pay by transfer (empty for COD and card). */
export function getPaymentDetails(settings: PaymentSettings, method: string): PaymentDetail[] {
    const rows = (pairs: [string, string][]) =>
        pairs.filter(([, value]) => value).map(([label, value]) => ({ label, value }));

    switch (method) {
        case 'bank_transfer': {
            const b = settings.bank_transfer;
            return rows([
                ['Bank', b.bank_name],
                ['Account title', b.account_title],
                ['Account number', b.account_number],
                ['IBAN', b.iban],
            ]);
        }
        case 'jazzcash':
        case 'easypaisa': {
            const w = settings[method];
            return rows([
                ['Account title', w.account_title],
                ['Mobile number', w.account_number],
            ]);
        }
        default:
            return [];
    }
}

export function buildCheckoutPaymentOptions(
    settings: PaymentSettings,
    contact: { whatsappNumber: string | null; supportEmail: string },
    env: PaymentEnvironment & { cardTestMode: boolean } = { cardReady: false, cardTestMode: false }
): CheckoutPaymentOptions {
    const methods = getAvailablePaymentMethods(settings, env);
    return {
        methods,
        details: Object.fromEntries(methods.map(m => [m, getPaymentDetails(settings, m)])),
        ...contact,
        cardTestMode: methods.includes('card') && env.cardTestMode,
    };
}
