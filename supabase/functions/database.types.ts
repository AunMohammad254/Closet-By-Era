export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type Database = {
    // Allows to automatically instantiate createClient with right options
    // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
    __InternalSupabase: {
        PostgrestVersion: "13.0.5"
    }
    public: {
        Tables: {
            addresses: {
                Row: {
                    address_line1: string
                    address_line2: string | null
                    city: string
                    country: string | null
                    created_at: string | null
                    customer_id: string | null
                    first_name: string | null
                    id: string
                    is_default: boolean | null
                    last_name: string | null
                    phone: string | null
                    postal_code: string | null
                    state: string | null
                    type: string | null
                }
                Insert: {
                    address_line1: string
                    address_line2?: string | null
                    city: string
                    country?: string | null
                    created_at?: string | null
                    customer_id?: string | null
                    first_name?: string | null
                    id?: string
                    is_default?: boolean | null
                    last_name?: string | null
                    phone?: string | null
                    postal_code?: string | null
                    state?: string | null
                    type?: string | null
                }
                Update: {
                    address_line1?: string
                    address_line2?: string | null
                    city?: string
                    country?: string | null
                    created_at?: string | null
                    customer_id?: string | null
                    first_name?: string | null
                    id?: string
                    is_default?: boolean | null
                    last_name?: string | null
                    phone?: string | null
                    postal_code?: string | null
                    state?: string | null
                    type?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "addresses_customer_id_fkey"
                        columns: ["customer_id"]
                        isOneToOne: false
                        referencedRelation: "customers"
                        referencedColumns: ["id"]
                    },
                ]
            }
            categories: {
                Row: {
                    created_at: string | null
                    description: string | null
                    id: string
                    image_url: string | null
                    is_active: boolean | null
                    name: string
                    slug: string
                }
                Insert: {
                    created_at?: string | null
                    description?: string | null
                    id?: string
                    image_url?: string | null
                    is_active?: boolean | null
                    name: string
                    slug: string
                }
                Update: {
                    created_at?: string | null
                    description?: string | null
                    id?: string
                    image_url?: string | null
                    is_active?: boolean | null
                    name?: string
                    slug?: string
                }
                Relationships: []
            }
            contracts: {
                Row: {
                    contract_type: string
                    created_at: string | null
                    customer_id: string | null
                    description: string | null
                    end_date: string | null
                    file_url: string | null
                    id: string
                    start_date: string | null
                    status: string | null
                    title: string
                    updated_at: string | null
                }
                Insert: {
                    contract_type: string
                    created_at?: string | null
                    customer_id?: string | null
                    description?: string | null
                    end_date?: string | null
                    file_url?: string | null
                    id?: string
                    start_date?: string | null
                    status?: string | null
                    title: string
                    updated_at?: string | null
                }
                Update: {
                    contract_type?: string
                    created_at?: string | null
                    customer_id?: string | null
                    description?: string | null
                    end_date?: string | null
                    file_url?: string | null
                    id?: string
                    start_date?: string | null
                    status?: string | null
                    title?: string
                    updated_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "contracts_customer_id_fkey"
                        columns: ["customer_id"]
                        isOneToOne: false
                        referencedRelation: "customers"
                        referencedColumns: ["id"]
                    },
                ]
            }
            coupons: {
                Row: {
                    code: string
                    created_at: string | null
                    current_uses: number | null
                    description: string | null
                    discount_type: Database["public"]["Enums"]["discount_type"]
                    discount_value: number
                    end_date: string | null
                    id: string
                    is_active: boolean | null
                    max_uses: number | null
                    min_order_value: number | null
                    start_date: string | null
                }
                Insert: {
                    code: string
                    created_at?: string | null
                    current_uses?: number | null
                    description?: string | null
                    discount_type: Database["public"]["Enums"]["discount_type"]
                    discount_value: number
                    end_date?: string | null
                    id?: string
                    is_active?: boolean | null
                    max_uses?: number | null
                    min_order_value?: number | null
                    start_date?: string | null
                }
                Update: {
                    code?: string
                    created_at?: string | null
                    current_uses?: number | null
                    description?: string | null
                    discount_type?: Database["public"]["Enums"]["discount_type"]
                    discount_value?: number
                    end_date?: string | null
                    id?: string
                    is_active?: boolean | null
                    max_uses?: number | null
                    min_order_value?: number | null
                    start_date?: string | null
                }
                Relationships: []
            }
            customers: {
                Row: {
                    created_at: string | null
                    email: string
                    first_name: string | null
                    id: string
                    last_name: string | null
                    phone: string | null
                }
                Insert: {
                    created_at?: string | null
                    email: string
                    first_name?: string | null
                    id: string
                    last_name?: string | null
                    phone?: string | null
                }
                Update: {
                    created_at?: string | null
                    email?: string
                    first_name?: string | null
                    id?: string
                    last_name?: string | null
                    phone?: string | null
                }
                Relationships: []
            }
            order_items: {
                Row: {
                    created_at: string | null
                    id: string
                    order_id: string | null
                    price: number
                    product_id: string | null
                    quantity: number
                }
                Insert: {
                    created_at?: string | null
                    id?: string
                    order_id?: string | null
                    price: number
                    product_id?: string | null
                    quantity: number
                }
                Update: {
                    created_at?: string | null
                    id?: string
                    order_id?: string | null
                    price?: number
                    product_id?: string | null
                    quantity?: number
                }
                Relationships: [
                    {
                        foreignKeyName: "order_items_order_id_fkey"
                        columns: ["order_id"]
                        isOneToOne: false
                        referencedRelation: "orders"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "order_items_product_id_fkey"
                        columns: ["product_id"]
                        isOneToOne: false
                        referencedRelation: "products"
                        referencedColumns: ["id"]
                    },
                ]
            }
            orders: {
                Row: {
                    created_at: string | null
                    customer_id: string | null
                    id: string
                    notes: string | null
                    payment_method: Database["public"]["Enums"]["payment_method"] | null
                    payment_status: Database["public"]["Enums"]["payment_status"] | null
                    shipping_address_id: string | null
                    status: Database["public"]["Enums"]["order_status"] | null
                    total_amount: number
                    updated_at: string | null
                    user_id: string | null
                }
                Insert: {
                    created_at?: string | null
                    customer_id?: string | null
                    id?: string
                    notes?: string | null
                    payment_method?: Database["public"]["Enums"]["payment_method"] | null
                    payment_status?: Database["public"]["Enums"]["payment_status"] | null
                    shipping_address_id?: string | null
                    status?: Database["public"]["Enums"]["order_status"] | null
                    total_amount: number
                    updated_at?: string | null
                    user_id?: string | null
                }
                Update: {
                    created_at?: string | null
                    customer_id?: string | null
                    id?: string
                    notes?: string | null
                    payment_method?: Database["public"]["Enums"]["payment_method"] | null
                    payment_status?: Database["public"]["Enums"]["payment_status"] | null
                    shipping_address_id?: string | null
                    status?: Database["public"]["Enums"]["order_status"] | null
                    total_amount?: number
                    updated_at?: string | null
                    user_id?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "orders_customer_id_fkey"
                        columns: ["customer_id"]
                        isOneToOne: false
                        referencedRelation: "customers"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "orders_shipping_address_id_fkey"
                        columns: ["shipping_address_id"]
                        isOneToOne: false
                        referencedRelation: "addresses"
                        referencedColumns: ["id"]
                    },
                ]
            }
            products: {
                Row: {
                    category_id: string | null
                    created_at: string | null
                    description: string | null
                    featured: boolean | null
                    id: string
                    image_url: string | null
                    in_stock: boolean | null
                    name: string
                    price: number
                    slug: string
                    stock_quantity: number
                    updated_at: string | null
                }
                Insert: {
                    category_id?: string | null
                    created_at?: string | null
                    description?: string | null
                    featured?: boolean | null
                    id?: string
                    image_url?: string | null
                    in_stock?: boolean | null
                    name: string
                    price: number
                    slug: string
                    stock_quantity?: number
                    updated_at?: string | null
                }
                Update: {
                    category_id?: string | null
                    created_at?: string | null
                    description?: string | null
                    featured?: boolean | null
                    id?: string
                    image_url?: string | null
                    in_stock?: boolean | null
                    name?: string
                    price?: number
                    slug?: string
                    stock_quantity?: number
                    updated_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "products_category_id_fkey"
                        columns: ["category_id"]
                        isOneToOne: false
                        referencedRelation: "categories"
                        referencedColumns: ["id"]
                    },
                ]
            }
            reviews: {
                Row: {
                    comment: string | null
                    created_at: string | null
                    customer_id: string | null
                    id: string
                    is_approved: boolean | null
                    product_id: string | null
                    rating: number
                }
                Insert: {
                    comment?: string | null
                    created_at?: string | null
                    customer_id?: string | null
                    id?: string
                    is_approved?: boolean | null
                    product_id?: string | null
                    rating: number
                }
                Update: {
                    comment?: string | null
                    created_at?: string | null
                    customer_id?: string | null
                    id?: string
                    is_approved?: boolean | null
                    product_id?: string | null
                    rating?: number
                }
                Relationships: [
                    {
                        foreignKeyName: "reviews_customer_id_fkey"
                        columns: ["customer_id"]
                        isOneToOne: false
                        referencedRelation: "customers"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "reviews_product_id_fkey"
                        columns: ["product_id"]
                        isOneToOne: false
                        referencedRelation: "products"
                        referencedColumns: ["id"]
                    },
                ]
            }
            roles: {
                Row: {
                    created_at: string | null
                    id: string
                    name: string
                    user_id: string | null
                }
                Insert: {
                    created_at?: string | null
                    id?: string
                    name: string
                    user_id?: string | null
                }
                Update: {
                    created_at?: string | null
                    id?: string
                    name?: string
                    user_id?: string | null
                }
                Relationships: []
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            is_admin: {
                Args: Record<PropertyKey, never>
                Returns: boolean
            }
        }
        Enums: {
            discount_type: "percentage" | "fixed"
            order_status:
            | "pending"
            | "packed"
            | "shipping"
            | "delivered"
            | "cancelled"
            payment_method: "cod" | "bank_transfer" | "card"
            payment_status: "pending" | "paid" | "failed" | "refunded"
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}

