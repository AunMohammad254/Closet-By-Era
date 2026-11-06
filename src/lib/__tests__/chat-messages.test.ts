import { mergeMessages } from '../chat-messages';
import type { Message } from '@/actions/chat';

describe('mergeMessages', () => {
    const createMessage = (id: string, created_at: string): Message => ({
        id,
        ticket_id: 'ticket-1',
        sender_id: 'user-1',
        message: `Message ${id}`,
        is_admin_reply: false,
        created_at
    });

    it('returns empty array when both inputs are empty', () => {
        expect(mergeMessages([], [])).toEqual([]);
    });

    it('returns incoming messages when current is empty', () => {
        const incoming = [createMessage('1', '2023-01-01T10:00:00Z')];
        expect(mergeMessages([], incoming)).toEqual(incoming);
    });

    it('returns exact current reference when incoming has no new messages', () => {
        const current = [createMessage('1', '2023-01-01T10:00:00Z')];
        const incoming = [createMessage('1', '2023-01-01T10:00:00Z')];
        const result = mergeMessages(current, incoming);

        expect(result).toBe(current);
    });

    it('deduplicates messages and sorts chronologically', () => {
        const msg1 = createMessage('1', '2023-01-01T10:00:00Z');
        const msg2 = createMessage('2', '2023-01-01T10:05:00Z');
        const msg3 = createMessage('3', '2023-01-01T09:55:00Z');

        const current = [msg2, msg1]; // Not sorted initially
        const incoming = [msg1, msg3]; // Includes existing (msg1) and new (msg3)

        const result = mergeMessages(current, incoming);

        expect(result).toEqual([msg3, msg1, msg2]);
    });

    it('handles incoming messages that are already in current', () => {
        const msg1 = createMessage('1', '2023-01-01T10:00:00Z');
        const msg2 = createMessage('2', '2023-01-01T10:05:00Z');

        const current = [msg1];
        const incoming = [msg1, msg2];

        const result = mergeMessages(current, incoming);

        expect(result).toEqual([msg1, msg2]);
    });
});
