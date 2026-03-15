import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema, sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    await ensureSchema();
    const { id } = await params;
    const expenseId = Number(id);
    const body = await request.json();
    const title = String(body.title ?? '').trim();
    const amount = Number(body.amount);
    const person = body.person === 'Mulher' ? 'Mulher' : 'Marido';
    const spentAt = String(body.spent_at ?? '').trim();

    if (!expenseId || !title || !spentAt || Number.isNaN(amount) || amount < 0) {
      return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 });
    }

    const [updated] = await sql`
      UPDATE expenses
      SET title = ${title}, amount = ${amount}, person = ${person}, spent_at = ${spentAt}
      WHERE id = ${expenseId}
      RETURNING id, title, amount::float8 AS amount, person, spent_at::text, created_at::text;
    `;

    if (!updated) {
      return NextResponse.json({ error: 'Gasto não encontrado.' }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erro ao editar gasto.' }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: Params) {
  try {
    await ensureSchema();
    const { id } = await params;
    const expenseId = Number(id);

    if (!expenseId) {
      return NextResponse.json({ error: 'ID inválido.' }, { status: 400 });
    }

    const deleted = await sql`DELETE FROM expenses WHERE id = ${expenseId};`;
    return NextResponse.json({ ok: true, deleted });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erro ao excluir gasto.' }, { status: 500 });
  }
}
