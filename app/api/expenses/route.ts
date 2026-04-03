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

    // Validação de título
    if (!title || title.length > 100) {
      return NextResponse.json({ error: 'Título deve ter 1-100 caracteres.' }, { status: 400 });
    }

    // Validação de data
    const date = new Date(spentAt);
    if (isNaN(date.getTime())) {
      return NextResponse.json({ error: 'Data inválida.' }, { status: 400 });
    }
    if (date > new Date()) {
      return NextResponse.json({ error: 'Não é permitido cadastrar gastos em datas futuras.' }, { status: 400 });
    }

    // Validação de montante
    if (Number.isNaN(amount) || amount <= 0 || amount > 999999.99) {
      return NextResponse.json({ error: 'Valor deve estar entre 0,01 e 999.999,99.' }, { status: 400 });
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
