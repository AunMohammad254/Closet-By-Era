import { getOrderById } from '@/actions/orders';
import OrderStatusSelector from '@/components/admin/orders/OrderStatusSelector';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft, Mail, Phone, MapPin, Package, CreditCard } from 'lucide-react';

export const metadata = {
    title: 'Order Details | Admin Dashboard',
};

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = await params;

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const order = await getOrderById(resolvedParams.id);

    if (!order) {
        notFound();
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getCustomerName = () => {
        // @ts-ignore
        if (order.customers) {
            // @ts-ignore
            return `${order.customers.first_name || ''} ${order.customers.last_name || ''}`.trim() || order.customers.email;
        }
        const addr = order.shipping_address;
        if (addr && typeof addr === 'object') {
            // @ts-ignore
            return `${addr.firstName || ''} ${addr.lastName || ''}`.trim();
        }
        return 'Guest';
    };

    // @ts-ignore
    const shipping = typeof order.shipping_address === 'object' ? order.shipping_address || {} : {};

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link
                    href="/admin/orders"
                    className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-gray-500 hover:text-gray-900"
                >
                    <ChevronLeft className="w-5 h-5" />
                </Link>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-gray-900">Order {order.order_number}</h1>
                    <p className="text-gray-500 text-sm mt-1">{formatDate(order.created_at)}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Items */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100">
                            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                <Package className="w-4 h-4 text-gray-500" />
                                Order Items
                            </h3>
                        </div>
                        <div className="divide-y divide-gray-100">
                            {order.items?.map((item: any) => (
                                <div key={item.id} className="p-6 flex gap-4">
                                    {/* Placeholder image if we had one */}
                                    <div className="w-20 h-24 bg-gray-100 rounded-lg flex-shrink-0"></div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h4 className="font-medium text-gray-900">{item.product_name}</h4>
                                                <p className="text-sm text-gray-500 mt-1">
                                                    Size: {item.size} • Color: {item.color}
                                                </p>
                                            </div>
                                            <p className="font-medium text-gray-900">
                                                PKR {(item.price_at_purchase * item.quantity).toLocaleString()}
                                            </p>
                                        </div>
                                        <div className="mt-2 text-sm text-gray-500">
                                            Qty: {item.quantity} × PKR {item.price_at_purchase?.toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 space-y-2">
                            <div className="flex justify-between text-sm text-gray-600">
                                <span>Subtotal</span>
                                <span>PKR {(order.subtotal ?? 0).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-sm text-gray-600">
                                <span>Shipping</span>
                                <span>PKR {(order.shipping_cost || 0).toLocaleString()}</span>
                            </div>
                            {/* @ts-ignore */}
                            {(order.discount || 0) > 0 && (
                                <div className="flex justify-between text-sm text-green-600">
                                    <span>Discount</span>
                                    <span>- PKR {(order.discount || 0).toLocaleString()}</span>
                                </div>
                            )}
                            <div className="flex justify-between font-bold text-gray-900 text-lg pt-2 border-t border-gray-200 mt-2">
                                <span>Total</span>
                                <span>PKR {(order.total ?? order.total_amount ?? 0).toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    {/* Timeline / Notes (Placeholder) */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                        <h3 className="font-semibold text-gray-900 mb-4">Order Notes</h3>
                        <p className="text-gray-500 text-sm">
                            {/* @ts-ignore */}
                            {order.notes || "No notes provided."}
                        </p>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Status Card */}
                    <OrderStatusSelector orderId={order.id} currentStatus={order.status} />

                    {/* Customer Info */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100">
                            <h3 className="font-semibold text-gray-900">Customer Details</h3>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 font-medium">
                                    {getCustomerName().charAt(0)}
                                </div>
                                <div>
                                    <p className="font-medium text-gray-900">{getCustomerName()}</p>
                                    <p className="text-xs text-gray-500">Customer since 2023</p>
                                </div>
                            </div>
                            <div className="pt-4 border-t border-gray-100 space-y-3">
                                <div className="flex items-center gap-3 text-sm text-gray-600">
                                    <Mail className="w-4 h-4 text-gray-400" />
                                    {/* @ts-ignore */}
                                    <a href={`mailto:${shipping.email || ''}`} className="hover:text-rose-600 transition-colors">
                                        {/* @ts-ignore */}
                                        {shipping.email || order.customer_email || 'N/A'}
                                    </a>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-gray-600">
                                    <Phone className="w-4 h-4 text-gray-400" />
                                    {/* @ts-ignore */}
                                    <span>{shipping.phone || 'N/A'}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Shipping Address */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100">
                            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-gray-500" />
                                Shipping Address
                            </h3>
                        </div>
                        <div className="p-6 text-sm text-gray-600 leading-relaxed">
                            {/* @ts-ignore */}
                            {shipping.address}<br />
                            {/* @ts-ignore */}
                            {shipping.apartment && <>{shipping.apartment}<br /></>}
                            {/* @ts-ignore */}
                            {shipping.city}, {shipping.postalCode}<br />
                            {/* @ts-ignore */}
                            {shipping.country}
                        </div>
                    </div>

                    {/* Payment Info */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100">
                            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                <CreditCard className="w-4 h-4 text-gray-500" />
                                Payment Information
                            </h3>
                        </div>
                        <div className="p-6">
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-5 bg-white border border-gray-200 rounded flex items-center justify-center text-[10px] font-bold text-gray-500 uppercase">
                                        {order.payment_method === 'cod' ? 'COD' : 'CARD'}
                                    </div>
                                    <span className="text-sm font-medium text-gray-900 capitalize">
                                        {order.payment_method === 'cod' ? 'Cash on Delivery' : 'Credit Card'}
                                    </span>
                                </div>
                                <span className="text-xs font-medium text-gray-500 bg-white px-2 py-1 rounded border border-gray-200">
                                    Paid: {order.status === 'delivered' ? 'Yes' : 'Pending'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
