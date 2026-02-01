'use client';

import dynamic from 'next/dynamic';

const OrderKanban = dynamic(() => import('@/components/admin/OrderKanban'), {
    ssr: false,
    loading: () => (
        <div className="flex items-center justify-center h-96">
            <div className="animate-spin h-8 w-8 border-2 border-rose-500 border-t-transparent rounded-full"></div>
        </div>
    )
});

export default function OrderKanbanPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-100">Order Kanban</h1>
                <p className="text-slate-400 text-sm mt-1">Visual order fulfillment workflow</p>
            </div>
            <OrderKanban />
        </div>
    );
}
