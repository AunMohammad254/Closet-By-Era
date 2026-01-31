'use client';

import { useState, useEffect } from 'react';
import { getAuditLogs, type AuditLog } from '@/actions/super-admin';
import { ScrollText, Shield, User, Package, ShoppingCart, Settings, Loader2, Filter } from 'lucide-react';

export default function AuditLogsPage() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionFilter, setActionFilter] = useState<string>('all');

    useEffect(() => {
        loadLogs();
    }, []);

    async function loadLogs() {
        try {
            const data = await getAuditLogs({ limit: 200 });
            setLogs(data);
        } catch (error) {
            console.error('Failed to load audit logs:', error);
        } finally {
            setLoading(false);
        }
    }

    const getActionIcon = (action: string) => {
        if (action.includes('role')) return <Shield className="w-4 h-4" />;
        if (action.includes('user') || action.includes('customer')) return <User className="w-4 h-4" />;
        if (action.includes('product')) return <Package className="w-4 h-4" />;
        if (action.includes('order')) return <ShoppingCart className="w-4 h-4" />;
        return <Settings className="w-4 h-4" />;
    };

    const getActionColor = (action: string) => {
        if (action.includes('delete')) return 'text-red-400 bg-red-500/10 border-red-500/30';
        if (action.includes('create') || action.includes('add')) return 'text-green-400 bg-green-500/10 border-green-500/30';
        if (action.includes('update') || action.includes('change')) return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
        return 'text-purple-400 bg-purple-500/10 border-purple-500/30';
    };

    const formatDetails = (details: unknown): string | null => {
        if (details && typeof details === 'object') {
            return JSON.stringify(details, null, 2);
        }
        return null;
    };

    const uniqueActions = [...new Set(logs.map(l => l.action))];

    const filteredLogs = actionFilter === 'all'
        ? logs
        : logs.filter(l => l.action === actionFilter);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                    <ScrollText className="w-8 h-8 text-purple-400" />
                    Audit Logs
                </h1>
                <p className="text-slate-400 mt-1">Track all administrative actions</p>
            </div>

            {/* Filter */}
            <div className="flex items-center gap-4">
                <Filter className="w-5 h-5 text-slate-400" />
                <select
                    value={actionFilter}
                    onChange={(e) => setActionFilter(e.target.value)}
                    className="px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                    <option value="all">All Actions</option>
                    {uniqueActions.map(action => (
                        <option key={action} value={action}>{action.replace(/_/g, ' ')}</option>
                    ))}
                </select>
                <span className="text-slate-400 text-sm">
                    Showing {filteredLogs.length} of {logs.length} entries
                </span>
            </div>

            {/* Logs List */}
            <div className="space-y-3">
                {filteredLogs.length === 0 ? (
                    <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-12 text-center">
                        <ScrollText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                        <p className="text-slate-400">No audit logs found</p>
                    </div>
                ) : (
                    filteredLogs.map((log) => (
                        <div
                            key={log.id}
                            className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-4 hover:bg-slate-800/70 transition-colors"
                        >
                            <div className="flex items-start gap-4">
                                <div className={`p-2 rounded-lg border ${getActionColor(log.action)}`}>
                                    {getActionIcon(log.action)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`px-2 py-0.5 rounded text-xs font-medium border ${getActionColor(log.action)}`}>
                                            {log.action.replace(/_/g, ' ')}
                                        </span>
                                        <span className="text-slate-500 text-xs">
                                            {log.entity}
                                            {log.entity_id && ` #${log.entity_id.slice(0, 8)}...`}
                                        </span>
                                    </div>
                                    {formatDetails(log.details) && (
                                        <pre className="text-sm text-slate-300 mt-2 bg-slate-900/50 rounded-lg p-3 font-mono text-xs overflow-x-auto whitespace-pre-wrap">
                                            {formatDetails(log.details)}
                                        </pre>
                                    )}
                                    <p className="text-slate-500 text-xs mt-2">
                                        {new Date(log.created_at).toLocaleString()}
                                        {log.admin_email && ` • by ${log.admin_email}`}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
