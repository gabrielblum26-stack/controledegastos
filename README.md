# Controle de Gastos - Next.js + Neon

Versão simples e funcional para subir na Vercel, com:

- seleção de perfil (Marido / Mulher)
- dashboard mensal
- gráfico por dia
- cadastro de gasto
- edição de gasto
- exclusão de gasto
- banco Postgres com Neon

## Banco escolhido

Escolhi **Neon Postgres** porque ele se encaixa muito bem com deploy serverless na Vercel e não exige Prisma nesta versão, deixando o build mais simples e rápido.

## 1. Criar o banco no Neon

Crie um projeto no Neon e copie a connection string Postgres.

Exemplo de variável:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST/DB?sslmode=require
```

## 2. Rodar localmente

```bash
npm install
npm run dev
```

## 3. Subir na Vercel

1. Envie este projeto para o GitHub
2. Importe o repositório na Vercel
3. Adicione a variável `DATABASE_URL`
4. Faça o deploy

## Observação importante

A tabela é criada automaticamente na primeira requisição da aplicação, então você não precisa rodar migration manual para essa versão.

## Estrutura

- `app/page.tsx` -> interface principal
- `app/api/expenses` -> listagem e criação
- `app/api/expenses/[id]` -> edição e exclusão
- `lib/db.ts` -> conexão com Neon e criação da tabela
