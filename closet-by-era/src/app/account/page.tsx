'use client';

import { useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

type AccountTab = 'profile' | 'orders' | 'addresses' | 'wishlist';

// Mock orders data
const mockOrders = [
    {
        id: 'CBE-12345678',
        date: '2024-12-10',
        status: 'delivered',
        total: 18980,
        items: [
            { name: 'Signature Wool Blend Overcoat', size: 'M', color: 'Black', quantity: 1, price: 12990 },
            { name: 'Premium Cotton Oxford Shirt', size: 'L', color: 'White', quantity: 1, price: 4490 },
        ],
    },
    {
        id: 'CBE-12345679',
        date: '2024-12-05',
        status: 'shipped',
        total: 8990,
        items: [
            { name: 'Cashmere Blend Sweater', size: 'S', color: 'Cream', quantity: 1, price: 8990 },
        ],
    },
];

export default function AccountPage() {
    const { user, signOut, loading } = useAuth();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<AccountTab>('profile');
    const [isEditing, setIsEditing] = useState(false);

    const [profile, setProfile] = useState({
        firstName: 'John',
        lastName: 'Doe',
        email: user?.email || '',
        phone: '+92 300 1234567',
    });

    const handleSignOut = async () => {
        await signOut();
        router.push('/');
    };

    // Show loading state
    if (loading) {
        return (
            <main className="min-h-screen bg-white">
                <Navbar />
                <div className="pt-32 pb-20 flex items-center justify-center">
                    <div className="animate-spin w-8 h-8 border-2 border-gray-200 border-t-rose-600 rounded-full"></div>
                </div>
                <Footer />
            </main>
        );
    }

    // Redirect if not logged in (mock - always show for demo)
    // if (!user) {
    //   router.push('/auth/login');
    //   return null;
    // }

    const getStatusBadge = (status: string) => {
        const styles = {
            pending: 'bg-yellow-100 text-yellow-700',
            processing: 'bg-blue-100 text-blue-700',
            shipped: 'bg-purple-100 text-purple-700',
            delivered: 'bg-emerald-100 text-emerald-700',
            cancelled: 'bg-gray-100 text-gray-700',
        };
        return styles[status as keyof typeof styles] || styles.pending;
    };

    return (
        <main className="min-h-screen bg-gray-50">
            <Navbar />

            <section className="pt-32 pb-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col lg:flex-row gap-8">
                        {/* Sidebar */}
                        <aside className="lg:w-64 flex-shrink-0">
                            <div className="bg-white rounded-2xl p-6 shadow-sm">
                                {/* User Info */}
                                <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
                                    <div className="w-14 h-14 bg-gradient-to-br from-rose-400 to-rose-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                                        JD
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-900">John Doe</p>
                                        <p className="text-sm text-gray-500">{user?.email || 'john@example.com'}</p>
                                    </div>
                                </div>

                                {/* Navigation */}
                                <nav className="space-y-1">
                                    {[
                                        { id: 'profile', label: 'My Profile', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
                                        { id: 'orders', label: 'Orders', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
                                        { id: 'addresses', label: 'Addresses', icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z' },
                                        { id: 'wishlist', label: 'Wishlist', icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z' },
                                    ].map((item) => (
                                        <button
                                            key={item.id}
                                            onClick={() => setActiveTab(item.id as AccountTab)}
                                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === item.id
                                                    ? 'bg-slate-900 text-white'
                                                    : 'text-gray-600 hover:bg-gray-100'
                                                }`}
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} />
                                            </svg>
                                            {item.label}
                                        </button>
                                    ))}
                                </nav>

                                {/* Sign Out */}
                                <button
                                    onClick={handleSignOut}
                                    className="w-full mt-6 flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-rose-600 hover:bg-rose-50 transition-colors"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                    </svg>
                                    Sign Out
                                </button>
                            </div>
                        </aside>

                        {/* Main Content */}
                        <div className="flex-1">
                            {/* Profile Tab */}
                            {activeTab === 'profile' && (
                                <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm">
                                    <div className="flex items-center justify-between mb-6">
                                        <h2 className="text-xl font-bold text-gray-900">My Profile</h2>
                                        <button
                                            onClick={() => setIsEditing(!isEditing)}
                                            className="text-sm text-rose-600 font-medium hover:text-rose-700 transition-colors"
                                        >
                                            {isEditing ? 'Cancel' : 'Edit'}
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-500 mb-1">First Name</label>
                                            {isEditing ? (
                                                <input
                                                    type="text"
                                                    value={profile.firstName}
                                                    onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                                                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                                                />
                                            ) : (
                                                <p className="text-gray-900">{profile.firstName}</p>
                                            )}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-500 mb-1">Last Name</label>
                                            {isEditing ? (
                                                <input
                                                    type="text"
                                                    value={profile.lastName}
                                                    onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                                                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                                                />
                                            ) : (
                                                <p className="text-gray-900">{profile.lastName}</p>
                                            )}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-500 mb-1">Email</label>
                                            <p className="text-gray-900">{profile.email || 'john@example.com'}</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-500 mb-1">Phone</label>
                                            {isEditing ? (
                                                <input
                                                    type="tel"
                                                    value={profile.phone}
                                                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                                                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                                                />
                                            ) : (
                                                <p className="text-gray-900">{profile.phone}</p>
                                            )}
                                        </div>
                                    </div>

                                    {isEditing && (
                                        <button
                                            onClick={() => setIsEditing(false)}
                                            className="mt-6 px-6 py-3 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 transition-colors"
                                        >
                                            Save Changes
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* Orders Tab */}
                            {activeTab === 'orders' && (
                                <div className="space-y-4">
                                    <h2 className="text-xl font-bold text-gray-900 mb-6">My Orders</h2>

                                    {mockOrders.length === 0 ? (
                                        <div className="bg-white rounded-2xl p-12 shadow-sm text-center">
                                            <svg className="w-12 h-12 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                            </svg>
                                            <p className="text-gray-500 mb-4">No orders yet</p>
                                            <Link href="/products" className="text-rose-600 font-medium hover:text-rose-700">
                                                Start shopping
                                            </Link>
                                        </div>
                                    ) : (
                                        mockOrders.map((order) => (
                                            <div key={order.id} className="bg-white rounded-2xl p-6 shadow-sm">
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 pb-4 border-b border-gray-100">
                                                    <div>
                                                        <p className="font-semibold text-gray-900">Order {order.id}</p>
                                                        <p className="text-sm text-gray-500">{new Date(order.date).toLocaleDateString('en-US', { dateStyle: 'long' })}</p>
                                                    </div>
                                                    <span className={`mt-2 sm:mt-0 inline-flex px-3 py-1 rounded-full text-xs font-medium capitalize ${getStatusBadge(order.status)}`}>
                                                        {order.status}
                                                    </span>
                                                </div>

                                                <div className="space-y-3 mb-4">
                                                    {order.items.map((item, index) => (
                                                        <div key={index} className="flex justify-between text-sm">
                                                            <span className="text-gray-600">
                                                                {item.name} ({item.size}, {item.color}) x{item.quantity}
                                                            </span>
                                                            <span className="text-gray-900 font-medium">PKR {item.price.toLocaleString()}</span>
                                                        </div>
                                                    ))}
                                                </div>

                                                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                                                    <span className="font-semibold text-gray-900">Total: PKR {order.total.toLocaleString()}</span>
                                                    <button className="text-sm text-rose-600 font-medium hover:text-rose-700 transition-colors">
                                                        View Details
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}

                            {/* Addresses Tab */}
                            {activeTab === 'addresses' && (
                                <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm">
                                    <div className="flex items-center justify-between mb-6">
                                        <h2 className="text-xl font-bold text-gray-900">Saved Addresses</h2>
                                        <button className="text-sm text-rose-600 font-medium hover:text-rose-700 transition-colors">
                                            + Add New
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="p-4 border border-gray-200 rounded-xl relative">
                                            <span className="absolute top-4 right-4 px-2 py-0.5 bg-slate-900 text-white text-xs rounded">Default</span>
                                            <p className="font-medium text-gray-900 mb-1">Home</p>
                                            <p className="text-sm text-gray-600">
                                                John Doe<br />
                                                123 Main Street, DHA Phase 5<br />
                                                Karachi, Sindh 75500<br />
                                                +92 300 1234567
                                            </p>
                                            <div className="mt-4 flex gap-4">
                                                <button className="text-sm text-gray-500 hover:text-gray-700">Edit</button>
                                                <button className="text-sm text-rose-500 hover:text-rose-700">Delete</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Wishlist Tab */}
                            {activeTab === 'wishlist' && (
                                <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm">
                                    <h2 className="text-xl font-bold text-gray-900 mb-6">My Wishlist</h2>
                                    <div className="text-center py-12">
                                        <svg className="w-12 h-12 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                        </svg>
                                        <p className="text-gray-500 mb-4">Your wishlist is empty</p>
                                        <Link href="/products" className="text-rose-600 font-medium hover:text-rose-700">
                                            Discover products
                                        </Link>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </main>
    );
}
