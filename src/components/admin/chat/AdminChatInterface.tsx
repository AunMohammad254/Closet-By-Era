'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getTickets, getMessages, sendMessage, Ticket, Message } from '@/actions/chat';
import { useAuth } from '@/context/AuthContext';
import { format } from 'date-fns';

export default function AdminChatInterface() {
    const { user } = useAuth();
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const supabase = createClient();

    // Load Tickets
    useEffect(() => {
        getTickets().then(setTickets).catch(console.error);
    }, []);

    // Subscribe to Ticket Updates (New tickets)
    useEffect(() => {
        const channel = supabase
            .channel('admin_tickets')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'support_tickets' },
                () => {
                    getTickets().then(setTickets);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [supabase]);

    // Load Messages for Selected Ticket
    useEffect(() => {
        if (!selectedTicketId) return;

        getMessages(selectedTicketId).then(setMessages);

        const channel = supabase
            .channel(`admin_chat:${selectedTicketId}`)
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'support_messages', filter: `ticket_id=eq.${selectedTicketId}` },
                (payload) => {
                    const newMsg = payload.new as Message;
                    setMessages(prev => [...prev, newMsg]);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [selectedTicketId, supabase]);

    // Scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, selectedTicketId]);


    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || !selectedTicketId) return;

        const msg = input;
        setInput('');

        try {
            await sendMessage(selectedTicketId, msg);
        } catch (e) {
            console.error(e);
            alert('Failed to send');
        }
    };

    return (
        <div className="flex h-[calc(100vh-140px)] bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Sidebar List */}
            <div className="w-80 border-r border-gray-100 flex flex-col">
                <div className="p-4 border-b border-gray-100 bg-gray-50">
                    <h2 className="font-bold text-gray-900">Active Tickets</h2>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {tickets.map((ticket) => (
                        <button
                            key={ticket.id}
                            onClick={() => setSelectedTicketId(ticket.id)}
                            className={`w-full text-left p-4 hover:bg-gray-50 transition-colors border-b border-gray-50 ${selectedTicketId === ticket.id ? 'bg-rose-50 border-l-4 border-l-rose-500' : ''
                                }`}
                        >
                            <div className="flex justify-between items-start mb-1">
                                <span className="font-medium text-gray-900 truncate w-32">User {ticket.user_id.slice(0, 8)}...</span>
                                <span className="text-xs text-gray-400">{format(new Date(ticket.updated_at), 'MMM d, HH:mm')}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${ticket.status === 'open' ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                                <span className="text-xs text-gray-500 capitalize">{ticket.status}</span>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col bg-gray-50/50">
                {selectedTicketId ? (
                    <>
                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            {messages.map((msg) => {
                                const isMe = msg.is_admin_reply; // Admin is viewing
                                return (
                                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[70%] rounded-2xl px-5 py-3 ${isMe
                                                ? 'bg-slate-900 text-white rounded-br-none'
                                                : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none shadow-sm'
                                            }`}>
                                            <p className="text-sm">{msg.message}</p>
                                            <p className={`text-[10px] mt-1 ${isMe ? 'text-slate-400' : 'text-gray-400'}`}>
                                                {format(new Date(msg.created_at), 'HH:mm')}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <div className="p-4 bg-white border-t border-gray-100">
                            <form onSubmit={handleSend} className="flex gap-4">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Type your reply..."
                                    className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all"
                                />
                                <button
                                    type="submit"
                                    disabled={!input.trim()}
                                    className="px-6 py-3 bg-slate-900 text-white font-medium rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-50"
                                >
                                    Reply
                                </button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                        <svg className="w-16 h-16 mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <p>Select a ticket to start chatting</p>
                    </div>
                )}
            </div>
        </div>
    );
}
