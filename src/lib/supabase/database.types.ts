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
      admin_users: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          id: string
          is_active: boolean
          last_seen_at: string | null
          role: Database["public"]["Enums"]["admin_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          is_active?: boolean
          last_seen_at?: string | null
          role?: Database["public"]["Enums"]["admin_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          is_active?: boolean
          last_seen_at?: string | null
          role?: Database["public"]["Enums"]["admin_role"]
          updated_at?: string
        }
        Relationships: []
      }
      application_notes: {
        Row: {
          application_id: string
          author_id: string | null
          body: string
          created_at: string
          id: string
        }
        Insert: {
          application_id: string
          author_id?: string | null
          body: string
          created_at?: string
          id?: string
        }
        Update: {
          application_id?: string
          author_id?: string | null
          body?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "application_notes_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "application_notes_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      application_status_history: {
        Row: {
          application_id: string
          changed_by: string | null
          created_at: string
          from_status: Database["public"]["Enums"]["application_status"] | null
          id: string
          to_status: Database["public"]["Enums"]["application_status"]
        }
        Insert: {
          application_id: string
          changed_by?: string | null
          created_at?: string
          from_status?: Database["public"]["Enums"]["application_status"] | null
          id?: string
          to_status: Database["public"]["Enums"]["application_status"]
        }
        Update: {
          application_id?: string
          changed_by?: string | null
          created_at?: string
          from_status?: Database["public"]["Enums"]["application_status"] | null
          id?: string
          to_status?: Database["public"]["Enums"]["application_status"]
        }
        Relationships: [
          {
            foreignKeyName: "application_status_history_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "application_status_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      applications: {
        Row: {
          age_range: Database["public"]["Enums"]["age_range"]
          assigned_to: string | null
          contacted_at: string | null
          converted_candidate_id: string | null
          created_at: string
          full_name: string
          gender: Database["public"]["Enums"]["gender"]
          id: string
          ip_hash: string | null
          phone: string
          promo_code: string | null
          source: string
          status: Database["public"]["Enums"]["application_status"]
          telegram: string
          updated_at: string
          user_agent: string | null
        }
        Insert: {
          age_range: Database["public"]["Enums"]["age_range"]
          assigned_to?: string | null
          contacted_at?: string | null
          converted_candidate_id?: string | null
          created_at?: string
          full_name: string
          gender: Database["public"]["Enums"]["gender"]
          id?: string
          ip_hash?: string | null
          phone: string
          promo_code?: string | null
          source?: string
          status?: Database["public"]["Enums"]["application_status"]
          telegram: string
          updated_at?: string
          user_agent?: string | null
        }
        Update: {
          age_range?: Database["public"]["Enums"]["age_range"]
          assigned_to?: string | null
          contacted_at?: string | null
          converted_candidate_id?: string | null
          created_at?: string
          full_name?: string
          gender?: Database["public"]["Enums"]["gender"]
          id?: string
          ip_hash?: string | null
          phone?: string
          promo_code?: string | null
          source?: string
          status?: Database["public"]["Enums"]["application_status"]
          telegram?: string
          updated_at?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "applications_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_converted_candidate_id_fkey"
            columns: ["converted_candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
        ]
      }
      candidate_achievements: {
        Row: {
          candidate_id: string
          created_at: string
          description: string | null
          id: string
          sort_order: number
          title: string
          year: number | null
        }
        Insert: {
          candidate_id: string
          created_at?: string
          description?: string | null
          id?: string
          sort_order?: number
          title: string
          year?: number | null
        }
        Update: {
          candidate_id?: string
          created_at?: string
          description?: string | null
          id?: string
          sort_order?: number
          title?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "candidate_achievements_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
        ]
      }
      candidate_categories: {
        Row: {
          candidate_id: string
          category_id: string
        }
        Insert: {
          candidate_id: string
          category_id: string
        }
        Update: {
          candidate_id?: string
          category_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "candidate_categories_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidate_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      candidate_education: {
        Row: {
          candidate_id: string
          created_at: string
          degree: string | null
          end_year: number | null
          id: string
          institution: string
          is_current: boolean
          level: Database["public"]["Enums"]["education_level"] | null
          sort_order: number
          start_year: number | null
        }
        Insert: {
          candidate_id: string
          created_at?: string
          degree?: string | null
          end_year?: number | null
          id?: string
          institution: string
          is_current?: boolean
          level?: Database["public"]["Enums"]["education_level"] | null
          sort_order?: number
          start_year?: number | null
        }
        Update: {
          candidate_id?: string
          created_at?: string
          degree?: string | null
          end_year?: number | null
          id?: string
          institution?: string
          is_current?: boolean
          level?: Database["public"]["Enums"]["education_level"] | null
          sort_order?: number
          start_year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "candidate_education_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
        ]
      }
      candidate_experience: {
        Row: {
          candidate_id: string
          created_at: string
          description: string | null
          id: string
          sort_order: number
          subtitle: string | null
          title: string
          year_label: string
        }
        Insert: {
          candidate_id: string
          created_at?: string
          description?: string | null
          id?: string
          sort_order?: number
          subtitle?: string | null
          title: string
          year_label: string
        }
        Update: {
          candidate_id?: string
          created_at?: string
          description?: string | null
          id?: string
          sort_order?: number
          subtitle?: string | null
          title?: string
          year_label?: string
        }
        Relationships: [
          {
            foreignKeyName: "candidate_experience_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
        ]
      }
      candidate_media: {
        Row: {
          alt: string | null
          candidate_id: string
          caption: string | null
          created_at: string
          id: string
          kind: Database["public"]["Enums"]["media_kind"]
          sort_order: number
          url: string
        }
        Insert: {
          alt?: string | null
          candidate_id: string
          caption?: string | null
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["media_kind"]
          sort_order?: number
          url: string
        }
        Update: {
          alt?: string | null
          candidate_id?: string
          caption?: string | null
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["media_kind"]
          sort_order?: number
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "candidate_media_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
        ]
      }
      candidate_projects: {
        Row: {
          candidate_id: string
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          sort_order: number
          title: string
          updated_at: string
          url: string | null
        }
        Insert: {
          candidate_id: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          sort_order?: number
          title: string
          updated_at?: string
          url?: string | null
        }
        Update: {
          candidate_id?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          sort_order?: number
          title?: string
          updated_at?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "candidate_projects_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
        ]
      }
      candidate_social_links: {
        Row: {
          candidate_id: string
          created_at: string
          id: string
          platform: string
          sort_order: number
          url: string
        }
        Insert: {
          candidate_id: string
          created_at?: string
          id?: string
          platform: string
          sort_order?: number
          url: string
        }
        Update: {
          candidate_id?: string
          created_at?: string
          id?: string
          platform?: string
          sort_order?: number
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "candidate_social_links_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
        ]
      }
      candidates: {
        Row: {
          about: string | null
          activity_field: string | null
          birth_date: string | null
          birth_place: string | null
          canonical_url: string | null
          created_at: string
          created_by: string | null
          direction: string | null
          full_name: string
          id: string
          intro: string | null
          is_featured: boolean
          keywords: string[]
          no_index: boolean
          og_description: string | null
          og_image_url: string | null
          og_title: string | null
          portrait_alt: string | null
          portrait_url: string | null
          primary_category_id: string | null
          projects_count: number | null
          published_at: string | null
          region_id: string | null
          search_vector: unknown
          seo_description: string | null
          seo_title: string | null
          slug: string
          sort_order: number
          specialization: string | null
          status: Database["public"]["Enums"]["candidate_status"]
          tagline: string | null
          title: string | null
          updated_at: string
          video_url: string | null
          view_count: number
          years_experience: number | null
        }
        Insert: {
          about?: string | null
          activity_field?: string | null
          birth_date?: string | null
          birth_place?: string | null
          canonical_url?: string | null
          created_at?: string
          created_by?: string | null
          direction?: string | null
          full_name: string
          id?: string
          intro?: string | null
          is_featured?: boolean
          keywords?: string[]
          no_index?: boolean
          og_description?: string | null
          og_image_url?: string | null
          og_title?: string | null
          portrait_alt?: string | null
          portrait_url?: string | null
          primary_category_id?: string | null
          projects_count?: number | null
          published_at?: string | null
          region_id?: string | null
          search_vector?: unknown
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          sort_order?: number
          specialization?: string | null
          status?: Database["public"]["Enums"]["candidate_status"]
          tagline?: string | null
          title?: string | null
          updated_at?: string
          video_url?: string | null
          view_count?: number
          years_experience?: number | null
        }
        Update: {
          about?: string | null
          activity_field?: string | null
          birth_date?: string | null
          birth_place?: string | null
          canonical_url?: string | null
          created_at?: string
          created_by?: string | null
          direction?: string | null
          full_name?: string
          id?: string
          intro?: string | null
          is_featured?: boolean
          keywords?: string[]
          no_index?: boolean
          og_description?: string | null
          og_image_url?: string | null
          og_title?: string | null
          portrait_alt?: string | null
          portrait_url?: string | null
          primary_category_id?: string | null
          projects_count?: number | null
          published_at?: string | null
          region_id?: string | null
          search_vector?: unknown
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          sort_order?: number
          specialization?: string | null
          status?: Database["public"]["Enums"]["candidate_status"]
          tagline?: string | null
          title?: string | null
          updated_at?: string
          video_url?: string | null
          view_count?: number
          years_experience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "candidates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidates_primary_category_id_fkey"
            columns: ["primary_category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidates_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          icon: string
          id: string
          is_active: boolean
          name: string
          seo_description: string | null
          seo_title: string | null
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string
          id?: string
          is_active?: boolean
          name: string
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string
          id?: string
          is_active?: boolean
          name?: string
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      hero_portraits: {
        Row: {
          alt: string | null
          candidate_id: string | null
          created_at: string
          id: string
          image_url: string
          is_active: boolean
          sort_order: number
          updated_at: string
        }
        Insert: {
          alt?: string | null
          candidate_id?: string | null
          created_at?: string
          id?: string
          image_url: string
          is_active?: boolean
          sort_order?: number
          updated_at?: string
        }
        Update: {
          alt?: string | null
          candidate_id?: string | null
          created_at?: string
          id?: string
          image_url?: string
          is_active?: boolean
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hero_portraits_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
        ]
      }
      promocodes: {
        Row: {
          code: string
          created_at: string
          id: string
          is_active: boolean
          label: string | null
          updated_at: string
          usage_count: number
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          is_active?: boolean
          label?: string | null
          updated_at?: string
          usage_count?: number
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          label?: string | null
          updated_at?: string
          usage_count?: number
        }
        Relationships: []
      }
      regions: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          is_public: boolean
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          is_public?: boolean
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Update: {
          is_public?: boolean
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "site_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      build_search_query: { Args: { p_query: string }; Returns: unknown }
      can_write: { Args: never; Returns: boolean }
      convert_application_to_candidate: {
        Args: { p_application_id: string }
        Returns: Json
      }
      filtered_candidates: {
        Args: { p_category: string; p_region: string; p_ts: unknown }
        Returns: {
          id: string
          rank: number
        }[]
      }
      get_admin_stats: { Args: never; Returns: Json }
      get_public_stats: { Args: never; Returns: Json }
      increment_candidate_view: { Args: { p_slug: string }; Returns: undefined }
      is_admin: { Args: never; Returns: boolean }
      kw_to_text: { Args: { arr: string[] }; Returns: string }
      normalize_promo: { Args: { raw: string }; Returns: string }
      normalize_telegram: { Args: { raw: string }; Returns: string }
      normalize_uz_phone: { Args: { raw: string }; Returns: string }
      quick_search: {
        Args: { p_limit?: number; p_query: string }
        Returns: Json
      }
      search_candidates: {
        Args: {
          p_category?: string
          p_limit?: number
          p_offset?: number
          p_query?: string
          p_region?: string
          p_sort?: string
        }
        Returns: Json
      }
      slugify: { Args: { value: string }; Returns: string }
      submit_application: {
        Args: {
          p_age_range: string
          p_full_name: string
          p_gender: string
          p_ip_hash?: string
          p_phone: string
          p_promo_code?: string
          p_telegram: string
          p_user_agent?: string
        }
        Returns: Json
      }
    }
    Enums: {
      admin_role: "owner" | "admin" | "editor" | "viewer"
      age_range: "14_18" | "19_24" | "25_29" | "35_plus"
      application_status:
        | "yangi"
        | "boglanildi"
        | "jarayonda"
        | "tasdiqlandi"
        | "rad_etildi"
        | "nomzodga_aylantirildi"
      candidate_status: "draft" | "published" | "archived"
      education_level:
        | "orta"
        | "orta_maxsus"
        | "bakalavr"
        | "magistr"
        | "doktorantura"
        | "kurs"
        | "boshqa"
      gender: "ayol" | "erkak"
      media_kind: "image" | "video" | "document"
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
      admin_role: ["owner", "admin", "editor", "viewer"],
      age_range: ["14_18", "19_24", "25_29", "35_plus"],
      application_status: [
        "yangi",
        "boglanildi",
        "jarayonda",
        "tasdiqlandi",
        "rad_etildi",
        "nomzodga_aylantirildi",
      ],
      candidate_status: ["draft", "published", "archived"],
      education_level: [
        "orta",
        "orta_maxsus",
        "bakalavr",
        "magistr",
        "doktorantura",
        "kurs",
        "boshqa",
      ],
      gender: ["ayol", "erkak"],
      media_kind: ["image", "video", "document"],
    },
  },
} as const
