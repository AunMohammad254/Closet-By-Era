'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { createTicket, sendMessage, getActiveChat, getMessages, Message } from '@/actions/chat';
import { CHAT_POLL_MS, mergeMessages } from '@/lib/chat-messages';

/** Local "HH:mm" (24h). The widget is on every shop page, so no date library for one format. */
function formatTime(iso: string): string {
    return new Date(iso).toTimeString().slice(0, 5);
}

export default function ChatWidget() {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [ticketId, setTicketId] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const supabase = createClient();

    // Load active ticket on mount
    useEffect(() => {
        if (!user) return;

        const loadChat = async () => {
            try {
                const chat = await getActiveChat();
                if (chat) {
                    setTicketId(chat.ticket.id);
                    setMessages(chat.messages);
                }
            } catch (e) {
                console.error(e);
            }
        };
        loadChat();
    }, [user]);

    // Subscribe to new messages
    useEffect(() => {
        if (!ticketId) return;

        const channel = supabase
            .channel(`chat:${ticketId}`)
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'support_messages', filter: `ticket_id=eq.${ticketId}` },
                (payload) => {
                    setMessages(prev => mergeMessages(prev, [payload.new as Message]));
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [ticketId, supabase]);

    // Poll while open, so replies arrive even without realtime.
    useEffect(() => {
        if (!ticketId || !isOpen) return;
        const timer = setInterval(() => {
            getMessages(ticketId)
                .then(msgs => setMessages(prev => mergeMessages(prev, msgs)))
                .catch(() => { /* next tick retries */ });
        }, CHAT_POLL_MS);
        return () => clearInterval(timer);
    }, [ticketId, isOpen]);

    // Scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isOpen]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || !user) return;

        const msg = input;
        setInput('');

        try {
            let id = ticketId;
            if (!id) {
                id = await createTicket(msg);
                setTicketId(id);
            } else {
                await sendMessage(id, msg);
            }
            // Show the sent message (and any reply) without waiting for realtime.
            const msgs = await getMessages(id);
            setMessages(prev => mergeMessages(prev, msgs));
        } catch (e) {
            console.error('Failed to send:', e);
            setInput(msg);
            alert('Failed to send message');
        }
    };

    if (!user) return null; // Hide for non-logged in users for now

    return (
        <div className="fixed bottom-6 right-6 z-40">
            {/* Chat Window */}
            {isOpen && (
                <div className="absolute bottom-16 right-0 w-80 sm:w-96 h-[500px] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-800 flex flex-col overflow-hidden animate-fade-in-up">
                    {/* Header */}
                    <div className="bg-slate-900 px-6 py-4 flex items-center justify-between">
                        <div>
                            <h3 className="font-bold text-white">Support Chat</h3>
                            <p className="text-xs text-slate-300">We usually reply in a few minutes</p>
                        </div>
                        <button type="button" onClick={() => setIsOpen(false)} aria-label="Close chat" className="text-slate-400 hover:text-white">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50" role="log" aria-label="Chat messages">
                        {messages.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-gray-500 text-sm p-4 text-center">
                                <p>On call! 👋<br />how can we help you today?</p>
                            </div>
                        ) : (
                            messages.map((msg) => {
                                const isMe = !msg.is_admin_reply;
                                return (
                                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${isMe
                                                ? 'bg-slate-900 text-white rounded-br-none'
                                                : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none shadow-sm'
                                            }`}>
                                            <p>{msg.message}</p>
                                            <p className={`text-[10px] mt-1 ${isMe ? 'text-slate-400' : 'text-gray-400'}`}>
                                                {formatTime(msg.created_at)}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <form onSubmit={handleSend} className="p-4 bg-white border-t border-gray-100">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Type a message..."
                                aria-label="Message"
                                maxLength={2000}
                                className="flex-1 px-4 py-2 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                            />
                            <button
                                type="submit"
                                disabled={!input.trim()}
                                aria-label="Send message"
                                className="p-2 bg-slate-900 text-white rounded-full hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <svg className="w-5 h-5 translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                </svg>
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Toggle Button */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                aria-label={isOpen ? 'Close support chat' : 'Open support chat'}
                aria-expanded={isOpen}
                className={`w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all duration-300 ${isOpen ? 'bg-slate-800 rotate-90' : 'bg-slate-900 hover:scale-110'
                    }`}
            >
                {isOpen ? (
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                ) : (
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                )}
            </button>
        </div>
    );
}
