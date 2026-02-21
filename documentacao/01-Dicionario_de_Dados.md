# Dicionário de Dados - Ecossistema Nelson Proença Info

## Visão Geral
O sistema utiliza o Supabase (PostgreSQL) com 8 tabelas principais.

## Tabelas e Esquemas
### 1. agendamentos
Registra as reuniões agendadas pelo agente de IA disponivel no Instagram.

  id uuid not null default gen_random_uuid (),
  created_at timestamp with time zone null default now(),
  cliente_nome text null,
  cliente_email text null,
  cliente_whatsapp text null,
  data_reuniao timestamp with time zone not null,
  status text null default 'pendente'::text,
  instagram_user_id text null,
  expert_responsavel text null default 'Nelson Proença'::text,
  indicado_por text null default 'Nelson Proença'::text,
  origem text null default 'Site'::text,
  valor_projeto numeric(10, 2) null,
  comissao_paga boolean null default false,
  constraint agendamentos_pkey primary key (id)

### 2. clientes
  id uuid not null default extensions.uuid_generate_v4 (),
  created_at timestamp with time zone not null default timezone ('utc'::text, now()),
  nome text not null,
  email text not null,
  empresa text null,
  segmento text null,
  status text null default 'ativo'::text,
  logo_url text null,
  site_url text null,
  constraint clientes_pkey primary key (id),
  constraint clientes_email_key unique (email)


### 3. colaboradores
Armazena os dados dos colaboradores.

  id uuid not null default extensions.uuid_generate_v4 (),
  created_at timestamp with time zone not null default timezone ('utc'::text, now()),
  nome text not null,
  cargo text null,
  departamento text null,
  email text not null,
  foto_url text null,
  constraint colaboradores_pkey primary key (id),
  constraint colaboradores_email_key unique (email)

### 4. contatos_clientes
Armazena os dados dos contatos de cada cliente.

  id uuid not null default extensions.uuid_generate_v4 (),
  cliente_id uuid null,
  nome text not null,
  telefone text null,
  email text null,
  created_at timestamp with time zone null default timezone ('utc'::text, now()),
  constraint contatos_clientes_pkey primary key (id),
  constraint contatos_clientes_cliente_id_fkey foreign KEY (cliente_id) references clientes (id) on delete CASCADE

### 5. enrich_company
Armazena os dados de um desafio de IA para saber o que uma empresa precisa de serviços de automação.

  id uuid not null default gen_random_uuid (),
  company_name text null,
  segment text null,
  output_ai text null,
  created_at timestamp with time zone not null default now(),
  constraint enrich_company_pkey primary key (id)

### 6. leads_ia
Armazena os dados de um lead que se cadastrou pelo site.

  id uuid not null default gen_random_uuid (),
  nome text null,
  contato text null,
  desafio_tecnico text null,
  canal text null,
  created_at timestamp with time zone not null default timezone ('utc'::text, now()),
  visto_pelo_nelson boolean null default false,
  origem text null default 'Site_Institucional'::text,
  analise_ia text null,
  empresa text null,
  constraint leads_ia_pkey primary key (id)

### 6. leads_ia
Armazena os dados de um desafio que o Agente de IA recebe um erro e gera uma solução.

  id uuid not null default gen_random_uuid (),
  input_tecnico text null,
  tipo_analise text null,
  output_ia text null,
  created_at timestamp with time zone not null default now(),
  status text null,
  constraint playground_analise_pkey primary key (id)


## Relacionamentos Chave
- `agendamentos.indicado_por` -> `colaboradores.nome`
- `contatos_clientes.cliente_id` -> `clientes.id`