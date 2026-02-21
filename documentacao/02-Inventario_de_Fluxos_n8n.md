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

