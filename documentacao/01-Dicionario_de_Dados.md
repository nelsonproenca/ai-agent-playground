# Dicionário de Dados - Ecossistema Nelson Proença Info

## Visão Geral
O sistema utiliza o Supabase (PostgreSQL) com 17 tabelas principais, divididas entre o site institucional e o módulo Watchtower Hub.

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


## Relacionamentos Chave (Site Principal)
- `agendamentos.indicado_por` -> `colaboradores.nome`
- `contatos_clientes.cliente_id` -> `clientes.id`

---

## Tabelas do Módulo Watchtower Hub

### 8. profiles
Perfil do usuário autenticado, criado automaticamente no signup via trigger.

  id uuid not null default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  display_name text null,
  avatar_url text null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint profiles_pkey primary key (id)

RLS: Usuário vê/insere/atualiza apenas seu próprio perfil.

### 9. cameras
Cadastro das câmeras disponíveis para monitoramento. Suporta atribuição opcional a um usuário específico (câmera privada).

  id uuid not null default gen_random_uuid(),
  display_name text not null,
  internal_stream_key text not null,
  location text null,
  owner_user_id uuid null,
  created_at timestamp with time zone not null default now(),
  constraint cameras_pkey primary key (id)

RLS:
- SELECT: Usuário vê câmeras públicas (`owner_user_id IS NULL`), as suas próprias, ou todas se for admin.
- INSERT/UPDATE/DELETE: Apenas admins (validado via `has_role(auth.uid(), 'admin')`).

### 10. subscriptions
Assinaturas de acesso dos usuários às câmeras.

  id uuid not null default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  camera_id uuid not null references cameras(id) on delete cascade,
  plan_type text not null,
  expires_at timestamp with time zone not null,
  created_at timestamp with time zone not null default now(),
  constraint subscriptions_pkey primary key (id),
  constraint subscriptions_user_id_camera_id_key unique (user_id, camera_id)

Valores válidos para `plan_type`: '24h', 'bronze', 'prata', 'ouro' (validado via trigger).
RLS: Usuário vê/insere apenas suas próprias assinaturas.

### 11. pending_payments
Registros de pagamentos Pix pendentes de confirmação.

  id uuid not null default gen_random_uuid(),
  created_at timestamp with time zone not null default now(),
  user_id uuid not null,
  camera_id uuid not null references cameras(id),
  plan_sku text not null,
  plan_name text not null,
  status text not null default 'pending',
  receipt_url text null,
  constraint pending_payments_pkey primary key (id)

RLS: Usuário insere/vê apenas seus próprios pagamentos.

### 12. contact_messages
Mensagens enviadas pelo formulário de contato do Watchtower.

  id uuid not null default gen_random_uuid(),
  created_at timestamp with time zone not null default now(),
  name text not null,
  email text not null,
  message text not null,
  constraint contact_messages_pkey primary key (id)

RLS: Qualquer pessoa (anon/authenticated) pode inserir.

### 13. camera_health_logs
Registros de verificações de status (health check) das câmeras.

  id uuid not null default gen_random_uuid(),
  camera_id uuid not null references cameras(id) on delete cascade,
  status text not null default 'unknown',
  response_time_ms integer null,
  error_message text null,
  checked_at timestamp with time zone not null default now(),
  constraint camera_health_logs_pkey primary key (id)

Índices: `camera_id`, `checked_at DESC`.
RLS: Usuários autenticados podem visualizar e inserir.

### 14. camera_health_config
Configurações de alertas do sistema de health check (tabela de linha única).

  id uuid not null default gen_random_uuid(),
  admin_email text null,
  admin_phone text null,
  admin_whatsapp text null,
  check_interval_minutes integer not null default 5,
  notify_after_failures integer not null default 2,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint camera_health_config_pkey primary key (id)

RLS: Usuários autenticados podem visualizar e atualizar.
Trigger: `updated_at` atualizado automaticamente.

### 15. user_roles
Sistema RBAC (Role-Based Access Control). Armazena os papéis (admin/user) de cada usuário em tabela separada para evitar ataques de privilege escalation.

  id uuid not null default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role app_role not null,
  created_at timestamp with time zone not null default now(),
  constraint user_roles_pkey primary key (id),
  constraint user_roles_user_id_role_key unique (user_id, role)

Enum `app_role`: `'admin' | 'user'`.

Função de segurança: `has_role(_user_id uuid, _role app_role) RETURNS boolean` (SECURITY DEFINER) — usada em policies RLS para evitar recursão.

RLS:
- SELECT: Usuário vê seus próprios papéis; admins veem todos.
- ALL: Apenas admins podem gerenciar (insert/update/delete).

### 16. plans
Catálogo dinâmico dos planos exibidos na landing page do Watchtower (substitui valores hardcoded).

  id uuid not null default gen_random_uuid(),
  sku text not null,
  name text not null,
  num text not null,
  price text not null,
  suffix text not null,
  period text not null,
  features jsonb not null default '[]'::jsonb,
  cta text not null,
  highlight boolean not null default false,
  active boolean not null default true,
  display_order integer not null default 0,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint plans_pkey primary key (id)

RLS:
- SELECT: Qualquer pessoa (anon/authenticated) vê planos com `active = true`; admins veem todos.
- INSERT/UPDATE/DELETE: Apenas admins.

## Relacionamentos Chave (Watchtower)
- `profiles.user_id` -> `auth.users.id`
- `subscriptions.user_id` -> `auth.users.id`
- `subscriptions.camera_id` -> `cameras.id`
- `pending_payments.camera_id` -> `cameras.id`
- `pending_payments.approved_by` -> `auth.users.id`
- `camera_health_logs.camera_id` -> `cameras.id`
- `cameras.owner_user_id` -> `auth.users.id`
- `user_roles.user_id` -> `auth.users.id`

## Funções RPC Administrativas (Watchtower)
- `has_role(_user_id, _role)` — verifica papel do usuário (SECURITY DEFINER, anti-recursão).
- `list_users_with_admin_status()` — lista usuários com flag `is_admin` (apenas admins).
- `list_pending_payments_admin()` — lista pagamentos Pix pendentes com dados do usuário e câmera (apenas admins).
- `approve_pending_payment(_payment_id)` — aprova pagamento e cria assinatura (apenas admins).
- `reject_pending_payment(_payment_id)` — rejeita pagamento (apenas admins).