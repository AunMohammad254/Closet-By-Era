import { createClient } from '@/lib/supabase/client';

/**
 * Products for a department page (e.g. "men"): the root category plus all of
 * its sub-categories. There is no gender column, so the category tree is the
 * only way to keep the Men page from listing the Women's catalog.
 */
export async function fetchCategoryCatalog(rootSlug: string) {
    const supabase = createClient();

    const { data: categories, error: categoriesError } = await supabase
        .from('categories')
        .select('id, name, slug, parent_id')
        .eq('is_active', true)
        .order('display_order');

    if (categoriesError) throw categoriesError;

    const root = categories.find(c => c.slug === rootSlug);
    if (!root) return { categoryNames: [] as string[], products: [] };

    const ids = new Set([root.id]);
    for (let grew = true; grew;) {
        grew = false;
        for (const c of categories) {
            if (c.parent_id && ids.has(c.parent_id) && !ids.has(c.id)) {
                ids.add(c.id);
                grew = true;
            }
        }
    }

    const { data: products, error } = await supabase
        .from('products')
        .select('*, categories(name)')
        .in('category_id', [...ids])
        .eq('is_active', true)
        .eq('in_stock', true)
        .order('created_at', { ascending: false });

    if (error) throw error;

    const categoryNames = [...new Set(
        categories.filter(c => c.id !== root.id && ids.has(c.id)).map(c => c.name)
    )];

    return { categoryNames, products };
}
