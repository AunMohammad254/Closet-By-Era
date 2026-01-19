'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface OrderTrackingProps {
    orderId: string;
    currentStatus: string;
    createdAt: string;
}

type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

const STEPS: { status: OrderStatus; label: string; icon: string }[] = [
    { status: 'pending', label: 'Order Placed', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
    { status: 'processing', label: 'Processing', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
    { status: 'shipped', label: 'Shipped', icon: 'M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4' },
    { status: 'delivered', label: 'Delivered', icon: 'M5 13l4 4L19 7' },
];

export default function OrderTracking({ orderId, currentStatus: initialStatus, createdAt }: OrderTrackingProps) {
    const supabase = createClient();
    const [status, setStatus] = useState<string>(initialStatus);

    useEffect(() => {
        // Update local status if prop changes
        // eslint-disable-next-line
        setStatus(initialStatus);

        // Subscribe to real-time updates for this specific order
        const channel = supabase
            .channel(`order-${orderId}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'orders',
                    filter: `id=eq.${orderId}`,
                },
                (payload) => {
                    if (payload.new && payload.new.status) {
                        setStatus(payload.new.status);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [orderId, initialStatus]);

    // Handle cancelled state specially
    if (status === 'cancelled') {
        return (
            <div className="w-full bg-red-50 p-6 rounded-xl border border-red-100 mb-6">
                <div className="flex items-center gap-4 text-red-700">
                    <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="font-semibold text-lg">Order Cancelled</h3>
                        <p className="text-sm opacity-90">This order has been cancelled.</p>
                    </div>
                </div>
            </div>
        );
    }

    const getCurrentStepIndex = () => {
        return STEPS.findIndex(s => s.status === status) !== -1
            ? STEPS.findIndex(s => s.status === status)
            : 0; // Default to first step if status unknown
    };

    const currentStepIndex = getCurrentStepIndex();

    return (
        <div className="w-full py-6">
            <div className="relative">
                {/* Progress Bar Background */}
                <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-100 -translate-y-1/2 rounded-full" />

                {/* Active Progress Bar */}
                <div
                    className="absolute top-1/2 left-0 h-1 bg-emerald-500 -translate-y-1/2 rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${(currentStepIndex / (STEPS.length - 1)) * 100}%` }}
                />

                {/* Steps */}
                <div className="relative flex justify-between items-center">
                    {STEPS.map((step, index) => {
                        const isCompleted = index <= currentStepIndex;
                        const isCurrent = index === currentStepIndex;

                        return (
                            <div key={step.status} className="flex flex-col items-center group">
                                <div
                                    className={`
                                        w-10 h-10 rounded-full flex items-center justify-center border-2 z-10 transition-all duration-300
                                        ${isCompleted
                                            ? 'bg-emerald-500 border-emerald-500 text-white'
                                            : 'bg-white border-gray-200 text-gray-300'
                                        }
                                        ${isCurrent ? 'ring-4 ring-emerald-100 scale-110' : ''}
                                    `}
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={step.icon} />
                                    </svg>
                                </div>
                                <div className="absolute mt-14 flex flex-col items-center w-32 text-center">
                                    <span className={`text-sm font-medium transition-colors duration-300 ${isCompleted ? 'text-gray-900' : 'text-gray-400'}`}>
                                        {step.label}
                                    </span>
                                    {index === 0 && (
                                        <span className="text-xs text-gray-400 mt-1">
                                            {new Date(createdAt).toLocaleDateString()}
                                        </span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
            {/* Spacing for labels */}
            <div className="h-16" />
        </div>
    );
}
