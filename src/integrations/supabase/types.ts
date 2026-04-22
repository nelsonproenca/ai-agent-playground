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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      admin_audit_log: {
        Row: {
          action: string
          changed_at: string
          changed_by: string
          changed_by_email: string | null
          details: Json | null
          entity_id: string | null
          entity_name: string | null
          entity_type: string
          id: string
          plan_id: string | null
          plan_name: string | null
          previous_highlighted_plan_id: string | null
          previous_highlighted_plan_name: string | null
        }
        Insert: {
          action: string
          changed_at?: string
          changed_by: string
          changed_by_email?: string | null
          details?: Json | null
          entity_id?: string | null
          entity_name?: string | null
          entity_type: string
          id?: string
          plan_id?: string | null
          plan_name?: string | null
          previous_highlighted_plan_id?: string | null
          previous_highlighted_plan_name?: string | null
        }
        Update: {
          action?: string
          changed_at?: string
          changed_by?: string
          changed_by_email?: string | null
          details?: Json | null
          entity_id?: string | null
          entity_name?: string | null
          entity_type?: string
          id?: string
          plan_id?: string | null
          plan_name?: string | null
          previous_highlighted_plan_id?: string | null
          previous_highlighted_plan_name?: string | null
        }
        Relationships: []
      }
      agendamentos: {
        Row: {
          cliente_email: string | null
          cliente_nome: string | null
          cliente_whatsapp: string | null
          comissao_paga: boolean | null
          created_at: string | null
          data_reuniao: string
          expert_responsavel: string | null
          id: string
          indicado_por: string | null
          instagram_user_id: string | null
          origem: string | null
          status: string | null
          valor_projeto: number | null
        }
        Insert: {
          cliente_email?: string | null
          cliente_nome?: string | null
          cliente_whatsapp?: string | null
          comissao_paga?: boolean | null
          created_at?: string | null
          data_reuniao: string
          expert_responsavel?: string | null
          id?: string
          indicado_por?: string | null
          instagram_user_id?: string | null
          origem?: string | null
          status?: string | null
          valor_projeto?: number | null
        }
        Update: {
          cliente_email?: string | null
          cliente_nome?: string | null
          cliente_whatsapp?: string | null
          comissao_paga?: boolean | null
          created_at?: string | null
          data_reuniao?: string
          expert_responsavel?: string | null
          id?: string
          indicado_por?: string | null
          instagram_user_id?: string | null
          origem?: string | null
          status?: string | null
          valor_projeto?: number | null
        }
        Relationships: []
      }
      camera_health_config: {
        Row: {
          admin_email: string | null
          admin_phone: string | null
          admin_whatsapp: string | null
          check_interval_minutes: number
          created_at: string
          id: string
          notify_after_failures: number
          updated_at: string
        }
        Insert: {
          admin_email?: string | null
          admin_phone?: string | null
          admin_whatsapp?: string | null
          check_interval_minutes?: number
          created_at?: string
          id?: string
          notify_after_failures?: number
          updated_at?: string
        }
        Update: {
          admin_email?: string | null
          admin_phone?: string | null
          admin_whatsapp?: string | null
          check_interval_minutes?: number
          created_at?: string
          id?: string
          notify_after_failures?: number
          updated_at?: string
        }
        Relationships: []
      }
      camera_health_logs: {
        Row: {
          camera_id: string
          checked_at: string
          error_message: string | null
          id: string
          response_time_ms: number | null
          status: string
        }
        Insert: {
          camera_id: string
          checked_at?: string
          error_message?: string | null
          id?: string
          response_time_ms?: number | null
          status?: string
        }
        Update: {
          camera_id?: string
          checked_at?: string
          error_message?: string | null
          id?: string
          response_time_ms?: number | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "camera_health_logs_camera_id_fkey"
            columns: ["camera_id"]
            isOneToOne: false
            referencedRelation: "cameras"
            referencedColumns: ["id"]
          },
        ]
      }
      cameras: {
        Row: {
          created_at: string
          display_name: string
          hls_base_url: string | null
          id: string
          internal_stream_key: string
          is_active: boolean
          location: string | null
          owner_user_id: string | null
          slug: string | null
        }
        Insert: {
          created_at?: string
          display_name: string
          hls_base_url?: string | null
          id?: string
          internal_stream_key: string
          is_active?: boolean
          location?: string | null
          owner_user_id?: string | null
          slug?: string | null
        }
        Update: {
          created_at?: string
          display_name?: string
          hls_base_url?: string | null
          id?: string
          internal_stream_key?: string
          is_active?: boolean
          location?: string | null
          owner_user_id?: string | null
          slug?: string | null
        }
        Relationships: []
      }
      clientes: {
        Row: {
          created_at: string
          email: string
          empresa: string | null
          id: string
          logo_url: string | null
          nome: string
          segmento: string | null
          site_url: string | null
          status: string | null
        }
        Insert: {
          created_at?: string
          email: string
          empresa?: string | null
          id?: string
          logo_url?: string | null
          nome: string
          segmento?: string | null
          site_url?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          empresa?: string | null
          id?: string
          logo_url?: string | null
          nome?: string
          segmento?: string | null
          site_url?: string | null
          status?: string | null
        }
        Relationships: []
      }
      colaboradores: {
        Row: {
          cargo: string | null
          created_at: string
          departamento: string | null
          email: string
          foto_url: string | null
          id: string
          nome: string
        }
        Insert: {
          cargo?: string | null
          created_at?: string
          departamento?: string | null
          email: string
          foto_url?: string | null
          id?: string
          nome: string
        }
        Update: {
          cargo?: string | null
          created_at?: string
          departamento?: string | null
          email?: string
          foto_url?: string | null
          id?: string
          nome?: string
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          phone: string | null
          prefer_whats_app: boolean | null
          subject: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          phone?: string | null
          prefer_whats_app?: boolean | null
          subject?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          phone?: string | null
          prefer_whats_app?: boolean | null
          subject?: string
        }
        Relationships: []
      }
      contatos_clientes: {
        Row: {
          cliente_id: string | null
          created_at: string | null
          email: string | null
          id: string
          nome: string
          telefone: string | null
        }
        Insert: {
          cliente_id?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          nome: string
          telefone?: string | null
        }
        Update: {
          cliente_id?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          nome?: string
          telefone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contatos_clientes_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      enrich_company: {
        Row: {
          company_name: string | null
          created_at: string
          id: string
          output_ai: string | null
          segment: string | null
        }
        Insert: {
          company_name?: string | null
          created_at?: string
          id?: string
          output_ai?: string | null
          segment?: string | null
        }
        Update: {
          company_name?: string | null
          created_at?: string
          id?: string
          output_ai?: string | null
          segment?: string | null
        }
        Relationships: []
      }
      leads_ia: {
        Row: {
          analise_ia: string | null
          canal: string | null
          contato: string | null
          created_at: string
          desafio_tecnico: string | null
          empresa: string | null
          id: string
          nome: string | null
          origem: string | null
          visto_pelo_nelson: boolean | null
        }
        Insert: {
          analise_ia?: string | null
          canal?: string | null
          contato?: string | null
          created_at?: string
          desafio_tecnico?: string | null
          empresa?: string | null
          id?: string
          nome?: string | null
          origem?: string | null
          visto_pelo_nelson?: boolean | null
        }
        Update: {
          analise_ia?: string | null
          canal?: string | null
          contato?: string | null
          created_at?: string
          desafio_tecnico?: string | null
          empresa?: string | null
          id?: string
          nome?: string | null
          origem?: string | null
          visto_pelo_nelson?: boolean | null
        }
        Relationships: []
      }
      pending_payments: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          camera_id: string
          created_at: string
          id: string
          plan_name: string
          plan_sku: string
          receipt_url: string | null
          status: string
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          camera_id: string
          created_at?: string
          id?: string
          plan_name: string
          plan_sku: string
          receipt_url?: string | null
          status?: string
          user_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          camera_id?: string
          created_at?: string
          id?: string
          plan_name?: string
          plan_sku?: string
          receipt_url?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pending_payments_camera_id_fkey"
            columns: ["camera_id"]
            isOneToOne: false
            referencedRelation: "cameras"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          active: boolean
          created_at: string
          cta: string
          display_order: number
          features: Json
          highlight: boolean
          id: string
          name: string
          num: string
          period: string
          price: string
          sku: string
          suffix: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          cta: string
          display_order?: number
          features?: Json
          highlight?: boolean
          id?: string
          name: string
          num: string
          period: string
          price: string
          sku: string
          suffix: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          cta?: string
          display_order?: number
          features?: Json
          highlight?: boolean
          id?: string
          name?: string
          num?: string
          period?: string
          price?: string
          sku?: string
          suffix?: string
          updated_at?: string
        }
        Relationships: []
      }
      playground_analise: {
        Row: {
          created_at: string
          id: string
          input_tecnico: string | null
          output_ia: string | null
          status: string | null
          tipo_analise: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          input_tecnico?: string | null
          output_ia?: string | null
          status?: string | null
          tipo_analise?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          input_tecnico?: string | null
          output_ia?: string | null
          status?: string | null
          tipo_analise?: string | null
        }
        Relationships: []
      }
      produtos_dtc: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          descriptionhtml: string | null
          id: string
          image_url: string | null
          name: string
          price: number
          producttype: string | null
          shopify_id: string | null
          shopify_variant_id: string | null
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          descriptionhtml?: string | null
          id?: string
          image_url?: string | null
          name: string
          price: number
          producttype?: string | null
          shopify_id?: string | null
          shopify_variant_id?: string | null
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          descriptionhtml?: string | null
          id?: string
          image_url?: string | null
          name?: string
          price?: number
          producttype?: string | null
          shopify_id?: string | null
          shopify_variant_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          access_released_at: string | null
          admin_request_status: string
          avatar_url: string | null
          created_at: string
          display_name: string | null
          document_number: number | null
          email: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          access_released_at?: string | null
          admin_request_status?: string
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          document_number?: number | null
          email?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          access_released_at?: string | null
          admin_request_status?: string
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          document_number?: number | null
          email?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          camera_id: string
          created_at: string
          expires_at: string
          id: string
          plan_type: string
          user_id: string
        }
        Insert: {
          camera_id: string
          created_at?: string
          expires_at: string
          id?: string
          plan_type: string
          user_id: string
        }
        Update: {
          camera_id?: string
          created_at?: string
          expires_at?: string
          id?: string
          plan_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_camera_id_fkey"
            columns: ["camera_id"]
            isOneToOne: false
            referencedRelation: "cameras"
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      approve_admin_request: { Args: { _user_id: string }; Returns: undefined }
      approve_pending_payment: {
        Args: { _payment_id: string }
        Returns: undefined
      }
      get_my_access_status: {
        Args: never
        Returns: {
          access_released_at: string
          admin_request_status: string
          is_admin: boolean
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      list_pending_admin_requests: {
        Args: never
        Returns: {
          access_released_at: string
          created_at: string
          display_name: string
          email: string
          user_id: string
        }[]
      }
      list_pending_payments_admin: {
        Args: never
        Returns: {
          approved_at: string
          camera_id: string
          camera_name: string
          created_at: string
          id: string
          plan_name: string
          plan_sku: string
          receipt_url: string
          status: string
          user_display_name: string
          user_email: string
          user_id: string
        }[]
      }
      list_users_with_admin_status: {
        Args: never
        Returns: {
          created_at: string
          display_name: string
          email: string
          is_admin: boolean
          user_id: string
        }[]
      }
      reject_admin_request: { Args: { _user_id: string }; Returns: undefined }
      reject_pending_payment: {
        Args: { _payment_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
    },
  },
} as const
