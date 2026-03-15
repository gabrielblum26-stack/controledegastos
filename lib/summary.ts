import { Person } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function getMonthlySummary(referenceDate = new Date()) {
  const start = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1);
  const end = new Date(referenceDate.getFullYear(), referenceDate.getMonth() + 1, 1);

  const expenses = await prisma.expense.findMany({
    where: {
      spentAt: {
        gte: start,
        lt: end,
      },
    },
    orderBy: {
      spentAt: "desc",
    },
  });

  const total = expenses.reduce((acc, item) => acc + Number(item.amount), 0);
  const husbandTotal = expenses
    .filter((item) => item.person === Person.MARIDO)
    .reduce((acc, item) => acc + Number(item.amount), 0);
  const wifeTotal = expenses
    .filter((item) => item.person === Person.MULHER)
    .reduce((acc, item) => acc + Number(item.amount), 0);

  const map = new Map<number, { husband: number; wife: number }>();

  for (const expense of expenses) {
    const day = new Date(expense.spentAt).getDate();
    const current = map.get(day) || { husband: 0, wife: 0 };

    if (expense.person === Person.MARIDO) {
      current.husband += Number(expense.amount);
    } else {
      current.wife += Number(expense.amount);
    }

    map.set(day, current);
  }

  const byDay = Array.from(map.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([day, totals]) => ({ day, ...totals }));

  return {
    total,
    count: expenses.length,
    husbandTotal,
    wifeTotal,
    byDay,
    expenses: expenses.map((item) => ({
      id: item.id,
      description: item.description,
      amount: Number(item.amount),
      person: item.person,
      spentAt: item.spentAt.toISOString(),
    })),
  };
}
