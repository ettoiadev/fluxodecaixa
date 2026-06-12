# Fechamento Automático do Caixa

## Visão Geral

O sistema possui um mecanismo de fechamento automático do caixa que executa diariamente às 23:59, caso o caixa ainda esteja aberto.

## Como Funciona

### 1. Edge Function

A Edge Function `fechar-caixa-automatico` foi criada no Supabase e realiza as seguintes operações:

- Busca caixas com status "aberto" para a data atual
- Calcula totais das movimentações (entradas, saídas, PIX, cartão, dinheiro)
- Insere registro na tabela `fechamentos`
- Atualiza o status do caixa para "fechado"
- Adiciona observação "Fechamento automático às 23:59"

### 2. Agendamento

O agendamento é configurado via GitHub Actions, que executa diariamente às 23:59 (horário de Brasília, UTC-3).

**Arquivo:** `.github/workflows/fechar-caixa-automatico.yml`

### 3. Execução Manual

Para testar ou executar manualmente:

```bash
curl -X POST \
  'https://ivcpnoowicrlfqnxqwyz.supabase.co/functions/v1/fechar-caixa-automatico' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2Y3Bub293aWNybGZxbnhxd3l6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgzMjkzMjEsImV4cCI6MjA5MzkwNTMyMX0.8LrAiJpwpicbHrYTbRyHfcnPXs_9QSNRSaWnZ4M1dn0' \
  -H 'Content-Type: application/json'
```

Ou via GitHub Actions:
1. Acesse o repositório no GitHub
2. Vá em "Actions"
3. Selecione o workflow "Fechar Caixa Automaticamente"
4. Clique em "Run workflow"

## Lógica de Fechamento Automático

No fechamento automático, o sistema assume que:
- O dinheiro físico no caixa é igual ao saldo calculado
- O valor entregue ao gestor é R$ 0,00
- O caixa "bateu" (está correto)

Isso é feito para garantir que o caixa seja fechado mesmo sem intervenção manual.

## Observações

- O fechamento automático é um mecanismo de segurança
- Recomenda-se sempre fechar o caixa manualmente quando possível
- O fechamento automático adiciona uma observação identificando que foi automático
- Se o caixa já estiver fechado, a função não faz nada

## Troubleshooting

### Verificar logs da Edge Function

1. Acesse o dashboard do Supabase
2. Vá em "Edge Functions"
3. Selecione "fechar-caixa-automatico"
4. Verifique os logs de execução

### Verificar se o workflow está rodando

1. Acesse o repositório no GitHub
2. Vá em "Actions"
3. Verifique o histórico de execuções do workflow "Fechar Caixa Automaticamente"

## Configuração do Horário

O horário está configurado para 23:59 UTC-3 (horário de Brasília). Se precisar ajustar:

1. Edite o arquivo `.github/workflows/fechar-caixa-automatico.yml`
2. Modifique o cron schedule:
   - Formato: `minuto hora * * *`
   - Exemplo para 23:59 UTC-3: `59 20 * * *` (20:59 UTC = 23:59 UTC-3)
