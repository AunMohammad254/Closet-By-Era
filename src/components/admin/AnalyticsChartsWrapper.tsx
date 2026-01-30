'use client';

import dynamic from 'next/dynamic';

// Dynamic import to reduce initial bundle size (~75KB for Recharts)
// This wrapper is needed because ssr: false is not allowed in Server Components
const AnalyticsCharts = dynamic(() => import('@/components/admin/AnalyticsCharts'), {
    ssr: false,
    loading: () => (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-pulse">
            <div className="bg-[#1e293b] p-6 rounded-2xl border border-slate-700/50 h-80"></div>
            <div className="bg-[#1e293b] p-6 rounded-2xl border border-slate-700/50 h-80"></div>
        </div>
    )
});

export default function AnalyticsChartsWrapper() {
    return <AnalyticsCharts />;
}
