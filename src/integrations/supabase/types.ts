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
      cameras: {
        Row: {
          created_at: string
          display_name: string
          id: string
          internal_stream_key: string
          location: string | null
        }
        Insert: {
          created_at?: string
          display_name: string
          id?: string
          internal_stream_key: string
          location?: string | null
        }
        Update: {
          created_at?: string
          display_name?: string
          id?: string
          internal_stream_key?: string
          location?: string | null
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
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
