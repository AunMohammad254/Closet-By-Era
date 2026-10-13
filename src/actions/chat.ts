'use server';

import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/server';
import { getAdminContext, getSessionUser, getStaffContext } from '@/lib/auth';

export interface Ticket {
    id: string;
    user_id: string;
    status: 'open' | 'closed';
    created_at: string;
    updated_at: string;
    last_message?: string;
    customer_name?: string;
    customer_email?: string;
}

export interface Message {
    id: string;
    ticket_id: string;
    sender_id: string;
    message: string;
    is_admin_reply: boolean;
    created_at: string;
}

const MAX_MESSAGE_LENGTH = 2000;

export async function createTicket(message: string) {
    const session = await getSessionUser();
    if (!session) throw new Error('Unauthorized');
    const { supabase, user } = session;

    // Check for existing open ticket to avoid spam
    const { data: existing } = await supabase
        .from('support_tickets')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'open')
        .maybeSingle();

    let ticketId = existing?.id;

    if (!ticketId) {
        const { data: newTicket, error } = await supabase
            .from('support_tickets')
            .insert({ user_id: user.id })
            .select('id')
            .single();

        if (error) throw new Error(error.message);
        ticketId = newTicket.id;
    }

    // Add initial message
    await sendMessage(ticketId, message);

    return ticketId;
}

/**
 * Customers may only post to their own tickets; staff may reply to any.
 * Authorization is checked here, then writes go through the service role
 * (support_* RLS only grants access to the ticket owner).
 */
export async function sendMessage(ticketId: string, message: string) {
    const text = message.trim();
    if (!text || text.length > MAX_MESSAGE_LENGTH) throw new Error('Invalid message');

    const session = await getSessionUser();
    if (!session) throw new Error('Unauthorized');

    const isAdmin = (await getStaffContext(session)) !== null;
    const admin = createAdminClient();

    const { data: ticket } = await admin
        .from('support_tickets')
        .select('id, user_id')
        .eq('id', ticketId)
        .maybeSingle();

    if (!ticket || (!isAdmin && ticket.user_id !== session.user.id)) {
        throw new Error('Ticket not found');
    }

    const { error } = await admin
        .from('support_messages')
        .insert({
            ticket_id: ticketId,
            sender_id: session.user.id,
            message: text,
            is_admin_reply: isAdmin
        });

    if (error) throw new Error(error.message);

    await admin
        .from('support_tickets')
        // A customer writing to a closed ticket reopens it.
        .update({ last_message: text.slice(0, 200), updated_at: new Date().toISOString(), ...(isAdmin ? {} : { status: 'open' }) })
        .eq('id', ticketId);

    revalidatePath('/admin/chat');
    revalidatePath('/dashboard/chat');
}

/** Staff inbox: every ticket, with who opened it. */
export async function getTickets() {
    if (!(await getAdminContext())) throw new Error('Forbidden');

    const admin = createAdminClient();
    const { data: tickets, error } = await admin
        .from('support_tickets')
        .select('*')
        .order('updated_at', { ascending: false });

    if (error) throw new Error(error.message);

    const userIds = [...new Set(tickets.map(t => t.user_id).filter((id): id is string => Boolean(id)))];
    const { data: customers } = userIds.length
        ? await admin.from('customers').select('auth_id, first_name, last_name, email').in('auth_id', userIds)
        : { data: [] };
    const byUser = new Map((customers ?? []).map(c => [c.auth_id, c]));

    return tickets.map(t => {
        const c = t.user_id ? byUser.get(t.user_id) : undefined;
        const name = c ? [c.first_name, c.last_name].filter(Boolean).join(' ') : '';
        return { ...t, customer_name: name || undefined, customer_email: c?.email ?? undefined } as Ticket;
    });
}

/** Staff: mark a ticket closed (or reopen it). */
export async function setTicketStatus(ticketId: string, status: 'open' | 'closed') {
    if (!(await getAdminContext())) throw new Error('Forbidden');

    const { error } = await createAdminClient()
        .from('support_tickets')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', ticketId);

    if (error) throw new Error(error.message);
    revalidatePath('/admin/chat');
}

/**
 * The shopper's open ticket and its messages, in one round trip (the chat
 * widget loads this on every page; the browser sends Server Actions one at a time).
 */
export async function getActiveChat(): Promise<{ ticket: Ticket; messages: Message[] } | null> {
    const session = await getSessionUser();
    if (!session) return null;

    const { data: ticket } = await session.supabase
        .from('support_tickets')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('status', 'open')
        .maybeSingle();

    if (!ticket) return null;

    // The shopper's own ticket: RLS lets the owner read its messages.
    const { data: messages, error } = await session.supabase
        .from('support_messages')
        .select('*')
        .eq('ticket_id', ticket.id)
        .order('created_at', { ascending: true });

    if (error) throw new Error(error.message);
    return { ticket: ticket as Ticket, messages: messages as Message[] };
}

export async function getMessages(ticketId: string) {
    const session = await getSessionUser();
    if (!session) throw new Error('Unauthorized');

    const isAdmin = (await getStaffContext(session)) !== null;
    // Staff read through the service role; customers through RLS (own tickets only).
    const client = isAdmin ? createAdminClient() : session.supabase;

    const { data: messages, error } = await client
        .from('support_messages')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });

    if (error) throw new Error(error.message);
    return messages as Message[];
}
