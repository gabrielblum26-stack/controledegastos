# Controle de Gastos - versão Vercel

Aplicação em **Next.js + Prisma + PostgreSQL** pronta para subir na Vercel.

## Banco de dados escolhido

Eu escolhi **Neon (Postgres)**.

Motivos:
- integra bem com projetos hospedados na Vercel via Marketplace
- é um Postgres serverless com autoscaling e branching
- Prisma tem documentação oficial para fluxo com Next.js e deploy na Vercel usando Postgres

## Funcionalidades

- seleção de perfil: marido ou mulher
- dashboard mensal
- total do mês
- total por pessoa
- gráfico por dia
- extrato detalhado
- cadastrar gasto
- **editar gasto**
- **excluir gasto**

## Rodar localmente

```bash
npm install
cp .env.example .env
# preencha DATABASE_URL
npx prisma migrate deploy
npm run dev
```

## Popular com exemplo (opcional)

```bash
npm run seed
```

## Subir na Vercel

1. Crie um projeto na Vercel.
2. Crie um banco **Neon Postgres**.
3. Copie a string de conexão para a variável `DATABASE_URL`.
4. No projeto da Vercel, adicione a variável `DATABASE_URL`.
5. Faça o deploy.

## Comandos úteis

```bash
npx prisma studio
npx prisma migrate dev --name init
npx prisma migrate deploy
```

## Estrutura principal

- `app/` interface e rotas da API
- `components/` dashboard
- `prisma/` schema e migration inicial
- `lib/` prisma, resumo mensal e formatadores
