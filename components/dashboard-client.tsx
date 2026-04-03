'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  CalendarDays,
  Pencil,
  Plus,
  Receipt,
  Trash2,
  UserRound,
  Users,
  Wallet,
  X,
  LogOut,
  Loader,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatCurrency, formatDate, getMonthLabel } from '@/lib/format';
import { Expense, Perfil } from '@/lib/types';
import BillsClient from '@/components/bills-client';

type FormState = {
  id?: number;
  title: string;
  amount: string;
  person: Perfil;
  spent_at: string;
};

const initialForm = (): FormState => ({
  title: '',
  amount: '',
  person: 'Marido',
  spent_at: new Date().toISOString().slice(0, 10),
});

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

export default function DashboardClient() {
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<FormState>(initialForm());
  const [saving, setSaving] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const saved = window.localStorage.getItem('controle-gastos-perfil');
    if (saved === 'Marido' || saved === 'Mulher') {
      setPerfil(saved);
    }
  }, []);

  useEffect(() => {
    if (!perfil) return;
    void loadExpenses();
  }, [perfil]);

  async function loadExpenses() {
    setLoading(true);
    try {
      const response = await fetch('/api/expenses', { cache: 'no-store' });
      const data = await response.json();
      setExpenses(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }

  function chooseProfile(nextPerfil: Perfil) {
    window.localStorage.setItem('controle-gastos-perfil', nextPerfil);
    setPerfil(nextPerfil);
  }

  function logout() {
    window.localStorage.removeItem('controle-gastos-perfil');
    setPerfil(null);
  }

  function addToast(message: string, type: ToastType) {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }

  function validateForm(): boolean {
    const errors: Record<string, string> = {};

    if (!form.title.trim()) {
      errors.title = 'Título é obrigatório';
    } else if (form.title.length > 100) {
      errors.title = 'Título deve ter no máximo 100 caracteres';
    }

    const amount = Number(form.amount.replace(',', '.'));
    if (!form.amount || isNaN(amount)) {
      errors.amount = 'Valor é obrigatório';
    } else if (amount <= 0) {
      errors.amount = 'Valor deve ser maior que 0';
    } else if (amount > 999999.99) {
      errors.amount = 'Valor máximo é 999.999,99';
    }

    const date = new Date(form.spent_at);
    if (!form.spent_at) {
      errors.spent_at = 'Data é obrigatória';
    } else if (isNaN(date.getTime())) {
      errors.spent_at = 'Data inválida';
    } else if (date > new Date()) {
      errors.spent_at = 'Não é permitido cadastrar em datas futuras';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function openCreateModal() {
    setForm(initialForm());
    setFormErrors({});
    setShowModal(true);
  }

  function openEditModal(expense: Expense) {
    setForm({
      id: expense.id,
      title: expense.title,
      amount: String(expense.amount).replace('.', ','),
      person: expense.person,
      spent_at: expense.spent_at.slice(0, 10),
    });
    setFormErrors({});
    setShowModal(true);
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!validateForm()) {
      addToast('Verifique os erros no formulário', 'error');
      return;
    }

    setSaving(true);

    const normalizedAmount = Number(form.amount.replace(',', '.'));
    const payload = {
      title: form.title.trim(),
      amount: normalizedAmount,
      person: form.person,
      spent_at: form.spent_at,
    };

    const isEditing = Boolean(form.id);
    const url = isEditing ? `/api/expenses/${form.id}` : '/api/expenses';
    const method = isEditing ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha ao salvar gasto.');
      }

      setShowModal(false);
      setForm(initialForm());
      setFormErrors({});
      await loadExpenses();
      addToast(
        isEditing ? 'Gasto atualizado com sucesso!' : 'Gasto cadastrado com sucesso!',
        'success'
      );
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Erro inesperado.', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(id: number) {
    const confirmed = window.confirm('Deseja realmente excluir este gasto?');
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/expenses/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha ao excluir gasto.');
      }

      await loadExpenses();
      addToast('Gasto excluído com sucesso!', 'success');
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Erro inesperado.', 'error');
    }
  }

  const summary = useMemo(() => {
    const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const husband = expenses
      .filter((expense) => expense.person === 'Marido')
      .reduce((sum, expense) => sum + expense.amount, 0);
    const wife = expenses
      .filter((expense) => expense.person === 'Mulher')
      .reduce((sum, expense) => sum + expense.amount, 0);

    return {
      total,
      husband,
      wife,
      count: expenses.length,
      husbandPct: total ? (husband / total) * 100 : 0,
      wifePct: total ? (wife / total) * 100 : 0,
    };
  }, [expenses]);

  const chartData = useMemo(() => {
    const byDay = new Map<string, { day: string; Marido: number; Mulher: number }>();

    for (const expense of expenses) {
      const date = new Date(expense.spent_at);
      const day = `Dia ${date.getDate()}`;
      const current = byDay.get(day) ?? { day, Marido: 0, Mulher: 0 };
      current[expense.person] += expense.amount;
      byDay.set(day, current);
    }

    return Array.from(byDay.values()).sort((a, b) => {
      const da = Number(a.day.replace('Dia ', ''));
      const db = Number(b.day.replace('Dia ', ''));
      return da - db;
    });
  }, [expenses]);

  if (!perfil) {
    return (
      <main className="authShell">
        <section className="authCard">
          <div className="brandIcon">
            <Wallet size={32} />
          </div>
          <h1>Controle de Gastos</h1>
          <p>Gerencie as despesas do casal de forma simples e organizada</p>

          <div className="selectorTitle">
            <Users size={18} />
            <span>Selecione seu perfil para entrar:</span>
          </div>

          <div className="profileGrid">
            <button className="profileButton" onClick={() => chooseProfile('Marido')}>
              <UserRound size={18} />
              <strong>Marido</strong>
            </button>
            <button className="profileButton" onClick={() => chooseProfile('Mulher')}>
              <UserRound size={18} />
              <strong>Mulher</strong>
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="appShell">
      {/* Toast Container */}
      <div className="toastContainer">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toastItem toastItem-${toast.type}`}>
            <span>{toast.message}</span>
            <button
              className="toastClose"
              onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
              aria-label="Fechar notificação"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>

      <header className="topbar">
        <div className="topbarBrand">
          <div className="smallBrandIcon">
            <Wallet size={22} />
          </div>
          <div>
            <h1>Controle de Gastos</h1>
            <p>Bem-vindo(a), {perfil}</p>
          </div>
        </div>

        <button className="secondaryBtn" onClick={logout} aria-label="Sair da aplicação">
          <LogOut size={18} />
          Sair
        </button>
      </header>

      <section className="contentWrap">
        <div className="sectionHead">
          <div className="sectionTitle">
            <CalendarDays size={22} />
            <h2>Relatório de {getMonthLabel()}</h2>
          </div>
          <button
            className="primaryBtn"
            onClick={openCreateModal}
            aria-label="Abrir formulário para cadastrar novo gasto"
          >
            <Plus size={18} />
            Cadastrar Gasto
          </button>
        </div>

        <div className="cardsGrid">
          <article className="summaryCard">
            <div className="cardHead">
              <span>Total do Mês</span>
              <Receipt size={16} />
            </div>
            <strong>{formatCurrency(summary.total)}</strong>
            <p>{summary.count} gastos registrados</p>
          </article>

          <article className="summaryCard">
            <div className="cardHead">
              <span>Gastos do Marido</span>
              <UserRound size={16} className="blueText" />
            </div>
            <strong className="blueText">{formatCurrency(summary.husband)}</strong>
            <p>{summary.husbandPct.toFixed(1)}% do total</p>
          </article>

          <article className="summaryCard">
            <div className="cardHead">
              <span>Gastos da Mulher</span>
              <UserRound size={16} className="pinkText" />
            </div>
            <strong className="pinkText">{formatCurrency(summary.wife)}</strong>
            <p>{summary.wifePct.toFixed(1)}% do total</p>
          </article>
        </div>

        <section className="panel chartPanel">
          <div className="panelHead">
            <div>
              <h3>Gastos por Dia do Mês</h3>
              <p>Visualização dos dias de maior gasto</p>
            </div>
          </div>

          <div className="chartBox">
            <ResponsiveContainer width="100%" height={310}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="4 4" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip formatter={(value: number) => formatCurrency(Number(value))} />
                <Legend />
                <Bar dataKey="Marido" fill="#2563eb" radius={[8, 8, 0, 0]} />
                <Bar dataKey="Mulher" fill="#ec4899" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="panel">
          <div className="panelHead">
            <div>
              <h3>Extrato Detalhado</h3>
              <p>Todos os gastos registrados neste mês</p>
            </div>
          </div>

          {loading ? (
            <div className="emptyState">Carregando gastos...</div>
          ) : expenses.length === 0 ? (
            <div className="emptyState">Nenhum gasto cadastrado ainda.</div>
          ) : (
            <div className="expenseList">
              {expenses.map((expense) => (
                <article key={expense.id} className="expenseItem">
                  <div
                    className={`avatar ${
                      expense.person === 'Marido' ? 'avatarBlue' : 'avatarPink'
                    }`}
                  >
                    <UserRound size={18} />
                  </div>

                  <div className="expenseInfo">
                    <strong>{expense.title}</strong>
                    <p>
                      <span className={expense.person === 'Marido' ? 'blueText' : 'pinkText'}>
                        {expense.person}
                      </span>
                      <span className="dot">•</span>
                      <span>{formatDate(expense.spent_at)}</span>
                    </p>
                  </div>

                  <div className="expenseActions">
                    <strong>{formatCurrency(expense.amount)}</strong>
                    <div className="inlineActions">
                      <button
                        className="iconBtn"
                        onClick={() => openEditModal(expense)}
                        title="Editar gasto"
                        aria-label={`Editar gasto: ${expense.title}`}
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        className="iconBtn danger"
                        onClick={() => onDelete(expense.id)}
                        title="Excluir gasto"
                        aria-label={`Excluir gasto: ${expense.title}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* Bills Section */}
        <BillsClient onAddToast={addToast} />
      </section>

      {/* Modal */}
      {showModal && (
        <div className="modalOverlay" onClick={() => setShowModal(false)}>
          <div className="modalCard" onClick={(e) => e.stopPropagation()}>
            <div className="modalHeader">
              <h2>{form.id ? 'Editar Gasto' : 'Novo Gasto'}</h2>
              <button
                className="closeBtn"
                onClick={() => setShowModal(false)}
                aria-label="Fechar modal"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={onSubmit}>
              <div className="formGrid">
                <div className="formGroup">
                  <label htmlFor="title">Descrição *</label>
                  <input
                    id="title"
                    type="text"
                    placeholder="Ex: Supermercado"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    maxLength={100}
                    aria-invalid={!!formErrors.title}
                    aria-describedby={formErrors.title ? 'title-error' : undefined}
                  />
                  {formErrors.title && (
                    <span id="title-error" className="errorMessage">
                      {formErrors.title}
                    </span>
                  )}
                </div>

                <div className="formGroup">
                  <label htmlFor="amount">Valor (R$) *</label>
                  <input
                    id="amount"
                    type="text"
                    placeholder="0,00"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    aria-invalid={!!formErrors.amount}
                    aria-describedby={formErrors.amount ? 'amount-error' : undefined}
                  />
                  {formErrors.amount && (
                    <span id="amount-error" className="errorMessage">
                      {formErrors.amount}
                    </span>
                  )}
                </div>

                <div className="formGroup">
                  <label htmlFor="person">Quem gastou? *</label>
                  <select
                    id="person"
                    value={form.person}
                    onChange={(e) => setForm({ ...form, person: e.target.value as Perfil })}
                  >
                    <option value="Marido">Marido</option>
                    <option value="Mulher">Mulher</option>
                  </select>
                </div>

                <div className="formGroup">
                  <label htmlFor="spent_at">Data *</label>
                  <input
                    id="spent_at"
                    type="date"
                    value={form.spent_at}
                    onChange={(e) => setForm({ ...form, spent_at: e.target.value })}
                    aria-invalid={!!formErrors.spent_at}
                    aria-describedby={formErrors.spent_at ? 'spent_at-error' : undefined}
                  />
                  {formErrors.spent_at && (
                    <span id="spent_at-error" className="errorMessage">
                      {formErrors.spent_at}
                    </span>
                  )}
                </div>
              </div>

              <div className="formActions">
                <button
                  type="button"
                  className="secondaryBtn"
                  onClick={() => setShowModal(false)}
                  disabled={saving}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="primaryBtn"
                  disabled={saving}
                  aria-busy={saving}
                >
                  {saving ? (
                    <>
                      <Loader size={18} className="spinner" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Plus size={18} />
                      {form.id ? 'Atualizar' : 'Cadastrar'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}