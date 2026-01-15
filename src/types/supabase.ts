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
      analytics_events: {
        Row: {
          created_at: string | null
          event_type: string | null
          id: string
          meta: Json | null
          page_path: string | null
          product_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_type?: string | null
          id?: string
          meta?: Json | null
          page_path?: string | null
          product_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_type?: string | null
          id?: string
          meta?: Json | null
          page_path?: string | null
          product_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          id: string
          admin_id: string | null
          action: string
          entity: string
          entity_id: string | null
          details: Json | null
          ip_address: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          admin_id?: string | null
          action: string
          entity: string
          entity_id?: string | null
          details?: Json | null
          ip_address?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          admin_id?: string | null
          action?: string
          entity?: string
          entity_id?: string | null
          details?: Json | null
          ip_address?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      banners: {
        Row: {
          created_at: string | null
          display_order: number | null
          ends_at: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          link_url: string | null
          position: string | null
          starts_at: string | null
          subtitle: string | null
          title: string
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          ends_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          link_url?: string | null
          position?: string | null
          starts_at?: string | null
          subtitle?: string | null
          title: string
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          ends_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          link_url?: string | null
          position?: string | null
          starts_at?: string | null
          subtitle?: string | null
          title?: string
        }
        Relationships: []
      }
      cart_items: {
        Row: {
          color: string | null
          created_at: string | null
          id: string
          product_id: string
          product_image: string | null
          product_name: string
          product_price: number
          quantity: number
          size: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          id?: string
          product_id: string
          product_image?: string | null
          product_name: string
          product_price: number
          quantity?: number
          size?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          id?: string
          product_id?: string
          product_image?: string | null
          product_name?: string
          product_price?: number
          quantity?: number
          size?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      carts: {
        Row: {
          color: string | null
          created_at: string | null
          customer_id: string | null
          id: string
          product_id: string | null
          quantity: number
          session_id: string | null
          size: string | null
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          customer_id?: string | null
          id?: string
          product_id?: string | null
          quantity?: number
          session_id?: string | null
          size?: string | null
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          customer_id?: string | null
          id?: string
          product_id?: string | null
          quantity?: number
          session_id?: string | null
          size?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "carts_customer_id_fkey"
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
          display_order: number | null
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          parent_id: string | null
          slug: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          parent_id?: string | null
          slug: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          parent_id?: string | null
          slug?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          code: string
          created_at: string | null
          description: string | null
          discount_type: string
          discount_value: number
          ends_at: string | null
          id: string
          is_active: boolean | null
          max_uses: number | null
          min_order_amount: number | null
          starts_at: string | null
          uses_count: number | null
        }
        Insert: {
          code: string
          created_at?: string | null
          description?: string | null
          discount_type: string
          discount_value: number
          ends_at?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          min_order_amount?: number | null
          starts_at?: string | null
          uses_count?: number | null
        }
        Update: {
          code?: string
          created_at?: string | null
          description?: string | null
          discount_type?: string
          discount_value?: number
          ends_at?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          min_order_amount?: number | null
          starts_at?: string | null
          uses_count?: number | null
        }
        Relationships: []
      }
      customers: {
        Row: {
          auth_id: string | null
          avatar_url: string | null
          created_at: string | null
          email: string
          first_name: string | null
          id: string
          last_name: string | null
          phone: string | null
          role: string | null
          updated_at: string | null
        }
        Insert: {
          auth_id?: string | null
          avatar_url?: string | null
          created_at?: string | null
          email: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          auth_id?: string | null
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      gift_card_usage: {
        Row: {
          amount_used: number
          created_at: string | null
          gift_card_id: string | null
          id: string
          order_id: string | null
        }
        Insert: {
          amount_used: number
          created_at?: string | null
          gift_card_id?: string | null
          id?: string
          order_id?: string | null
        }
        Update: {
          amount_used?: number
          created_at?: string | null
          gift_card_id?: string | null
          id?: string
          order_id?: string | null
        }
        Relationships: []
      }
      gift_cards: {
        Row: {
          balance: number
          code: string
          created_at: string | null
          expires_at: string | null
          id: string
          initial_value: number
          is_active: boolean | null
        }
        Insert: {
          balance: number
          code: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          initial_value: number
          is_active?: boolean | null
        }
        Update: {
          balance?: number
          code?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          initial_value?: number
          is_active?: boolean | null
        }
        Relationships: []
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          price_at_purchase: number
          product_id: string
          quantity: number
          product_name: string
          size: string | null
          color: string | null
          total_price: number | null
          unit_price: number | null
        }
        Insert: {
          id?: string
          order_id: string
          price_at_purchase: number
          product_id: string
          quantity: number
        }
        Update: {
          id?: string
          order_id?: string
          price_at_purchase?: number
          product_id?: string
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
          created_at: string
          customer_email: string
          customer_id: string | null
          customer_name: string
          id: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_status: Database["public"]["Enums"]["payment_status"]
          shipping_address: string
          billing_address: string | null
          status: Database["public"]["Enums"]["order_status"]
          total: number
          subtotal: number
          discount: number | null
          shipping_cost: number | null
          order_number: string
        }
        Insert: {
          created_at?: string
          customer_email: string
          customer_id?: string | null
          customer_name: string
          id?: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_status?: Database["public"]["Enums"]["payment_status"]
          shipping_address: string
          billing_address?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          total: number
          subtotal: number
          discount?: number | null
          shipping_cost?: number | null
        }
        Update: {
          created_at?: string
          customer_email?: string
          customer_id?: string | null
          customer_name?: string
          id?: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
          payment_status?: Database["public"]["Enums"]["payment_status"]
          shipping_address?: string
          billing_address?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          total?: number
          subtotal?: number
          discount?: number | null
          shipping_cost?: number | null
          order_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      product_images: {
        Row: {
          alt_text: string | null
          created_at: string | null
          display_order: number | null
          id: string
          image_url: string
          is_primary: boolean | null
          product_id: string | null
        }
        Insert: {
          alt_text?: string | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          image_url: string
          is_primary?: boolean | null
          product_id?: string | null
        }
        Update: {
          alt_text?: string | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          image_url?: string
          is_primary?: boolean | null
          product_id?: string | null
        }
        Relationships: []
      }
      product_variants: {
        Row: {
          color: string
          created_at: string | null
          id: string
          product_id: string | null
          size: string
          stock_quantity: number | null
        }
        Insert: {
          color: string
          created_at?: string | null
          id?: string
          product_id?: string | null
          size: string
          stock_quantity?: number | null
        }
        Update: {
          color?: string
          created_at?: string | null
          id?: string
          product_id?: string | null
          size?: string
          stock_quantity?: number | null
        }
        Relationships: []
      }
      products: {
        Row: {
          category: string | null
          category_id: string | null
          colors: string[] | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          images: string[] | null
          in_stock: boolean | null
          is_active: boolean
          is_featured: boolean | null
          is_new: boolean | null
          is_sale: boolean | null
          name: string
          original_price: number | null
          price: number
          short_description: string | null
          sizes: string[] | null
          slug: string | null
          stock: number
        }
        Insert: {
          category?: string | null
          category_id?: string | null
          colors?: string[] | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          images?: string[] | null
          in_stock?: boolean | null
          is_active?: boolean
          is_featured?: boolean | null
          is_new?: boolean | null
          is_sale?: boolean | null
          name: string
          original_price?: number | null
          price: number
          short_description?: string | null
          sizes?: string[] | null
          slug?: string | null
          stock?: number
        }
        Update: {
          category?: string | null
          category_id?: string | null
          colors?: string[] | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          images?: string[] | null
          in_stock?: boolean | null
          is_active?: boolean
          is_featured?: boolean | null
          is_new?: boolean | null
          is_sale?: boolean | null
          name?: string
          original_price?: number | null
          price?: number
          short_description?: string | null
          sizes?: string[] | null
          slug?: string | null
          stock?: number
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
          is_verified: boolean | null
          product_id: string | null
          rating: number
          title: string | null
          images: string[] | null
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          customer_id?: string | null
          id?: string
          is_approved?: boolean | null
          is_verified?: boolean | null
          product_id?: string | null
          rating: number
          title?: string | null
          images?: string[] | null
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          customer_id?: string | null
          id?: string
          is_approved?: boolean | null
          is_verified?: boolean | null
          product_id?: string | null
          rating?: number
          title?: string | null
          images?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      wishlist_items: {
        Row: {
          category: string | null
          created_at: string | null
          id: string
          product_id: string
          product_image: string | null
          product_name: string
          product_price: number
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          id?: string
          product_id: string
          product_image?: string | null
          product_name: string
          product_price: number
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          id?: string
          product_id?: string
          product_image?: string | null
          product_name?: string
          product_price?: number
          user_id?: string
        }
        Relationships: []
      }
      wishlists: {
        Row: {
          created_at: string | null
          customer_id: string | null
          id: string
          product_id: string | null
        }
        Insert: {
          created_at?: string | null
          customer_id?: string | null
          id?: string
          product_id?: string | null
        }
        Update: {
          created_at?: string | null
          customer_id?: string | null
          id?: string
          product_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wishlists_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_analytics_summary: {
        Args: {
          days_back: number
        }
        Returns: Json
      }
      get_admin_stats: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
    }
    Enums: {
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



type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
  | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
    DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
    DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
  ? R
  : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
    DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] &
    DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
  ? R
  : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
  | keyof DefaultSchema["Tables"]
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Insert: infer I
  }
  ? I
  : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
    Insert: infer I
  }
  ? I
  : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
  | keyof DefaultSchema["Tables"]
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Update: infer U
  }
  ? U
  : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
    Update: infer U
  }
  ? U
  : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
  | keyof DefaultSchema["Enums"]
  | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
  : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
  | keyof DefaultSchema["CompositeTypes"]
  | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
  : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  public: {
    Enums: {
      order_status: ["pending", "packed", "shipping", "delivered", "cancelled"],
      payment_method: ["cod", "bank_transfer", "card"],
      payment_status: ["pending", "paid", "failed", "refunded"],
    },
  },
} as const

// ============================================================================
// Convenience type exports for common tables
// These make it easier to use types throughout the application
// ============================================================================

// Table row types
export type Address = Tables<'addresses'>
export type Banner = Tables<'banners'>
export type CartItem = Tables<'cart_items'>
export type Category = Tables<'categories'>
export type Coupon = Tables<'coupons'>
export type GiftCard = Tables<'gift_cards'>
export type GiftCardUsage = Tables<'gift_card_usage'>
export type Order = Tables<'orders'>
export type OrderItem = Tables<'order_items'>
export type Product = Tables<'products'>
export type ProductImage = Tables<'product_images'>
export type ProductVariant = Tables<'product_variants'>
export type Review = Tables<'reviews'>
export type WishlistItem = Tables<'wishlist_items'>
export type AuditLog = Tables<'audit_logs'>
export type AnalyticsEvent = Tables<'analytics_events'>

export type Customer = Tables<'customers'>

// Insert types
export type InsertAddress = TablesInsert<'addresses'>
export type InsertOrder = TablesInsert<'orders'>
export type InsertOrderItem = TablesInsert<'order_items'>
export type InsertProduct = TablesInsert<'products'>
export type InsertReview = TablesInsert<'reviews'>

// Update types  
export type UpdateOrder = TablesUpdate<'orders'>
export type UpdateProduct = TablesUpdate<'products'>

export type Wishlist = Tables<'wishlists'>
export type InsertTables<T extends keyof Database['public']['Tables']> = TablesInsert<T>
export type UpdateTables<T extends keyof Database['public']['Tables']> = TablesUpdate<T>

