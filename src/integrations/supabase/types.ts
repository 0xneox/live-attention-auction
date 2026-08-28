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
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
      bids: {
        Row: {
          amount_paise: number
          artwork_path: string | null
          created_at: string
          id: string
          outbid_at: string | null
          round_id: string
          slot_id: string
          status: Database["public"]["Enums"]["bid_status"]
          user_id: string
        }
        Insert: {
          amount_paise: number
          artwork_path?: string | null
          created_at?: string
          id?: string
          outbid_at?: string | null
          round_id: string
          slot_id: string
          status?: Database["public"]["Enums"]["bid_status"]
          user_id: string
        }
        Update: {
          amount_paise?: number
          artwork_path?: string | null
          created_at?: string
          id?: string
          outbid_at?: string | null
          round_id?: string
          slot_id?: string
          status?: Database["public"]["Enums"]["bid_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bids_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "round_stats"
            referencedColumns: ["round_id"]
          },
          {
            foreignKeyName: "bids_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "rounds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bids_slot_id_fkey"
            columns: ["slot_id"]
            isOneToOne: false
            referencedRelation: "slot_board"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bids_slot_id_fkey"
            columns: ["slot_id"]
            isOneToOne: false
            referencedRelation: "slots"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          campaign_end: string | null
          campaign_start: string | null
          created_at: string
          id: string
          install_date: string | null
          proof_photo_url: string | null
          proof_video_url: string | null
          slot_id: string
          status: Database["public"]["Enums"]["campaign_status"]
          user_id: string
          winning_bid_id: string
        }
        Insert: {
          campaign_end?: string | null
          campaign_start?: string | null
          created_at?: string
          id?: string
          install_date?: string | null
          proof_photo_url?: string | null
          proof_video_url?: string | null
          slot_id: string
          status?: Database["public"]["Enums"]["campaign_status"]
          user_id: string
          winning_bid_id: string
        }
        Update: {
          campaign_end?: string | null
          campaign_start?: string | null
          created_at?: string
          id?: string
          install_date?: string | null
          proof_photo_url?: string | null
          proof_video_url?: string | null
          slot_id?: string
          status?: Database["public"]["Enums"]["campaign_status"]
          user_id?: string
          winning_bid_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_slot_id_fkey"
            columns: ["slot_id"]
            isOneToOne: false
            referencedRelation: "slot_board"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaigns_slot_id_fkey"
            columns: ["slot_id"]
            isOneToOne: false
            referencedRelation: "slots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaigns_winning_bid_id_fkey"
            columns: ["winning_bid_id"]
            isOneToOne: true
            referencedRelation: "activity_feed"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaigns_winning_bid_id_fkey"
            columns: ["winning_bid_id"]
            isOneToOne: true
            referencedRelation: "bids"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_policy: {
        Row: {
          description_text: string
          id: number
          policy_type: string
          updated_at: string
        }
        Insert: {
          description_text?: string
          id?: number
          policy_type?: string
          updated_at?: string
        }
        Update: {
          description_text?: string
          id?: number
          policy_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          admin_notes: string | null
          amount_paise: number
          bid_id: string
          created_at: string
          id: string
          provider: string
          provider_order_id: string | null
          provider_payment_id: string | null
          receipt_url: string | null
          status: Database["public"]["Enums"]["payment_status"]
          updated_at: string
          user_id: string
          webhook_verified: boolean
        }
        Insert: {
          admin_notes?: string | null
          amount_paise: number
          bid_id: string
          created_at?: string
          id?: string
          provider?: string
          provider_order_id?: string | null
          provider_payment_id?: string | null
          receipt_url?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
          user_id: string
          webhook_verified?: boolean
        }
        Update: {
          admin_notes?: string | null
          amount_paise?: number
          bid_id?: string
          created_at?: string
          id?: string
          provider?: string
          provider_order_id?: string | null
          provider_payment_id?: string | null
          receipt_url?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
          user_id?: string
          webhook_verified?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "payments_bid_id_fkey"
            columns: ["bid_id"]
            isOneToOne: false
            referencedRelation: "activity_feed"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_bid_id_fkey"
            columns: ["bid_id"]
            isOneToOne: false
            referencedRelation: "bids"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_contact: {
        Row: {
          created_at: string
          email: string | null
          id: string
          phone: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          id: string
          phone?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          phone?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string
          handle: string | null
          id: string
        }
        Insert: {
          created_at?: string
          display_name?: string
          handle?: string | null
          id: string
        }
        Update: {
          created_at?: string
          display_name?: string
          handle?: string | null
          id?: string
        }
        Relationships: []
      }
      rounds: {
        Row: {
          campaign_duration_days: number
          created_at: string
          currency: string
          ends_at: string
          id: string
          name: string
          starts_at: string
          status: Database["public"]["Enums"]["round_status"]
        }
        Insert: {
          campaign_duration_days?: number
          created_at?: string
          currency?: string
          ends_at: string
          id?: string
          name: string
          starts_at?: string
          status?: Database["public"]["Enums"]["round_status"]
        }
        Update: {
          campaign_duration_days?: number
          created_at?: string
          currency?: string
          ends_at?: string
          id?: string
          name?: string
          starts_at?: string
          status?: Database["public"]["Enums"]["round_status"]
        }
        Relationships: []
      }
      slots: {
        Row: {
          base_price_paise: number
          created_at: string
          current_bid_id: string | null
          dimensions: string | null
          id: string
          image_url: string | null
          minimum_increment_paise: number
          name: string
          position_label: string
          reservation_bid_id: string | null
          reservation_expires_at: string | null
          slug: string
          status: Database["public"]["Enums"]["slot_status"]
          vehicle_id: string
        }
        Insert: {
          base_price_paise?: number
          created_at?: string
          current_bid_id?: string | null
          dimensions?: string | null
          id?: string
          image_url?: string | null
          minimum_increment_paise?: number
          name: string
          position_label: string
          reservation_bid_id?: string | null
          reservation_expires_at?: string | null
          slug: string
          status?: Database["public"]["Enums"]["slot_status"]
          vehicle_id: string
        }
        Update: {
          base_price_paise?: number
          created_at?: string
          current_bid_id?: string | null
          dimensions?: string | null
          id?: string
          image_url?: string | null
          minimum_increment_paise?: number
          name?: string
          position_label?: string
          reservation_bid_id?: string | null
          reservation_expires_at?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["slot_status"]
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "slots_current_bid_fk"
            columns: ["current_bid_id"]
            isOneToOne: false
            referencedRelation: "activity_feed"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "slots_current_bid_fk"
            columns: ["current_bid_id"]
            isOneToOne: false
            referencedRelation: "bids"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "slots_reservation_bid_fk"
            columns: ["reservation_bid_id"]
            isOneToOne: false
            referencedRelation: "activity_feed"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "slots_reservation_bid_fk"
            columns: ["reservation_bid_id"]
            isOneToOne: false
            referencedRelation: "bids"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "slots_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vehicles: {
        Row: {
          agreement_doc_url: string | null
          city: string
          consent_status: string
          created_at: string
          driver_contact: string | null
          driver_name: string | null
          estimated_daily_impressions: number | null
          id: string
          photos: string[]
          public_name: string
          route_description: string | null
          status: Database["public"]["Enums"]["vehicle_status"]
        }
        Insert: {
          agreement_doc_url?: string | null
          city: string
          consent_status?: string
          created_at?: string
          driver_contact?: string | null
          driver_name?: string | null
          estimated_daily_impressions?: number | null
          id?: string
          photos?: string[]
          public_name: string
          route_description?: string | null
          status?: Database["public"]["Enums"]["vehicle_status"]
        }
        Update: {
          agreement_doc_url?: string | null
          city?: string
          consent_status?: string
          created_at?: string
          driver_contact?: string | null
          driver_name?: string | null
          estimated_daily_impressions?: number | null
          id?: string
          photos?: string[]
          public_name?: string
          route_description?: string | null
          status?: Database["public"]["Enums"]["vehicle_status"]
        }
        Relationships: []
      }
    }
    Views: {
      activity_feed: {
        Row: {
          actor: string | null
          amount_paise: number | null
          created_at: string | null
          id: string | null
          position_label: string | null
          previous_actor: string | null
          previous_amount_paise: number | null
          slot_id: string | null
          slot_name: string | null
          slot_slug: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bids_slot_id_fkey"
            columns: ["slot_id"]
            isOneToOne: false
            referencedRelation: "slot_board"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bids_slot_id_fkey"
            columns: ["slot_id"]
            isOneToOne: false
            referencedRelation: "slots"
            referencedColumns: ["id"]
          },
        ]
      }
      round_stats: {
        Row: {
          bid_count: number | null
          campaign_duration_days: number | null
          currency: string | null
          ends_at: string | null
          name: string | null
          open_slots: number | null
          round_id: string | null
          starts_at: string | null
          status: Database["public"]["Enums"]["round_status"] | null
          total_raised_paise: number | null
        }
        Insert: {
          bid_count?: never
          campaign_duration_days?: number | null
          currency?: string | null
          ends_at?: string | null
          name?: string | null
          open_slots?: never
          round_id?: string | null
          starts_at?: string | null
          status?: Database["public"]["Enums"]["round_status"] | null
          total_raised_paise?: never
        }
        Update: {
          bid_count?: never
          campaign_duration_days?: number | null
          currency?: string | null
          ends_at?: string | null
          name?: string | null
          open_slots?: never
          round_id?: string | null
          starts_at?: string | null
          status?: Database["public"]["Enums"]["round_status"] | null
          total_raised_paise?: never
        }
        Relationships: []
      }
      slot_board: {
        Row: {
          base_price_paise: number | null
          bid_count: number | null
          city: string | null
          current_amount_paise: number | null
          current_bid_id: string | null
          dimensions: string | null
          estimated_daily_impressions: number | null
          id: string | null
          image_url: string | null
          leader_handle: string | null
          leader_name: string | null
          min_next_paise: number | null
          minimum_increment_paise: number | null
          name: string | null
          position_label: string | null
          reservation_expires_at: string | null
          reserved: boolean | null
          route_description: string | null
          slug: string | null
          status: Database["public"]["Enums"]["slot_status"] | null
          vehicle_id: string | null
          vehicle_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "slots_current_bid_fk"
            columns: ["current_bid_id"]
            isOneToOne: false
            referencedRelation: "activity_feed"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "slots_current_bid_fk"
            columns: ["current_bid_id"]
            isOneToOne: false
            referencedRelation: "bids"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "slots_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      close_round: { Args: { p_round_id: string }; Returns: number }
      confirm_payment: {
        Args: { p_bid_id: string; p_provider_payment_id?: string }
        Returns: Json
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      place_bid: {
        Args: {
          p_amount_paise: number
          p_artwork_path?: string
          p_slot_id: string
        }
        Returns: string
      }
      release_expired_reservations: { Args: never; Returns: number }
    }
    Enums: {
      app_role: "admin" | "user"
      bid_status: "pending_payment" | "paid" | "outbid" | "won" | "expired"
      campaign_status:
        | "pending"
        | "artwork_submitted"
        | "printed"
        | "installed"
        | "live"
        | "expired"
      payment_status: "created" | "paid" | "failed" | "refund_due" | "refunded"
      round_status: "draft" | "live" | "closed"
      slot_status:
        | "open"
        | "bidding"
        | "sold"
        | "installing"
        | "live"
        | "expired"
      vehicle_status: "draft" | "active" | "retired"
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
      app_role: ["admin", "user"],
      bid_status: ["pending_payment", "paid", "outbid", "won", "expired"],
      campaign_status: [
        "pending",
        "artwork_submitted",
        "printed",
        "installed",
        "live",
        "expired",
      ],
      payment_status: ["created", "paid", "failed", "refund_due", "refunded"],
      round_status: ["draft", "live", "closed"],
      slot_status: ["open", "bidding", "sold", "installing", "live", "expired"],
      vehicle_status: ["draft", "active", "retired"],
    },
  },
} as const
