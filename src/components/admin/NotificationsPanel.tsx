'use client';

import { useState, useEffect, useCallback } from 'react';
import { Bell, Check, CheckCheck, X, ShoppingCart, Package, Star, RotateCcw, AlertCircle } from 'lucide-react';
import { getAdminNotifications, markNotificationAsRead, markAllNotificationsAsRead, getUnreadNotificationCount } from '@/actions/notifications';

interface Notification {
    id: string;
    type: 'order' | 'stock' | 'review' | 'return' | 'system';
    title: string;
    message: string;
    entity_id: string | null;
    entity_type: string | null;
    is_read: boolean;
    created_at: string;
}

const typeIcons = {
    order: ShoppingCart,
    stock: Package,
    review: Star,
    return: RotateCcw,
    system: AlertCircle
};

const typeColors = {
    order: 'bg-blue-500/10 text-blue-400',
    stock: 'bg-amber-500/10 text-amber-400',
    review: 'bg-purple-500/10 text-purple-400',
    return: 'bg-rose-500/10 text-rose-400',
    system: 'bg-slate-500/10 text-slate-400'
};

export default function NotificationsPanel() {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);

    const fetchNotifications = useCallback(async () => {
        setLoading(true);
        const [notifs, count] = await Promise.all([
            getAdminNotifications({ limit: 10 }),
            getUnreadNotificationCount()
        ]);
        setNotifications(notifs);
        setUnreadCount(count);
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchNotifications();
        // Poll for new notifications every 30 seconds
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, [fetchNotifications]);

    const handleMarkAsRead = async (id: string) => {
        await markNotificationAsRead(id);
        setNotifications(prev =>
            prev.map(n => n.id === id ? { ...n, is_read: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
    };

    const handleMarkAllAsRead = async () => {
        await markAllNotificationsAsRead();
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        setUnreadCount(0);
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        return `${days}d ago`;
    };

    return (
        <div className="relative">
            {/* Bell Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 rounded-xl transition-colors"
            >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown Panel */}
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Panel */}
                    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#1e293b] border border-slate-700/50 rounded-2xl shadow-2xl z-50 overflow-hidden">
                        {/* Header */}
                        <div className="px-4 py-3 border-b border-slate-700/50 flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-slate-200">Notifications</h3>
                            <div className="flex items-center gap-2">
                                {unreadCount > 0 && (
                                    <button
                                        onClick={handleMarkAllAsRead}
                                        className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1"
                                    >
                                        <CheckCheck className="w-3.5 h-3.5" />
                                        Mark all read
                                    </button>
                                )}
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="text-slate-500 hover:text-slate-300"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Notifications List */}
                        <div className="max-h-96 overflow-y-auto">
                            {loading && notifications.length === 0 ? (
                                <div className="px-4 py-8 text-center text-slate-500">
                                    Loading...
                                </div>
                            ) : notifications.length === 0 ? (
                                <div className="px-4 py-8 text-center text-slate-500">
                                    <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                    <p>No notifications yet</p>
                                </div>
                            ) : (
                                notifications.map((notification) => {
                                    const Icon = typeIcons[notification.type];
                                    const colorClass = typeColors[notification.type];

                                    return (
                                        <div
                                            key={notification.id}
                                            className={`px-4 py-3 border-b border-slate-700/30 hover:bg-slate-800/30 transition-colors ${!notification.is_read ? 'bg-slate-800/20' : ''
                                                }`}
                                        >
                                            <div className="flex gap-3">
                                                <div className={`p-2 rounded-lg ${colorClass}`}>
                                                    <Icon className="w-4 h-4" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <p className="text-sm font-medium text-slate-200 truncate">
                                                            {notification.title}
                                                        </p>
                                                        <span className="text-xs text-slate-500 whitespace-nowrap">
                                                            {formatTime(notification.created_at)}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">
                                                        {notification.message}
                                                    </p>
                                                </div>
                                                {!notification.is_read && (
                                                    <button
                                                        onClick={() => handleMarkAsRead(notification.id)}
                                                        className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                                                        title="Mark as read"
                                                    >
                                                        <Check className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
