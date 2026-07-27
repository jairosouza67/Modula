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
      avatars: {
        Row: {
          created_at: string
          id: string
          stage: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          stage?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          stage?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      body_metrics: {
        Row: {
          body_fat_percent: number | null
          created_at: string
          id: string
          lean_mass: number | null
          measured_at: string
          measurements: Json | null
          notes: string | null
          user_id: string
          weight: number | null
        }
        Insert: {
          body_fat_percent?: number | null
          created_at?: string
          id?: string
          lean_mass?: number | null
          measured_at?: string
          measurements?: Json | null
          notes?: string | null
          user_id: string
          weight?: number | null
        }
        Update: {
          body_fat_percent?: number | null
          created_at?: string
          id?: string
          lean_mass?: number | null
          measured_at?: string
          measurements?: Json | null
          notes?: string | null
          user_id?: string
          weight?: number | null
        }
        Relationships: []
      }
      boss_damage_log: {
        Row: {
          boss_id: string
          checkin_id: string | null
          created_at: string
          damage: number
          id: string
          user_id: string
        }
        Insert: {
          boss_id: string
          checkin_id?: string | null
          created_at?: string
          damage: number
          id?: string
          user_id: string
        }
        Update: {
          boss_id?: string
          checkin_id?: string | null
          created_at?: string
          damage?: number
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "boss_damage_log_boss_id_fkey"
            columns: ["boss_id"]
            isOneToOne: false
            referencedRelation: "weekly_bosses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "boss_damage_log_checkin_id_fkey"
            columns: ["checkin_id"]
            isOneToOne: false
            referencedRelation: "checkins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "boss_damage_log_checkin_id_fkey"
            columns: ["checkin_id"]
            isOneToOne: false
            referencedRelation: "checkins_feed"
            referencedColumns: ["id"]
          },
        ]
      }
      checkins: {
        Row: {
          coins_earned: number
          created_at: string
          distance_km: number | null
          duration_minutes: number | null
          group_id: string | null
          id: string
          image_url: string | null
          intensity: number | null
          title: string
          type: string
          user_id: string
          xp_earned: number
        }
        Insert: {
          coins_earned?: number
          created_at?: string
          distance_km?: number | null
          duration_minutes?: number | null
          group_id?: string | null
          id?: string
          image_url?: string | null
          intensity?: number | null
          title: string
          type: string
          user_id: string
          xp_earned?: number
        }
        Update: {
          coins_earned?: number
          created_at?: string
          distance_km?: number | null
          duration_minutes?: number | null
          group_id?: string | null
          id?: string
          image_url?: string | null
          intensity?: number | null
          title?: string
          type?: string
          user_id?: string
          xp_earned?: number
        }
        Relationships: [
          {
            foreignKeyName: "checkins_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkins_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups_view"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          checkin_id: string
          content: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          checkin_id: string
          content: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          checkin_id?: string
          content?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_checkin_id_fkey"
            columns: ["checkin_id"]
            isOneToOne: false
            referencedRelation: "checkins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_checkin_id_fkey"
            columns: ["checkin_id"]
            isOneToOne: false
            referencedRelation: "checkins_feed"
            referencedColumns: ["id"]
          },
        ]
      }
      group_blocked_users: {
        Row: {
          blocked_by: string | null
          created_at: string
          group_id: string
          id: string
          user_id: string
        }
        Insert: {
          blocked_by?: string | null
          created_at?: string
          group_id: string
          id?: string
          user_id: string
        }
        Update: {
          blocked_by?: string | null
          created_at?: string
          group_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_blocked_users_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_blocked_users_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups_view"
            referencedColumns: ["id"]
          },
        ]
      }
      group_join_requests: {
        Row: {
          created_at: string
          group_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          group_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          group_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_join_requests_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_join_requests_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups_view"
            referencedColumns: ["id"]
          },
        ]
      }
      group_members: {
        Row: {
          group_id: string
          id: string
          joined_at: string
          status: string
          user_id: string
        }
        Insert: {
          group_id: string
          id?: string
          joined_at?: string
          status?: string
          user_id: string
        }
        Update: {
          group_id?: string
          id?: string
          joined_at?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups_view"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          owner_id: string
          password: string | null
          photo_url: string | null
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          owner_id: string
          password?: string | null
          photo_url?: string | null
          type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          owner_id?: string
          password?: string | null
          photo_url?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      likes: {
        Row: {
          checkin_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          checkin_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          checkin_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "likes_checkin_id_fkey"
            columns: ["checkin_id"]
            isOneToOne: false
            referencedRelation: "checkins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "likes_checkin_id_fkey"
            columns: ["checkin_id"]
            isOneToOne: false
            referencedRelation: "checkins_feed"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          id: string
          updated_at: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          id: string
          updated_at?: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      season_participants: {
        Row: {
          bio_score: number
          created_at: string
          final_body_metrics_id: string | null
          id: string
          initial_body_metrics_id: string | null
          medals: Json
          season_id: string
          user_id: string
          xp_earned: number
        }
        Insert: {
          bio_score?: number
          created_at?: string
          final_body_metrics_id?: string | null
          id?: string
          initial_body_metrics_id?: string | null
          medals?: Json
          season_id: string
          user_id: string
          xp_earned?: number
        }
        Update: {
          bio_score?: number
          created_at?: string
          final_body_metrics_id?: string | null
          id?: string
          initial_body_metrics_id?: string | null
          medals?: Json
          season_id?: string
          user_id?: string
          xp_earned?: number
        }
        Relationships: [
          {
            foreignKeyName: "season_participants_final_body_metrics_id_fkey"
            columns: ["final_body_metrics_id"]
            isOneToOne: false
            referencedRelation: "body_metrics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "season_participants_initial_body_metrics_id_fkey"
            columns: ["initial_body_metrics_id"]
            isOneToOne: false
            referencedRelation: "body_metrics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "season_participants_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      seasons: {
        Row: {
          created_at: string
          ends_at: string
          id: string
          name: string
          starts_at: string
          status: string
        }
        Insert: {
          created_at?: string
          ends_at: string
          id?: string
          name: string
          starts_at: string
          status?: string
        }
        Update: {
          created_at?: string
          ends_at?: string
          id?: string
          name?: string
          starts_at?: string
          status?: string
        }
        Relationships: []
      }
      user_stats: {
        Row: {
          checkins_count: number
          coins: number
          created_at: string
          discipline: number | null
          endurance: number | null
          hp: number | null
          id: string
          level: number
          max_hp: number | null
          speed: number | null
          stamina: number | null
          strength: number | null
          total_xp: number
          updated_at: string
          user_id: string
        }
        Insert: {
          checkins_count?: number
          coins?: number
          created_at?: string
          discipline?: number | null
          endurance?: number | null
          hp?: number | null
          id?: string
          level?: number
          max_hp?: number | null
          speed?: number | null
          stamina?: number | null
          strength?: number | null
          total_xp?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          checkins_count?: number
          coins?: number
          created_at?: string
          discipline?: number | null
          endurance?: number | null
          hp?: number | null
          id?: string
          level?: number
          max_hp?: number | null
          speed?: number | null
          stamina?: number | null
          strength?: number | null
          total_xp?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      weekly_bosses: {
        Row: {
          created_at: string
          current_hp: number
          ends_at: string | null
          group_id: string | null
          hp: number
          id: string
          name: string
          starts_at: string | null
          status: string
        }
        Insert: {
          created_at?: string
          current_hp: number
          ends_at?: string | null
          group_id?: string | null
          hp: number
          id?: string
          name: string
          starts_at?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          current_hp?: number
          ends_at?: string | null
          group_id?: string | null
          hp?: number
          id?: string
          name?: string
          starts_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "weekly_bosses_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "weekly_bosses_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups_view"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      checkins_feed: {
        Row: {
          avatar_url: string | null
          coins_earned: number | null
          comments_count: number | null
          created_at: string | null
          distance_km: number | null
          duration_minutes: number | null
          group_id: string | null
          group_name: string | null
          group_type: string | null
          id: string | null
          image_url: string | null
          level: number | null
          likes_count: number | null
          title: string | null
          type: string | null
          user_id: string | null
          username: string | null
          xp_earned: number | null
        }
        Relationships: [
          {
            foreignKeyName: "checkins_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkins_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups_view"
            referencedColumns: ["id"]
          },
        ]
      }
      global_ranking_view: {
        Row: {
          avatar_url: string | null
          checkins_count: number | null
          level: number | null
          total_xp: number | null
          user_id: string | null
          username: string | null
        }
        Relationships: []
      }
      groups_view: {
        Row: {
          created_at: string | null
          description: string | null
          group_type: string | null
          id: string | null
          member_count: number | null
          name: string | null
          owner_id: string | null
          password: string | null
          photo_url: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          group_type?: string | null
          id?: string | null
          member_count?: never
          name?: string | null
          owner_id?: string | null
          password?: string | null
          photo_url?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          group_type?: string | null
          id?: string | null
          member_count?: never
          name?: string | null
          owner_id?: string | null
          password?: string | null
          photo_url?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      aplicar_penalidade: { Args: { p_user_id: string }; Returns: undefined }
      calcular_bio_score: {
        Args: { p_final_metrics_id: string; p_initial_metrics_id: string }
        Returns: number
      }
      processar_checkin: {
        Args: {
          p_duration_minutes?: number
          p_group_id?: string
          p_image_url?: string
          p_intensity?: number
          p_title: string
          p_type: string
        }
        Returns: Json
      }
      regenerar_hp: { Args: { p_user_id: string }; Returns: undefined }
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
