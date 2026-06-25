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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      ai_extraction_jobs: {
        Row: {
          created_at: string
          current_step: string | null
          error_message: string | null
          id: string
          product_id: string | null
          result: Json | null
          seller_id: string
          source_kind: string
          source_meta: Json
          status: string
          steps_log: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_step?: string | null
          error_message?: string | null
          id?: string
          product_id?: string | null
          result?: Json | null
          seller_id: string
          source_kind: string
          source_meta?: Json
          status?: string
          steps_log?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_step?: string | null
          error_message?: string | null
          id?: string
          product_id?: string | null
          result?: Json | null
          seller_id?: string
          source_kind?: string
          source_meta?: Json
          status?: string
          steps_log?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_extraction_jobs_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      app_admins: {
        Row: {
          created_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      cart_items: {
        Row: {
          created_at: string | null
          id: string
          product_id: string | null
          quantity: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          product_id?: string | null
          quantity?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          product_id?: string | null
          quantity?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      commission_rate_history: {
        Row: {
          admin_id: string | null
          created_at: string | null
          id: string
          new_rate: number | null
          new_rate_percent: number | null
          old_rate: number | null
          old_rate_percent: number | null
          seller_type: string
        }
        Insert: {
          admin_id?: string | null
          created_at?: string | null
          id?: string
          new_rate?: number | null
          new_rate_percent?: number | null
          old_rate?: number | null
          old_rate_percent?: number | null
          seller_type: string
        }
        Update: {
          admin_id?: string | null
          created_at?: string | null
          id?: string
          new_rate?: number | null
          new_rate_percent?: number | null
          old_rate?: number | null
          old_rate_percent?: number | null
          seller_type?: string
        }
        Relationships: []
      }
      favorites: {
        Row: {
          created_at: string
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          product_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          commission_amount: number | null
          created_at: string | null
          id: string
          image_url: string | null
          name: string
          net_amount: number | null
          order_id: string | null
          price: number
          product_id: string | null
          quantity: number
          seller_id: string | null
          status: string | null
        }
        Insert: {
          commission_amount?: number | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          name: string
          net_amount?: number | null
          order_id?: string | null
          price: number
          product_id?: string | null
          quantity: number
          seller_id?: string | null
          status?: string | null
        }
        Update: {
          commission_amount?: number | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          name?: string
          net_amount?: number | null
          order_id?: string | null
          price?: number
          product_id?: string | null
          quantity?: number
          seller_id?: string | null
          status?: string | null
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
          address: Json
          commission_rate: number | null
          created_at: string | null
          customer_email: string
          customer_name: string
          id: string
          payment_id: string | null
          payment_status: string | null
          shipping_cost: number
          shipping_method: string
          status: string | null
          subtotal: number
          total: number
          user_id: string | null
        }
        Insert: {
          address: Json
          commission_rate?: number | null
          created_at?: string | null
          customer_email: string
          customer_name: string
          id?: string
          payment_id?: string | null
          payment_status?: string | null
          shipping_cost: number
          shipping_method: string
          status?: string | null
          subtotal: number
          total: number
          user_id?: string | null
        }
        Update: {
          address?: Json
          commission_rate?: number | null
          created_at?: string | null
          customer_email?: string
          customer_name?: string
          id?: string
          payment_id?: string | null
          payment_status?: string | null
          shipping_cost?: number
          shipping_method?: string
          status?: string | null
          subtotal?: number
          total?: number
          user_id?: string | null
        }
        Relationships: []
      }
      products: {
        Row: {
          active: boolean | null
          ai_job_id: string | null
          badges: string[] | null
          category: string
          created_at: string | null
          description: string | null
          external_buy_url: string | null
          gallery: string[]
          id: string
          image_url: string | null
          is_draft: boolean
          is_published: boolean | null
          name: string
          origin: string
          price: number
          rating: number | null
          region: string | null
          reviews: number | null
          seller_id: string | null
          shop: string | null
          shop_name: string | null
          short_description: string | null
          slug: string
          stock_quantity: number | null
          updated_at: string | null
          vendor_id: string | null
        }
        Insert: {
          active?: boolean | null
          ai_job_id?: string | null
          badges?: string[] | null
          category: string
          created_at?: string | null
          description?: string | null
          external_buy_url?: string | null
          gallery?: string[]
          id?: string
          image_url?: string | null
          is_draft?: boolean
          is_published?: boolean | null
          name: string
          origin?: string
          price: number
          rating?: number | null
          region?: string | null
          reviews?: number | null
          seller_id?: string | null
          shop?: string | null
          shop_name?: string | null
          short_description?: string | null
          slug: string
          stock_quantity?: number | null
          updated_at?: string | null
          vendor_id?: string | null
        }
        Update: {
          active?: boolean | null
          ai_job_id?: string | null
          badges?: string[] | null
          category?: string
          created_at?: string | null
          description?: string | null
          external_buy_url?: string | null
          gallery?: string[]
          id?: string
          image_url?: string | null
          is_draft?: boolean
          is_published?: boolean | null
          name?: string
          origin?: string
          price?: number
          rating?: number | null
          region?: string | null
          reviews?: number | null
          seller_id?: string | null
          shop?: string | null
          shop_name?: string | null
          short_description?: string | null
          slug?: string
          stock_quantity?: number | null
          updated_at?: string | null
          vendor_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          role: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id: string
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          role?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          product_id: string
          rating: number
          updated_at: string
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          product_id: string
          rating: number
          updated_at?: string
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          product_id?: string
          rating?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      seller_integrations: {
        Row: {
          access_token: string | null
          config: Json
          created_at: string
          external_account: string | null
          id: string
          last_sync_at: string | null
          platform: string
          refresh_token: string | null
          seller_id: string
          status: string
          updated_at: string
        }
        Insert: {
          access_token?: string | null
          config?: Json
          created_at?: string
          external_account?: string | null
          id?: string
          last_sync_at?: string | null
          platform: string
          refresh_token?: string | null
          seller_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          access_token?: string | null
          config?: Json
          created_at?: string
          external_account?: string | null
          id?: string
          last_sync_at?: string | null
          platform?: string
          refresh_token?: string | null
          seller_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      seller_type_settings: {
        Row: {
          commission_rate: number
          created_at: string | null
          seller_type: string
          updated_at: string | null
        }
        Insert: {
          commission_rate?: number
          created_at?: string | null
          seller_type: string
          updated_at?: string | null
        }
        Update: {
          commission_rate?: number
          created_at?: string | null
          seller_type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      seller_wallet: {
        Row: {
          balance: number | null
          id: string
          seller_id: string | null
          total_withdrawn: number | null
          updated_at: string | null
        }
        Insert: {
          balance?: number | null
          id?: string
          seller_id?: string | null
          total_withdrawn?: number | null
          updated_at?: string | null
        }
        Update: {
          balance?: number | null
          id?: string
          seller_id?: string | null
          total_withdrawn?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      sellers: {
        Row: {
          approved: boolean | null
          commission_rate: number | null
          created_at: string | null
          description: string | null
          id: string
          logo_url: string | null
          rating: number | null
          seller_type: string | null
          store_name: string
          user_id: string | null
          verified_at: string | null
        }
        Insert: {
          approved?: boolean | null
          commission_rate?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          logo_url?: string | null
          rating?: number | null
          seller_type?: string | null
          store_name: string
          user_id?: string | null
          verified_at?: string | null
        }
        Update: {
          approved?: boolean | null
          commission_rate?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          logo_url?: string | null
          rating?: number | null
          seller_type?: string | null
          store_name?: string
          user_id?: string | null
          verified_at?: string | null
        }
        Relationships: []
      }
      shipment_updates: {
        Row: {
          created_at: string
          description: string | null
          id: string
          location: string | null
          shipment_id: string | null
          status: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          location?: string | null
          shipment_id?: string | null
          status: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          location?: string | null
          shipment_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "shipment_updates_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "shipments"
            referencedColumns: ["id"]
          },
        ]
      }
      shipments: {
        Row: {
          carrier: string | null
          created_at: string | null
          id: string
          order_id: string | null
          seller_id: string | null
          status: string | null
          tracking_code: string | null
          updated_at: string | null
        }
        Insert: {
          carrier?: string | null
          created_at?: string | null
          id?: string
          order_id?: string | null
          seller_id?: string | null
          status?: string | null
          tracking_code?: string | null
          updated_at?: string | null
        }
        Update: {
          carrier?: string | null
          created_at?: string | null
          id?: string
          order_id?: string | null
          seller_id?: string | null
          status?: string | null
          tracking_code?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shipments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      wallet_transactions: {
        Row: {
          amount: number
          commission: number | null
          created_at: string | null
          description: string | null
          id: string
          order_id: string | null
          order_item_id: string | null
          type: string
          wallet_id: string | null
        }
        Insert: {
          amount: number
          commission?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          order_id?: string | null
          order_item_id?: string | null
          type: string
          wallet_id?: string | null
        }
        Update: {
          amount?: number
          commission?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          order_id?: string | null
          order_item_id?: string | null
          type?: string
          wallet_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wallet_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wallet_transactions_order_item_id_fkey"
            columns: ["order_item_id"]
            isOneToOne: false
            referencedRelation: "order_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wallet_transactions_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "seller_wallet"
            referencedColumns: ["id"]
          },
        ]
      }
      withdrawal_requests: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          pix_key: string | null
          seller_id: string
          status: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          pix_key?: string | null
          seller_id: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          pix_key?: string | null
          seller_id?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_monthly_sales_report: {
        Args: { report_month: string }
        Returns: {
          sales_by_category: Json
          sales_by_status: Json
          total_orders: number
          total_revenue: number
        }[]
      }
      is_admin: { Args: never; Returns: boolean }
      recalculate_all_commissions: { Args: never; Returns: undefined }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
