import Link from 'next/link';
import { getSystemStats, getAnalyticsData } from '@/actions/super-admin';
import { Users, ShieldCheck, Shield, TrendingUp } from 'lucide-react';
import DashboardCharts from '@/components/super-admin/DashboardCharts';

export const metadata = {
    title: 'Dashboard | Super Admin',
};

export default async function SuperAdminDashboard() {
    // Server-side data fetching
    const [stats, analytics] = await Promise.all([
        getSystemStats(),
        getAnalyticsData()
    ]);

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white">Super Admin Dashboard</h1>
                    <p className="text-slate-400 mt-1">System overview and management</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/30 rounded-xl">
                    <TrendingUp className="w-4 h-4 text-purple-400" />
                    <span className="text-purple-400 text-sm font-medium">Owner Access</span>
                </div>
            </div>

            {/* Client component for interactive charts */}
            <DashboardCharts stats={stats} analytics={analytics} />

            {/* Quick Actions */}
            <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Link
                        href="/super-admin/users"
                        className="flex items-center gap-3 p-4 bg-slate-900/50 rounded-xl hover:bg-slate-900/80 transition-colors border border-slate-700/50"
                    >
                        <Users className="w-5 h-5 text-blue-400" />
                        <span className="text-white">Manage User Roles</span>
                    </Link>
                    <Link
                        href="/super-admin/audit"
                        className="flex items-center gap-3 p-4 bg-slate-900/50 rounded-xl hover:bg-slate-900/80 transition-colors border border-slate-700/50"
                    >
                        <Shield className="w-5 h-5 text-purple-400" />
                        <span className="text-white">View Audit Logs</span>
                    </Link>
                    <Link
                        href="/admin"
                        className="flex items-center gap-3 p-4 bg-slate-900/50 rounded-xl hover:bg-slate-900/80 transition-colors border border-slate-700/50"
                    >
                        <ShieldCheck className="w-5 h-5 text-green-400" />
                        <span className="text-white">Go to Admin Panel</span>
                    </Link>
                </div>
            </div>
        </div>
    );
}
