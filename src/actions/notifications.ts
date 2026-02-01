'use server';

import { createClient } from '@/lib/supabase/server';

// Types for notifications (table will exist after migration is applied)
interface Notification {
    id: string;
    type: 'order' | 'stock' | 'review' | 'return' | 'system';
    title: string;
    message: string;
    entity_id: string | null;
    entity_type: string | null;
    is_read: boolean;
    created_at: string;
}

/**
 * Get admin notifications
 * Note: Requires migration 20260201140000_admin_improvements.sql to be applied
 */
export async function getAdminNotifications(options?: {
    limit?: number;
    unreadOnly?: boolean;
}): Promise<Notification[]> {
    const supabase = await createClient();

    try {
        // Using any to handle table that may not exist in types yet
        let query = (supabase as any)
            .from('admin_notifications')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(options?.limit || 20);

        if (options?.unreadOnly) {
            query = query.eq('is_read', false);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching notifications:', error);
            return [];
        }

        return (data || []) as Notification[];
    } catch {
        // Table may not exist yet
        return [];
    }
}

/**
 * Get unread notification count
 */
export async function getUnreadNotificationCount(): Promise<number> {
    const supabase = await createClient();

    try {
        const { count, error } = await (supabase as any)
            .from('admin_notifications')
            .select('*', { count: 'exact', head: true })
            .eq('is_read', false);

        if (error) {
            console.error('Error fetching unread count:', error);
            return 0;
        }

        return count || 0;
    } catch {
        return 0;
    }
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(notificationId: string): Promise<{ success: boolean }> {
    const supabase = await createClient();

    try {
        const { error } = await (supabase as any)
            .from('admin_notifications')
            .update({ is_read: true })
            .eq('id', notificationId);

        if (error) {
            console.error('Error marking notification as read:', error);
            return { success: false };
        }

        return { success: true };
    } catch {
        return { success: false };
    }
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsAsRead(): Promise<{ success: boolean }> {
    const supabase = await createClient();

    try {
        const { error } = await (supabase as any)
            .from('admin_notifications')
            .update({ is_read: true })
            .eq('is_read', false);

        if (error) {
            console.error('Error marking all notifications as read:', error);
            return { success: false };
        }

        return { success: true };
    } catch {
        return { success: false };
    }
}

/**
 * Create a notification (internal use / triggered by other actions)
 */
export async function createNotification(notification: {
    type: 'order' | 'stock' | 'review' | 'return' | 'system';
    title: string;
    message: string;
    entity_id?: string;
    entity_type?: string;
}): Promise<{ success: boolean }> {
    const supabase = await createClient();

    try {
        const { error } = await (supabase as any)
            .from('admin_notifications')
            .insert({
                type: notification.type,
                title: notification.title,
                message: notification.message,
                entity_id: notification.entity_id || null,
                entity_type: notification.entity_type || null
            });

        if (error) {
            console.error('Error creating notification:', error);
            return { success: false };
        }

        return { success: true };
    } catch {
        return { success: false };
    }
}
