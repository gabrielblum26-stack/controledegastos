export type Person = "MARIDO" | "MULHER";

export type ExpenseItem = {
  id: string;
  description: string;
  amount: number;
  person: Person;
  spentAt: string;
};

export type Summary = {
  total: number;
  count: number;
  husbandTotal: number;
  wifeTotal: number;
  byDay: Array<{
    day: number;
    husband: number;
    wife: number;
  }>;
  expenses: ExpenseItem[];
};
