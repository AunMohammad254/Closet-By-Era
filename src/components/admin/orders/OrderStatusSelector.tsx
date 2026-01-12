'use client';

import { useState } from 'react';
import { updateOrderStatus } from '@/actions/orders';
import { Loader2 } from 'lucide-react';

interface Props {
    orderId: string;
    currentStatus: string;
}

export default function OrderStatusSelector({ orderId, currentStatus }: Props) {
    const [status, setStatus] = useState(currentStatus);
    const [updating, setUpdating] = useState(false);

    const statuses = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

    const handleStatusChange = async (newStatus: string) => {
        setUpdating(true);
        try {
            await updateOrderStatus(orderId, newStatus);
            setStatus(newStatus);
        } catch (error) {
            alert('Failed to update status');
            console.error(error);
        } finally {
            setUpdating(false);
        }
    };

    return (
        <div className="flex items-center gap-3 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <label className="text-sm font-medium text-gray-700">Order Status:</label>
            <div className="relative">
                <select
                    value={status}
                    // @ts-ignore
                    onChange={(e) => handleStatusChange(e.target.value)}
                    disabled={updating}
                    className="appearance-none bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-slate-900 focus:border-slate-900 block w-full p-2.5 pr-8 disabled:opacity-50"
                >
                    {statuses.map((s) => (
                        <option key={s} value={s.toLowerCase()}>
                            {s}
                        </option>
                    ))}
                </select>
                {updating && (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2">
                        <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                    </div>
                )}
            </div>
        </div>
    );
}
