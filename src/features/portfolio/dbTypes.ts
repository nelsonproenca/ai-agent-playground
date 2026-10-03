/**
 * Formato das linhas do portfólio (projetos, etapas, artefatos, pedidos e respostas), como o portal-api as devolve.
 * Só as 5 tabelas que o front usa, com os mesmos nomes de campo que a API devolve (snake_case).
 */

type Tabelas = {
  projetos: {
    Row: {
      categoria: string | null
      cliente_id: string
      created_at: string
      id: string
      imagem_capa_url: string | null
      link_url: string | null
      nome: string
      status_publico: string
      visibilidade: string
    }
    Insert: {
      categoria?: string | null
      cliente_id: string
      created_at?: string
      id?: string
      imagem_capa_url?: string | null
      link_url?: string | null
      nome: string
      status_publico?: string
      visibilidade?: string
    }
    Update: {
      categoria?: string | null
      cliente_id?: string
      created_at?: string
      id?: string
      imagem_capa_url?: string | null
      link_url?: string | null
      nome?: string
      status_publico?: string
      visibilidade?: string
    }
  }
  etapas: {
    Row: {
      created_at: string
      id: string
      nome: string
      ordem: number
      projeto_id: string
      status: string
    }
    Insert: {
      created_at?: string
      id?: string
      nome: string
      ordem?: number
      projeto_id: string
      status?: string
    }
    Update: {
      created_at?: string
      id?: string
      nome?: string
      ordem?: number
      projeto_id?: string
      status?: string
    }
  }
  artefatos: {
    Row: {
      created_at: string
      etapa_id: string | null
      id: string
      nome: string
      projeto_id: string
      tipo: string
      uploaded_by: string
      url: string
    }
    Insert: {
      created_at?: string
      etapa_id?: string | null
      id?: string
      nome: string
      projeto_id: string
      tipo?: string
      uploaded_by?: string
      url: string
    }
    Update: {
      created_at?: string
      etapa_id?: string | null
      id?: string
      nome?: string
      projeto_id?: string
      tipo?: string
      uploaded_by?: string
      url?: string
    }
  }
  pedidos: {
    Row: {
      created_at: string
      etapa_id: string | null
      id: string
      projeto_id: string
      status: string
      tipo: string
      titulo: string
    }
    Insert: {
      created_at?: string
      etapa_id?: string | null
      id?: string
      projeto_id: string
      status?: string
      tipo: string
      titulo: string
    }
    Update: {
      created_at?: string
      etapa_id?: string | null
      id?: string
      projeto_id?: string
      status?: string
      tipo?: string
      titulo?: string
    }
  }
  pedido_respostas: {
    Row: {
      arquivo_url: string | null
      created_at: string
      id: string
      pedido_id: string
      texto: string
    }
    Insert: {
      arquivo_url?: string | null
      created_at?: string
      id?: string
      pedido_id: string
      texto: string
    }
    Update: {
      arquivo_url?: string | null
      created_at?: string
      id?: string
      pedido_id?: string
      texto?: string
    }
  }
};

export type Tables<T extends keyof Tabelas> = Tabelas[T]["Row"];
export type TablesInsert<T extends keyof Tabelas> = Tabelas[T]["Insert"];
export type TablesUpdate<T extends keyof Tabelas> = Tabelas[T]["Update"];
