import AdminChatInterface from '@/components/admin/chat/AdminChatInterface';

export const metadata = {
    title: 'Support Chat | Admin Dashboard',
};

export default function AdminChatPage() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-100">Support Chat</h1>
                <p className="text-slate-400 text-sm mt-1">Manage customer inquiries in real-time.</p>
            </div>

            {/* Chat Interface */}
            <AdminChatInterface />
        </div>
    );
}
