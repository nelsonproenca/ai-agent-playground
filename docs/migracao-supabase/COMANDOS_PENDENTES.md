# Fases 1 a 4: o que falta rodar (VPS, n8n, Meta e navegador)

O código das fases 1 a 4 está pronto e testado localmente (ver "Resultado" no [PLANO.md](PLANO.md)). O que sobra
é o que **só você consegue fazer** (acesso à VPS, ao n8n e à Meta) e a **ordem** é importante: o deploy da API
aplica 2 migrations; o segredo do n8n precisa existir nos dois lados antes de publicar os fluxos.

Legenda do lugar: **LOCAL** = Git Bash no seu PC, na raiz do workspace · **VPS** = PuTTY em `191.252.220.204` ·
**n8n** = https://n8n.nelson-proenca-info.com.br · **ME** = você me chama e eu faço pelo MCP.

Nada aqui imprime segredo. **Não cole segredos no chat.**

---

## 1. Gerar o segredo do n8n (LOCAL)

```bash
openssl rand -hex 32
```

Copie o valor para um bloco de notas **por alguns minutos**: ele vai em dois lugares (passo 2 e passo 5) e depois
você apaga. Não cole no chat.

## 2. Criar as credenciais no n8n (n8n, pelo navegador)

Menu **Credentials → Create credential → Header Auth**:

| Nome da credencial | Name (header) | Value |
|---|---|---|
| `SiteNPI Webhook Secret` | `X-Webhook-Secret` | o segredo do passo 1 |
| `Instagram Graph Token` | `Authorization` | `Bearer ` + o **token novo** da Meta (passo 3) |

## 3. Rotacionar o token da Meta (navegador, developers.facebook.com)

O token antigo estava **escrito dentro do fluxo** do Instagram (e passou por logs/conversas). Trate como vazado:
no app da Meta, gere um novo token do Instagram e **revogue o antigo**. Use o novo na credencial do passo 2.
Em seguida, anote o **App Secret** do app (Configurações → Básico): ele será usado para validar a assinatura
`X-Hub-Signature-256` (item pendente, ver "Ainda não feito" no fim).

## 4. Deploy da API (LOCAL, raiz do workspace)

```bash
bash deploy.sh portal back
```

O build local roda antes. Ao subir, a API aplica sozinha as migrations `AddCrm` (6 tabelas) e
`AddClienteLoginTokens`. **Como desfazer:** o código antigo continua no histórico do repositório; as migrations só
criam tabelas novas (não alteram as existentes). Se algo falhar: `ssh root@191.252.220.204 'docker logs portal-api --tail 50'`.

## 5. Gravar o segredo na VPS (VPS)

```bash
cd /opt/portal-backend-src
bash scripts/vps-portal.sh set-n8n-secret
```

Cole o **mesmo** segredo do passo 1 (não aparece na tela). O script grava em `.env` (chmod 600) e recria o
`portal-api`.

## 6. Levar o backup para a VPS (VPS e depois LOCAL)

Contém dados de terceiros (leads, agendamentos): fica na VPS só durante o import.

```bash
# VPS
mkdir -p /root/portal-import && chmod 700 /root/portal-import
```

```powershell
# LOCAL (PowerShell). Copia só tables/ e uploads/ (não os CSVs de schema).
pscp -r E:\Backups\supabase-2026-10-02\tables root@191.252.220.204:/root/portal-import/
pscp -r E:\Backups\supabase-2026-10-02\uploads root@191.252.220.204:/root/portal-import/
```

## 7. Importar (VPS)

```bash
cd /opt/portal-backend-src
free -h                                   # confira "available" > 700 MB antes (a VPS tem 3,8 GB)
bash scripts/vps-portal.sh import         # SIMULAÇÃO: nada é gravado
```

A simulação deve mostrar (do backup real, já conferido localmente): `colaboradores 3`, `contatos_clientes 0`,
`leads_ia 5`, `agendamentos 5`, `enrich_company 2`, `playground_analise 0`, **0 puladas** e
`uploads: 1 a copiar`. Se estiver assim:

```bash
bash scripts/vps-portal.sh import --apply
rm -rf /root/portal-import                # apaga o backup da VPS
```

É idempotente: rodar de novo não duplica.

## 8. Smoke test da API (VPS)

```bash
bash scripts/vps-portal.sh smoke
```

Esperado: todos `OK`, contagens `Clientes 2 / Colaboradores 3 / ContatosClientes 0 / LeadsIa 5 / Agendamentos 5 /
EnrichCompany 2 / PlaygroundAnalises 0` e `smoke test sem falhas`. Se a contagem de `Clientes` não for 2, **pare**
e me chame.

## 9. Deploy do site (LOCAL, raiz do workspace)

```bash
bash deploy.sh portal front
```

## 10. Me chame (ME): vincular credenciais, publicar os 4 fluxos e testar

Eu faço: ligar as credenciais `SiteNPI Webhook Secret` e `Instagram Graph Token` aos nodes, publicar os 4 fluxos
(`AddLeads`, `AddChallenger`, `SearchCompany`, `AutomatedServiceInstagram`), arquivar os paths antigos e conferir as
execuções. Só publico depois dos passos 4 a 9.

## 11. Checklist no navegador (https://www.nelson-proenca-info.com.br)

- [ ] `/login` (admin) entra; `/admin/colaboradores` lista 3 e permite criar, editar e excluir um de teste
- [ ] `/admin/clientes`: criar um contato num cliente e excluir
- [ ] Home: enviar o formulário de lead (nome/contato/desafio de TESTE) → aparece em `/admin/leads` e, em ~1 min, a
      análise da IA chega e **1 mensagem** no Telegram
- [ ] `/playground`: enviar uma análise → o resultado aparece (polling) em até ~1 min
- [ ] Enriquecer empresa (home): idem
- [ ] `/admin/agendamentos`: lista 5; mudar status e marcar comissão
- [ ] `/convites`: gerar um QR, ele salva e aparece na galeria; excluir
- [ ] `/landing`: mostra o convite do Nelson Proença (o arquivo importado)
- [ ] `/colabs` e `/clientes`: vitrines carregam
- [ ] `/portal` (aba anônima): informar o e-mail de um cliente → chega o e-mail → o link abre `/portal/entrar` →
      entra no portal. O mesmo link, aberto uma 2ª vez, deve dizer "inválido ou expirado".
- [ ] Admin: `/admin/projetos` continua funcionando (cookie do admin não foi afetado)

## Ainda não feito (depende de você ou de teste real)

1. **Assinatura da Meta** (`X-Hub-Signature-256`) no webhook do Instagram: precisa do App Secret e de um jeito de
   guardá-lo (credencial/variável do n8n). O webhook da Meta continua **sem autenticação**, como antes. Quando for
   fazer, me chame.
2. **Fluxo do Instagram nunca foi testado de ponta a ponta**: ele estava com defeitos antes (o `Merge` gerava 2
   itens, o `Edit Fields` descartava o corpo, expressões sem `$`); corrigi o que era evidente e testei com dados
   simulados, mas a leitura do JSON que o agente devolve no meio do texto é frágil. Teste com uma mensagem real e
   me diga o resultado.
3. **Fase 6 (encerrar o Supabase)**: só depois de ~1 semana estável: apagar a credencial `Supabase account` e
   `Supabase account 2` no n8n, revogar a chave anon, e decidir se apaga o projeto. Não faça antes.
4. **Commit e push** dos dois repos (`portal-api`, `portal-web`): me peça quando quiser (um commit por assunto,
   por repo). Os arquivos do `.claude/` e `docs/` da raiz do workspace não têm git.
