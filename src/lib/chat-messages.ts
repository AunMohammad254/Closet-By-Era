import type { Message } from '@/actions/chat';

/** How often an open chat checks for new messages (realtime may not be enabled). */
export const CHAT_POLL_MS = 10_000;

/** Adds messages not already in the list, oldest first. */
export function mergeMessages(current: Message[], incoming: Message[]): Message[] {
    const known = new Set(current.map(m => m.id));
    const added = incoming.filter(m => !known.has(m.id));
    if (added.length === 0) return current;
    return [...current, ...added].sort((a, b) => a.created_at.localeCompare(b.created_at));
}
