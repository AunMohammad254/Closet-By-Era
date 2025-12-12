'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { sendOrderConfirmationEmail, formatOrderForEmail } from '@/lib/email';

type CheckoutStep = 'information' | 'shipping' | 'payment';

export default function CheckoutPage() {
    const router = useRouter();
    const { items, subtotal, clearCart } = useCart();
    const { user } = useAuth();

    const [step, setStep] = useState<CheckoutStep>('information');
    const [isProcessing, setIsProcessing] = useState(false);
    const [orderComplete, setOrderComplete] = useState(false);
    const [orderNumber, setOrderNumber] = useState('');

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
    const total = subtotal + shipping + shippingMethodCost;

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

        if (currentStep === 'payment' && formData.paymentMethod === 'card') {
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

    const handlePlaceOrder = async () => {
        if (!validateStep('payment')) return;

        setIsProcessing(true);

        try {
            // Simulate order processing
            await new Promise((resolve) => setTimeout(resolve, 1500));

            // Generate order number
            const newOrderNumber = `CBE-${Date.now().toString().slice(-8)}`;
            setOrderNumber(newOrderNumber);

            // Prepare order data for email
            const orderItems = items.map((item) => ({
                productName: item.name,
                quantity: item.quantity,
                size: item.size,
                color: item.color,
                unitPrice: item.price,
                totalPrice: item.price * item.quantity,
            }));

            const shippingAddress = {
                firstName: formData.firstName,
                lastName: formData.lastName,
                address: formData.address,
                apartment: formData.apartment,
                city: formData.city,
                postalCode: formData.postalCode,
                country: formData.country,
                phone: formData.phone,
            };

            // Format and send order confirmation email
            const emailData = formatOrderForEmail(
                {
                    order_number: newOrderNumber,
                    subtotal: subtotal,
                    shipping_cost: shipping + shippingMethodCost,
                    discount: 0,
                    total: total,
                },
                orderItems,
                formData.email,
                `${formData.firstName} ${formData.lastName}`,
                shippingAddress,
                formData.paymentMethod
            );

            // Send email (non-blocking - don't wait for result)
            sendOrderConfirmationEmail(emailData).then((result) => {
                if (!result.success) {
                    console.warn('Email sending failed:', result.error);
                }
            });

            // Clear cart and show success
            clearCart();
            setOrderComplete(true);
        } catch (error) {
            console.error('Order processing error:', error);
            // Still complete the order even if email fails
            clearCart();
            setOrderComplete(true);
        } finally {
            setIsProcessing(false);
        }
    };

    if (items.length === 0 && !orderComplete) {
        return (
            <main className="min-h-screen bg-white">
                <Navbar />
                <section className="pt-32 pb-20">
                    <div className="max-w-md mx-auto px-4 text-center py-20">
                        <h1 className="text-2xl font-bold text-gray-900 mb-4">Your cart is empty</h1>
                        <Link href="/products" className="text-rose-600 hover:text-rose-700 transition-colors">
                            Continue shopping
                        </Link>
                    </div>
                </section>
                <Footer />
            </main>
        );
    }

    if (orderComplete) {
        return (
            <main className="min-h-screen bg-white">
                <Navbar />
                <section className="pt-32 pb-20">
                    <div className="max-w-lg mx-auto px-4 text-center py-12">
                        {/* Success Icon */}
                        <div className="w-20 h-20 mx-auto bg-emerald-100 rounded-full flex items-center justify-center mb-8">
                            <svg className="w-10 h-10 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>

                        <h1 className="text-3xl font-bold text-gray-900 mb-4">Order Confirmed!</h1>
                        <p className="text-gray-600 mb-2">Thank you for your purchase.</p>
                        <p className="text-gray-600 mb-8">
                            Order number: <span className="font-semibold text-gray-900">{orderNumber}</span>
                        </p>

                        <p className="text-sm text-gray-500 mb-8">
                            We&apos;ve sent a confirmation email to <span className="font-medium">{formData.email}</span>
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link
                                href="/products"
                                className="px-8 py-4 bg-slate-900 text-white font-medium rounded-full hover:bg-slate-800 transition-colors"
                            >
                                Continue Shopping
                            </Link>
                            <Link
                                href="/account/orders"
                                className="px-8 py-4 border border-gray-200 text-gray-700 font-medium rounded-full hover:border-gray-400 transition-colors"
                            >
                                View Orders
                            </Link>
                        </div>
                    </div>
                </section>
                <Footer />
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-white">
            <Navbar />

            <section className="pt-32 pb-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Progress Steps */}
                    <div className="max-w-2xl mx-auto mb-12">
                        <div className="flex items-center justify-between">
                            {(['information', 'shipping', 'payment'] as CheckoutStep[]).map((s, index) => (
                                <div key={s} className="flex items-center">
                                    <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${step === s
                                        ? 'bg-slate-900 text-white'
                                        : index < ['information', 'shipping', 'payment'].indexOf(step)
                                            ? 'bg-emerald-500 text-white'
                                            : 'bg-gray-200 text-gray-500'
                                        }`}>
                                        {index < ['information', 'shipping', 'payment'].indexOf(step) ? (
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                        ) : (
                                            index + 1
                                        )}
                                    </div>
                                    <span className={`ml-2 text-sm font-medium capitalize hidden sm:inline ${step === s ? 'text-gray-900' : 'text-gray-500'
                                        }`}>
                                        {s}
                                    </span>
                                    {index < 2 && (
                                        <div className={`w-16 sm:w-24 h-px mx-4 ${index < ['information', 'shipping', 'payment'].indexOf(step) ? 'bg-emerald-500' : 'bg-gray-200'
                                            }`} />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
                        {/* Form Section */}
                        <div className="lg:col-span-2">
                            {/* Information Step */}
                            {step === 'information' && (
                                <div className="space-y-8">
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900 mb-6">Contact Information</h2>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                                <input
                                                    type="email"
                                                    name="email"
                                                    value={formData.email}
                                                    onChange={handleInputChange}
                                                    suppressHydrationWarning
                                                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 ${errors.email ? 'border-rose-500' : 'border-gray-200'
                                                        }`}
                                                    placeholder="your@email.com"
                                                />
                                                {errors.email && <p className="mt-1 text-sm text-rose-500">{errors.email}</p>}
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                                                <input
                                                    type="tel"
                                                    name="phone"
                                                    value={formData.phone}
                                                    onChange={handleInputChange}
                                                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 ${errors.phone ? 'border-rose-500' : 'border-gray-200'
                                                        }`}
                                                    placeholder="+92 300 1234567"
                                                />
                                                {errors.phone && <p className="mt-1 text-sm text-rose-500">{errors.phone}</p>}
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900 mb-6">Shipping Address</h2>
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                                                    <input
                                                        type="text"
                                                        name="firstName"
                                                        value={formData.firstName}
                                                        onChange={handleInputChange}
                                                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 ${errors.firstName ? 'border-rose-500' : 'border-gray-200'
                                                            }`}
                                                    />
                                                    {errors.firstName && <p className="mt-1 text-sm text-rose-500">{errors.firstName}</p>}
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                                                    <input
                                                        type="text"
                                                        name="lastName"
                                                        value={formData.lastName}
                                                        onChange={handleInputChange}
                                                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 ${errors.lastName ? 'border-rose-500' : 'border-gray-200'
                                                            }`}
                                                    />
                                                    {errors.lastName && <p className="mt-1 text-sm text-rose-500">{errors.lastName}</p>}
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                                                <input
                                                    type="text"
                                                    name="address"
                                                    value={formData.address}
                                                    onChange={handleInputChange}
                                                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 ${errors.address ? 'border-rose-500' : 'border-gray-200'
                                                        }`}
                                                    placeholder="Street address"
                                                />
                                                {errors.address && <p className="mt-1 text-sm text-rose-500">{errors.address}</p>}
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Apartment, suite, etc. (optional)</label>
                                                <input
                                                    type="text"
                                                    name="apartment"
                                                    value={formData.apartment}
                                                    onChange={handleInputChange}
                                                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                                                    <input
                                                        type="text"
                                                        name="city"
                                                        value={formData.city}
                                                        onChange={handleInputChange}
                                                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 ${errors.city ? 'border-rose-500' : 'border-gray-200'
                                                            }`}
                                                    />
                                                    {errors.city && <p className="mt-1 text-sm text-rose-500">{errors.city}</p>}
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code</label>
                                                    <input
                                                        type="text"
                                                        name="postalCode"
                                                        value={formData.postalCode}
                                                        onChange={handleInputChange}
                                                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
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
                                    <h2 className="text-xl font-bold text-gray-900 mb-6">Shipping Method</h2>
                                    <div className="space-y-4">
                                        <label className={`flex items-center p-4 border rounded-xl cursor-pointer transition-colors ${formData.shippingMethod === 'standard' ? 'border-slate-900 bg-slate-50' : 'border-gray-200 hover:border-gray-400'
                                            }`}>
                                            <input
                                                type="radio"
                                                name="shippingMethod"
                                                value="standard"
                                                checked={formData.shippingMethod === 'standard'}
                                                onChange={handleInputChange}
                                                className="sr-only"
                                            />
                                            <div className={`w-5 h-5 rounded-full border-2 mr-4 flex items-center justify-center ${formData.shippingMethod === 'standard' ? 'border-slate-900' : 'border-gray-300'
                                                }`}>
                                                {formData.shippingMethod === 'standard' && (
                                                    <div className="w-2.5 h-2.5 rounded-full bg-slate-900" />
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-medium text-gray-900">Standard Shipping</p>
                                                <p className="text-sm text-gray-500">3-5 business days</p>
                                            </div>
                                            <span className="font-medium text-gray-900">
                                                {shipping === 0 ? 'Free' : `PKR ${shipping}`}
                                            </span>
                                        </label>

                                        <label className={`flex items-center p-4 border rounded-xl cursor-pointer transition-colors ${formData.shippingMethod === 'express' ? 'border-slate-900 bg-slate-50' : 'border-gray-200 hover:border-gray-400'
                                            }`}>
                                            <input
                                                type="radio"
                                                name="shippingMethod"
                                                value="express"
                                                checked={formData.shippingMethod === 'express'}
                                                onChange={handleInputChange}
                                                className="sr-only"
                                            />
                                            <div className={`w-5 h-5 rounded-full border-2 mr-4 flex items-center justify-center ${formData.shippingMethod === 'express' ? 'border-slate-900' : 'border-gray-300'
                                                }`}>
                                                {formData.shippingMethod === 'express' && (
                                                    <div className="w-2.5 h-2.5 rounded-full bg-slate-900" />
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-medium text-gray-900">Express Shipping</p>
                                                <p className="text-sm text-gray-500">1-2 business days</p>
                                            </div>
                                            <span className="font-medium text-gray-900">PKR 300</span>
                                        </label>
                                    </div>

                                    {/* Order Notes */}
                                    <div className="mt-8">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Order Notes (optional)</label>
                                        <textarea
                                            name="notes"
                                            value={formData.notes}
                                            onChange={handleInputChange}
                                            rows={3}
                                            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none"
                                            placeholder="Special instructions for your order..."
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Payment Step */}
                            {step === 'payment' && (
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900 mb-6">Payment Method</h2>
                                    <div className="space-y-4">
                                        <label className={`flex items-center p-4 border rounded-xl cursor-pointer transition-colors ${formData.paymentMethod === 'cod' ? 'border-slate-900 bg-slate-50' : 'border-gray-200 hover:border-gray-400'
                                            }`}>
                                            <input
                                                type="radio"
                                                name="paymentMethod"
                                                value="cod"
                                                checked={formData.paymentMethod === 'cod'}
                                                onChange={handleInputChange}
                                                className="sr-only"
                                            />
                                            <div className={`w-5 h-5 rounded-full border-2 mr-4 flex items-center justify-center ${formData.paymentMethod === 'cod' ? 'border-slate-900' : 'border-gray-300'
                                                }`}>
                                                {formData.paymentMethod === 'cod' && (
                                                    <div className="w-2.5 h-2.5 rounded-full bg-slate-900" />
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-medium text-gray-900">Cash on Delivery</p>
                                                <p className="text-sm text-gray-500">Pay when you receive your order</p>
                                            </div>
                                        </label>

                                        <label className={`flex items-center p-4 border rounded-xl cursor-pointer transition-colors ${formData.paymentMethod === 'card' ? 'border-slate-900 bg-slate-50' : 'border-gray-200 hover:border-gray-400'
                                            }`}>
                                            <input
                                                type="radio"
                                                name="paymentMethod"
                                                value="card"
                                                checked={formData.paymentMethod === 'card'}
                                                onChange={handleInputChange}
                                                className="sr-only"
                                            />
                                            <div className={`w-5 h-5 rounded-full border-2 mr-4 flex items-center justify-center ${formData.paymentMethod === 'card' ? 'border-slate-900' : 'border-gray-300'
                                                }`}>
                                                {formData.paymentMethod === 'card' && (
                                                    <div className="w-2.5 h-2.5 rounded-full bg-slate-900" />
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-medium text-gray-900">Credit/Debit Card</p>
                                                <p className="text-sm text-gray-500">Visa, Mastercard, etc.</p>
                                            </div>
                                        </label>

                                        {formData.paymentMethod === 'card' && (
                                            <div className="mt-4 p-4 bg-gray-50 rounded-xl space-y-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Card Number</label>
                                                    <input
                                                        type="text"
                                                        name="cardNumber"
                                                        value={formData.cardNumber}
                                                        onChange={handleInputChange}
                                                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 ${errors.cardNumber ? 'border-rose-500' : 'border-gray-200'
                                                            }`}
                                                        placeholder="1234 5678 9012 3456"
                                                    />
                                                    {errors.cardNumber && <p className="mt-1 text-sm text-rose-500">{errors.cardNumber}</p>}
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                                                        <input
                                                            type="text"
                                                            name="cardExpiry"
                                                            value={formData.cardExpiry}
                                                            onChange={handleInputChange}
                                                            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 ${errors.cardExpiry ? 'border-rose-500' : 'border-gray-200'
                                                                }`}
                                                            placeholder="MM/YY"
                                                        />
                                                        {errors.cardExpiry && <p className="mt-1 text-sm text-rose-500">{errors.cardExpiry}</p>}
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">CVC</label>
                                                        <input
                                                            type="text"
                                                            name="cardCvc"
                                                            value={formData.cardCvc}
                                                            onChange={handleInputChange}
                                                            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 ${errors.cardCvc ? 'border-rose-500' : 'border-gray-200'
                                                                }`}
                                                            placeholder="123"
                                                        />
                                                        {errors.cardCvc && <p className="mt-1 text-sm text-rose-500">{errors.cardCvc}</p>}
                                                    </div>
                                                </div>
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
                                        className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
                                    >
                                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                        </svg>
                                        Back
                                    </button>
                                ) : (
                                    <Link href="/cart" className="flex items-center text-gray-600 hover:text-gray-900 transition-colors">
                                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                        </svg>
                                        Return to cart
                                    </Link>
                                )}

                                {step !== 'payment' ? (
                                    <button
                                        onClick={handleContinue}
                                        className="px-8 py-4 bg-slate-900 text-white font-medium rounded-full hover:bg-slate-800 transition-colors"
                                    >
                                        Continue
                                    </button>
                                ) : (
                                    <button
                                        onClick={handlePlaceOrder}
                                        disabled={isProcessing}
                                        className="px-8 py-4 bg-rose-600 text-white font-medium rounded-full hover:bg-rose-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
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
                                            `Place Order — PKR ${total.toLocaleString()}`
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Order Summary Sidebar */}
                        <div className="lg:col-span-1">
                            <div className="sticky top-32 p-6 bg-gray-50 rounded-2xl">
                                <h3 className="text-lg font-bold text-gray-900 mb-4">Order Summary</h3>

                                {/* Cart Items */}
                                <div className="space-y-4 max-h-64 overflow-y-auto mb-4">
                                    {items.map((item) => (
                                        <div key={item.id} className="flex gap-3">
                                            <div className="w-16 h-20 bg-gray-200 rounded-lg flex-shrink-0 flex items-center justify-center relative">
                                                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                                <span className="absolute -top-2 -right-2 w-5 h-5 bg-slate-900 text-white text-xs rounded-full flex items-center justify-center">
                                                    {item.quantity}
                                                </span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                                                <p className="text-xs text-gray-500">{item.size} / {item.color}</p>
                                                <p className="text-sm font-medium text-gray-900 mt-1">PKR {(item.price * item.quantity).toLocaleString()}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Totals */}
                                <div className="border-t border-gray-200 pt-4 space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Subtotal</span>
                                        <span className="font-medium">PKR {subtotal.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Shipping</span>
                                        <span className="font-medium">
                                            {shipping === 0 ? 'Free' : `PKR ${(shipping + shippingMethodCost).toLocaleString()}`}
                                        </span>
                                    </div>
                                    <div className="flex justify-between pt-2 border-t border-gray-200">
                                        <span className="font-bold text-gray-900">Total</span>
                                        <span className="text-lg font-bold text-gray-900">PKR {total.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </main>
    );
}
