import { NextRequest, NextResponse } from 'next/server';
import { currentMonthRange, ensureSchema, sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await ensureSchema();
    const { start, end } = currentMonthRange();

    const rows = await sql`
      SELECT id, title, amount::float8 AS amount, person, spent_at::text, created_at::text
      FROM expenses
      WHERE spent_at >= ${start} AND spent_at < ${end}
      ORDER BY spent_at DESC, id DESC;
    `;

    return NextResponse.json(rows);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erro ao buscar gastos.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureSchema();
    const body = await request.json();
    const title = String(body.title ?? '').trim();
    const amount = Number(body.amount);
    const person = body.person === 'Mulher' ? 'Mulher' : 'Marido';
    const spentAt = String(body.spent_at ?? '').trim();

    if (!title || !spentAt || Number.isNaN(amount) || amount < 0) {
      return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 });
    }

    const [created] = await sql`
      INSERT INTO expenses (title, amount, person, spent_at)
      VALUES (${title}, ${amount}, ${person}, ${spentAt})
      RETURNING id, title, amount::float8 AS amount, person, spent_at::text, created_at::text;
    `;

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erro ao cadastrar gasto.' }, { status: 500 });
  }
}
