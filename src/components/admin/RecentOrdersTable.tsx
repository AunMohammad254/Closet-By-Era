export default function RecentOrdersTable() {
    const orders = [
        { id: '#758003', customer: 'Glucina Brann', date: 'Feb 15, 2023', status: 'Confirmed', total: '$52.00' },
        { id: '#758004', customer: 'Jasnifa Smith', date: 'Feb 14, 2023', status: 'Processing', total: '$23.00' },
        { id: '#758005', customer: 'Robert Fox', date: 'Feb 14, 2023', status: 'Shipped', total: '$120.50' },
        { id: '#758006', customer: 'Guy Hawkins', date: 'Feb 13, 2023', status: 'Delivered', total: '$85.00' },
        { id: '#758007', customer: 'Esther Howard', date: 'Feb 12, 2023', status: 'Cancelled', total: '$32.00' },
    ];

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Confirmed': return 'bg-blue-50 text-blue-600';
            case 'Processing': return 'bg-yellow-50 text-yellow-600';
            case 'Shipped': return 'bg-purple-50 text-purple-600';
            case 'Delivered': return 'bg-green-50 text-green-600';
            case 'Cancelled': return 'bg-red-50 text-red-600';
            default: return 'bg-gray-50 text-gray-600';
        }
    };

    return (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                <h3 className="font-semibold text-gray-900">Recent Orders</h3>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-500 font-medium">
                        <tr>
                            <th className="px-6 py-3">Order ID</th>
                            <th className="px-6 py-3">Customer</th>
                            <th className="px-6 py-3">Date</th>
                            <th className="px-6 py-3">Status</th>
                            <th className="px-6 py-3 text-right">Total</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {orders.map((order) => (
                            <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 font-medium text-gray-900">{order.id}</td>
                                <td className="px-6 py-4 text-gray-600">{order.customer}</td>
                                <td className="px-6 py-4 text-gray-500">{order.date}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                                        {order.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right font-medium text-gray-900">{order.total}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
