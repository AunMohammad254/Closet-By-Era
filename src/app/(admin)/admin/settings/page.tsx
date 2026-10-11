'use client';

import { useState, useEffect } from 'react';
import { Save, Loader2, Store, CreditCard, Bell, Lock, LayoutTemplate } from 'lucide-react';
import { getIntegrationStatus, getStoreSettings, updateStoreSettings, type IntegrationStatus, type StoreSettings } from '@/actions/settings';
import {
    isPaymentMethodAvailable,
    normalizePaymentSettings,
    PAYMENT_METHOD_LABELS,
    type PaymentSettings,
} from '@/lib/payments';

type ActiveTab = 'general' | 'payment' | 'content' | 'notifications' | 'security';

const stripeReady = (s: IntegrationStatus) => (s.stripe === 'test' || s.stripe === 'live') && s.stripeWebhook;

function StatusRow({ ok, label, hint }: { ok: boolean; label: string; hint?: string }) {
    return (
        <li className="flex items-start gap-2 text-sm">
            <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${ok ? 'bg-emerald-400' : 'bg-amber-400'}`} aria-hidden="true" />
            <span className="text-slate-300">
                {label}
                {hint && <span className="block text-xs text-slate-500">{hint}</span>}
            </span>
        </li>
    );
}

function StripeStatus({ status }: { status: IntegrationStatus }) {
    const keyRow = {
        test: { ok: true, label: 'Test mode key set (no real charges)' },
        live: { ok: true, label: 'Live key set (real charges)' },
        live_blocked: { ok: false, label: 'Live key ignored', hint: 'This store runs Stripe in test mode. Use an sk_test_ key, or set STRIPE_ALLOW_LIVE=true.' },
        missing: { ok: false, label: 'STRIPE_SECRET_KEY not set', hint: 'Stripe Dashboard > Developers > API keys (test mode): the sk_test_... key.' },
    }[status.stripe];
    return (
        <ul className="space-y-2">
            <StatusRow {...keyRow} />
            <StatusRow
                ok={status.stripeWebhook}
                label={status.stripeWebhook ? 'Webhook secret set' : 'STRIPE_WEBHOOK_SECRET not set'}
                hint={status.stripeWebhook ? undefined : 'Add a webhook endpoint for /api/webhooks/stripe and copy its signing secret.'}
            />
        </ul>
    );
}

const PROVIDER_LABELS: Record<string, { name: string; env: string }> = {
    brevo: { name: 'Brevo', env: 'BREVO_SMTP_LOGIN and BREVO_SMTP_KEY' },
    resend: { name: 'Resend', env: 'RESEND_API_KEY' },
    smtp: { name: 'Custom SMTP', env: 'SMTP_HOST, SMTP_USER and SMTP_PASSWORD' },
};

function EmailStatus({ status }: { status: IntegrationStatus }) {
    const active = status.emailProviders.filter(p => p.configured);
    return (
        <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/50">
                <h3 className="font-medium text-slate-200 mb-3">Providers (tried in this order)</h3>
                <ul className="space-y-2">
                    {status.emailProviders.map((p, i) => (
                        <StatusRow
                            key={p.id}
                            ok={p.configured}
                            label={`${i + 1}. ${PROVIDER_LABELS[p.id].name}${p.configured ? '' : ': not configured'}`}
                            hint={p.configured ? undefined : `Set ${PROVIDER_LABELS[p.id].env}.`}
                        />
                    ))}
                </ul>
                {active.length === 0 && <p className="mt-3 text-sm text-amber-400">No provider is configured, so no emails are sent.</p>}
            </div>
            <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/50">
                <ul className="space-y-2">
                    <StatusRow ok label={`Sender: ${status.sender}`} hint="EMAIL_FROM / EMAIL_FROM_NAME. Verify this domain with every provider." />
                    <StatusRow
                        ok={status.authEmailHook}
                        label={status.authEmailHook ? 'Account emails hook connected' : 'Account emails use Supabase defaults'}
                        hint={status.authEmailHook ? undefined : 'Set SEND_EMAIL_HOOK_SECRET and enable Supabase Auth > Hooks > Send Email (URL /api/webhooks/confirmation-email).'}
                    />
                </ul>
            </div>
        </div>
    );
}

function PaymentMethodCard({
    title,
    description,
    enabled,
    onToggle,
    missingDetails = false,
    missingMessage = 'Hidden from checkout until the account details are complete.',
    status,
    children,
}: {
    title: string;
    description: string;
    enabled: boolean;
    onToggle: (enabled: boolean) => void;
    missingDetails?: boolean;
    missingMessage?: string;
    status?: React.ReactNode;
    children?: React.ReactNode;
}) {
    return (
        <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/50 space-y-4">
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center text-green-400">
                        <Store size={20} />
                    </div>
                    <div>
                        <h3 className="font-medium text-slate-200">{title}</h3>
                        <p className="text-sm text-slate-500">{description}</p>
                    </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={enabled}
                        onChange={(e) => onToggle(e.target.checked)}
                        aria-label={`Offer ${title} at checkout`}
                    />
                    <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-300 after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-500 peer-checked:after:bg-white"></div>
                </label>
            </div>
            {enabled && children && <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{children}</div>}
            {enabled && status}
            {missingDetails && <p className="text-xs text-amber-400">{missingMessage}</p>}
        </div>
    );
}

function AccountField({
    label,
    value,
    placeholder,
    onChange,
}: {
    label: string;
    value: string;
    placeholder?: string;
    onChange: (value: string) => void;
}) {
    return (
        <label className="block">
            <span className="block text-xs font-medium text-slate-400 mb-1">{label}</span>
            <input
                type="text"
                value={value}
                placeholder={placeholder}
                onChange={(e) => onChange(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 text-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500/50 outline-none transition-all text-sm"
            />
        </label>
    );
}

export default function SettingsPage() {
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<ActiveTab>('general');

    // Default fallback state
    const [settings, setSettings] = useState<StoreSettings>({
        id: '',
        store_name: '',
        support_email: '',
        support_phone: '',
        currency: 'PKR',
        payment_methods: normalizePaymentSettings(null),
        content: {
            hero_title: '',
            hero_subtitle: '',
            announcement_bar: ''
        },
        updated_at: ''
    });

    const [integrations, setIntegrations] = useState<IntegrationStatus | null>(null);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const [{ success, data }, status] = await Promise.all([getStoreSettings(), getIntegrationStatus()]);
                if (success && data) {
                    setSettings(data);
                }
                if (status.success && status.data) setIntegrations(status.data);
            } catch (error) {
                console.error('Error loading settings:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const payment = settings.payment_methods;
    const updatePayment = <K extends keyof PaymentSettings>(method: K, patch: Partial<PaymentSettings[K]>) =>
        setSettings((prev) => ({
            ...prev,
            payment_methods: {
                ...prev.payment_methods,
                [method]: { ...prev.payment_methods[method], ...patch },
            },
        }));

    const handleSave = async () => {
        setSaving(true);
        try {
            const result = await updateStoreSettings(settings);
            if (!result.success) {
                alert('Failed to save settings: ' + result.error);
            }
        } catch (error) {
            console.error('Error saving settings:', error);
            alert('An unexpected error occurred');
        } finally {
            setSaving(false);
        }
    };

    const tabs = [
        { id: 'general', label: 'General', icon: Store },
        { id: 'payment', label: 'Payment Methods', icon: CreditCard },
        { id: 'content', label: 'Store Content', icon: LayoutTemplate },
        { id: 'notifications', label: 'Email', icon: Bell },
        { id: 'security', label: 'Security', icon: Lock },
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 text-rose-500 animate-spin" />
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-100">Settings</h1>
                <p className="text-slate-400 text-sm mt-1">Manage your store configuration and preferences.</p>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
                {/* Sidebar Navigation */}
                <div className="w-full lg:w-64 flex-shrink-0">
                    <div className="bg-[#1e293b] rounded-xl border border-slate-700/50 overflow-hidden">
                        <nav className="flex flex-col p-2 space-y-1">
                            {tabs.map((tab) => {
                                const Icon = tab.icon;
                                const isActive = activeTab === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id as ActiveTab)}
                                        className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-all ${isActive
                                            ? 'bg-rose-500/10 text-rose-400 shadow-sm'
                                            : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                                            }`}
                                    >
                                        <Icon size={18} />
                                        {tab.label}
                                    </button>
                                );
                            })}
                        </nav>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1">
                    <div className="bg-[#1e293b] rounded-xl border border-slate-700/50 p-6 sm:p-8">
                        {activeTab === 'general' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                                <div>
                                    <h2 className="text-lg font-bold text-slate-100 mb-1">Store Information</h2>
                                    <p className="text-sm text-slate-400">Update your store details and contact information.</p>
                                </div>
                                <div className="grid grid-cols-1 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">Store Name</label>
                                        <input
                                            type="text"
                                            value={settings.store_name}
                                            onChange={(e) => setSettings({ ...settings, store_name: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 text-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500/50 outline-none transition-all"
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-300 mb-2">Support Email</label>
                                            <input
                                                type="email"
                                                value={settings.support_email}
                                                onChange={(e) => setSettings({ ...settings, support_email: e.target.value })}
                                                className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 text-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500/50 outline-none transition-all"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-300 mb-2">Support Phone</label>
                                            <input
                                                type="text"
                                                value={settings.support_phone || ''}
                                                onChange={(e) => setSettings({ ...settings, support_phone: e.target.value })}
                                                className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 text-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500/50 outline-none transition-all"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">Store Currency</label>
                                        <select
                                            value={settings.currency}
                                            onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 text-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500/50 outline-none transition-all"
                                        >
                                            <option value="PKR">PKR (Pakistani Rupee)</option>
                                            <option value="USD">USD (United States Dollar)</option>
                                            <option value="EUR">EUR (Euro)</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'payment' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                                <div>
                                    <h2 className="text-lg font-bold text-slate-100 mb-1">Payment Methods</h2>
                                    <p className="text-sm text-slate-400">
                                        Choose what customers can use at checkout. Transfer methods only appear once their account details are filled in.
                                        Card payments go through Stripe (test mode).
                                    </p>
                                </div>
                                <div className="space-y-4">
                                    <PaymentMethodCard
                                        title="Cash on Delivery"
                                        description="Customer pays the courier on delivery"
                                        enabled={payment.cod.enabled}
                                        onToggle={(enabled) => updatePayment('cod', { enabled })}
                                    />
                                    <PaymentMethodCard
                                        title="Card (Stripe)"
                                        description="Customer pays on Stripe's hosted checkout page"
                                        enabled={payment.card.enabled}
                                        onToggle={(enabled) => updatePayment('card', { enabled })}
                                        missingDetails={payment.card.enabled && !!integrations && !stripeReady(integrations)}
                                        missingMessage="Hidden from checkout until the Stripe keys below are set on the server."
                                        status={integrations && <StripeStatus status={integrations} />}
                                    />
                                    <PaymentMethodCard
                                        title="Bank Transfer"
                                        description="Customer transfers to your bank account"
                                        enabled={payment.bank_transfer.enabled}
                                        onToggle={(enabled) => updatePayment('bank_transfer', { enabled })}
                                        missingDetails={payment.bank_transfer.enabled && !isPaymentMethodAvailable(payment, 'bank_transfer')}
                                    >
                                        <AccountField label="Bank name" value={payment.bank_transfer.bank_name} placeholder="e.g. HBL" onChange={(bank_name) => updatePayment('bank_transfer', { bank_name })} />
                                        <AccountField label="Account title" value={payment.bank_transfer.account_title} onChange={(account_title) => updatePayment('bank_transfer', { account_title })} />
                                        <AccountField label="Account number" value={payment.bank_transfer.account_number} onChange={(account_number) => updatePayment('bank_transfer', { account_number })} />
                                        <AccountField label="IBAN" value={payment.bank_transfer.iban} placeholder="PK.." onChange={(iban) => updatePayment('bank_transfer', { iban })} />
                                    </PaymentMethodCard>
                                    {(['jazzcash', 'easypaisa'] as const).map((wallet) => (
                                        <PaymentMethodCard
                                            key={wallet}
                                            title={PAYMENT_METHOD_LABELS[wallet]}
                                            description="Customer sends money to your mobile wallet"
                                            enabled={payment[wallet].enabled}
                                            onToggle={(enabled) => updatePayment(wallet, { enabled })}
                                            missingDetails={payment[wallet].enabled && !isPaymentMethodAvailable(payment, wallet)}
                                        >
                                            <AccountField label="Account title" value={payment[wallet].account_title} onChange={(account_title) => updatePayment(wallet, { account_title })} />
                                            <AccountField label="Mobile number" value={payment[wallet].account_number} placeholder="03XX-XXXXXXX" onChange={(account_number) => updatePayment(wallet, { account_number })} />
                                        </PaymentMethodCard>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeTab === 'content' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                                <div>
                                    <h2 className="text-lg font-bold text-slate-100 mb-1">Store Content (CMS)</h2>
                                    <p className="text-sm text-slate-400">Customize text displayed on your storefront.</p>
                                </div>
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">Hero Title</label>
                                        <input
                                            type="text"
                                            value={settings.content?.hero_title || ''}
                                            onChange={(e) => setSettings({
                                                ...settings,
                                                content: { ...settings.content, hero_title: e.target.value }
                                            })}
                                            className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 text-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500/50 outline-none transition-all"
                                            placeholder="e.g. New Collection"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">Hero Subtitle</label>
                                        <input
                                            type="text"
                                            value={settings.content?.hero_subtitle || ''}
                                            onChange={(e) => setSettings({
                                                ...settings,
                                                content: { ...settings.content, hero_subtitle: e.target.value }
                                            })}
                                            className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 text-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500/50 outline-none transition-all"
                                            placeholder="e.g. Discover the latest trends"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">Announcement Bar</label>
                                        <input
                                            type="text"
                                            value={settings.content?.announcement_bar || ''}
                                            onChange={(e) => setSettings({
                                                ...settings,
                                                content: { ...settings.content, announcement_bar: e.target.value }
                                            })}
                                            className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 text-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500/50 outline-none transition-all"
                                            placeholder="e.g. Free shipping on all orders"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Other tabs placeholders */}
                        {activeTab === 'notifications' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                                <div>
                                    <h2 className="text-lg font-bold text-slate-100 mb-1">Email Delivery</h2>
                                    <p className="text-sm text-slate-400">
                                        Every email (orders, sign-up confirmation, password reset, security notices) uses the store&apos;s own template and is sent through these providers in order; if one fails, the next is used. Providers are configured with server environment variables.
                                    </p>
                                </div>
                                {integrations ? <EmailStatus status={integrations} /> : <Loader2 className="w-5 h-5 text-slate-500 animate-spin" />}
                            </div>
                        )}

                        {activeTab === 'security' && (
                            <div className="flex flex-col items-center justify-center py-12 text-center animate-in fade-in slide-in-from-bottom-4 duration-300">
                                <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mb-4">
                                    <Lock className="w-8 h-8 text-slate-500" />
                                </div>
                                <h3 className="text-lg font-medium text-slate-200">Coming Soon</h3>
                                <p className="text-slate-500 max-w-sm mt-2">This settings section is currently under development. Check back later for updates.</p>
                            </div>
                        )}

                        {/* Footer Actions - Show only for editable tabs */}
                        {(['general', 'payment', 'content'].includes(activeTab)) && (
                            <div className="mt-8 pt-6 border-t border-slate-700/50 flex justify-end">
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="px-6 py-2.5 bg-rose-500 text-white rounded-xl font-medium hover:bg-rose-600 transition-colors flex items-center gap-2 shadow-lg shadow-rose-500/20 disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    Save Changes
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
