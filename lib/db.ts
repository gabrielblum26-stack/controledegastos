import { neon } from '@neondatabase/serverless';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL não configurada.');
}

export const sql = neon(databaseUrl);

let initialized = false;

export async function ensureSchema() {
  if (initialized) return;

  await sql`
    CREATE TABLE IF NOT EXISTS expenses (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
      person TEXT NOT NULL CHECK (person IN ('Marido', 'Mulher')),
      spent_at DATE NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS bills (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
      due_date DATE NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('pending', 'paid')) DEFAULT 'pending',
      person TEXT NOT NULL CHECK (person IN ('Marido', 'Mulher')),
      description TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      paid_at TIMESTAMPTZ
    );
  `;

  initialized = true;
}

export function currentMonthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}
