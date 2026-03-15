import { NextRequest, NextResponse } from "next/server";
import { Person } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { description, amount, person, spentAt } = body;

  if (!description || !amount || !person) {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }

  const expense = await prisma.expense.create({
    data: {
      description: String(description).trim(),
      amount: Number(amount),
      person: person === "MULHER" ? Person.MULHER : Person.MARIDO,
      spentAt: spentAt ? new Date(spentAt) : new Date(),
    },
  });

  return NextResponse.json({
    ...expense,
    amount: Number(expense.amount),
  });
}
