'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getTickets, getMessages, sendMessage, Ticket, Message } from '@/actions/chat';
import { useAuth } from '@/context/AuthContext';
import { format } from 'date-fns';
import { MessageCircle, Send } from 'lucide-react';

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
        <div className="flex h-[calc(100vh-200px)] bg-[#1e293b] rounded-xl border border-slate-700/50 overflow-hidden">
            {/* Sidebar List */}
            <div className="w-80 border-r border-slate-700/50 flex flex-col">
                <div className="p-4 border-b border-slate-700/50 bg-slate-800/50">
                    <h2 className="font-bold text-slate-200">Active Tickets</h2>
                    <p className="text-xs text-slate-500 mt-0.5">{tickets.length} conversations</p>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {tickets.length === 0 ? (
                        <div className="p-6 text-center">
                            <MessageCircle className="w-10 h-10 mx-auto text-slate-600 mb-2" />
                            <p className="text-slate-500 text-sm">No support tickets</p>
                        </div>
                    ) : (
                        tickets.map((ticket) => (
                            <button
                                key={ticket.id}
                                onClick={() => setSelectedTicketId(ticket.id)}
                                className={`w-full text-left p-4 hover:bg-slate-800/50 transition-colors border-b border-slate-700/30 ${selectedTicketId === ticket.id
                                        ? 'bg-rose-500/10 border-l-4 border-l-rose-500'
                                        : ''
                                    }`}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <span className="font-medium text-slate-200 truncate w-32">
                                        User {ticket.user_id.slice(0, 8)}...
                                    </span>
                                    <span className="text-xs text-slate-500">
                                        {format(new Date(ticket.updated_at), 'MMM d, HH:mm')}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`w-2 h-2 rounded-full ${ticket.status === 'open' ? 'bg-emerald-400' : 'bg-slate-500'
                                        }`} />
                                    <span className="text-xs text-slate-400 capitalize">{ticket.status}</span>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col bg-slate-800/30">
                {selectedTicketId ? (
                    <>
                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            {messages.map((msg) => {
                                const isMe = msg.is_admin_reply; // Admin is viewing
                                return (
                                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[70%] rounded-2xl px-5 py-3 ${isMe
                                            ? 'bg-rose-500 text-white rounded-br-none'
                                            : 'bg-slate-700 text-slate-200 rounded-bl-none'
                                            }`}>
                                            <p className="text-sm">{msg.message}</p>
                                            <p className={`text-[10px] mt-1 ${isMe ? 'text-rose-200' : 'text-slate-400'}`}>
                                                {format(new Date(msg.created_at), 'HH:mm')}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <div className="p-4 bg-slate-800/50 border-t border-slate-700/50">
                            <form onSubmit={handleSend} className="flex gap-4">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Type your reply..."
                                    className="flex-1 px-4 py-3 bg-slate-800/50 border border-slate-700/50 text-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500/50 transition-all placeholder:text-slate-500"
                                />
                                <button
                                    type="submit"
                                    disabled={!input.trim()}
                                    className="inline-flex items-center px-6 py-3 bg-rose-500 text-white font-medium rounded-xl hover:bg-rose-600 transition-colors disabled:opacity-50 shadow-lg shadow-rose-500/20"
                                >
                                    <Send className="w-4 h-4 mr-2" />
                                    Reply
                                </button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
                        <MessageCircle className="w-16 h-16 mb-4 text-slate-600" />
                        <p className="text-lg font-medium text-slate-400">Select a ticket</p>
                        <p className="text-sm text-slate-500">Choose a conversation from the sidebar</p>
                    </div>
                )}
            </div>
        </div>
    );
}
