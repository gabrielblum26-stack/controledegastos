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

    // Validação de ID
    if (!expenseId || expenseId <= 0) {
      return NextResponse.json({ error: 'ID inválido.' }, { status: 400 });
    }

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

    // Validação de ID
    if (!expenseId || expenseId <= 0) {
      return NextResponse.json({ error: 'ID inválido.' }, { status: 400 });
    }

    // Verificar se o registro existe antes de deletar
    const [existing] = await sql`SELECT id FROM expenses WHERE id = ${expenseId};`;
    if (!existing) {
      return NextResponse.json({ error: 'Gasto não encontrado.' }, { status: 404 });
    }

    await sql`DELETE FROM expenses WHERE id = ${expenseId};`;
    return NextResponse.json({ ok: true, deleted: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erro ao excluir gasto.' }, { status: 500 });
  }
}
