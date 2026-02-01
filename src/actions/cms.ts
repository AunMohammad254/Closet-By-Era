'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { ActionResult } from '@/types/shared';

// BANNERS
export interface Banner {
    id: string;
    title: string;
    image_url: string;
    link_url: string | null;
    position: 'hero' | 'sidebar' | 'footer';
    is_active: boolean;
    starts_at: string | null;
    ends_at: string | null;
    created_at: string;
}

export async function getBanners(): Promise<ActionResult<Banner[]>> {
    const supabase = await createClient();
    try {
        const { data, error } = await (supabase as any)
            .from('cms_banners')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return { success: true, data: data || [] };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function createBanner(data: Omit<Banner, 'id' | 'created_at'>): Promise<ActionResult<{ id: string }>> {
    const supabase = await createClient();
    try {
        const { data: banner, error } = await (supabase as any)
            .from('cms_banners')
            .insert(data)
            .select('id')
            .single();

        if (error) throw error;
        revalidatePath('/admin/cms');
        return { success: true, data: { id: banner.id } };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function deleteBanner(id: string): Promise<ActionResult> {
    const supabase = await createClient();
    try {
        const { error } = await (supabase as any)
            .from('cms_banners')
            .delete()
            .eq('id', id);

        if (error) throw error;
        revalidatePath('/admin/cms');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

// POPUPS
export interface Popup {
    id: string;
    title: string;
    content: string;
    image_url: string | null;
    trigger: 'exit_intent' | 'scroll' | 'timer' | 'page_load';
    trigger_value: number | null;
    show_on_pages: string[] | null;
    is_active: boolean;
    created_at: string;
}

export async function getPopups(): Promise<ActionResult<Popup[]>> {
    const supabase = await createClient();
    try {
        const { data, error } = await (supabase as any)
            .from('cms_popups')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return { success: true, data: data || [] };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function createPopup(data: Omit<Popup, 'id' | 'created_at'>): Promise<ActionResult<{ id: string }>> {
    const supabase = await createClient();
    try {
        const { data: popup, error } = await (supabase as any)
            .from('cms_popups')
            .insert(data)
            .select('id')
            .single();

        if (error) throw error;
        revalidatePath('/admin/cms');
        return { success: true, data: { id: popup.id } };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function togglePopup(id: string, isActive: boolean): Promise<ActionResult> {
    const supabase = await createClient();
    try {
        const { error } = await (supabase as any)
            .from('cms_popups')
            .update({ is_active: isActive })
            .eq('id', id);

        if (error) throw error;
        revalidatePath('/admin/cms');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function deletePopup(id: string): Promise<ActionResult> {
    const supabase = await createClient();
    try {
        const { error } = await (supabase as any)
            .from('cms_popups')
            .delete()
            .eq('id', id);

        if (error) throw error;
        revalidatePath('/admin/cms');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

// FAQs
export interface FAQ {
    id: string;
    question: string;
    answer: string;
    category: string | null;
    sort_order: number;
    is_active: boolean;
    created_at: string;
}

export async function getFAQs(): Promise<ActionResult<FAQ[]>> {
    const supabase = await createClient();
    try {
        const { data, error } = await (supabase as any)
            .from('cms_faqs')
            .select('*')
            .order('sort_order', { ascending: true });

        if (error) throw error;
        return { success: true, data: data || [] };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function createFAQ(data: Omit<FAQ, 'id' | 'created_at'>): Promise<ActionResult<{ id: string }>> {
    const supabase = await createClient();
    try {
        const { data: faq, error } = await (supabase as any)
            .from('cms_faqs')
            .insert(data)
            .select('id')
            .single();

        if (error) throw error;
        revalidatePath('/admin/cms');
        return { success: true, data: { id: faq.id } };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function updateFAQ(id: string, data: Partial<FAQ>): Promise<ActionResult> {
    const supabase = await createClient();
    try {
        const { error } = await (supabase as any)
            .from('cms_faqs')
            .update(data)
            .eq('id', id);

        if (error) throw error;
        revalidatePath('/admin/cms');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function deleteFAQ(id: string): Promise<ActionResult> {
    const supabase = await createClient();
    try {
        const { error } = await (supabase as any)
            .from('cms_faqs')
            .delete()
            .eq('id', id);

        if (error) throw error;
        revalidatePath('/admin/cms');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
