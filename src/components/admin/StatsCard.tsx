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
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
                <div className={`p-3.5 rounded-xl ${trendUp === undefined ? 'bg-gray-50 text-gray-600' : 'bg-rose-50 text-rose-600'}`}>
                    <Icon size={24} />
                </div>
                {trend && (
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 ${trendUp
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                            : 'bg-amber-50 text-amber-700 border border-amber-100' // Assuming non-up trend might be neutral/warning or we can add logic for 'down'
                        }`}>
                        {trendUp ? '↑' : '•'} {trend}
                    </span>
                )}
            </div>
            <h3 className="text-gray-500 text-sm font-medium">{title}</h3>
            <p className="text-2xl font-bold text-gray-900 mt-1 tracking-tight">{value}</p>
        </div>
    );
}
