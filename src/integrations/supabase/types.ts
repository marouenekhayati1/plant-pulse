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
      technicians: {
        Row: {
          active: boolean
          created_at: string
          first_name: string
          id: string
          last_name: string
          matricule: string
          role: Database["public"]["Enums"]["tech_role"]
        }
        Insert: {
          active?: boolean
          created_at?: string
          first_name: string
          id?: string
          last_name: string
          matricule: string
          role?: Database["public"]["Enums"]["tech_role"]
        }
        Update: {
          active?: boolean
          created_at?: string
          first_name?: string
          id?: string
          last_name?: string
          matricule?: string
          role?: Database["public"]["Enums"]["tech_role"]
        }
        Relationships: []
      }
      thresholds: {
        Row: {
          field_key: string
          id: string
          label: string
          max_value: number | null
          min_value: number | null
          unit: string | null
          updated_at: string
          utility: Database["public"]["Enums"]["utility_kind"]
          warn_max: number | null
          warn_min: number | null
        }
        Insert: {
          field_key: string
          id?: string
          label: string
          max_value?: number | null
          min_value?: number | null
          unit?: string | null
          updated_at?: string
          utility: Database["public"]["Enums"]["utility_kind"]
          warn_max?: number | null
          warn_min?: number | null
        }
        Update: {
          field_key?: string
          id?: string
          label?: string
          max_value?: number | null
          min_value?: number | null
          unit?: string | null
          updated_at?: string
          utility?: Database["public"]["Enums"]["utility_kind"]
          warn_max?: number | null
          warn_min?: number | null
        }
        Relationships: []
      }
      utility_readings: {
        Row: {
          anomaly: boolean
          anomaly_fields: Json
          checklist: Json | null
          comment: string | null
          computed: Json
          data: Json
          guard_post: number
          id: string
          recorded_at: string
          technician_id: string
          technician_matricule: string
          technician_name: string
          utility: Database["public"]["Enums"]["utility_kind"]
        }
        Insert: {
          anomaly?: boolean
          anomaly_fields?: Json
          checklist?: Json | null
          comment?: string | null
          computed?: Json
          data?: Json
          guard_post: number
          id?: string
          recorded_at?: string
          technician_id: string
          technician_matricule: string
          technician_name: string
          utility: Database["public"]["Enums"]["utility_kind"]
        }
        Update: {
          anomaly?: boolean
          anomaly_fields?: Json
          checklist?: Json | null
          comment?: string | null
          computed?: Json
          data?: Json
          guard_post?: number
          id?: string
          recorded_at?: string
          technician_id?: string
          technician_matricule?: string
          technician_name?: string
          utility?: Database["public"]["Enums"]["utility_kind"]
        }
        Relationships: [
          {
            foreignKeyName: "utility_readings_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "technicians"
            referencedColumns: ["id"]
          },
        ]
      }
      wattnow_session: {
        Row: {
          access_token: string
          device_key: string | null
          expires_at: string
          id: string
          id_token: string | null
          refresh_token: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token: string
          device_key?: string | null
          expires_at: string
          id?: string
          id_token?: string | null
          refresh_token?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string
          device_key?: string | null
          expires_at?: string
          id?: string
          id_token?: string | null
          refresh_token?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      wattnow_snapshots: {
        Row: {
          aux_kw: number | null
          conso_kw: number | null
          delta_kw: number | null
          ge1_kw: number | null
          ge2_kw: number | null
          id: string
          prod_kw: number | null
          randa1_kw: number | null
          randa2_kw: number | null
          randa3_kw: number | null
          raw: Json | null
          recorded_at: string
        }
        Insert: {
          aux_kw?: number | null
          conso_kw?: number | null
          delta_kw?: number | null
          ge1_kw?: number | null
          ge2_kw?: number | null
          id?: string
          prod_kw?: number | null
          randa1_kw?: number | null
          randa2_kw?: number | null
          randa3_kw?: number | null
          raw?: Json | null
          recorded_at?: string
        }
        Update: {
          aux_kw?: number | null
          conso_kw?: number | null
          delta_kw?: number | null
          ge1_kw?: number | null
          ge2_kw?: number | null
          id?: string
          prod_kw?: number | null
          randa1_kw?: number | null
          randa2_kw?: number | null
          randa3_kw?: number | null
          raw?: Json | null
          recorded_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      tech_role: "technician" | "maintenance_manager" | "admin"
      utility_kind:
        | "generator_g1"
        | "generator_g2"
        | "osmosis"
        | "hot_water"
        | "steam_boiler"
        | "water_room"
        | "chiller"
        | "vacuum_pump"
        | "air_compressor"
        | "thermo"
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
      tech_role: ["technician", "maintenance_manager", "admin"],
      utility_kind: [
        "generator_g1",
        "generator_g2",
        "osmosis",
        "hot_water",
        "steam_boiler",
        "water_room",
        "chiller",
        "vacuum_pump",
        "air_compressor",
        "thermo",
      ],
    },
  },
} as const
