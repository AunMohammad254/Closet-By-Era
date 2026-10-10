'use server';

import { revalidatePath } from 'next/cache';
import { ActionResult } from '@/types/shared';
import { getAdminContext, FORBIDDEN } from '@/lib/auth';
import type { Database } from '@/types/supabase';

// The admin UI uses the field names below; the tables are `banners`,
// `popups` and `faqs` (there are no cms_* tables), so map between them here.

type Tables = Database['public']['Tables'];

function errorMessage(error: unknown): string {
    return (error as { message?: string })?.message ?? 'Unexpected error';
}

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

function toBanner(row: Tables['banners']['Row']): Banner {
    return {
        id: row.id,
        title: row.title,
        image_url: row.image_url ?? '',
        link_url: row.link_url,
        position: (row.position as Banner['position']) ?? 'hero',
        is_active: row.is_active ?? false,
        starts_at: row.starts_at,
        ends_at: row.ends_at,
        created_at: row.created_at ?? '',
    };
}

export async function getBanners(): Promise<ActionResult<Banner[]>> {
    const ctx = await getAdminContext();
    if (!ctx) return { success: false, error: FORBIDDEN };

    const { data, error } = await ctx.supabase
        .from('banners')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) return { success: false, error: errorMessage(error) };
    return { success: true, data: data.map(toBanner) };
}

export async function createBanner(data: Omit<Banner, 'id' | 'created_at'>): Promise<ActionResult<{ id: string }>> {
    const ctx = await getAdminContext();
    if (!ctx) return { success: false, error: FORBIDDEN };

    const { data: banner, error } = await ctx.supabase
        .from('banners')
        .insert({
            title: data.title,
            image_url: data.image_url,
            link_url: data.link_url,
            position: data.position,
            is_active: data.is_active,
            starts_at: data.starts_at,
            ends_at: data.ends_at,
        })
        .select('id')
        .single();

    if (error) return { success: false, error: errorMessage(error) };
    revalidatePath('/admin/cms');
    return { success: true, data: { id: banner.id } };
}

export async function deleteBanner(id: string): Promise<ActionResult> {
    const ctx = await getAdminContext();
    if (!ctx) return { success: false, error: FORBIDDEN };

    const { error } = await ctx.supabase.from('banners').delete().eq('id', id);

    if (error) return { success: false, error: errorMessage(error) };
    revalidatePath('/admin/cms');
    return { success: true };
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

function toPopup(row: Tables['popups']['Row']): Popup {
    return {
        id: row.id,
        title: row.title,
        content: row.content,
        image_url: row.image_url,
        trigger: (row.trigger_type as Popup['trigger']) ?? 'page_load',
        trigger_value: row.trigger_value,
        show_on_pages: row.target_pages,
        is_active: row.is_active ?? false,
        created_at: row.created_at,
    };
}

export async function getPopups(): Promise<ActionResult<Popup[]>> {
    const ctx = await getAdminContext();
    if (!ctx) return { success: false, error: FORBIDDEN };

    const { data, error } = await ctx.supabase
        .from('popups')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) return { success: false, error: errorMessage(error) };
    return { success: true, data: data.map(toPopup) };
}

export async function createPopup(data: Omit<Popup, 'id' | 'created_at'>): Promise<ActionResult<{ id: string }>> {
    const ctx = await getAdminContext();
    if (!ctx) return { success: false, error: FORBIDDEN };

    const { data: popup, error } = await ctx.supabase
        .from('popups')
        .insert({
            title: data.title,
            content: data.content,
            image_url: data.image_url,
            trigger_type: data.trigger,
            trigger_value: data.trigger_value,
            target_pages: data.show_on_pages,
            is_active: data.is_active,
        })
        .select('id')
        .single();

    if (error) return { success: false, error: errorMessage(error) };
    revalidatePath('/admin/cms');
    return { success: true, data: { id: popup.id } };
}

export async function togglePopup(id: string, isActive: boolean): Promise<ActionResult> {
    const ctx = await getAdminContext();
    if (!ctx) return { success: false, error: FORBIDDEN };

    const { error } = await ctx.supabase.from('popups').update({ is_active: isActive }).eq('id', id);

    if (error) return { success: false, error: errorMessage(error) };
    revalidatePath('/admin/cms');
    return { success: true };
}

export async function deletePopup(id: string): Promise<ActionResult> {
    const ctx = await getAdminContext();
    if (!ctx) return { success: false, error: FORBIDDEN };

    const { error } = await ctx.supabase.from('popups').delete().eq('id', id);

    if (error) return { success: false, error: errorMessage(error) };
    revalidatePath('/admin/cms');
    return { success: true };
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

function toFAQ(row: Tables['faqs']['Row']): FAQ {
    return {
        id: row.id,
        question: row.question,
        answer: row.answer,
        category: row.category,
        sort_order: row.display_order ?? 0,
        is_active: row.is_active ?? false,
        created_at: row.created_at,
    };
}

export async function getFAQs(): Promise<ActionResult<FAQ[]>> {
    const ctx = await getAdminContext();
    if (!ctx) return { success: false, error: FORBIDDEN };

    const { data, error } = await ctx.supabase
        .from('faqs')
        .select('*')
        .order('display_order', { ascending: true });

    if (error) return { success: false, error: errorMessage(error) };
    return { success: true, data: data.map(toFAQ) };
}

export async function createFAQ(data: Omit<FAQ, 'id' | 'created_at'>): Promise<ActionResult<{ id: string }>> {
    const ctx = await getAdminContext();
    if (!ctx) return { success: false, error: FORBIDDEN };

    const { data: faq, error } = await ctx.supabase
        .from('faqs')
        .insert({
            question: data.question,
            answer: data.answer,
            category: data.category,
            display_order: data.sort_order,
            is_active: data.is_active,
        })
        .select('id')
        .single();

    if (error) return { success: false, error: errorMessage(error) };
    revalidatePath('/admin/cms');
    return { success: true, data: { id: faq.id } };
}

export async function updateFAQ(id: string, data: Partial<FAQ>): Promise<ActionResult> {
    const ctx = await getAdminContext();
    if (!ctx) return { success: false, error: FORBIDDEN };

    const { error } = await ctx.supabase
        .from('faqs')
        .update({
            question: data.question,
            answer: data.answer,
            category: data.category,
            display_order: data.sort_order,
            is_active: data.is_active,
        })
        .eq('id', id);

    if (error) return { success: false, error: errorMessage(error) };
    revalidatePath('/admin/cms');
    return { success: true };
}

export async function deleteFAQ(id: string): Promise<ActionResult> {
    const ctx = await getAdminContext();
    if (!ctx) return { success: false, error: FORBIDDEN };

    const { error } = await ctx.supabase.from('faqs').delete().eq('id', id);

    if (error) return { success: false, error: errorMessage(error) };
    revalidatePath('/admin/cms');
    return { success: true };
}
