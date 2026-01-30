'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import OrderTracking from '@/components/OrderTracking';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { Order, OrderItem, Customer } from '@/types/database';
import { getCustomerByAuthId } from '@/actions/customer';
import { getLoyaltyBalance, getLoyaltyHistory, LoyaltyHistory } from '@/actions/loyalty';

type AccountTab = 'profile' | 'orders' | 'addresses' | 'wishlist' | 'loyalty';

const VALID_TABS: AccountTab[] = ['profile', 'orders', 'addresses', 'wishlist', 'loyalty'];

interface OrderWithItems extends Order {
    items: OrderItem[];
}

interface Address {
    id: string;
    label: string;
    firstName: string;
    lastName: string;
    address: string;
    apartment?: string;
    city: string;
    state?: string;
    postalCode: string;
    country: string;
    phone: string;
    isDefault: boolean;
}

function AccountPageContent() {
    const { user, signOut, loading } = useAuth();
    const supabase = createClient();
    const router = useRouter();
    const searchParams = useSearchParams();

    // Get tab from URL or default to 'orders'
    const tabFromUrl = searchParams.get('tab') as AccountTab | null;
    const initialTab: AccountTab = tabFromUrl && VALID_TABS.includes(tabFromUrl) ? tabFromUrl : 'orders';

    const [activeTab, setActiveTab] = useState<AccountTab>(initialTab);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [orders, setOrders] = useState<OrderWithItems[]>([]);
    const [ordersLoading, setOrdersLoading] = useState(true);
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [customerLoaded, setCustomerLoaded] = useState(false);
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [loyaltyPoints, setLoyaltyPoints] = useState(0);
    const [loyaltyHistory, setLoyaltyHistory] = useState<LoyaltyHistory[]>([]);
    const [loyaltyLoading, setLoyaltyLoading] = useState(false);

    const [profile, setProfile] = useState({
        firstName: '',
        lastName: '',
        email: user?.email || '',
        phone: '',
    });

    // Sync URL search params with active tab
    useEffect(() => {
        const urlTab = searchParams.get('tab') as AccountTab | null;
        if (urlTab && VALID_TABS.includes(urlTab) && urlTab !== activeTab) {
            setActiveTab(urlTab);
        }
    }, [searchParams, activeTab]);

    // Handle tab change - update both state and URL
    const handleTabChange = (tab: AccountTab) => {
        setActiveTab(tab);
        // Update URL without full page reload
        const params = new URLSearchParams(searchParams.toString());
        params.set('tab', tab);
        router.push(`/account?${params.toString()}`, { scroll: false });
    };
    // Fetch customer data (create if needed)
    useEffect(() => {
        const fetchOrCreateCustomer = async () => {
            if (!user) {
                setCustomerLoaded(true);
                return;
            }

            let customerData = await getCustomerByAuthId(user.id);

            // If no customer record exists, create one
            if (!customerData) {
                const { data: newCustomer, error } = await supabase
                    .from('customers')
                    .insert({
                        auth_id: user.id,
                        email: user.email ?? '',
                        first_name: user.user_metadata?.first_name || '',
                        last_name: user.user_metadata?.last_name || '',
                    })
                    .select()
                    .single();

                if (!error && newCustomer) {
                    customerData = newCustomer as Customer;
                }
            }

            if (customerData) {
                setCustomer(customerData);
                setProfile({
                    firstName: customerData.first_name || '',
                    lastName: customerData.last_name || '',
                    email: customerData.email || user.email || '',
                    phone: customerData.phone || '',
                });
            } else {
                // Set defaults from user even if customer creation failed
                setProfile({
                    firstName: user.user_metadata?.first_name || '',
                    lastName: user.user_metadata?.last_name || '',
                    email: user.email || '',
                    phone: '',
                });
            }

            setCustomerLoaded(true);
        };

        fetchOrCreateCustomer();
        fetchOrCreateCustomer();
    }, [user]);

    // Fetch Loyalty Data
    useEffect(() => {
        if (!user) return;

        const fetchLoyalty = async () => {
            setLoyaltyLoading(true);
            try {
                const points = await getLoyaltyBalance();
                setLoyaltyPoints(points);

                const history = await getLoyaltyHistory();
                setLoyaltyHistory(history);
            } catch (err) {
                console.error('Error fetching loyalty:', err);
            } finally {
                setLoyaltyLoading(false);
            }
        };

        if (activeTab === 'loyalty') {
            fetchLoyalty();
        }
    }, [user, activeTab]);

    // Fetch orders from database
    useEffect(() => {
        const fetchOrders = async () => {
            // Wait for customer fetch to complete before fetching orders
            if (!customerLoaded) {
                return;
            }

            if (!user || !customer) {
                setOrdersLoading(false);
                return;
            }

            setOrdersLoading(true);
            try {
                // Fetch orders for this customer with their items in a single query
                const { data: ordersData, error: ordersError } = await supabase
                    .from('orders')
                    .select('*, items:order_items(*)')
                    .eq('customer_id', customer.id)
                    .order('created_at', { ascending: false });

                if (ordersError) {
                    console.error('Error fetching orders:', ordersError);
                    setOrdersLoading(false);
                    return;
                }

                if (!ordersData) {
                    setOrders([]);
                    return;
                }

                // Cast the response to OrderWithItems[] since we know the structure matches
                // but Supabase types might imply arrays or nulls differently
                setOrders(ordersData as unknown as OrderWithItems[]);
            } catch (error) {
                console.error('Error fetching orders:', error);
            } finally {
                setOrdersLoading(false);
            }
        };

        fetchOrders();
    }, [user, customer, customerLoaded]);

    // Extract addresses from orders
    useEffect(() => {
        if (orders.length > 0) {
            // Get unique addresses from orders
            const addressMap = new Map<string, Address>();

            orders.forEach((order, index) => {
                let addr = order.shipping_address;

                // Parse shipping_address if it's a JSON string
                if (typeof addr === 'string') {
                    try {
                        addr = JSON.parse(addr);
                    } catch {
                        return; // Skip if parsing fails
                    }
                }

                // Type guard: ensure addr is an object with address property
                if (addr && typeof addr === 'object' && 'address' in addr) {
                    const addrObj = addr as Record<string, string | undefined>;
                    const key = `${addrObj.address}-${addrObj.city}-${addrObj.postalCode}`;
                    if (!addressMap.has(key)) {
                        addressMap.set(key, {
                            id: `addr-${index}`,
                            label: index === 0 ? 'Home' : `Address ${index + 1}`,
                            firstName: addrObj.firstName || '',
                            lastName: addrObj.lastName || '',
                            address: addrObj.address || '',
                            apartment: addrObj.apartment,
                            city: addrObj.city || '',
                            state: addrObj.state,
                            postalCode: addrObj.postalCode || '',
                            country: addrObj.country || 'Pakistan',
                            phone: addrObj.phone || '',
                            isDefault: index === 0,
                        });
                    }
                }
            });

            setAddresses(Array.from(addressMap.values()));
        }
    }, [orders]);

    const handleSignOut = async () => {
        await signOut();
        router.push('/');
    };

    const handleSaveProfile = async () => {
        if (!user || !customer) return;

        setIsSaving(true);
        try {
            const { error } = await supabase
                .from('customers')
                .update({
                    first_name: profile.firstName,
                    last_name: profile.lastName,
                    phone: profile.phone,
                })
                .eq('id', customer.id);

            if (error) {
                console.error('Error updating profile:', error);
            } else {
                setCustomer({
                    ...customer,
                    first_name: profile.firstName,
                    last_name: profile.lastName,
                    phone: profile.phone,
                });
                setIsEditing(false);
            }
        } catch (error) {
            console.error('Error saving profile:', error);
        } finally {
            setIsSaving(false);
        }
    };

    // Show loading state
    if (loading) {
        return (
            <main className="min-h-screen bg-white">
                <div className="pt-32 pb-20 flex items-center justify-center">
                    <div className="animate-spin w-8 h-8 border-2 border-gray-200 border-t-rose-600 rounded-full"></div>
                </div>
            </main>
        );
    }

    // Redirect if not logged in
    if (!user) {
        return (
            <main className="min-h-screen bg-white">
                <section className="pt-32 pb-20">
                    <div className="max-w-md mx-auto px-4 text-center py-20">
                        <div className="w-20 h-20 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-6">
                            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-4">Sign in to view your account</h1>
                        <p className="text-gray-600 mb-8">
                            Access your orders, wishlist, and manage your profile.
                        </p>
                        <Link
                            href="/auth/login"
                            className="inline-flex items-center justify-center px-8 py-4 bg-slate-900 text-white font-medium rounded-full hover:bg-slate-800 transition-colors"
                        >
                            Sign In
                        </Link>
                        <p className="mt-4 text-sm text-gray-500">
                            Don&apos;t have an account?{' '}
                            <Link href="/auth/register" className="text-rose-600 hover:text-rose-700">
                                Create one
                            </Link>
                        </p>
                    </div>
                </section>
            </main>
        );
    }

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

    const getInitials = () => {
        const first = profile.firstName?.[0] || user.email?.[0] || 'U';
        const last = profile.lastName?.[0] || '';
        return `${first}${last}`.toUpperCase();
    };

    const getDisplayName = () => {
        if (profile.firstName && profile.lastName) {
            return `${profile.firstName} ${profile.lastName}`;
        }
        return user.email?.split('@')[0] || 'User';
    };

    return (
        <main className="min-h-screen bg-gray-50">

            <section className="pt-32 pb-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col lg:flex-row gap-8">
                        {/* Sidebar */}
                        <aside className="lg:w-64 flex-shrink-0">
                            <div className="bg-white rounded-2xl p-6 shadow-sm">
                                {/* User Info */}
                                <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
                                    <div className="w-14 h-14 flex-shrink-0 bg-gradient-to-br from-rose-400 to-rose-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                                        {getInitials()}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="font-semibold text-gray-900 truncate" title={getDisplayName()}>{getDisplayName()}</p>
                                        <p className="text-sm text-gray-500 truncate" title={user.email || ''}>{user.email}</p>
                                    </div>
                                </div>

                                {/* Navigation */}
                                <nav className="space-y-1">
                                    {[
                                        { id: 'profile', label: 'My Profile', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
                                        { id: 'orders', label: 'Orders', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
                                        { id: 'addresses', label: 'Addresses', icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z' },
                                        { id: 'wishlist', label: 'Wishlist', icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z' },
                                        { id: 'loyalty', label: 'Loyalty Points', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
                                    ].map((item) => (
                                        <button
                                            key={item.id}
                                            onClick={() => handleTabChange(item.id as AccountTab)}
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
                                                <p className="text-gray-900">{profile.firstName || '-'}</p>
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
                                                <p className="text-gray-900">{profile.lastName || '-'}</p>
                                            )}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-500 mb-1">Email</label>
                                            <p className="text-gray-900">{profile.email}</p>
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
                                                <p className="text-gray-900">{profile.phone || '-'}</p>
                                            )}
                                        </div>
                                    </div>

                                    {isEditing && (
                                        <button
                                            onClick={handleSaveProfile}
                                            disabled={isSaving}
                                            className="mt-6 px-6 py-3 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                                        >
                                            {isSaving ? (
                                                <>
                                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                    Saving...
                                                </>
                                            ) : (
                                                'Save Changes'
                                            )}
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* Orders Tab */}
                            {activeTab === 'orders' && (
                                <div className="space-y-4">
                                    <h2 className="text-xl font-bold text-gray-900 mb-6">My Orders</h2>

                                    {ordersLoading ? (
                                        <div className="bg-white rounded-2xl p-12 shadow-sm text-center">
                                            <div className="animate-spin w-8 h-8 border-2 border-gray-200 border-t-rose-600 rounded-full mx-auto"></div>
                                            <p className="mt-4 text-gray-500">Loading orders...</p>
                                        </div>
                                    ) : orders.length === 0 ? (
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
                                        orders.map((order) => (
                                            <div key={order.id} className="bg-white rounded-2xl p-6 shadow-sm">
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 pb-4 border-b border-gray-100">
                                                    <div>
                                                        <p className="font-semibold text-gray-900">Order {order.order_number}</p>
                                                        <p className="text-sm text-gray-500">{new Date(order.created_at).toLocaleDateString('en-US', { dateStyle: 'long' })}</p>
                                                    </div>
                                                    <span className={`mt-2 sm:mt-0 inline-flex px-3 py-1 rounded-full text-xs font-medium capitalize ${getStatusBadge(order.status || 'pending')}`}>
                                                        {order.status || 'pending'}
                                                    </span>
                                                </div>

                                                <OrderTracking
                                                    orderId={order.id}
                                                    currentStatus={order.status || 'pending'}
                                                    createdAt={order.created_at}
                                                />

                                                <div className="space-y-3 mb-4">
                                                    {order.items.map((item, index) => (
                                                        <div key={index} className="flex justify-between text-sm">
                                                            <span className="text-gray-600">
                                                                {item.product_name} {item.size && `(${item.size}`}{item.color && `, ${item.color}`}{(item.size || item.color) && ')'} x{item.quantity}
                                                            </span>
                                                            <span className="text-gray-900 font-medium">PKR {(item.price_at_purchase * item.quantity).toLocaleString()}</span>
                                                        </div>
                                                    ))}
                                                </div>

                                                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                                                    <span className="font-semibold text-gray-900">Total: PKR {(order.total ?? order.total_amount ?? 0).toLocaleString()}</span>
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

                                    {addresses.length === 0 ? (
                                        <div className="text-center py-12">
                                            <svg className="w-12 h-12 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                            <p className="text-gray-500 mb-4">No saved addresses</p>
                                            <p className="text-sm text-gray-400">Addresses from your orders will appear here</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {addresses.map((address) => (
                                                <div key={address.id} className="p-4 border border-gray-200 rounded-xl relative">
                                                    {address.isDefault && (
                                                        <span className="absolute top-4 right-4 px-2 py-0.5 bg-slate-900 text-white text-xs rounded">Default</span>
                                                    )}
                                                    <p className="font-medium text-gray-900 mb-1">{address.label}</p>
                                                    <p className="text-sm text-gray-600">
                                                        {address.firstName} {address.lastName}<br />
                                                        {address.address}{address.apartment && `, ${address.apartment}`}<br />
                                                        {address.city}{address.state && `, ${address.state}`} {address.postalCode}<br />
                                                        {address.phone}
                                                    </p>
                                                    <div className="mt-4 flex gap-4">
                                                        <button className="text-sm text-gray-500 hover:text-gray-700">Edit</button>
                                                        <button className="text-sm text-rose-500 hover:text-rose-700">Delete</button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
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

                            {/* Loyalty Tab */}
                            {activeTab === 'loyalty' && (
                                <div className="space-y-6">
                                    {/* Balance Card */}
                                    <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-8 text-white shadow-lg overflow-hidden relative">
                                        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                                        <div className="relative z-10">
                                            <h2 className="text-lg font-medium text-slate-300 mb-2">My Loyalty Points</h2>
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-5xl font-bold">{loyaltyPoints}</span>
                                                <span className="text-xl text-slate-400">pts</span>
                                            </div>
                                            <p className="mt-4 text-sm text-slate-400 max-w-sm">
                                                Earn 1 point for every 100 PKR spent. Redeem your points for exclusive discounts on your next purchase.
                                            </p>
                                        </div>
                                    </div>

                                    {/* History */}
                                    <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm">
                                        <h3 className="text-xl font-bold text-gray-900 mb-6">Points History</h3>

                                        {loyaltyLoading ? (
                                            <div className="text-center py-8">
                                                <div className="animate-spin w-6 h-6 border-2 border-gray-200 border-t-rose-600 rounded-full mx-auto"></div>
                                            </div>
                                        ) : loyaltyHistory.length === 0 ? (
                                            <div className="text-center py-12 text-gray-500">
                                                No history yet. Start shopping to earn points!
                                            </div>
                                        ) : (
                                            <div className="divide-y divide-gray-100">
                                                {loyaltyHistory.map((item) => (
                                                    <div key={item.id} className="py-4 flex items-center justify-between">
                                                        <div>
                                                            <p className="font-medium text-gray-900">{item.reason}</p>
                                                            <p className="text-sm text-gray-500">{new Date(item.created_at).toLocaleDateString()}</p>
                                                        </div>
                                                        <span className={`font-medium ${item.points > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                            {item.points > 0 ? '+' : ''}{item.points} pts
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>

        </main >
    );
}

// Wrap with Suspense for useSearchParams
export default function AccountPage() {
    return (
        <Suspense fallback={
            <main className="min-h-screen bg-gray-50">
                <div className="pt-32 pb-20 flex items-center justify-center">
                    <div className="animate-spin w-8 h-8 border-2 border-gray-200 border-t-rose-600 rounded-full"></div>
                </div>
            </main>
        }>
            <AccountPageContent />
        </Suspense>
    );
}

