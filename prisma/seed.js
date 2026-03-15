const { PrismaClient, Person } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const count = await prisma.expense.count();
  if (count > 0) return;

  await prisma.expense.createMany({
    data: [
      { description: 'Supermercado', amount: 280, person: Person.MARIDO, spentAt: new Date('2026-03-14') },
      { description: 'Academia', amount: 150, person: Person.MULHER, spentAt: new Date('2026-03-13') },
      { description: 'Roupas', amount: 250, person: Person.MULHER, spentAt: new Date('2026-03-11') },
      { description: 'Conta de Luz', amount: 180, person: Person.MARIDO, spentAt: new Date('2026-03-09') },
      { description: 'Farmácia', amount: 85.5, person: Person.MULHER, spentAt: new Date('2026-03-06') },
      { description: 'Restaurante', amount: 120, person: Person.MARIDO, spentAt: new Date('2026-03-04') },
      { description: 'Combustível', amount: 200, person: Person.MARIDO, spentAt: new Date('2026-03-02') }
    ]
  });
}

main().finally(() => prisma.$disconnect());
