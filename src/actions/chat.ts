'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// Type-safe wrapper for tables not yet in generated types
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getSupabaseAny = async () => await createClient() as any;

export interface Ticket {
    id: string;
    user_id: string;
    status: 'open' | 'closed';
    created_at: string;
    updated_at: string;
    last_message?: string;
}

export interface Message {
    id: string;
    ticket_id: string;
    sender_id: string;
    message: string;
    is_admin_reply: boolean;
    created_at: string;
}

export async function createTicket(message: string) {
    const supabase = await getSupabaseAny();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error('Unauthorized');

    // Check for existing open ticket to avoid spam
    const { data: existing } = await supabase
        .from('support_tickets')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'open')
        .single();

    let ticketId = existing?.id;

    if (!ticketId) {
        const { data: newTicket, error } = await supabase
            .from('support_tickets')
            .insert({ user_id: user.id })
            .select()
            .single();

        if (error) throw new Error(error.message);
        ticketId = newTicket.id;
    }

    // Add initial message
    await sendMessage(ticketId, message);

    return ticketId;
}

export async function sendMessage(ticketId: string, message: string) {
    const supabase = await getSupabaseAny();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    // Check if user is admin
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    const isAdmin = profile?.role === 'admin';

    const { error } = await supabase
        .from('support_messages')
        .insert({
            ticket_id: ticketId,
            sender_id: user.id,
            message,
            is_admin_reply: isAdmin
        });

    if (error) throw new Error(error.message);

    revalidatePath('/dashboard/chat');
}

export async function getTickets() {
    const supabase = await getSupabaseAny();
    const { data: tickets, error } = await supabase
        .from('support_tickets')
        .select('*')
        .order('updated_at', { ascending: false });

    if (error) throw new Error(error.message);
    return tickets as Ticket[];
}

export async function getUserActiveTicket() {
    const supabase = await getSupabaseAny();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: ticket } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'open')
        .single();

    return ticket as Ticket;
}

export async function getMessages(ticketId: string) {
    const supabase = await getSupabaseAny();
    const { data: messages, error } = await supabase
        .from('support_messages')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });

    if (error) throw new Error(error.message);
    return messages as Message[];
}
