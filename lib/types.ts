export type Perfil = 'Marido' | 'Mulher';

export type Expense = {
  id: number;
  title: string;
  amount: number;
  person: Perfil;
  spent_at: string;
  created_at: string;
};
