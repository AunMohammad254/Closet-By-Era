export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            addresses: {
                Row: {
                    id: string
                    customer_id: string | null
                    type: string | null
                    first_name: string | null
                    last_name: string | null
                    address_line1: string
                    address_line2: string | null
                    city: string
                    state: string | null
                    postal_code: string | null
                    country: string | null
                    phone: string | null
                    is_default: boolean | null
                    created_at: string | null
                }
                Insert: {
                    id?: string
                    customer_id?: string | null
                    type?: string | null
                    first_name?: string | null
                    last_name?: string | null
                    address_line1: string
                    address_line2?: string | null
                    city: string
                    state?: string | null
                    postal_code?: string | null
                    country?: string | null
                    phone?: string | null
                    is_default?: boolean | null
                    created_at?: string | null
                }
                Update: {
                    id?: string
                    customer_id?: string | null
                    type?: string | null
                    first_name?: string | null
                    last_name?: string | null
                    address_line1?: string
                    address_line2?: string | null
                    city?: string
                    state?: string | null
                    postal_code?: string | null
                    country?: string | null
                    phone?: string | null
                    is_default?: boolean | null
                    created_at?: string | null
                }
            }
            analytics_events: {
                Row: {
                    id: string
                    event_type: string
                    page_path: string | null
                    product_id: string | null
                    user_id: string | null
                    meta: Json | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    event_type: string
                    page_path?: string | null
                    product_id?: string | null
                    user_id?: string | null
                    meta?: Json | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    event_type?: string
                    page_path?: string | null
                    product_id?: string | null
                    user_id?: string | null
                    meta?: Json | null
                    created_at?: string
                }
            }
            audit_logs: {
                Row: {
                    id: string
                    admin_id: string | null
                    action: string
                    entity_type: string | null
                    entity_id: string | null
                    old_values: Json | null
                    new_values: Json | null
                    ip_address: string | null
                    user_agent: string | null
                    created_at: string | null
                }
                Insert: {
                    id?: string
                    admin_id?: string | null
                    action: string
                    entity_type?: string | null
                    entity_id?: string | null
                    old_values?: Json | null
                    new_values?: Json | null
                    ip_address?: string | null
                    user_agent?: string | null
                    created_at?: string | null
                }
                Update: {
                    id?: string
                    admin_id?: string | null
                    action?: string
                    entity_type?: string | null
                    entity_id?: string | null
                    old_values?: Json | null
                    new_values?: Json | null
                    ip_address?: string | null
                    user_agent?: string | null
                    created_at?: string | null
                }
            }
            banners: {
                Row: {
                    id: string
                    title: string
                    subtitle: string | null
                    image_url: string
                    link_url: string | null
                    position: string | null
                    is_active: boolean | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    title: string
                    subtitle?: string | null
                    image_url: string
                    link_url?: string | null
                    position?: string | null
                    is_active?: boolean | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    title?: string
                    subtitle?: string | null
                    image_url?: string
                    link_url?: string | null
                    position?: string | null
                    is_active?: boolean | null
                    created_at?: string
                }
            }
            cart_items: {
                Row: {
                    id: string
                    cart_id: string | null
                    product_id: string | null
                    variant_id: string | null
                    quantity: number | null
                    created_at: string | null
                }
                Insert: {
                    id?: string
                    cart_id?: string | null
                    product_id?: string | null
                    variant_id?: string | null
                    quantity?: number | null
                    created_at?: string | null
                }
                Update: {
                    id?: string
                    cart_id?: string | null
                    product_id?: string | null
                    variant_id?: string | null
                    quantity?: number | null
                    created_at?: string | null
                }
            }
            carts: {
                Row: {
                    id: string
                    customer_id: string | null
                    created_at: string | null
                    updated_at: string | null
                }
                Insert: {
                    id?: string
                    customer_id?: string | null
                    created_at?: string | null
                    updated_at?: string | null
                }
                Update: {
                    id?: string
                    customer_id?: string | null
                    created_at?: string | null
                    updated_at?: string | null
                }
            }
            categories: {
                Row: {
                    id: string
                    name: string
                    slug: string
                    image_url: string | null
                    description: string | null
                    parent_id: string | null
                    display_order: number | null
                    is_active: boolean | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    slug: string
                    image_url?: string | null
                    description?: string | null
                    parent_id?: string | null
                    display_order?: number | null
                    is_active?: boolean | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    slug?: string
                    image_url?: string | null
                    description?: string | null
                    parent_id?: string | null
                    display_order?: number | null
                    is_active?: boolean | null
                    created_at?: string
                }
            }
            coupons: {
                Row: {
                    id: string
                    code: string
                    description: string | null
                    discount_type: Database['public']['Enums']['discount_type']
                    discount_value: number
                    min_order_amount: number | null
                    max_uses: number | null
                    uses_count: number | null
                    is_active: boolean | null
                    starts_at: string | null
                    ends_at: string | null
                    created_at: string | null
                }
                Insert: {
                    id?: string
                    code: string
                    description?: string | null
                    discount_type: Database['public']['Enums']['discount_type']
                    discount_value: number
                    min_order_amount?: number | null
                    max_uses?: number | null
                    uses_count?: number | null
                    is_active?: boolean | null
                    starts_at?: string | null
                    ends_at?: string | null
                    created_at?: string | null
                }
                Update: {
                    id?: string
                    code?: string
                    description?: string | null
                    discount_type?: Database['public']['Enums']['discount_type']
                    discount_value?: number
                    min_order_amount?: number | null
                    max_uses?: number | null
                    uses_count?: number | null
                    is_active?: boolean | null
                    starts_at?: string | null
                    ends_at?: string | null
                    created_at?: string | null
                }
            }
            customers: {
                Row: {
                    id: string
                    auth_id: string | null
                    email: string | null
                    first_name: string | null
                    last_name: string | null
                    phone: string | null
                    avatar_url: string | null
                    role: 'customer' | 'admin' | null
                    loyalty_points: number | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    auth_id?: string | null
                    email?: string | null
                    first_name?: string | null
                    last_name?: string | null
                    phone?: string | null
                    avatar_url?: string | null
                    role?: 'customer' | 'admin' | null
                    loyalty_points?: number | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    auth_id?: string | null
                    email?: string | null
                    first_name?: string | null
                    last_name?: string | null
                    phone?: string | null
                    avatar_url?: string | null
                    role?: 'customer' | 'admin' | null
                    loyalty_points?: number | null
                    created_at?: string
                }
            }
            gift_card_usage: {
                Row: {
                    id: string
                    gift_card_id: string | null
                    order_id: string | null
                    amount_used: number
                    used_at: string | null
                }
                Insert: {
                    id?: string
                    gift_card_id?: string | null
                    order_id?: string | null
                    amount_used: number
                    used_at?: string | null
                }
                Update: {
                    id?: string
                    gift_card_id?: string | null
                    order_id?: string | null
                    amount_used?: number
                    used_at?: string | null
                }
            }
            gift_cards: {
                Row: {
                    id: string
                    code: string
                    initial_balance: number
                    current_balance: number
                    purchaser_id: string | null
                    recipient_email: string | null
                    recipient_name: string | null
                    message: string | null
                    is_active: boolean | null
                    expires_at: string | null
                    created_at: string | null
                }
                Insert: {
                    id?: string
                    code: string
                    initial_balance: number
                    current_balance: number
                    purchaser_id?: string | null
                    recipient_email?: string | null
                    recipient_name?: string | null
                    message?: string | null
                    is_active?: boolean | null
                    expires_at?: string | null
                    created_at?: string | null
                }
                Update: {
                    id?: string
                    code?: string
                    initial_balance?: number
                    current_balance?: number
                    purchaser_id?: string | null
                    recipient_email?: string | null
                    recipient_name?: string | null
                    message?: string | null
                    is_active?: boolean | null
                    expires_at?: string | null
                    created_at?: string | null
                }
            }
            loyalty_history: {
                Row: {
                    id: string
                    user_id: string | null
                    points: number
                    reason: string | null
                    created_at: string | null
                }
                Insert: {
                    id?: string
                    user_id?: string | null
                    points: number
                    reason?: string | null
                    created_at?: string | null
                }
                Update: {
                    id?: string
                    user_id?: string | null
                    points?: number
                    reason?: string | null
                    created_at?: string | null
                }
            }
            order_items: {
                Row: {
                    id: string
                    order_id: string
                    product_id: string | null
                    product_name: string
                    size: string | null
                    color: string | null
                    quantity: number
                    unit_price: number
                    total_price: number
                    created_at: string
                }
                Insert: {
                    id?: string
                    order_id: string
                    product_id?: string | null
                    product_name: string
                    size?: string | null
                    color?: string | null
                    quantity?: number
                    unit_price: number
                    total_price: number
                    created_at?: string
                }
                Update: {
                    id?: string
                    order_id?: string
                    product_id?: string | null
                    product_name?: string
                    size?: string | null
                    color?: string | null
                    quantity?: number
                    unit_price?: number
                    total_price?: number
                    created_at?: string
                }
            }
            orders: {
                Row: {
                    id: string
                    order_number: string
                    customer_id: string | null
                    status: Database['public']['Enums']['order_status'] | null
                    payment_status: Database['public']['Enums']['payment_status'] | null
                    payment_method: Database['public']['Enums']['payment_method'] | null
                    subtotal: number
                    discount: number | null
                    shipping_cost: number | null
                    total: number
                    shipping_address: Json | null
                    billing_address: Json | null
                    notes: string | null
                    customer_name: string | null
                    customer_email: string | null
                    customer_phone: string | null
                    tracking_number: string | null
                    coupon_code: string | null
                    gift_card_code: string | null
                    created_at: string
                    updated_at: string | null
                }
                Insert: {
                    id?: string
                    order_number: string
                    customer_id?: string | null
                    status?: Database['public']['Enums']['order_status'] | null
                    payment_status?: Database['public']['Enums']['payment_status'] | null
                    payment_method?: Database['public']['Enums']['payment_method'] | null
                    subtotal: number
                    discount?: number | null
                    shipping_cost?: number | null
                    total: number
                    shipping_address?: Json | null
                    billing_address?: Json | null
                    notes?: string | null
                    customer_name?: string | null
                    customer_email?: string | null
                    customer_phone?: string | null
                    tracking_number?: string | null
                    coupon_code?: string | null
                    gift_card_code?: string | null
                    created_at?: string
                    updated_at?: string | null
                }
                Update: {
                    id?: string
                    order_number?: string
                    customer_id?: string | null
                    status?: Database['public']['Enums']['order_status'] | null
                    payment_status?: Database['public']['Enums']['payment_status'] | null
                    payment_method?: Database['public']['Enums']['payment_method'] | null
                    subtotal?: number
                    discount?: number | null
                    shipping_cost?: number | null
                    total?: number
                    shipping_address?: Json | null
                    billing_address?: Json | null
                    notes?: string | null
                    customer_name?: string | null
                    customer_email?: string | null
                    customer_phone?: string | null
                    tracking_number?: string | null
                    coupon_code?: string | null
                    gift_card_code?: string | null
                    created_at?: string
                    updated_at?: string | null
                }
            }
            product_images: {
                Row: {
                    id: string
                    product_id: string | null
                    image_url: string
                    alt_text: string | null
                    is_primary: boolean | null
                    display_order: number | null
                    created_at: string | null
                }
                Insert: {
                    id?: string
                    product_id?: string | null
                    image_url: string
                    alt_text?: string | null
                    is_primary?: boolean | null
                    display_order?: number | null
                    created_at?: string | null
                }
                Update: {
                    id?: string
                    product_id?: string | null
                    image_url?: string
                    alt_text?: string | null
                    is_primary?: boolean | null
                    display_order?: number | null
                    created_at?: string | null
                }
            }
            product_variants: {
                Row: {
                    id: string
                    product_id: string | null
                    size: string
                    color: string
                    stock_quantity: number | null
                    created_at: string | null
                }
                Insert: {
                    id?: string
                    product_id?: string | null
                    size: string
                    color: string
                    stock_quantity?: number | null
                    created_at?: string | null
                }
                Update: {
                    id?: string
                    product_id?: string | null
                    size?: string
                    color?: string
                    stock_quantity?: number | null
                    created_at?: string | null
                }
            }
            products: {
                Row: {
                    id: string
                    name: string
                    slug: string
                    description: string | null
                    short_description: string | null
                    price: number
                    original_price: number | null
                    category_id: string | null
                    image_url: string | null
                    images: string[] | null
                    sizes: string[] | null
                    colors: string[] | null
                    in_stock: boolean | null
                    is_featured: boolean | null
                    is_new: boolean | null
                    is_sale: boolean | null
                    sku: string | null
                    stock_quantity: number | null
                    weight: number | null
                    tags: string[] | null
                    meta_title: string | null
                    meta_description: string | null
                    created_at: string
                    updated_at: string | null
                }
                Insert: {
                    id?: string
                    name: string
                    slug: string
                    description?: string | null
                    short_description?: string | null
                    price: number
                    original_price?: number | null
                    category_id?: string | null
                    image_url?: string | null
                    images?: string[] | null
                    sizes?: string[] | null
                    colors?: string[] | null
                    in_stock?: boolean | null
                    is_featured?: boolean | null
                    is_new?: boolean | null
                    is_sale?: boolean | null
                    sku?: string | null
                    stock_quantity?: number | null
                    weight?: number | null
                    tags?: string[] | null
                    meta_title?: string | null
                    meta_description?: string | null
                    created_at?: string
                    updated_at?: string | null
                }
                Update: {
                    id?: string
                    name?: string
                    slug?: string
                    description?: string | null
                    short_description?: string | null
                    price?: number
                    original_price?: number | null
                    category_id?: string | null
                    image_url?: string | null
                    images?: string[] | null
                    sizes?: string[] | null
                    colors?: string[] | null
                    in_stock?: boolean | null
                    is_featured?: boolean | null
                    is_new?: boolean | null
                    is_sale?: boolean | null
                    sku?: string | null
                    stock_quantity?: number | null
                    weight?: number | null
                    tags?: string[] | null
                    meta_title?: string | null
                    meta_description?: string | null
                    created_at?: string
                    updated_at?: string | null
                }
            }
            profiles: {
                Row: {
                    id: string
                    role: 'customer' | 'admin' | null
                    loyalty_points: number | null
                    created_at: string | null
                    updated_at: string | null
                }
                Insert: {
                    id: string
                    role?: 'customer' | 'admin' | null
                    loyalty_points?: number | null
                    created_at?: string | null
                    updated_at?: string | null
                }
                Update: {
                    id?: string
                    role?: 'customer' | 'admin' | null
                    loyalty_points?: number | null
                    created_at?: string | null
                    updated_at?: string | null
                }
            }
            reviews: {
                Row: {
                    id: string
                    product_id: string
                    user_id: string
                    rating: number
                    comment: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    product_id: string
                    user_id: string
                    rating: number
                    comment?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    product_id?: string
                    user_id?: string
                    rating?: number
                    comment?: string | null
                    created_at?: string
                }
            }
            support_messages: {
                Row: {
                    id: string
                    ticket_id: string | null
                    sender_id: string | null
                    message: string
                    is_admin_reply: boolean | null
                    created_at: string | null
                }
                Insert: {
                    id?: string
                    ticket_id?: string | null
                    sender_id?: string | null
                    message: string
                    is_admin_reply?: boolean | null
                    created_at?: string | null
                }
                Update: {
                    id?: string
                    ticket_id?: string | null
                    sender_id?: string | null
                    message?: string
                    is_admin_reply?: boolean | null
                    created_at?: string | null
                }
            }
            support_tickets: {
                Row: {
                    id: string
                    user_id: string | null
                    subject: string | null
                    status: string | null
                    priority: string | null
                    created_at: string | null
                    updated_at: string | null
                }
                Insert: {
                    id?: string
                    user_id?: string | null
                    subject?: string | null
                    status?: string | null
                    priority?: string | null
                    created_at?: string | null
                    updated_at?: string | null
                }
                Update: {
                    id?: string
                    user_id?: string | null
                    subject?: string | null
                    status?: string | null
                    priority?: string | null
                    created_at?: string | null
                    updated_at?: string | null
                }
            }
            wishlist_items: {
                Row: {
                    id: string
                    user_id: string
                    product_id: string
                    product_name: string
                    product_price: number
                    product_image: string | null
                    category: string | null
                    created_at: string | null
                }
                Insert: {
                    id?: string
                    user_id: string
                    product_id: string
                    product_name: string
                    product_price: number
                    product_image?: string | null
                    category?: string | null
                    created_at?: string | null
                }
                Update: {
                    id?: string
                    user_id?: string
                    product_id?: string
                    product_name?: string
                    product_price?: number
                    product_image?: string | null
                    category?: string | null
                    created_at?: string | null
                }
            }
            wishlists: {
                Row: {
                    id: string
                    customer_id: string | null
                    product_id: string | null
                    created_at: string | null
                }
                Insert: {
                    id?: string
                    customer_id?: string | null
                    product_id?: string | null
                    created_at?: string | null
                }
                Update: {
                    id?: string
                    customer_id?: string | null
                    product_id?: string | null
                    created_at?: string | null
                }
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            get_featured_products_fast: {
                Args: {
                    p_limit: number
                }
                Returns: {
                    id: string
                    name: string
                    slug: string
                    price: number
                    original_price: number | null
                    image: string | null
                    is_new: boolean | null
                    is_sale: boolean | null
                }[]
            }
            get_new_arrivals_fast: {
                Args: {
                    p_limit: number
                }
                Returns: {
                    id: string
                    name: string
                    slug: string
                    price: number
                    original_price: number | null
                    image: string | null
                    is_new: boolean | null
                    is_sale: boolean | null
                }[]
            }
            get_admin_stats: {
                Args: Record<string, never>
                Returns: {
                    totalRevenue: number
                    activeOrders: number
                    totalProducts: number
                    totalCustomers: number
                }
            }
            get_analytics_summary: {
                Args: {
                    days_back: number
                }
                Returns: {
                    timeline: { date: string; views: number }[]
                    topProducts: { product_id: string; name: string; views: number }[]
                    totalViews: number
                }
            }
            validate_gift_card: {
                Args: {
                    code_input: string
                }
                Returns: {
                    valid: boolean
                    message?: string
                    id?: string
                    code?: string
                    balance?: number
                    initial_value?: number
                }
            }
            redeem_gift_card_atomic: {
                Args: {
                    p_code: string
                    p_amount: number
                    p_order_id: string
                }
                Returns: {
                    success: boolean
                    message?: string
                    new_balance?: number
                    amount_redeemed?: number
                }
            }
            is_admin: {
                Args: Record<string, never>
                Returns: boolean
            }
        }
        Enums: {
            discount_type: 'percentage' | 'fixed'
            order_status: 'pending' | 'packed' | 'shipping' | 'delivered' | 'cancelled'
            payment_method: 'cod' | 'bank_transfer' | 'card' | 'jazzcash' | 'easypaisa'
            payment_status: 'pending' | 'paid' | 'failed' | 'refunded'
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}

// Helper types for easier access
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T]
