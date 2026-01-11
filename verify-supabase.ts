import { supabase } from './src/lib/supabase';

async function verifySupabase() {
    console.log('Verifying Supabase connection...');

    // 1. Check if we can fetch any products
    const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id, name, slug')
        .limit(5);

    if (productsError) {
        console.error('Error fetching products:', productsError);
    } else {
        console.log('Successfully fetched products:', products);
    }

    // 2. Check the specific query used in the product page
    // We'll pick a slug from the fetched products or use a test one
    const testSlug = products?.[0]?.slug || 'signature-wool-blend-overcoat';
    console.log(`Testing fetching product with slug: ${testSlug}`);

    const { data: productData, error: productError } = await supabase
        .from('products')
        .select(`
            *,
            category:categories(name, slug)
        `)
        .eq('slug', testSlug)
        .single();

    if (productError) {
        console.error('Error fetching specific product (with join):', productError);
        console.log('Possible cause: Foreign key relationship between products and categories might be missing or named differently.');
    } else {
        console.log('Successfully fetched product with join:', productData);
    }
}

verifySupabase();
