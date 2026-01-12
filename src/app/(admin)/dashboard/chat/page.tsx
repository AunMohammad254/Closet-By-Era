import AdminChatInterface from '@/components/admin/chat/AdminChatInterface';

export default function AdminChatPage() {
    return (
        <div className="p-6 max-w-[1600px] mx-auto">
            <header className="mb-8">
                <h1 className="text-2xl font-bold text-slate-900">Support Messages</h1>
                <p className="text-gray-500">Manage customer inquiries in real-time</p>
            </header>

            <AdminChatInterface />
        </div>
    );
}
