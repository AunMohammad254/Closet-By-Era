'use server';

import { supabaseServer } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';

export async function importProductsFromCSV(formData: FormData): Promise<{ success: boolean; count?: number; errors?: string[] }> {
    const file = formData.get('file') as File;

    if (!file) {
        return { success: false, errors: ['No file provided'] };
    }

    try {
        const text = await file.text();
        const lines = text.split(/\r?\n/);
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

        // Expected headers: name, description, price, category, stock, image
        const requiredHeaders = ['name', 'price', 'category'];
        const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));

        if (missingHeaders.length > 0) {
            return { success: false, errors: [`Missing required headers: ${missingHeaders.join(', ')}`] };
        }

        const productsToInsert = [];
        const errors = [];
        const categoriesMap = new Map<string, string>(); // Name -> ID

        // 1. Fetch existing categories to map names to IDs
        const { data: categories } = await supabaseServer.from('categories').select('id, name');
        if (categories) {
            categories.forEach(c => categoriesMap.set(c.name.toLowerCase(), c.id));
        }

        // 2. Parse Rows
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            const values = parseCSVLine(line);
            if (values.length !== headers.length) {
                errors.push(`Row ${i + 1}: Check column count`);
                continue;
            }

            const row: Record<string, string> = {};
            headers.forEach((h, index) => {
                row[h] = values[index]?.trim();
            });

            // Validation
            if (!row.name || !row.price || !row.category) {
                errors.push(`Row ${i + 1}: Missing required fields`);
                continue;
            }

            const price = parseFloat(row.price);
            if (isNaN(price)) {
                errors.push(`Row ${i + 1}: Invalid price`);
                continue;
            }

            // Category matching
            let categoryId = categoriesMap.get(row.category.toLowerCase());

            // If category doesn't exist, create it (Simplified: usually we might valid strict existence)
            // For now, if not found, we'll try to create it or skip. Let's create it.
            if (!categoryId) {
                const slug = row.category.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                const { data: newCat, error: catError } = await supabaseServer
                    .from('categories')
                    .insert({ name: row.category, slug, description: 'Imported' })
                    .select('id')
                    .single();

                if (newCat && newCat.id) {
                    categoryId = newCat.id;
                    categoriesMap.set(row.category.toLowerCase(), newCat.id);
                } else {
                    errors.push(`Row ${i + 1}: Failed to create category '${row.category}'`);
                    continue;
                }
            }

            const slug = row.name.toLowerCase().replace(/space/g, '-').replace(/[^\w-]+/g, '');

            productsToInsert.push({
                name: row.name,
                slug: `${slug}-${Date.now()}-${i}`, // Ensure uniqueness
                description: row.description || '',
                price: price,
                category_id: categoryId,
                stock: parseInt(row.stock || '0') || 0,
                in_stock: (parseInt(row.stock || '0') || 0) > 0,
                images: row.image ? [row.image] : [],
                is_active: true
            });
        }

        if (productsToInsert.length === 0) {
            return { success: false, errors: ['No valid products found to import. ' + errors.join('; ')] };
        }

        // 3. Batch Insert
        const { error: insertError } = await supabaseServer
            .from('products')
            .insert(productsToInsert);

        if (insertError) {
            console.error('Batch insert error:', insertError);
            return { success: false, errors: ['Database insertion failed. ' + insertError.message] };
        }

        revalidatePath('/dashboard/products');
        return { success: true, count: productsToInsert.length, errors: errors.length > 0 ? errors : undefined };

    } catch (e) {
        console.error('Import error:', e);
        return { success: false, errors: ['Server error during import'] };
    }
}

// Simple CSV line parser handling quotes
function parseCSVLine(text: string) {
    const result = [];
    let cell = '';
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(cell);
            cell = '';
        } else {
            cell += char;
        }
    }
    result.push(cell);
    return result;
}
