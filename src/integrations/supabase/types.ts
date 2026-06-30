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
      categories: {
        Row: {
          icon: string
          name_uk: string
          position: number
          slug: string
        }
        Insert: {
          icon: string
          name_uk: string
          position: number
          slug: string
        }
        Update: {
          icon?: string
          name_uk?: string
          position?: number
          slug?: string
        }
        Relationships: []
      }
      chats: {
        Row: {
          client_id: string
          created_at: string | null
          dispute_active: boolean | null
          id: string
          master_id: string
          order_id: string | null
        }
        Insert: {
          client_id: string
          created_at?: string | null
          dispute_active?: boolean | null
          id?: string
          master_id: string
          order_id?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string | null
          dispute_active?: boolean | null
          id?: string
          master_id?: string
          order_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chats_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chats_master_id_fkey"
            columns: ["master_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chats_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      disputes: {
        Row: {
          admin_id: string | null
          created_at: string | null
          id: string
          opened_by: string
          order_id: string
          resolution: string | null
          status: string | null
        }
        Insert: {
          admin_id?: string | null
          created_at?: string | null
          id?: string
          opened_by: string
          order_id: string
          resolution?: string | null
          status?: string | null
        }
        Update: {
          admin_id?: string | null
          created_at?: string | null
          id?: string
          opened_by?: string
          order_id?: string
          resolution?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "disputes_opened_by_fkey"
            columns: ["opened_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disputes_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      master_subcategories: {
        Row: {
          master_id: string
          subcategory_id: string
        }
        Insert: {
          master_id: string
          subcategory_id: string
        }
        Update: {
          master_id?: string
          subcategory_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "master_subcategories_master_id_fkey"
            columns: ["master_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "master_subcategories_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "subcategories"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          body: string | null
          chat_id: string
          created_at: string | null
          id: string
          kind: Database["public"]["Enums"]["msg_kind"] | null
          media_url: string | null
          price: number | null
          read_at: string | null
          reply_to: string | null
          sender_id: string
        }
        Insert: {
          body?: string | null
          chat_id: string
          created_at?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["msg_kind"] | null
          media_url?: string | null
          price?: number | null
          read_at?: string | null
          reply_to?: string | null
          sender_id: string
        }
        Update: {
          body?: string | null
          chat_id?: string
          created_at?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["msg_kind"] | null
          media_url?: string | null
          price?: number | null
          read_at?: string | null
          reply_to?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_reply_to_fkey"
            columns: ["reply_to"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          address: string | null
          category_slug: string | null
          client_id: string
          completed_at: string | null
          created_at: string | null
          escrow_status: Database["public"]["Enums"]["escrow_status"] | null
          id: string
          lat: number | null
          lng: number | null
          master_id: string | null
          notes: string | null
          payment_method: Database["public"]["Enums"]["payment_method"] | null
          price: number | null
          status: Database["public"]["Enums"]["order_status"] | null
          subcategory_id: string | null
        }
        Insert: {
          address?: string | null
          category_slug?: string | null
          client_id: string
          completed_at?: string | null
          created_at?: string | null
          escrow_status?: Database["public"]["Enums"]["escrow_status"] | null
          id?: string
          lat?: number | null
          lng?: number | null
          master_id?: string | null
          notes?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          price?: number | null
          status?: Database["public"]["Enums"]["order_status"] | null
          subcategory_id?: string | null
        }
        Update: {
          address?: string | null
          category_slug?: string | null
          client_id?: string
          completed_at?: string | null
          created_at?: string | null
          escrow_status?: Database["public"]["Enums"]["escrow_status"] | null
          id?: string
          lat?: number | null
          lng?: number | null
          master_id?: string | null
          notes?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          price?: number | null
          status?: Database["public"]["Enums"]["order_status"] | null
          subcategory_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_category_slug_fkey"
            columns: ["category_slug"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["slug"]
          },
          {
            foreignKeyName: "orders_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_master_id_fkey"
            columns: ["master_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "subcategories"
            referencedColumns: ["id"]
          },
        ]
      }
      portfolio_photos: {
        Row: {
          created_at: string | null
          id: string
          master_id: string
          position: number | null
          url: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          master_id: string
          position?: number | null
          url: string
        }
        Update: {
          created_at?: string | null
          id?: string
          master_id?: string
          position?: number | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_photos_master_id_fkey"
            columns: ["master_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          experience_years: number | null
          full_name: string | null
          has_vehicle: boolean | null
          id: string
          locked_address: string | null
          locked_lat: number | null
          locked_lng: number | null
          phone: string | null
          primary_category_slug: string | null
          rating: number | null
          status: Database["public"]["Enums"]["master_status"] | null
          tools_inventory: string | null
          verified: boolean | null
          wallet_balance: number | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          experience_years?: number | null
          full_name?: string | null
          has_vehicle?: boolean | null
          id: string
          locked_address?: string | null
          locked_lat?: number | null
          locked_lng?: number | null
          phone?: string | null
          primary_category_slug?: string | null
          rating?: number | null
          status?: Database["public"]["Enums"]["master_status"] | null
          tools_inventory?: string | null
          verified?: boolean | null
          wallet_balance?: number | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          experience_years?: number | null
          full_name?: string | null
          has_vehicle?: boolean | null
          id?: string
          locked_address?: string | null
          locked_lat?: number | null
          locked_lng?: number | null
          phone?: string | null
          primary_category_slug?: string | null
          rating?: number | null
          status?: Database["public"]["Enums"]["master_status"] | null
          tools_inventory?: string | null
          verified?: boolean | null
          wallet_balance?: number | null
        }
        Relationships: []
      }
      reviews: {
        Row: {
          author_id: string
          created_at: string | null
          id: string
          rating: number
          target_id: string
          text: string | null
        }
        Insert: {
          author_id: string
          created_at?: string | null
          id?: string
          rating: number
          target_id: string
          text?: string | null
        }
        Update: {
          author_id?: string
          created_at?: string | null
          id?: string
          rating?: number
          target_id?: string
          text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_target_id_fkey"
            columns: ["target_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subcategories: {
        Row: {
          category_slug: string
          id: string
          name_uk: string
          position: number
        }
        Insert: {
          category_slug: string
          id?: string
          name_uk: string
          position: number
        }
        Update: {
          category_slug?: string
          id?: string
          name_uk?: string
          position?: number
        }
        Relationships: [
          {
            foreignKeyName: "subcategories_category_slug_fkey"
            columns: ["category_slug"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["slug"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          kind: Database["public"]["Enums"]["tx_kind"]
          master_id: string | null
          order_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          kind: Database["public"]["Enums"]["tx_kind"]
          master_id?: string | null
          order_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["tx_kind"]
          master_id?: string | null
          order_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_master_id_fkey"
            columns: ["master_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "master" | "client"
      escrow_status: "none" | "held" | "released" | "disputed" | "refunded"
      master_status: "free" | "working" | "offline"
      msg_kind: "text" | "voice" | "media" | "price_card" | "system"
      order_status:
        | "pending"
        | "accepted"
        | "enroute"
        | "in_progress"
        | "completed"
        | "cancelled"
        | "disputed"
      payment_method: "card" | "cash"
      tx_kind:
        | "hold"
        | "release_master"
        | "release_platform"
        | "cash_debt"
        | "payout"
        | "topup"
        | "instant_fee"
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
      app_role: ["admin", "master", "client"],
      escrow_status: ["none", "held", "released", "disputed", "refunded"],
      master_status: ["free", "working", "offline"],
      msg_kind: ["text", "voice", "media", "price_card", "system"],
      order_status: [
        "pending",
        "accepted",
        "enroute",
        "in_progress",
        "completed",
        "cancelled",
        "disputed",
      ],
      payment_method: ["card", "cash"],
      tx_kind: [
        "hold",
        "release_master",
        "release_platform",
        "cash_debt",
        "payout",
        "topup",
        "instant_fee",
      ],
    },
  },
} as const
