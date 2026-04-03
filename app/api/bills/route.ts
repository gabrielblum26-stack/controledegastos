import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema, sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await ensureSchema();

    const rows = await sql`
      SELECT id, title, amount::float8 AS amount, due_date::text, status, person, description, created_at::text, paid_at::text
      FROM bills
      ORDER BY due_date ASC, id DESC;
    `;

    return NextResponse.json(rows);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erro ao buscar contas.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureSchema();
    const body = await request.json();
    const title = String(body.title ?? '').trim();
    const amount = Number(body.amount);
    const person = body.person === 'Mulher' ? 'Mulher' : 'Marido';
    const dueDate = String(body.due_date ?? '').trim();
    const description = String(body.description ?? '').trim();

    // Validação de título
    if (!title || title.length > 100) {
      return NextResponse.json({ error: 'Título deve ter 1-100 caracteres.' }, { status: 400 });
    }

    // Validação de data
    const date = new Date(dueDate);
    if (isNaN(date.getTime())) {
      return NextResponse.json({ error: 'Data inválida.' }, { status: 400 });
    }

    // Validação de montante
    if (Number.isNaN(amount) || amount <= 0 || amount > 999999.99) {
      return NextResponse.json({ error: 'Valor deve estar entre 0,01 e 999.999,99.' }, { status: 400 });
    }

    const [created] = await sql`
      INSERT INTO bills (title, amount, person, due_date, description, status)
      VALUES (${title}, ${amount}, ${person}, ${dueDate}, ${description || null}, 'pending')
      RETURNING id, title, amount::float8 AS amount, due_date::text, status, person, description, created_at::text, paid_at::text;
    `;

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erro ao cadastrar conta.' }, { status: 500 });
  }
}
