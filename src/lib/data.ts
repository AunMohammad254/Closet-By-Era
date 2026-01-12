import { supabase, Product, Category, Banner } from './supabase';

// =============================================
// Product Functions
// =============================================

export async function getProducts(options?: {
    category?: string;
    limit?: number;
    offset?: number;
    featured?: boolean;
    isNew?: boolean;
    isSale?: boolean;
    search?: string;
    sortBy?: 'newest' | 'price_asc' | 'price_desc' | 'name';
}) {
    let query = supabase
        .from('products')
        .select(`
      *,
      categories (
        id,
        name,
        slug
      )
    `)
        .eq('in_stock', true);

    if (options?.category) {
        query = query.eq('categories.slug', options.category);
    }

    if (options?.featured) {
        query = query.eq('is_featured', true);
    }

    if (options?.isNew) {
        query = query.eq('is_new', true);
    }

    if (options?.isSale) {
        query = query.eq('is_sale', true);
    }

    if (options?.search) {
        query = query.ilike('name', `%${options.search}%`);
    }

    // Sorting
    switch (options?.sortBy) {
        case 'price_asc':
            query = query.order('price', { ascending: true });
            break;
        case 'price_desc':
            query = query.order('price', { ascending: false });
            break;
        case 'name':
            query = query.order('name', { ascending: true });
            break;
        case 'newest':
        default:
            query = query.order('created_at', { ascending: false });
    }

    if (options?.limit) {
        query = query.limit(options.limit);
    }

    if (options?.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 20) - 1);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching products:', error);
        return [];
    }

    return data as (Product & { categories: Category })[];
}

export async function getProductBySlug(slug: string) {
    const { data, error } = await supabase
        .from('products')
        .select(`
      *,
      categories (
        id,
        name,
        slug
      )
    `)
        .eq('slug', slug)
        .single();

    if (error) {
        console.error('Error fetching product:', error);
        return null;
    }

    return data as Product & { categories: Category };
}

export async function getProductById(id: string) {
    const { data, error } = await supabase
        .from('products')
        .select(`
      *,
      categories (
        id,
        name,
        slug
      )
    `)
        .eq('id', id)
        .single();

    if (error) {
        console.error('Error fetching product:', error);
        return null;
    }

    return data as Product & { categories: Category };
}

export async function getFeaturedProducts(limit = 8) {
    return getProducts({ featured: true, limit });
}

export async function getNewArrivals(limit = 8) {
    return getProducts({ isNew: true, limit });
}

export async function getSaleProducts(limit = 8) {
    return getProducts({ isSale: true, limit });
}

export async function getRelatedProducts(categoryId: string, excludeId: string, limit = 4) {
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('category_id', categoryId)
        .neq('id', excludeId)
        .eq('in_stock', true)
        .limit(limit);

    if (error) {
        console.error('Error fetching related products:', error);
        return [];
    }

    return data as Product[];
}

// =============================================
// Category Functions
// =============================================

export async function getCategories(parentOnly = false) {
    let query = supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

    if (parentOnly) {
        query = query.is('parent_id', null);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching categories:', error);
        return [];
    }

    return data as Category[];
}

export async function getCategoryBySlug(slug: string) {
    const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('slug', slug)
        .single();

    if (error) {
        console.error('Error fetching category:', error);
        return null;
    }

    return data as Category;
}

export async function getProductsByCategory(categorySlug: string, limit = 20) {
    const category = await getCategoryBySlug(categorySlug);
    if (!category) return [];

    const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('category_id', category.id)
        .eq('in_stock', true)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('Error fetching products by category:', error);
        return [];
    }

    return data as Product[];
}

// =============================================
// Banner Functions
// =============================================

export async function getBanners(position?: string) {
    let query = supabase
        .from('banners')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

    if (position) {
        query = query.eq('position', position);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching banners:', error);
        return [];
    }

    return data as Banner[];
}

// =============================================
// Search Functions
// =============================================

export async function searchProducts(query: string, limit = 20) {
    const { data, error } = await supabase
        .from('products')
        .select(`
      *,
      categories (
        id,
        name,
        slug
      )
    `)
        .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
        .eq('in_stock', true)
        .limit(limit);

    if (error) {
        console.error('Error searching products:', error);
        return [];
    }

    return data as (Product & { categories: Category })[];
}

// =============================================
// Order Functions
// =============================================

export async function createOrder(orderData: {
    customerId?: string;
    items: Array<{
        productId: string;
        productName: string;
        productImage?: string;
        quantity: number;
        size?: string;
        color?: string;
        unitPrice: number;
    }>;
    shippingAddress: object;
    billingAddress?: object;
    subtotal: number;
    discount?: number;
    shippingCost?: number;
    total: number;
    notes?: string;
}) {
    // Generate order number
    const orderNumber = `CBE-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

    const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
            order_number: orderNumber,
            customer_id: orderData.customerId,
            status: 'pending',
            subtotal: orderData.subtotal,
            discount: orderData.discount || 0,
            shipping_cost: orderData.shippingCost || 0,
            total: orderData.total,
            shipping_address: orderData.shippingAddress as any,
            billing_address: (orderData.billingAddress || orderData.shippingAddress) as any,
            notes: orderData.notes,
        })
        .select()
        .single();

    if (orderError) {
        console.error('Error creating order:', orderError);
        return null;
    }

    // Insert order items
    const orderItems = orderData.items.map((item) => ({
        order_id: order.id,
        product_id: item.productId,
        product_name: item.productName,
        product_image: item.productImage,
        quantity: item.quantity,
        size: item.size,
        color: item.color,
        unit_price: item.unitPrice,
        total_price: item.unitPrice * item.quantity,
    }));

    const { error: itemsError } = await supabase.from('order_items').insert(orderItems);

    if (itemsError) {
        console.error('Error creating order items:', itemsError);
        // Consider rolling back the order here
    }

    return order;
}

export async function getCustomerOrders(customerId: string) {
    const { data, error } = await supabase
        .from('orders')
        .select(`
      *,
      order_items (*)
    `)
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching orders:', error);
        return [];
    }

    return data;
}

// =============================================
// Coupon Functions
// =============================================

// Moved to src/actions/coupons.ts
// Use validateCoupon from actions instead.
