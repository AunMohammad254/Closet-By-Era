import { getDashboardStats } from '@/actions/analytics';
import StatsCard from '@/components/admin/StatsCard';
import AnalyticsChartsWrapper from '@/components/admin/AnalyticsChartsWrapper';
import RecentOrdersTable from '@/components/admin/RecentOrdersTable';
import QuickActions from '@/components/admin/dashboard/QuickActions';
import LowStockAlert from '@/components/admin/dashboard/LowStockAlert';
import { DollarSign, ShoppingBag, Users, Package } from 'lucide-react';

export default async function AdminDashboardPage() {
    // This action already exists and works
    const stats = await getDashboardStats();

    return (
        <div className="space-y-8">
            {/* Page Title */}
            <div>
                <h1 className="text-2xl font-bold text-slate-100">Dashboard</h1>
                <p className="text-slate-400 text-sm mt-1">Overview of your store's performance.</p>
            </div>

            {/* Quick Actions */}
            <QuickActions />

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
                    value={`${stats.activeOrders}`}
                    icon={ShoppingBag}
                    trend="+12%"
                    trendUp={true}
                />
                <StatsCard
                    title="Active Customers"
                    value={`${stats.totalCustomers}`}
                    icon={Users}
                    trend="+5%"
                    trendUp={true}
                />
                <StatsCard
                    title="Total Products"
                    value={`${stats.totalProducts}`}
                    icon={Package}
                    trend="In Stock"
                    trendUp={true}
                />
            </div>

            {/* Main Layout Grid: Charts + Side Widgets */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Charts Area (2/3 width) */}
                <div className="xl:col-span-2 space-y-8">
                    <AnalyticsChartsWrapper />

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-bold text-slate-100">Recent Orders</h2>
                        </div>
                        <RecentOrdersTable />
                    </div>
                </div>

                {/* Side Widgets (1/3 width) */}
                <div className="space-y-6">
                    {/* Low Stock Widget - Fixed Height */}
                    <div className="h-[420px]">
                        <LowStockAlert />
                    </div>

                    {/* Could add another widget here, e.g., Activity Log */}
                </div>
            </div>
        </div>
    );
}
