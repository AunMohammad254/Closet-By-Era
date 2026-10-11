'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { createOrder } from '@/actions/orders';
import { validateCoupon } from '@/actions/coupons';
import { validateGiftCard } from '@/actions/gift-cards';
import { calculateCouponDiscount, calculateShipping, STANDARD_SHIPPING_COST, FREE_SHIPPING_THRESHOLD, EXPRESS_SHIPPING_SURCHARGE } from '@/lib/pricing';
import { formatPKR, useCurrency } from '@/context/CurrencyContext';
import { PAYMENT_METHOD_LABELS, type CheckoutPaymentMethod, type CheckoutPaymentOptions } from '@/lib/payments';
import PaymentInstructions from './PaymentInstructions';
import { takeCheckoutCode } from '@/lib/checkout-code';

type CheckoutStep = 'information' | 'shipping' | 'payment';

type AppliedCode =
    | { kind: 'coupon'; code: string; discountType: string; discountValue: number }
    | { kind: 'gift_card'; code: string; balance: number };

const PAYMENT_METHOD_HINTS: Record<CheckoutPaymentMethod, string> = {
    cod: 'Pay when you receive your order',
    card: 'Visa, Mastercard and more, on Stripe’s secure page',
    bank_transfer: 'Transfer to our bank account',
    jazzcash: 'Pay via JazzCash mobile wallet',
    easypaisa: 'Pay via EasyPaisa mobile wallet',
};

interface PlacedOrder {
    orderNumber: string;
    total: number;
    paymentMethod: CheckoutPaymentMethod;
}

export default function CheckoutForm({ paymentOptions }: { paymentOptions: CheckoutPaymentOptions }) {
    const { items, subtotal, clearCart } = useCart();
    const { user } = useAuth();
    const { currency, formatPrice } = useCurrency();

    const [step, setStep] = useState<CheckoutStep>('information');
    const [isProcessing, setIsProcessing] = useState(false);
    const [placedOrder, setPlacedOrder] = useState<PlacedOrder | null>(null);
    const [orderError, setOrderError] = useState<string | null>(null);
    const hasPaymentMethods = paymentOptions.methods.length > 0;

    // Coupon & Gift Card State
    const [couponCode, setCouponCode] = useState('');
    const [couponMessage, setCouponMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
    const [appliedCode, setAppliedCode] = useState<AppliedCode | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        email: '',
        firstName: '',
        lastName: '',
        phone: '',
        address: '',
        apartment: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'Pakistan',
        shippingMethod: 'standard' as 'standard' | 'express',
        paymentMethod: (paymentOptions.methods[0] ?? 'cod') as CheckoutPaymentMethod,
        notes: '',
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    // Auth may resolve after first render, so fall back to the account email.
    const email = formData.email || user?.email || '';

    // Display-only totals. createOrder recomputes everything from DB prices
    // using the same helpers in src/lib/pricing.ts.
    const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING_COST;
    const shippingCost = calculateShipping(subtotal, formData.shippingMethod);
    const discount = appliedCode?.kind === 'coupon'
        ? calculateCouponDiscount({ discount_type: appliedCode.discountType, discount_value: appliedCode.discountValue }, subtotal)
        : 0;
    const totalAfterCoupon = Math.max(0, subtotal + shippingCost - discount);
    const giftCard = appliedCode?.kind === 'gift_card' ? appliedCode : null;
    const potentialGiftCardUsage = giftCard ? Math.min(giftCard.balance, totalAfterCoupon) : 0;
    const total = Math.max(0, totalAfterCoupon - potentialGiftCardUsage);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        // Clear error when user types
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: '' }));
        }
    };

    const validateStep = (currentStep: CheckoutStep): boolean => {
        const newErrors: Record<string, string> = {};

        if (currentStep === 'information') {
            if (!email) newErrors.email = 'Email is required';
            if (!formData.firstName) newErrors.firstName = 'First name is required';
            if (!formData.lastName) newErrors.lastName = 'Last name is required';
            if (!formData.phone) newErrors.phone = 'Phone number is required';
            if (!formData.address) newErrors.address = 'Address is required';
            if (!formData.city) newErrors.city = 'City is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleContinue = () => {
        if (!validateStep(step)) return;

        if (step === 'information') setStep('shipping');
        else if (step === 'shipping') setStep('payment');
    };

    const handleBack = () => {
        if (step === 'payment') setStep('shipping');
        else if (step === 'shipping') setStep('information');
    };

    const handleApplyCoupon = async (codeToApply?: string) => {
        const code = (codeToApply ?? couponCode).trim().toUpperCase();
        if (!code) return;
        setIsValidatingCoupon(true);
        setCouponMessage(null);
        setAppliedCode(null);

        try {
            // 1. Try Coupon
            const couponResult = await validateCoupon(code, subtotal);

            if (couponResult.success && couponResult.data) {
                const coupon = couponResult.data;
                setAppliedCode({ kind: 'coupon', code, discountType: coupon.discount_type, discountValue: coupon.discount_value });
                setCouponMessage({ type: 'success', text: `Coupon applied: ${coupon.code}` });
                return;
            }

            // 2. Try Gift Card
            const giftCardResult = await validateGiftCard(code);
            if (giftCardResult.valid && giftCardResult.balance) {
                setAppliedCode({ kind: 'gift_card', code, balance: giftCardResult.balance });
                setCouponMessage({ type: 'success', text: `Gift Card applied! Balance: ${formatPrice(giftCardResult.balance)}` });
                return;
            }

            setCouponMessage({ type: 'error', text: couponResult.error || giftCardResult.message || 'Invalid code' });
        } catch {
            setCouponMessage({ type: 'error', text: 'Error validating code' });
        } finally {
            setIsValidatingCoupon(false);
        }
    };

    // A code entered in the cart is applied (and validated again) once the
    // cart has loaded, so minimum-order rules see the real subtotal.
    const cartCodeChecked = useRef(false);
    useEffect(() => {
        if (cartCodeChecked.current || subtotal <= 0) return;
        cartCodeChecked.current = true;
        const saved = takeCheckoutCode();
        if (!saved) return;
        setCouponCode(saved);
        handleApplyCoupon(saved);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [subtotal]);

    const handlePlaceOrder = async () => {
        if (!validateStep('payment')) return;

        setIsProcessing(true);
        setOrderError(null);
        let leavingForPayment = false;

        try {
            const result = await createOrder({
                email,
                firstName: formData.firstName,
                lastName: formData.lastName,
                phone: formData.phone,
                address: formData.address,
                apartment: formData.apartment,
                city: formData.city,
                state: formData.state,
                postalCode: formData.postalCode,
                country: formData.country,
                shippingMethod: formData.shippingMethod,
                paymentMethod: formData.paymentMethod,
                notes: formData.notes || null,
                code: appliedCode?.code ?? null,
                items: items.map(item => ({
                    productId: item.productId,
                    quantity: item.quantity,
                    size: item.size,
                    color: item.color,
                })),
            });

            if (!result.success || !result.data) {
                setOrderError(result.error || 'There was an error processing your order. Please try again.');
                return;
            }

            // Card: pay on Stripe; the cart is cleared once the payment succeeds.
            if (result.data.paymentUrl) {
                leavingForPayment = true; // keep the button disabled while the page changes
                window.location.assign(result.data.paymentUrl);
                return;
            }

            // Clear cart and show success
            clearCart();
            setPlacedOrder({
                orderNumber: result.data.orderNumber,
                total: result.data.total,
                paymentMethod: formData.paymentMethod,
            });
        } catch (error) {
            console.error('Order processing error:', error);
            setOrderError('There was an error processing your order. Please try again.');
        } finally {
            if (!leavingForPayment) setIsProcessing(false);
        }
    };

    if (items.length === 0 && !placedOrder) {
        return (
            <main className="min-h-screen bg-background">
                <section className="pt-32 pb-20">
                    <div className="max-w-md mx-auto px-4 text-center py-20">
                        <h1 className="text-2xl font-bold text-foreground mb-4">Your cart is empty</h1>
                        <Link href="/products" className="text-rose-600 hover:text-rose-700 transition-colors">
                            Continue shopping
                        </Link>
                    </div>
                </section>
            </main>
        );
    }

    if (placedOrder) {
        const { orderNumber } = placedOrder;
        const awaitingTransfer = placedOrder.paymentMethod !== 'cod' && placedOrder.total > 0;
        return (
            <main className="min-h-screen bg-background">
                <section className="pt-32 pb-20">
                    <div className="max-w-lg mx-auto px-4 text-center py-12">
                        {/* Success Icon */}
                        <div className="w-20 h-20 mx-auto bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-8">
                            <svg className="w-10 h-10 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>

                        <h1 className="text-3xl font-bold text-foreground mb-4">Order Confirmed!</h1>
                        <p className="text-muted-foreground mb-2">Thank you for your purchase.</p>
                        <p className="text-muted-foreground mb-8">
                            Order number: <span className="font-semibold text-foreground">{orderNumber}</span>
                        </p>

                        {awaitingTransfer && (
                            <div className="mb-8">
                                <h2 className="text-lg font-semibold text-foreground mb-3">
                                    Complete your payment by {PAYMENT_METHOD_LABELS[placedOrder.paymentMethod]}
                                </h2>
                                <PaymentInstructions
                                    details={paymentOptions.details[placedOrder.paymentMethod] ?? []}
                                    amount={placedOrder.total}
                                    orderNumber={orderNumber}
                                    whatsappNumber={paymentOptions.whatsappNumber}
                                    supportEmail={paymentOptions.supportEmail}
                                />
                            </div>
                        )}

                        <p className="text-sm text-muted-foreground mb-8">
                            We&apos;ve sent a confirmation email to <span className="font-medium text-foreground">{email}</span>
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link
                                href="/products"
                                className="px-8 py-4 bg-primary text-primary-foreground font-medium rounded-full hover:bg-primary/90 transition-colors"
                            >
                                Continue Shopping
                            </Link>
                            <Link
                                href="/account?tab=orders"
                                className="px-8 py-4 border border-border text-foreground font-medium rounded-full hover:bg-accent hover:text-accent-foreground transition-colors"
                            >
                                View Orders
                            </Link>
                        </div>
                    </div>
                </section>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-background">

            <section className="pt-32 pb-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Progress Steps */}
                    <div className="max-w-4xl mx-auto mb-16">
                        <div className="relative">
                            {/* Connecting Line */}
                            <div className="absolute top-1/2 left-0 w-full h-1 bg-muted -translate-y-1/2 rounded-full z-0"></div>
                            <div className="absolute top-1/2 left-0 h-1 bg-primary -translate-y-1/2 rounded-full z-0 transition-all duration-500 ease-in-out" style={{ width: `${(Math.max(0, ['information', 'shipping', 'payment'].indexOf(step)) / 2) * 100}%` }}></div>

                            <div className="relative z-10 flex justify-between w-full">
                                {(['information', 'shipping', 'payment'] as CheckoutStep[]).map((s, index) => {
                                    const stepIndex = ['information', 'shipping', 'payment'].indexOf(step);
                                    const isActive = index <= stepIndex;
                                    const isCompleted = index < stepIndex;

                                    return (
                                        <div key={s} className="flex flex-col items-center group">
                                            <div className={`
                                                w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-4 transition-all duration-300
                                                ${isActive
                                                    ? 'bg-primary border-background text-primary-foreground shadow-[0_0_0_4px_rgba(225,29,72,0.2)] scale-110'
                                                    : 'bg-background border-muted text-muted-foreground'
                                                }
                                                ${isCompleted ? 'bg-primary border-background text-primary-foreground' : ''}
                                            `}>
                                                {isCompleted ? (
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                ) : (
                                                    index + 1
                                                )}
                                            </div>
                                            <span className={`
                                                mt-3 text-xs font-semibold uppercase tracking-wider transition-colors duration-300
                                                ${isActive ? 'text-primary' : 'text-muted-foreground'}
                                            `}>
                                                {s}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
                        {/* Form Section */}
                        <div className="lg:col-span-2">
                            {/* Information Step */}
                            {step === 'information' && (
                                <div className="space-y-8">
                                    <div>
                                        <h2 className="text-xl font-bold text-foreground mb-6">Contact Information</h2>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-foreground mb-1">Email</label>
                                                <input
                                                    type="email"
                                                    name="email"
                                                    value={email}
                                                    onChange={handleInputChange}
                                                    suppressHydrationWarning
                                                    className={`w-full px-4 py-3 bg-muted/30 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-200 ${errors.email ? 'border-destructive' : 'border-white/10 focus:border-primary'} `}
                                                    placeholder="your@email.com"
                                                />
                                                {errors.email && <p className="mt-1 text-sm text-destructive">{errors.email}</p>}
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-foreground mb-1">Phone</label>
                                                <input
                                                    type="tel"
                                                    name="phone"
                                                    value={formData.phone}
                                                    onChange={handleInputChange}
                                                    className={`w-full px-4 py-3 bg-muted/30 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-200 ${errors.phone ? 'border-destructive' : 'border-white/10 focus:border-primary'} `}
                                                    placeholder="+92 300 1234567"
                                                />
                                                {errors.phone && <p className="mt-1 text-sm text-destructive">{errors.phone}</p>}
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <h2 className="text-xl font-bold text-foreground mb-6">Shipping Address</h2>
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-foreground mb-1">First Name</label>
                                                    <input
                                                        type="text"
                                                        name="firstName"
                                                        value={formData.firstName}
                                                        onChange={handleInputChange}
                                                        className={`w-full px-4 py-3 bg-muted/30 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-200 ${errors.firstName ? 'border-destructive' : 'border-white/10 focus:border-primary'} `}
                                                    />
                                                    {errors.firstName && <p className="mt-1 text-sm text-destructive">{errors.firstName}</p>}
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-foreground mb-1">Last Name</label>
                                                    <input
                                                        type="text"
                                                        name="lastName"
                                                        value={formData.lastName}
                                                        onChange={handleInputChange}
                                                        className={`w-full px-4 py-3 bg-muted/30 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-200 ${errors.lastName ? 'border-destructive' : 'border-white/10 focus:border-primary'} `}
                                                    />
                                                    {errors.lastName && <p className="mt-1 text-sm text-destructive">{errors.lastName}</p>}
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-foreground mb-1">Address</label>
                                                <input
                                                    type="text"
                                                    name="address"
                                                    value={formData.address}
                                                    onChange={handleInputChange}
                                                    className={`w-full px-4 py-3 bg-muted/30 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-200 ${errors.address ? 'border-destructive' : 'border-white/10 focus:border-primary'} `}
                                                    placeholder="Street address"
                                                />
                                                {errors.address && <p className="mt-1 text-sm text-destructive">{errors.address}</p>}
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-foreground mb-1">Apartment, suite, etc. (optional)</label>
                                                <input
                                                    type="text"
                                                    name="apartment"
                                                    value={formData.apartment}
                                                    onChange={handleInputChange}
                                                    className="w-full px-4 py-3 bg-muted/30 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200"
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-foreground mb-1">City</label>
                                                    <input
                                                        type="text"
                                                        name="city"
                                                        value={formData.city}
                                                        onChange={handleInputChange}
                                                        className={`w-full px-4 py-3 bg-muted/30 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-200 ${errors.city ? 'border-destructive' : 'border-white/10 focus:border-primary'} `}
                                                    />
                                                    {errors.city && <p className="mt-1 text-sm text-destructive">{errors.city}</p>}
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-foreground mb-1">Postal Code</label>
                                                    <input
                                                        type="text"
                                                        name="postalCode"
                                                        value={formData.postalCode}
                                                        onChange={handleInputChange}
                                                        className="w-full px-4 py-3 bg-muted/30 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Shipping Step */}
                            {step === 'shipping' && (
                                <div>
                                    <h2 className="text-xl font-bold text-foreground mb-6">Shipping Method</h2>
                                    <div className="space-y-4">
                                        <label className={`flex items-center p-4 border rounded-xl cursor-pointer transition-all duration-200 ${formData.shippingMethod === 'standard' ? 'border-primary bg-primary/10 backdrop-blur-sm' : 'border-white/10 bg-muted/30 hover:border-primary/50'
                                            } `}>
                                            <input
                                                type="radio"
                                                name="shippingMethod"
                                                value="standard"
                                                checked={formData.shippingMethod === 'standard'}
                                                onChange={handleInputChange}
                                                className="sr-only"
                                            />
                                            <div className={`w-5 h-5 rounded-full border-2 mr-4 flex items-center justify-center transition-colors duration-200 ${formData.shippingMethod === 'standard' ? 'border-primary' : 'border-muted-foreground'
                                                } `}>
                                                {formData.shippingMethod === 'standard' && (
                                                    <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-medium text-foreground">Standard Shipping</p>
                                                <p className="text-sm text-muted-foreground">3-5 business days</p>
                                            </div>
                                            <span className="font-medium text-foreground">
                                                {shipping === 0 ? 'Free' : formatPrice(shipping)}
                                            </span>
                                        </label>

                                        <label className={`flex items-center p-4 border rounded-xl cursor-pointer transition-all duration-200 ${formData.shippingMethod === 'express' ? 'border-primary bg-primary/10 backdrop-blur-sm' : 'border-white/10 bg-muted/30 hover:border-primary/50'
                                            } `}>
                                            <input
                                                type="radio"
                                                name="shippingMethod"
                                                value="express"
                                                checked={formData.shippingMethod === 'express'}
                                                onChange={handleInputChange}
                                                className="sr-only"
                                            />
                                            <div className={`w-5 h-5 rounded-full border-2 mr-4 flex items-center justify-center transition-colors duration-200 ${formData.shippingMethod === 'express' ? 'border-primary' : 'border-muted-foreground'
                                                } `}>
                                                {formData.shippingMethod === 'express' && (
                                                    <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-medium text-foreground">Express Shipping</p>
                                                <p className="text-sm text-muted-foreground">1-2 business days</p>
                                            </div>
                                            <span className="font-medium text-foreground">+{formatPrice(EXPRESS_SHIPPING_SURCHARGE)}</span>
                                        </label>
                                    </div>

                                    {/* Order Notes */}
                                    <div className="mt-8">
                                        <label className="block text-sm font-medium text-foreground mb-1">Order Notes (optional)</label>
                                        <textarea
                                            name="notes"
                                            value={formData.notes}
                                            onChange={handleInputChange}
                                            rows={3}
                                            className="w-full px-4 py-3 bg-muted/30 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary resize-none transition-all duration-200"
                                            placeholder="Special instructions for your order..."
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Payment Step */}
                            {step === 'payment' && (
                                <div>
                                    <h2 className="text-xl font-bold text-foreground mb-6">Payment Method</h2>
                                    {total === 0 ? (
                                        <p className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-sm text-foreground">
                                            Your gift card covers the full amount. No further payment is needed.
                                        </p>
                                    ) : !hasPaymentMethods ? (
                                        <p role="alert" className="p-4 rounded-xl border border-destructive/30 bg-destructive/10 text-sm text-destructive">
                                            Online checkout is temporarily unavailable. Please contact us at {paymentOptions.supportEmail} to place your order.
                                        </p>
                                    ) : (
                                        <div className="space-y-4">
                                            {paymentOptions.methods.map((method) => {
                                                const selected = formData.paymentMethod === method;
                                                return (
                                                    <div key={method}>
                                                        <label className={`flex items-center p-4 border rounded-xl cursor-pointer transition-all duration-200 ${selected ? 'border-primary bg-primary/10 backdrop-blur-sm' : 'border-white/10 bg-muted/30 hover:border-primary/50'}`}>
                                                            <input
                                                                type="radio"
                                                                name="paymentMethod"
                                                                value={method}
                                                                checked={selected}
                                                                onChange={handleInputChange}
                                                                className="sr-only"
                                                            />
                                                            <div className={`w-5 h-5 rounded-full border-2 mr-4 flex items-center justify-center transition-colors duration-200 ${selected ? 'border-primary' : 'border-muted-foreground'}`}>
                                                                {selected && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                                                            </div>
                                                            <div className="flex-1">
                                                                <p className="font-medium text-foreground">{PAYMENT_METHOD_LABELS[method]}</p>
                                                                <p className="text-sm text-muted-foreground">{PAYMENT_METHOD_HINTS[method]}</p>
                                                            </div>
                                                        </label>
                                                        {selected && method === 'card' && (
                                                            <div className="mt-2 p-4 bg-muted/50 rounded-xl border border-border text-sm text-muted-foreground space-y-2">
                                                                <p>After you place the order you will be taken to Stripe to pay. Your card details never touch our site.</p>
                                                                {paymentOptions.cardTestMode && (
                                                                    <p className="text-amber-600 dark:text-amber-400">
                                                                        Test mode: no real money is taken. Pay with card <span className="font-mono">4242 4242 4242 4242</span>, any future expiry date and any CVC.
                                                                    </p>
                                                                )}
                                                            </div>
                                                        )}
                                                        {selected && method !== 'cod' && method !== 'card' && (
                                                            <PaymentInstructions
                                                                className="mt-2"
                                                                details={paymentOptions.details[method] ?? []}
                                                                amount={total}
                                                                whatsappNumber={paymentOptions.whatsappNumber}
                                                                supportEmail={paymentOptions.supportEmail}
                                                            />
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}

                            {orderError && (
                                <p role="alert" className="mt-8 p-4 rounded-xl border border-destructive/30 bg-destructive/10 text-sm text-destructive">
                                    {orderError}
                                </p>
                            )}

                            {/* Navigation Buttons */}
                            <div className="mt-10 flex items-center justify-between">
                                {step !== 'information' ? (
                                    <button
                                        onClick={handleBack}
                                        className="flex items-center text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                        </svg>
                                        Back
                                    </button>
                                ) : (
                                    <Link href="/cart" className="flex items-center text-muted-foreground hover:text-foreground transition-colors">
                                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                        </svg>
                                        Return to cart
                                    </Link>
                                )}

                                {step !== 'payment' ? (
                                    <button
                                        onClick={handleContinue}
                                        disabled={isProcessing}
                                        className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-primary/20 hover:-translate-y-0.5"
                                    >
                                        Continue
                                    </button>
                                ) : (
                                    <button
                                        onClick={handlePlaceOrder}
                                        disabled={isProcessing || (total > 0 && !hasPaymentMethods)}
                                        className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-primary/20 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                                    >
                                        {isProcessing ? (
                                            <>
                                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Processing...
                                            </>
                                        ) : (
                                            `${formData.paymentMethod === 'card' && total > 0 ? 'Pay with card' : 'Place Order'} — ${formatPKR(total)}`
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Order Summary Sidebar */}
                        <div className="lg:col-span-1">
                            <div className="sticky top-32 p-6 bg-card/40 backdrop-blur-md border border-white/10 rounded-2xl shadow-xl">
                                <h3 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                                    <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                    </svg>
                                    Order Summary
                                </h3>

                                {/* Cart Items */}
                                <div className="space-y-4 max-h-64 overflow-y-auto mb-4">
                                    {items.map((item) => (
                                        <div key={item.id} className="flex gap-3">
                                            <div className="w-16 h-20 bg-muted rounded-lg shrink-0 flex items-center justify-center relative">
                                                <svg className="w-6 h-6 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                                <span className="absolute -top-2 -right-2 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                                                    {item.quantity}
                                                </span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
                                                <p className="text-xs text-muted-foreground">{item.size} / {item.color}</p>
                                                <p className="text-sm font-medium text-foreground mt-1">{formatPrice(item.price * item.quantity)}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Totals */}
                                <div className="border-t border-border pt-4 space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Subtotal</span>
                                        <span className="font-medium text-foreground">{formatPrice(subtotal)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Shipping</span>
                                        <span className="font-medium text-foreground">
                                            {shippingCost === 0 ? 'Free' : formatPrice(shippingCost)}
                                        </span>
                                    </div>

                                    {/* Discount Line */}
                                    {discount > 0 && (
                                        <div className="flex justify-between text-green-600 dark:text-green-400">
                                            <span className="font-medium">Discount</span>
                                            <span className="font-medium">- {formatPrice(discount)}</span>
                                        </div>
                                    )}

                                    {/* Gift Card Line */}
                                    {giftCard && potentialGiftCardUsage > 0 && (
                                        <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                                            <span className="font-medium">Gift Card ({giftCard.code})</span>
                                            <span className="font-medium">- {formatPrice(potentialGiftCardUsage)}</span>
                                        </div>
                                    )}

                                    <div className="flex justify-between pt-2 border-t border-border">
                                        <span className="font-bold text-foreground">Total to Pay</span>
                                        <span className="text-lg font-bold text-foreground">{formatPrice(total)}</span>
                                    </div>
                                    {currency !== 'PKR' && (
                                        <p className="text-xs text-muted-foreground text-right">
                                            Approximate. You will be charged {formatPKR(total)}.
                                        </p>
                                    )}

                                    {/* Coupon Input */}
                                    <div className="pt-4 border-t border-border mt-4">
                                        <label className="block text-xs font-medium text-foreground mb-2">Discount Code</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={couponCode}
                                                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                                placeholder="Enter code"
                                                className="flex-1 px-4 py-2.5 bg-background/50 border border-white/10 rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary uppercase transition-all duration-200 placeholder:text-muted-foreground/50"
                                            />
                                            <button
                                                onClick={() => handleApplyCoupon()}
                                                disabled={isValidatingCoupon || !couponCode}
                                                className="px-6 py-2.5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 text-sm font-medium rounded-xl transition-all duration-200 disabled:opacity-50"
                                            >
                                                {isValidatingCoupon ? '...' : 'Apply'}
                                            </button>
                                        </div>
                                        {couponMessage && (
                                            <p className={`text-xs mt-2 ${couponMessage.type === 'success' ? 'text-green-600 dark:text-green-400' : 'text-destructive'}`}>
                                                {couponMessage.text}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

        </main>
    );
}
