import { Suspense } from 'react';
import { DollarSign, ShoppingBag, Package, Users } from 'lucide-react';
import StatsCard from '@/components/admin/StatsCard';
import RecentOrdersTable from '@/components/admin/RecentOrdersTable';
import { getDashboardStats } from '@/actions/analytics';
import AnalyticsChartsWrapper from '@/components/admin/AnalyticsChartsWrapper';


export default async function AdminDashboardPage() {
    const stats = await getDashboardStats();

    return (
        <div className="space-y-8">
            {/* Page Title */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-500 text-sm mt-1">Overview of your store's performance.</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 xl:gap-8">
                <StatsCard
                    title="Total Revenue"
                    value={`PKR ${stats.totalRevenue.toLocaleString()}`}
                    icon={DollarSign}
                    trend="Updated"
                    trendUp={true}
                />
                <StatsCard
                    title="Active Orders"
                    value={stats.activeOrders.toString()}
                    icon={ShoppingBag}
                    trend="Pending processing"
                    trendUp={true}
                />
                <StatsCard
                    title="Total Products"
                    value={stats.totalProducts.toString()}
                    icon={Package}
                />
                <StatsCard
                    title="Total Customers"
                    value={stats.totalCustomers.toString()}
                    icon={Users}
                    trend="Registered"
                    trendUp={true}
                />
            </div>

            {/* Charts & Tables Grid */}
            <div>
                <AnalyticsChartsWrapper />
            </div>

            {/* Recent Orders Section */}
            <div>
                <RecentOrdersTable />
            </div>
        </div>
    );
}
