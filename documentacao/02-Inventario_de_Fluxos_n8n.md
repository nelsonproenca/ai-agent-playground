# Inventário de Automações - n8n

Este documento descreve os 4 fluxos principais que orquestram a inteligência do negócio.

## Fluxo 1: Agente de IA para responder a usuario pelo instagram
- **Gatilho:** Webhook do Instagram (Link de Referral `?ref=`).
- **Lógica:** Identifica o ID do colaborador via parâmetro `ref`, inicia a conversa no Instagram, verifica se o usuário quer agendar uma call, grava as informações da call na tabela `agendamentos`.
- **Saída:** Grava um agendamento no BD.
- **Nome do Arquivo:**[PRD]SiteNPI-AutomatedServiceInstagram.json

## Fluxo 2: Agente de IA que recebe informação de um form web e grava os dados em um BD e envia uma mensagem pelo telegram.
- **Gatilho:** Formulario Web no site da empresa(https://nelson-proenca-info.com.br).
- **Lógica:** O Agente de IA com base nos dados de conhecimento de um analista tente solucionar um problema.
- **Saída:** Resposta gravada em uma tabela no BD.
- **Nome do Arquivo:** [PRD]SiteNPI-AddLeads.json

## Fluxo 3: Agente de IA que vai ressolver um problema técinico ou um bug(erro) informado pelo usuário.
- **Gatilho:** Formulario Web no site da empresa(https://nelson-proenca-info.com.br).
- **Lógica:** O Agente de IA com base nos dados de conhecimento de um analista tenta solucionar um problema.
- **Saída:** Resposta gravada em uma tabela no BD.
- **Nome do Arquivo:** [PRD]SiteNPI-AddChallenger.json

## Fluxo 4: Agente de IA busca informações sobre empresa ou segmento e retorna possíveis serviços de automação
- **Gatilho:** Formulario Web no site da empresa(https://nelson-proenca-info.com.br).
- **Lógica:** O Agente de IA recebe as informações e faz uma pesquisa no Google sobre a empresa ou segmento. 
- **Saída:** Resposta gravada em uma tabela no BD.
- **Nome do Arquivo:** [PRD]SiteNPI-SearchCompany.json


## Contrato atual com o portal-api (03/10/2026, publicar depois do deploy)

Os fluxos 1 a 4 **não gravam mais em banco**: o `portal-api` grava o registro, chama o webhook do n8n (header
`X-Webhook-Secret`, credencial `SiteNPI Webhook Secret`) e o n8n devolve o resultado por HTTP no próprio
`portal-api` (`http://portal-api:8080`, mesma rede Docker `n8n_default`). O navegador nunca chama o n8n.

| Fluxo | Webhook novo | Corpo recebido | Callback |
|---|---|---|---|
| `[PRD]SiteNPI-AddLeads` | `/webhook/sitenpi-leads` | `{id, nome, empresa, contato, canal, desafioTecnico}` | `PATCH /leads/{id}/analise` `{analiseIa}` |
| `[PRD]SiteNPI-AddChallenger` | `/webhook/sitenpi-playground` | `{id, tipoAnalise, inputTecnico}` | `PATCH /playground/{id}/resultado` `{outputIa}` |
| `[PRD]SiteNPI-SearchCompany` | `/webhook/sitenpi-enriquecer-empresa` | `{id, nomeEmpresa, segmento}` | `PATCH /enrich/{id}/resultado` `{outputAi}` |
| `[PRD]SiteNPI-AutomatedServiceInstagram` | `/webhook/atendimento_instagram` (Meta, sem header; falta validar `X-Hub-Signature-256`) | payload da Meta | `POST /agendamentos` |

As colunas "Saída: gravada em tabela no BD" acima descrevem o desenho antigo (Supabase). Os paths antigos
(`leads-site`, `analise-tecnica`, `enriquecer-empresa`) deixam de existir quando os fluxos novos forem publicados.
