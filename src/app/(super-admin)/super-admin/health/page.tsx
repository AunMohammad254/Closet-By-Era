'use client';

import { useState, useEffect } from 'react';
import { getSystemHealth, getTableStats, SystemHealth } from '@/actions/system-health';
import {
    Database, Activity, HardDrive, Users, ShoppingCart, AlertTriangle,
    CheckCircle, XCircle, RefreshCw, Loader2, Clock, Server
} from 'lucide-react';

export default function SystemHealthPage() {
    const [health, setHealth] = useState<SystemHealth | null>(null);
    const [tableStats, setTableStats] = useState<{ table: string; count: number }[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

    const loadHealth = async (showRefresh = false) => {
        if (showRefresh) setRefreshing(true);
        else setLoading(true);

        const [healthResult, statsResult] = await Promise.all([
            getSystemHealth(),
            getTableStats()
        ]);

        if (healthResult.success && healthResult.data) {
            setHealth(healthResult.data);
        }
        if (statsResult.success && statsResult.data) {
            setTableStats(statsResult.data);
        }

        setLastUpdate(new Date());
        setLoading(false);
        setRefreshing(false);
    };

    useEffect(() => {
        loadHealth();
        // Refresh every 30 seconds
        const interval = setInterval(() => loadHealth(true), 30000);
        return () => clearInterval(interval);
    }, []);

    const StatusIndicator = ({ ok }: { ok: boolean }) => (
        ok
            ? <CheckCircle className="w-5 h-5 text-emerald-400" />
            : <XCircle className="w-5 h-5 text-rose-400" />
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="animate-spin h-8 w-8 text-rose-500" />
            </div>
        );
    }

    if (!health) {
        return (
            <div className="text-center py-12">
                <AlertTriangle className="w-12 h-12 text-rose-400 mx-auto mb-4" />
                <p className="text-slate-400">Failed to load system health</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-100">System Health</h1>
                    <p className="text-slate-400 text-sm mt-1">Real-time system monitoring</p>
                </div>
                <div className="flex items-center gap-4">
                    {lastUpdate && (
                        <p className="text-xs text-slate-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Updated {lastUpdate.toLocaleTimeString()}
                        </p>
                    )}
                    <button
                        onClick={() => loadHealth(true)}
                        disabled={refreshing}
                        className="px-4 py-2 bg-slate-800/50 text-slate-400 rounded-xl hover:text-slate-200 transition-colors flex items-center gap-2"
                    >
                        <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                </div>
            </div>

            {/* Status Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-[#1e293b] rounded-xl border border-slate-700/50 p-4">
                    <div className="flex items-center gap-3 mb-3">
                        <div className={`p-2 rounded-lg ${health.database.connected ? 'bg-emerald-500/10' : 'bg-rose-500/10'}`}>
                            <Database className={`w-5 h-5 ${health.database.connected ? 'text-emerald-400' : 'text-rose-400'}`} />
                        </div>
                        <div>
                            <p className="text-sm text-slate-400">Database</p>
                            <p className={`text-lg font-bold ${health.database.connected ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {health.database.connected ? 'Connected' : 'Down'}
                            </p>
                        </div>
                    </div>
                    <div className="flex justify-between text-xs text-slate-500">
                        <span>Response: {health.database.response_time_ms}ms</span>
                        <span>~{health.database.db_size_mb}MB</span>
                    </div>
                </div>

                <div className="bg-[#1e293b] rounded-xl border border-slate-700/50 p-4">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 rounded-lg bg-blue-500/10">
                            <HardDrive className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-400">Storage</p>
                            <p className="text-lg font-bold text-slate-200">{health.storage.total_files} files</p>
                        </div>
                    </div>
                    <div className="text-xs text-slate-500">
                        ~{health.storage.total_size_mb.toFixed(1)}MB used
                    </div>
                </div>

                <div className="bg-[#1e293b] rounded-xl border border-slate-700/50 p-4">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 rounded-lg bg-purple-500/10">
                            <Activity className="w-5 h-5 text-purple-400" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-400">Uptime</p>
                            <p className="text-lg font-bold text-slate-200">{health.performance.uptime_percent}%</p>
                        </div>
                    </div>
                    <div className="text-xs text-slate-500">
                        Avg response: {health.performance.avg_response_ms}ms
                    </div>
                </div>

                <div className="bg-[#1e293b] rounded-xl border border-slate-700/50 p-4">
                    <div className="flex items-center gap-3 mb-3">
                        <div className={`p-2 rounded-lg ${health.errors.count_24h === 0 ? 'bg-emerald-500/10' : 'bg-amber-500/10'}`}>
                            <AlertTriangle className={`w-5 h-5 ${health.errors.count_24h === 0 ? 'text-emerald-400' : 'text-amber-400'}`} />
                        </div>
                        <div>
                            <p className="text-sm text-slate-400">Errors (24h)</p>
                            <p className={`text-lg font-bold ${health.errors.count_24h === 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                                {health.errors.count_24h}
                            </p>
                        </div>
                    </div>
                    <div className="text-xs text-slate-500">
                        {health.errors.count_24h === 0 ? 'All systems operational' : 'View logs for details'}
                    </div>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-[#1e293b] rounded-xl border border-slate-700/50 p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <ShoppingCart className="w-5 h-5 text-rose-400" />
                        <h3 className="font-semibold text-slate-200">Orders</h3>
                    </div>
                    <div className="space-y-3">
                        <div className="flex justify-between">
                            <span className="text-slate-400">Today</span>
                            <span className="font-medium text-slate-200">{health.orders.today}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-400">Pending</span>
                            <span className="font-medium text-amber-400">{health.orders.pending}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-400">Processing</span>
                            <span className="font-medium text-blue-400">{health.orders.processing}</span>
                        </div>
                    </div>
                </div>

                <div className="bg-[#1e293b] rounded-xl border border-slate-700/50 p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <Users className="w-5 h-5 text-blue-400" />
                        <h3 className="font-semibold text-slate-200">Users</h3>
                    </div>
                    <div className="space-y-3">
                        <div className="flex justify-between">
                            <span className="text-slate-400">Total</span>
                            <span className="font-medium text-slate-200">{health.users.total}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-400">Active Today</span>
                            <span className="font-medium text-emerald-400">{health.users.active_today}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-400">Admins</span>
                            <span className="font-medium text-purple-400">{health.users.admins}</span>
                        </div>
                    </div>
                </div>

                <div className="bg-[#1e293b] rounded-xl border border-slate-700/50 p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <Server className="w-5 h-5 text-emerald-400" />
                        <h3 className="font-semibold text-slate-200">Database Tables</h3>
                    </div>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                        {tableStats.map(stat => (
                            <div key={stat.table} className="flex justify-between text-sm">
                                <span className="text-slate-400">{stat.table}</span>
                                <span className="font-mono text-slate-300">{stat.count.toLocaleString()}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Health Check Status */}
            <div className="bg-[#1e293b] rounded-xl border border-slate-700/50 p-5">
                <h3 className="font-semibold text-slate-200 mb-4">Service Status</h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="flex items-center gap-3 p-3 bg-slate-800/30 rounded-lg">
                        <StatusIndicator ok={health.database.connected} />
                        <div>
                            <p className="font-medium text-slate-200">Database</p>
                            <p className="text-xs text-slate-500">PostgreSQL</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-slate-800/30 rounded-lg">
                        <StatusIndicator ok={true} />
                        <div>
                            <p className="font-medium text-slate-200">Authentication</p>
                            <p className="text-xs text-slate-500">Supabase Auth</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-slate-800/30 rounded-lg">
                        <StatusIndicator ok={true} />
                        <div>
                            <p className="font-medium text-slate-200">Storage</p>
                            <p className="text-xs text-slate-500">Supabase Storage</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-slate-800/30 rounded-lg">
                        <StatusIndicator ok={true} />
                        <div>
                            <p className="font-medium text-slate-200">Edge Functions</p>
                            <p className="text-xs text-slate-500">Deno Runtime</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
