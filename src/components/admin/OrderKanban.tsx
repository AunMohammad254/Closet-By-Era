'use client';

import { useState, useEffect } from 'react';
import { getOrders, updateOrderStatus } from '@/actions/orders';
import { Package, Truck, CheckCircle, Clock, Loader2, GripVertical, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

type Order = {
    id: string;
    order_number: string;
    status: OrderStatus;
    total: number;
    created_at: string;
    customer?: { first_name: string; last_name: string } | null;
};

const columns: { id: OrderStatus; label: string; icon: React.ElementType; color: string }[] = [
    { id: 'pending', label: 'Pending', icon: Clock, color: 'border-amber-500/30 bg-amber-500/5' },
    { id: 'processing', label: 'Processing', icon: Package, color: 'border-blue-500/30 bg-blue-500/5' },
    { id: 'shipped', label: 'Shipped', icon: Truck, color: 'border-purple-500/30 bg-purple-500/5' },
    { id: 'delivered', label: 'Delivered', icon: CheckCircle, color: 'border-emerald-500/30 bg-emerald-500/5' }
];

export default function OrderKanban() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [draggedOrder, setDraggedOrder] = useState<Order | null>(null);
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    const fetchOrders = async () => {
        setLoading(true);
        const result = await getOrders(1, 100); // Get up to 100 orders for kanban
        if (result && Array.isArray(result.data)) {
            setOrders((result.data as unknown as Order[]).filter(o => o.status !== 'cancelled'));
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const getOrdersByStatus = (status: OrderStatus) => {
        return orders.filter(o => o.status === status);
    };

    const handleDragStart = (e: React.DragEvent, order: Order) => {
        setDraggedOrder(order);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = async (e: React.DragEvent, newStatus: OrderStatus) => {
        e.preventDefault();

        if (!draggedOrder || draggedOrder.status === newStatus) {
            setDraggedOrder(null);
            return;
        }

        // Optimistically update UI
        setOrders(prev => prev.map(o =>
            o.id === draggedOrder.id ? { ...o, status: newStatus } : o
        ));
        setUpdatingId(draggedOrder.id);

        const result = await updateOrderStatus(draggedOrder.id, newStatus);

        if (result.success) {
            toast.success(`Order moved to ${newStatus}`);
        } else {
            // Revert on failure
            setOrders(prev => prev.map(o =>
                o.id === draggedOrder.id ? { ...o, status: draggedOrder.status } : o
            ));
            toast.error('Failed to update order status');
        }

        setUpdatingId(null);
        setDraggedOrder(null);
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatPrice = (price: number) => {
        return `Rs. ${price.toLocaleString()}`;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="animate-spin h-8 w-8 text-rose-500" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-slate-100">Order Fulfillment</h2>
                    <p className="text-sm text-slate-400">Drag orders between columns to update status</p>
                </div>
                <button
                    onClick={fetchOrders}
                    className="px-3 py-2 bg-slate-800/50 text-slate-400 rounded-lg hover:text-slate-200 transition-colors"
                >
                    <RefreshCw className="w-4 h-4" />
                </button>
            </div>

            {/* Kanban Board */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {columns.map(column => {
                    const columnOrders = getOrdersByStatus(column.id);
                    const Icon = column.icon;

                    return (
                        <div
                            key={column.id}
                            className={`rounded-xl border ${column.color} min-h-[400px] flex flex-col`}
                            onDragOver={handleDragOver}
                            onDrop={e => handleDrop(e, column.id)}
                        >
                            {/* Column Header */}
                            <div className="p-4 border-b border-slate-700/30">
                                <div className="flex items-center gap-2">
                                    <Icon className="w-5 h-5 text-slate-400" />
                                    <h3 className="font-semibold text-slate-200">{column.label}</h3>
                                    <span className="ml-auto px-2 py-0.5 text-xs bg-slate-700/50 text-slate-400 rounded-full">
                                        {columnOrders.length}
                                    </span>
                                </div>
                            </div>

                            {/* Orders */}
                            <div className="flex-1 p-3 space-y-3 overflow-y-auto">
                                {columnOrders.length === 0 ? (
                                    <div className="flex items-center justify-center h-32 text-slate-500 text-sm">
                                        No orders
                                    </div>
                                ) : (
                                    columnOrders.map(order => (
                                        <div
                                            key={order.id}
                                            draggable
                                            onDragStart={e => handleDragStart(e, order)}
                                            className={`bg-[#1e293b] rounded-lg border border-slate-700/50 p-3 cursor-grab active:cursor-grabbing hover:border-slate-600/50 transition-all ${updatingId === order.id ? 'opacity-50' : ''
                                                } ${draggedOrder?.id === order.id ? 'opacity-50 scale-95' : ''
                                                }`}
                                        >
                                            <div className="flex items-start gap-2">
                                                <GripVertical className="w-4 h-4 text-slate-600 mt-0.5 flex-shrink-0" />
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="font-medium text-slate-200 text-sm">
                                                            #{order.order_number}
                                                        </span>
                                                        {updatingId === order.id && (
                                                            <Loader2 className="w-3 h-3 animate-spin text-rose-500" />
                                                        )}
                                                    </div>
                                                    {order.customer && (
                                                        <p className="text-xs text-slate-400 truncate">
                                                            {order.customer.first_name} {order.customer.last_name}
                                                        </p>
                                                    )}
                                                    <div className="flex items-center justify-between mt-2">
                                                        <span className="text-xs text-slate-500">
                                                            {formatDate(order.created_at)}
                                                        </span>
                                                        <span className="text-sm font-semibold text-rose-400">
                                                            {formatPrice(order.total)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
