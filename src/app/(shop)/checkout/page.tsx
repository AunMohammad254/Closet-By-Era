'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { sendOrderConfirmation } from '@/actions/email';
import { createClient } from '@/lib/supabase/client';
import { createOrder, CreateOrderPayload } from '@/actions/orders';
import { getOrCreateCustomer } from '@/actions/customer';
import { revalidateAccountPage } from '@/app/actions';
import { validateCoupon, incrementCouponUsage } from '@/actions/coupons';
import { awardLoyaltyPoints } from '@/actions/loyalty';
import { validateGiftCard, redeemGiftCard, GiftCard } from '@/actions/gift-cards';

type CheckoutStep = 'information' | 'shipping' | 'payment';

export default function CheckoutPage() {
    const supabase = createClient();
    const router = useRouter();
    const { items, subtotal, clearCart } = useCart();
    const { user } = useAuth();

    const [step, setStep] = useState<CheckoutStep>('information');
    const [isProcessing, setIsProcessing] = useState(false);
    const [orderComplete, setOrderComplete] = useState(false);
    const [orderNumber, setOrderNumber] = useState('');
    const [orderError, setOrderError] = useState<string | null>(null);

    // Coupon & Gift Card State
    const [couponCode, setCouponCode] = useState('');
    const [couponMessage, setCouponMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [discount, setDiscount] = useState(0);
    const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
    const [giftCard, setGiftCard] = useState<GiftCard | null>(null);
    const [giftCardAmount, setGiftCardAmount] = useState(0);

    // Form state
    const [formData, setFormData] = useState({
        email: user?.email || '',
        firstName: '',
        lastName: '',
        phone: '',
        address: '',
        apartment: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'Pakistan',
        shippingMethod: 'standard',
        paymentMethod: 'cod',
        cardNumber: '',
        cardExpiry: '',
        cardCvc: '',
        notes: '',
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    const shipping = subtotal >= 5000 ? 0 : 500;
    const shippingMethodCost = formData.shippingMethod === 'express' ? 300 : 0;
    const totalBeforeDiscount = subtotal + shipping + shippingMethodCost;
    const totalAfterCoupon = Math.max(0, totalBeforeDiscount - discount);

    // Calculate how much gift card balance to use
    // It cannot exceed the total to pay
    const potentialGiftCardUsage = giftCard ? Math.min(giftCard.balance, totalAfterCoupon) : 0;

    // Update the state if it changed (use effect would be better but direct calculation here works if we are careful)
    // Actually we should set this when applying or whenever dependencies change.
    // For React render cycle, we should calculate 'total' derived from state.

    const quantityToPay = Math.max(0, totalAfterCoupon - potentialGiftCardUsage);
    const total = quantityToPay;

    // We need to keep track of the *actual* amount we correspond to using for the redeem call later
    // So we'll update the state validation function

    // Sync giftCardAmount effect
    if (giftCard && giftCardAmount !== potentialGiftCardUsage) {
        // This is a side effect in render, bad practice but fine for quick logic if we use useEffect
    }

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
            if (!formData.email) newErrors.email = 'Email is required';
            if (!formData.firstName) newErrors.firstName = 'First name is required';
            if (!formData.lastName) newErrors.lastName = 'Last name is required';
            if (!formData.phone) newErrors.phone = 'Phone number is required';
            if (!formData.address) newErrors.address = 'Address is required';
            if (!formData.city) newErrors.city = 'City is required';
        }

        if (currentStep === 'payment' && formData.paymentMethod === 'card' && total > 0) {
            if (!formData.cardNumber) newErrors.cardNumber = 'Card number is required';
            if (!formData.cardExpiry) newErrors.cardExpiry = 'Expiry date is required';
            if (!formData.cardCvc) newErrors.cardCvc = 'CVC is required';
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

    const handleApplyCoupon = async () => {
        if (!couponCode.trim()) return;
        setIsValidatingCoupon(true);
        setCouponMessage(null);

        // Reset
        setDiscount(0);
        setGiftCard(null);
        setGiftCardAmount(0);

        try {
            // 1. Try Coupon
            const couponResult = await validateCoupon(couponCode, subtotal);

            if (couponResult.success && couponResult.data) {
                const coupon = couponResult.data;
                let calculatedDiscount = 0;

                if (coupon.discount_type === 'percentage') {
                    calculatedDiscount = (subtotal * coupon.discount_value) / 100;
                } else {
                    calculatedDiscount = coupon.discount_value;
                }

                // Ensure discount doesn't exceed subtotal
                calculatedDiscount = Math.min(calculatedDiscount, subtotal);

                setDiscount(calculatedDiscount);
                setCouponMessage({ type: 'success', text: `Coupon applied: ${coupon.code} ` });
            } else {
                // 2. Try Gift Card
                const giftCardResult = await validateGiftCard(couponCode);

                if (giftCardResult.valid && giftCardResult.id) {
                    setGiftCard({
                        id: giftCardResult.id,
                        code: giftCardResult.code!,
                        balance: giftCardResult.balance!,
                        initial_value: giftCardResult.initial_value!,
                        is_active: true,
                        expires_at: null,
                        created_at: ''
                    });
                    setCouponMessage({ type: 'success', text: `Gift Card applied! Balance: PKR ${giftCardResult.balance?.toLocaleString()} ` });
                    setGiftCardAmount(giftCardResult.balance!);
                } else {
                    // Both invalid. Show specific coupon error if available, else generic.
                    // If couponResult had an error message, use it, unless it was just "Invalid coupon code" and we want to try gift card.
                    // But since we tried generic fallback, we just say Invalid Code.
                    setDiscount(0);
                    setGiftCard(null);
                    setCouponMessage({ type: 'error', text: couponResult.error || 'Invalid code' });
                }
            }
        } catch (error) {
            setCouponMessage({ type: 'error', text: 'Error validating code' });
        } finally {
            setIsValidatingCoupon(false);
        }
    };

    const handlePlaceOrder = async () => {
        if (!validateStep('payment')) return;

        setIsProcessing(true);
        setOrderError(null);

        try {
            // Prepare shipping address
            const shippingAddress = {
                firstName: formData.firstName,
                lastName: formData.lastName,
                address: formData.address,
                apartment: formData.apartment,
                city: formData.city,
                state: formData.state,
                postalCode: formData.postalCode,
                country: formData.country,
                phone: formData.phone,
            };

            // Get or create customer if user is logged in
            let customerId: string | null = null;
            if (user) {
                const customer = await getOrCreateCustomer(
                    user.id,
                    formData.email,
                    formData.firstName,
                    formData.lastName
                );
                if (customer) {
                    customerId = customer.id;
                }
            }

            // Prepare order payload
            const orderPayload: CreateOrderPayload = {
                customer_id: customerId,
                customer_email: formData.email,
                customer_name: `${formData.firstName} ${formData.lastName} `,
                shipping_address: JSON.stringify(shippingAddress),
                subtotal: subtotal,
                discount: discount,
                shipping_cost: shipping + shippingMethodCost,
                payment_method: total === 0 ? 'card' : formData.paymentMethod as any,
                payment_status: total === 0 ? 'paid' : 'pending',
                notes: formData.notes || null,
                items: items.map(item => ({
                    product_id: item.productId,
                    product_name: item.name,
                    product_image: item.image,
                    quantity: item.quantity,
                    price_at_purchase: item.price,
                    size: item.size,
                    color: item.color
                }))
            };

            // Create order using server action
            const result = await createOrder(orderPayload);

            if (!result.success || !result.data) {
                console.error('Error creating order:', result.error);
                throw new Error(result.error || 'Failed to create order');
            }

            const { orderId, orderNumber } = result.data;

            // Prepare order data for email
            const emailOrderItems = items.map((item) => ({
                productName: item.name,
                quantity: item.quantity,
                size: item.size,
                color: item.color,
                unitPrice: item.price,
                totalPrice: item.price * item.quantity,
            }));

            // Format and send order confirmation email via Server Action
            sendOrderConfirmation(
                {
                    order_number: orderNumber,
                    subtotal: subtotal,
                    shipping_cost: shipping + shippingMethodCost,
                    discount: discount,
                    total: total,
                },
                emailOrderItems,
                formData.email,
                `${formData.firstName} ${formData.lastName} `,
                shippingAddress,
                total === 0 ? 'gift_card' : formData.paymentMethod
            ).then((result) => {
                if (!result.success) {
                    console.warn('Email sending failed:', result.message);
                }
            });

            // Revalidate account page cache so orders appear immediately
            await revalidateAccountPage();

            // Award Loyalty Points
            if (user) {
                await awardLoyaltyPoints(total);
            }

            // Redeem Gift Card if used
            if (giftCard) {
                const finalTotalBeforeGiftCard = Math.max(0, subtotal + shipping + shippingMethodCost - discount);
                const amountToRedeem = Math.min(giftCard.balance, finalTotalBeforeGiftCard);

                if (amountToRedeem > 0) {
                    await redeemGiftCard(giftCard.code, amountToRedeem, orderId);
                }
            } else if (discount > 0 && couponCode) {
                // Increment coupon usage if it was a standard coupon
                await incrementCouponUsage(couponCode);
            }

            // Clear cart and show success
            clearCart();
            setOrderComplete(true);
        } catch (error) {
            console.error('Order processing error:', error);
            setOrderError('There was an error processing your order. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    if (items.length === 0 && !orderComplete) {
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

    if (orderComplete) {
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

                        <p className="text-sm text-muted-foreground mb-8">
                            We&apos;ve sent a confirmation email to <span className="font-medium text-foreground">{formData.email}</span>
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
                                                    value={formData.email}
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
                                                {shipping === 0 ? 'Free' : `PKR ${shipping} `}
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
                                            <span className="font-medium text-foreground">PKR 300</span>
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
                                    <div className="space-y-4">
                                        <label className={`flex items-center p-4 border rounded-xl cursor-pointer transition-all duration-200 ${formData.paymentMethod === 'cod' ? 'border-primary bg-primary/10 backdrop-blur-sm' : 'border-white/10 bg-muted/30 hover:border-primary/50'
                                            } `}>
                                            <input
                                                type="radio"
                                                name="paymentMethod"
                                                value="cod"
                                                checked={formData.paymentMethod === 'cod'}
                                                onChange={handleInputChange}
                                                className="sr-only"
                                            />
                                            <div className={`w-5 h-5 rounded-full border-2 mr-4 flex items-center justify-center transition-colors duration-200 ${formData.paymentMethod === 'cod' ? 'border-primary' : 'border-muted-foreground'
                                                } `}>
                                                {formData.paymentMethod === 'cod' && (
                                                    <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-medium text-foreground">Cash on Delivery</p>
                                                <p className="text-sm text-muted-foreground">Pay when you receive your order</p>
                                            </div>
                                        </label>

                                        <label className={`flex items-center p-4 border rounded-xl cursor-pointer transition-all duration-200 ${formData.paymentMethod === 'card' ? 'border-primary bg-primary/10 backdrop-blur-sm' : 'border-white/10 bg-muted/30 hover:border-primary/50'
                                            } `}>
                                            <input
                                                type="radio"
                                                name="paymentMethod"
                                                value="card"
                                                checked={formData.paymentMethod === 'card'}
                                                onChange={handleInputChange}
                                                className="sr-only"
                                            />
                                            <div className={`w-5 h-5 rounded-full border-2 mr-4 flex items-center justify-center transition-colors duration-200 ${formData.paymentMethod === 'card' ? 'border-primary' : 'border-muted-foreground'
                                                } `}>
                                                {formData.paymentMethod === 'card' && (
                                                    <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-medium text-foreground">Credit/Debit Card</p>
                                                <p className="text-sm text-muted-foreground">Visa, Mastercard, etc.</p>
                                            </div>
                                        </label>

                                        {formData.paymentMethod === 'card' && (
                                            <div className="mt-4 p-4 bg-muted/50 rounded-xl space-y-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-foreground mb-1">Card Number</label>
                                                    <input
                                                        type="text"
                                                        name="cardNumber"
                                                        value={formData.cardNumber}
                                                        onChange={handleInputChange}
                                                        className={`w-full px-4 py-3 bg-muted/30 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-200 ${errors.cardNumber ? 'border-destructive' : 'border-white/10 focus:border-primary'} `}
                                                        placeholder="1234 5678 9012 3456"
                                                    />
                                                    {errors.cardNumber && <p className="mt-1 text-sm text-destructive">{errors.cardNumber}</p>}
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-sm font-medium text-foreground mb-1">Expiry Date</label>
                                                        <input
                                                            type="text"
                                                            name="cardExpiry"
                                                            value={formData.cardExpiry}
                                                            onChange={handleInputChange}
                                                            className={`w-full px-4 py-3 bg-muted/30 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-200 ${errors.cardExpiry ? 'border-destructive' : 'border-white/10 focus:border-primary'} `}
                                                            placeholder="MM/YY"
                                                        />
                                                        {errors.cardExpiry && <p className="mt-1 text-sm text-destructive">{errors.cardExpiry}</p>}
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-foreground mb-1">CVC</label>
                                                        <input
                                                            type="text"
                                                            name="cardCvc"
                                                            value={formData.cardCvc}
                                                            onChange={handleInputChange}
                                                            className={`w-full px-4 py-3 bg-muted/30 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-200 ${errors.cardCvc ? 'border-destructive' : 'border-white/10 focus:border-primary'} `}
                                                            placeholder="123"
                                                        />
                                                        {errors.cardCvc && <p className="mt-1 text-sm text-destructive">{errors.cardCvc}</p>}
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Mobile Wallets Section */}
                                        <div className="pt-4 border-t border-border">
                                            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3 font-medium">Mobile Wallets</p>
                                        </div>

                                        {/* JazzCash Option */}
                                        <label className={`flex items-center p-4 border rounded-xl cursor-pointer transition-all duration-200 ${formData.paymentMethod === 'jazzcash' ? 'border-red-500 bg-red-500/10 backdrop-blur-sm' : 'border-white/10 bg-muted/30 hover:border-red-500/50'
                                            } `}>
                                            <input
                                                type="radio"
                                                name="paymentMethod"
                                                value="jazzcash"
                                                checked={formData.paymentMethod === 'jazzcash'}
                                                onChange={handleInputChange}
                                                className="sr-only"
                                            />
                                            <div className={`w-5 h-5 rounded-full border-2 mr-4 flex items-center justify-center transition-colors duration-200 ${formData.paymentMethod === 'jazzcash' ? 'border-red-500' : 'border-muted-foreground'
                                                } `}>
                                                {formData.paymentMethod === 'jazzcash' && (
                                                    <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                                                )}
                                            </div>
                                            <div className="w-10 h-10 mr-3 bg-red-600 rounded-lg flex items-center justify-center shadow-lg">
                                                <span className="text-white font-bold text-xs">JC</span>
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-medium text-foreground">JazzCash</p>
                                                <p className="text-sm text-muted-foreground">Pay via JazzCash mobile wallet</p>
                                            </div>
                                        </label>

                                        {formData.paymentMethod === 'jazzcash' && (
                                            <div className="mt-2 p-4 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-900/30">
                                                <p className="text-sm text-red-800 dark:text-red-300 font-medium mb-2">JazzCash Payment Instructions:</p>
                                                <ol className="text-sm text-red-700 dark:text-red-400 list-decimal list-inside space-y-1">
                                                    <li>Send payment to: <span className="font-bold">0300-1234567</span></li>
                                                    <li>Use order number as reference</li>
                                                    <li>Send screenshot via WhatsApp</li>
                                                </ol>
                                            </div>
                                        )}

                                        {/* EasyPaisa Option */}
                                        <label className={`flex items-center p-4 border rounded-xl cursor-pointer transition-all duration-200 ${formData.paymentMethod === 'easypaisa' ? 'border-green-500 bg-green-500/10 backdrop-blur-sm' : 'border-white/10 bg-muted/30 hover:border-green-500/50'
                                            } `}>
                                            <input
                                                type="radio"
                                                name="paymentMethod"
                                                value="easypaisa"
                                                checked={formData.paymentMethod === 'easypaisa'}
                                                onChange={handleInputChange}
                                                className="sr-only"
                                            />
                                            <div className={`w-5 h-5 rounded-full border-2 mr-4 flex items-center justify-center transition-colors duration-200 ${formData.paymentMethod === 'easypaisa' ? 'border-green-500' : 'border-muted-foreground'
                                                } `}>
                                                {formData.paymentMethod === 'easypaisa' && (
                                                    <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                                                )}
                                            </div>
                                            <div className="w-10 h-10 mr-3 bg-green-600 rounded-lg flex items-center justify-center shadow-lg">
                                                <span className="text-white font-bold text-xs">EP</span>
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-medium text-foreground">EasyPaisa</p>
                                                <p className="text-sm text-muted-foreground">Pay via EasyPaisa mobile wallet</p>
                                            </div>
                                        </label>

                                        {formData.paymentMethod === 'easypaisa' && (
                                            <div className="mt-2 p-4 bg-green-50 dark:bg-green-900/10 rounded-xl border border-green-100 dark:border-green-900/30">
                                                <p className="text-sm text-green-800 dark:text-green-300 font-medium mb-2">EasyPaisa Payment Instructions:</p>
                                                <ol className="text-sm text-green-700 dark:text-green-400 list-decimal list-inside space-y-1">
                                                    <li>Send payment to: <span className="font-bold">0345-1234567</span></li>
                                                    <li>Use order number as reference</li>
                                                    <li>Send screenshot via WhatsApp</li>
                                                </ol>
                                            </div>
                                        )}

                                        {/* Bank Transfer Option */}
                                        <label className={`flex items-center p-4 border rounded-xl cursor-pointer transition-all duration-200 ${formData.paymentMethod === 'bank_transfer' ? 'border-primary bg-primary/10 backdrop-blur-sm' : 'border-white/10 bg-muted/30 hover:border-primary/50'
                                            } `}>
                                            <input
                                                type="radio"
                                                name="paymentMethod"
                                                value="bank_transfer"
                                                checked={formData.paymentMethod === 'bank_transfer'}
                                                onChange={handleInputChange}
                                                className="sr-only"
                                            />
                                            <div className={`w-5 h-5 rounded-full border-2 mr-4 flex items-center justify-center transition-colors duration-200 ${formData.paymentMethod === 'bank_transfer' ? 'border-primary' : 'border-muted-foreground'
                                                } `}>
                                                {formData.paymentMethod === 'bank_transfer' && (
                                                    <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                                                )}
                                            </div>
                                            <div className="w-10 h-10 mr-3 bg-slate-700 rounded-lg flex items-center justify-center shadow-lg">
                                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                                </svg>
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-medium text-foreground">Bank Transfer</p>
                                                <p className="text-sm text-muted-foreground">Transfer to our bank account</p>
                                            </div>
                                        </label>

                                        {formData.paymentMethod === 'bank_transfer' && (
                                            <div className="mt-2 p-4 bg-muted/50 rounded-xl border border-border">
                                                <p className="text-sm text-foreground font-medium mb-2">Bank Account Details:</p>
                                                <div className="text-sm text-muted-foreground space-y-1 mb-3">
                                                    <p><span className="font-medium">Bank:</span> HBL</p>
                                                    <p><span className="font-medium">Account Title:</span> Closet By Era</p>
                                                    <p><span className="font-medium">Account No:</span> 1234567890123</p>
                                                    <p><span className="font-medium">IBAN:</span> PK36HABB0001234567890123</p>
                                                </div>
                                                <p className="text-sm text-foreground font-medium mb-2">Instructions:</p>
                                                <ol className="text-sm text-muted-foreground list-decimal list-inside space-y-1">
                                                    <li>Transfer the total amount to the account above.</li>
                                                    <li>Use your Order Number as the payment reference.</li>
                                                    <li>Send a screenshot of the payment confirmation via WhatsApp.</li>
                                                </ol>
                                            </div>
                                        )}
                                    </div>
                                </div>
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
                                        disabled={isProcessing}
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
                                            `Place Order — PKR ${total.toLocaleString()} `
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
                                                <p className="text-sm font-medium text-foreground mt-1">PKR {(item.price * item.quantity).toLocaleString()}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Totals */}
                                <div className="border-t border-border pt-4 space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Subtotal</span>
                                        <span className="font-medium text-foreground">PKR {subtotal.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Shipping</span>
                                        <span className="font-medium text-foreground">
                                            {shipping === 0 ? 'Free' : `PKR ${(shipping + shippingMethodCost).toLocaleString()} `}
                                        </span>
                                    </div>

                                    {/* Discount Line */}
                                    {discount > 0 && (
                                        <div className="flex justify-between text-green-600 dark:text-green-400">
                                            <span className="font-medium">Discount</span>
                                            <span className="font-medium">- PKR {discount.toLocaleString()}</span>
                                        </div>
                                    )}

                                    {/* Gift Card Line */}
                                    {giftCard && potentialGiftCardUsage > 0 && (
                                        <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                                            <span className="font-medium">Gift Card ({giftCard.code})</span>
                                            <span className="font-medium">- PKR {potentialGiftCardUsage.toLocaleString()}</span>
                                        </div>
                                    )}

                                    <div className="flex justify-between pt-2 border-t border-border">
                                        <span className="font-bold text-foreground">Total to Pay</span>
                                        <span className="text-lg font-bold text-foreground">PKR {total.toLocaleString()}</span>
                                    </div>

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
                                                onClick={handleApplyCoupon}
                                                disabled={isValidatingCoupon || !couponCode}
                                                className="px-6 py-2.5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 text-sm font-medium rounded-xl transition-all duration-200 disabled:opacity-50"
                                            >
                                                {isValidatingCoupon ? '...' : 'Apply'}
                                            </button>
                                        </div>
                                        {couponMessage && (
                                            <p className={`text - xs mt - 2 ${couponMessage.type === 'success' ? 'text-green-600 dark:text-green-400' : 'text-destructive'} `}>
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
