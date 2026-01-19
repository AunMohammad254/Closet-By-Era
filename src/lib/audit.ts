import { createClient } from '@/lib/supabase/server';
import { Json } from '@/types/supabase';

interface AuditLogParams {
    action: string;
    entity: string;
    entityId?: string;
    details?: Json;
}

export async function logAdminAction({ action, entity, entityId, details }: AuditLogParams) {
    try {
        const supabase = await createClient();

        // Get current user
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            console.error('Audit Log Error: No authenticated user found');
            return;
        }

        const { error } = await supabase.from('audit_logs').insert({
            admin_id: user.id,
            action,
            entity,
            entity_id: entityId,
            details,
            // ip_address can be hard to get in server actions reliably without headers(), 
            // but we can try if needed or leave it null for now.
        });

        if (error) {
            console.error('Audit Log Insert Error:', error);
        }
    } catch (err) {
        console.error('Audit Log Unexpected Error:', err);
    }
}
