import { NextRequest, NextResponse } from "next/server";
import { Person } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await req.json();
  const { description, amount, person, spentAt } = body;

  if (!description || !amount || !person) {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }

  const updated = await prisma.expense.update({
    where: { id },
    data: {
      description: String(description).trim(),
      amount: Number(amount),
      person: person === "MULHER" ? Person.MULHER : Person.MARIDO,
      spentAt: spentAt ? new Date(spentAt) : undefined,
    },
  });

  return NextResponse.json({
    ...updated,
    amount: Number(updated.amount),
  });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  await prisma.expense.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
