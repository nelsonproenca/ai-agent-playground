# Arquitetura de Interface - Lovable

O sistema possui 10 páginas divididas em duas camadas.

## Camada Pública
- **Landing Pages:** Focadas em nichos (Médicos, Advogados, Lojistas e etc...).
- **Formulários de Captura:** Integrados ao n8n.

## Index 
0. **URL:** https://nelson-proenca-info.com.br
1. **Link para acessar o playground:** Teste consultoria IA em tempo real e enriquecimento de leads com automações n8n `/playground`.
2. **Atendimento Automatizado:** Abre link do Instagram.
3. **Fale comigo:** Descreva seu projeto ou problema e entrarei em contato para discutirmos a melhor solução `/contato`.
4. **Colaboradores:** Lista dos colaboradores da empresa `/colabs`.
5. **Clientes:** Lista dos clientes da empresa `/clientes`.
6. **Área Restrita:** Gerenciamento do site `/dashboard`.

## Camada Restrita (area restrita)
1. **Dashboard de Leads:** Visão geral da tabela `leads_ia`.
2. **Colaboradores:** CRUD da tabela `colaboradores`.
3. **Clientes:** CRUD da tabela `clientes`.
4. **Dashboard de Agendamentos :** Visão geral da tabela `agendamentos`.
5. **Gerador de Convites:** Interface que gera links `ig.me` com o nome do colaborador.
6. **Flyer para Impressao:** Interface que gera o template para impressao do flyer para o Marketing Direto.

## Playground 
1. **Novo Desafio:** Enviar Desafio Técnico e dados do novo lead para cadastro na tabela `leads_ia`.
2. **Tech Playground:** Cole seu código, logs, bugs ou query SQL e receba uma análise técnica do agente IA.
3. **Lead Enricher:** Informe o domínio ou segmento. O agente IA pesquisa a web e gera sugestões de automação.


