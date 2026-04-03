export type Perfil = 'Marido' | 'Mulher';
export type BillStatus = 'pending' | 'paid';

export type Expense = {
  id: number;
  title: string;
  amount: number;
  person: Perfil;
  spent_at: string;
  created_at: string;
};

export type Bill = {
  id: number;
  title: string;
  amount: number;
  due_date: string;
  status: BillStatus;
  person: Perfil;
  description?: string;
  created_at: string;
  paid_at?: string;
};
