import SuperAdminSidebar from '@/components/super-admin/SuperAdminSidebar';

export default function SuperAdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900">
            <SuperAdminSidebar />
            <main className="lg:ml-72 min-h-screen">
                <div className="p-4 lg:p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
