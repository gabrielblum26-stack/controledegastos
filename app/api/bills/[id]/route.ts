import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema, sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    await ensureSchema();
    const { id } = await params;
    const billId = Number(id);
    const body = await request.json();
    const title = String(body.title ?? '').trim();
    const amount = Number(body.amount);
    const person = body.person === 'Mulher' ? 'Mulher' : 'Marido';
    const dueDate = String(body.due_date ?? '').trim();
    const description = String(body.description ?? '').trim();

    // Validação de ID
    if (!billId || billId <= 0) {
      return NextResponse.json({ error: 'ID inválido.' }, { status: 400 });
    }

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

    const [updated] = await sql`
      UPDATE bills
      SET title = ${title}, amount = ${amount}, person = ${person}, due_date = ${dueDate}, description = ${description || null}
      WHERE id = ${billId}
      RETURNING id, title, amount::float8 AS amount, due_date::text, status, person, description, created_at::text, paid_at::text;
    `;

    if (!updated) {
      return NextResponse.json({ error: 'Conta não encontrada.' }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erro ao editar conta.' }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: Params) {
  try {
    await ensureSchema();
    const { id } = await params;
    const billId = Number(id);

    // Validação de ID
    if (!billId || billId <= 0) {
      return NextResponse.json({ error: 'ID inválido.' }, { status: 400 });
    }

    // Verificar se o registro existe antes de deletar
    const [existing] = await sql`SELECT id FROM bills WHERE id = ${billId};`;
    if (!existing) {
      return NextResponse.json({ error: 'Conta não encontrada.' }, { status: 404 });
    }

    await sql`DELETE FROM bills WHERE id = ${billId};`;
    return NextResponse.json({ ok: true, deleted: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erro ao excluir conta.' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    await ensureSchema();
    const { id } = await params;
    const billId = Number(id);
    const body = await request.json();
    const action = body.action; // 'mark_paid' ou 'mark_pending'

    // Validação de ID
    if (!billId || billId <= 0) {
      return NextResponse.json({ error: 'ID inválido.' }, { status: 400 });
    }

    if (action === 'mark_paid') {
      const [updated] = await sql`
        UPDATE bills
        SET status = 'paid', paid_at = NOW()
        WHERE id = ${billId}
        RETURNING id, title, amount::float8 AS amount, due_date::text, status, person, description, created_at::text, paid_at::text;
      `;

      if (!updated) {
        return NextResponse.json({ error: 'Conta não encontrada.' }, { status: 404 });
      }

      return NextResponse.json(updated);
    } else if (action === 'mark_pending') {
      const [updated] = await sql`
        UPDATE bills
        SET status = 'pending', paid_at = NULL
        WHERE id = ${billId}
        RETURNING id, title, amount::float8 AS amount, due_date::text, status, person, description, created_at::text, paid_at::text;
      `;

      if (!updated) {
        return NextResponse.json({ error: 'Conta não encontrada.' }, { status: 404 });
      }

      return NextResponse.json(updated);
    } else {
      return NextResponse.json({ error: 'Ação inválida.' }, { status: 400 });
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erro ao atualizar conta.' }, { status: 500 });
  }
}
