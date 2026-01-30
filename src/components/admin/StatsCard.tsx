import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
    title: string;
    value: string;
    icon: LucideIcon;
    trend?: string;
    trendUp?: boolean;
}

export default function StatsCard({ title, value, icon: Icon, trend, trendUp }: StatsCardProps) {
    return (
        <div className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] p-6 rounded-2xl border border-slate-700/50 shadow-lg hover:shadow-xl hover:shadow-rose-500/5 transition-all duration-300 group">
            <div className="flex items-center justify-between mb-4">
                <div className={`p-3.5 rounded-xl ${trendUp === undefined ? 'bg-slate-700/50 text-slate-400' : 'bg-rose-500/10 text-rose-400'} group-hover:scale-105 transition-transform`}>
                    <Icon size={24} />
                </div>
                {trend && (
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 ${trendUp
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}>
                        {trendUp ? '↑' : '•'} {trend}
                    </span>
                )}
            </div>
            <h3 className="text-slate-400 text-sm font-medium">{title}</h3>
            <p className="text-2xl font-bold text-slate-100 mt-1 tracking-tight">{value}</p>
        </div>
    );
}
