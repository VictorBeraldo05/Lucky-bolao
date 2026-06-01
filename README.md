# Lucky Bolões

MVP funcional de uma plataforma web de bolões online para loterias da Caixa, com foco inicial em `Lotofacil` e arquitetura pronta para expansão para `Mega-Sena`, `Quina`, `Lotomania`, `Dupla Sena`, `Timemania`, `Dia de Sorte`, `Super Sete` e outras modalidades.

## Stack

- `Next.js 16` com App Router e TypeScript
- `Tailwind CSS 4`
- `Prisma` com `PostgreSQL`
- Autenticação própria com `JWT` em cookie `httpOnly`
- Estrutura pronta para `Supabase` no banco, `Render` no backend/app e `Vercel` no frontend

## O que já está no MVP

- Área pública com home, loterias, Lotofácil, listagem de bolões, detalhe do bolão, como funciona, resultados, login e cadastro
- Área logada com minha conta, meus jogos, carteira, extrato, perfil, notificações, comprovantes e resgates
- Painel admin com dashboard, usuários, loterias, concursos, bolões, compras, pagamentos, resultados, prêmios e logs
- Fluxo de cadastro e login
- Compra de cotas com transação atômica
- Crédito manual via admin
- Publicação manual de resultado via admin
- Conferência de acertos dos jogos do bolão
- Distribuição proporcional de prêmios na carteira
- Auditoria e notificações básicas
- Schema Prisma completo com seed inicial da Lotofácil

## Credenciais demo

- Admin: `admin@luckyboloes.com`
- Cliente: `cliente@luckyboloes.com`
- Senha: `123456`

## Estrutura principal

```txt
prisma/
  schema.prisma
  seed.ts
  migrations/20260527190000_init/migration.sql

src/
  app/
    api/
    admin/
    loterias/
    boloes/
  components/
  lib/
```

## Modelagem de domínio

Entidades principais no Prisma:

- `User`
- `Wallet`
- `WalletTransaction`
- `Lottery`
- `LotteryGameType`
- `Contest`
- `ContestResult`
- `Pool`
- `PoolGame`
- `PoolShare`
- `Purchase`
- `PurchaseItem`
- `Payment`
- `Prize`
- `Notification`
- `AuditLog`

## Como rodar localmente

1. Instale dependências:

```bash
npm install
```

2. Copie `.env.example` para `.env` e ajuste:

```env
DATABASE_URL="postgresql://..."
JWT_SECRET="uma-chave-forte"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

PAYMENT_BACKEND_BASE_URL="https://lucky-bolao-backend.onrender.com"
PAYMENT_BACKEND_API_KEY="segredo-compartilhado-opcional"
MERCADOPAGO_BASE_URL="https://api.mercadopago.com"
MERCADOPAGO_ACCESS_TOKEN="seu-token-de-acesso-mercadopago"
MERCADOPAGO_WEBHOOK_SECRET="seu-segredo-de-webhook"
MERCADOPAGO_CHARGE_EXPIRATION_MINUTES="15"
MERCADOPAGO_ALLOW_APPROVED_WITHOUT_CPF="false"
MERCADOPAGO_ALLOW_APPROVED_WITH_MISMATCHED_CPF="false"
```

3. Gere o client do Prisma:

```bash
npm run prisma:generate
```

4. Rode a migration no seu banco:

```bash
npm run prisma:migrate
```

5. Popule dados iniciais:

```bash
npm run prisma:seed
```

6. Suba o projeto:

```bash
npm run dev
```

## Fluxos principais

### Compra de cota

1. Usuário autenticado escolhe um bolão
2. API valida status do bolão, cotas disponíveis e saldo da carteira
3. Sistema debita a carteira com segurança transacional
4. Sistema cria `Purchase`, `PurchaseItem`, `PoolShare`, `WalletTransaction`, `Notification` e `AuditLog`

### Crédito manual

1. Admin escolhe o usuário
2. Informa valor e descrição
3. Sistema cria `Payment` aprovado e `WalletTransaction`
4. Carteira é atualizada e a ação vai para auditoria

### Resultado e premiação

1. Admin informa concurso, dezenas sorteadas e faixa de prêmio
2. Sistema grava `ContestResult`
3. Sistema calcula acertos em cada `PoolGame`
4. Sistema soma prêmio do bolão
5. Sistema distribui o valor proporcionalmente às cotas compradas
6. Sistema grava `Prize`, `WalletTransaction`, `Notification` e `AuditLog`

## Integração Mercado Pago PIX

O app já inclui o fluxo de depósito via Mercado Pago PIX na página de carteira.
As variáveis necessárias são:

- `PAYMENT_BACKEND_BASE_URL` - URL pública do backend de pagamentos no Render.
- `PAYMENT_BACKEND_API_KEY` - segredo opcional para proteger as rotas do backend de pagamentos.
- `MERCADOPAGO_BASE_URL` - URL da API oficial do Mercado Pago (padrão: `https://api.mercadopago.com`).
- `MERCADOPAGO_ACCESS_TOKEN` - token de acesso da conta Mercado Pago.
- `MERCADOPAGO_WEBHOOK_SECRET` - segredo usado para validar webhooks de pagamento.
- `MERCADOPAGO_CHARGE_EXPIRATION_MINUTES` - tempo em minutos para expirar a cobrança PIX.
- `MERCADOPAGO_ALLOW_APPROVED_WITHOUT_CPF` - permite aprovar pagamentos sem CPF.
- `MERCADOPAGO_ALLOW_APPROVED_WITH_MISMATCHED_CPF` - permite aprovar pagamentos com CPF divergente.

### Contrato do backend de pagamentos

- `POST /v1/payments` - cria a cobrança PIX no Mercado Pago e devolve o payload bruto do pagamento.
- `GET /v1/payments/:paymentId` - consulta o pagamento no Mercado Pago e devolve o payload atualizado.
- `POST /wallet/webhooks/mercadopago` - recebe o webhook do Mercado Pago, valida assinatura e sincroniza carteira, pagamentos e carrinho no banco.

## Preparação para produção

### Supabase

- Crie um projeto Postgres no Supabase
- Use a `DATABASE_URL` com SSL no ambiente de produção
- Execute as migrations com Prisma

### Render

- Pode hospedar o app Next.js diretamente no Render
- Configure `DATABASE_URL`, `JWT_SECRET`, `NEXT_PUBLIC_APP_URL`, `MERCADOPAGO_ACCESS_TOKEN`, `MERCADOPAGO_WEBHOOK_SECRET` e, se quiser, `PAYMENT_BACKEND_API_KEY`
- Build command: `npm install && npm run prisma:generate && npm run build`
- Start command: `npm start`
- Aponte o webhook do Mercado Pago para `https://SEU-RENDER.onrender.com/wallet/webhooks/mercadopago`

### Vercel

- Configure `DATABASE_URL`, `JWT_SECRET`, `NEXT_PUBLIC_APP_URL`, `PAYMENT_BACKEND_BASE_URL` e, se estiver usando, `PAYMENT_BACKEND_API_KEY`
- Garanta que o banco seja migrado com `npx prisma migrate deploy`
- Se a Vercel não executar a migration automaticamente, adicione `npx prisma migrate deploy` antes do build

- Também pode publicar tudo na Vercel se preferir manter app único
- Configure as mesmas variáveis de ambiente
- Se optar por front separado depois, a base atual já facilita a extração de backend

## Próximos passos sugeridos

- Integrar gateway de pagamento
- Adicionar upload real de comprovantes com storage
- Criar permissões mais detalhadas para admin
- Adicionar filtros completos nas telas
- Separar serviço de resultados em job/queue
- Incluir testes automatizados de regras críticas

## Validação local realizada

- `npm run lint`
- `npm run prisma:generate`
- `npm run build`
