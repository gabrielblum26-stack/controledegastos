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

export default function DashboardClient() {
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<FormState>(initialForm());
  const [saving, setSaving] = useState(false);

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

  function openCreateModal() {
    setForm(initialForm());
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
    setShowModal(true);
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
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
        throw new Error('Falha ao salvar gasto.');
      }

      setShowModal(false);
      setForm(initialForm());
      await loadExpenses();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Erro inesperado.');
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
        throw new Error('Falha ao excluir gasto.');
      }

      await loadExpenses();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Erro inesperado.');
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

        <button className="secondaryBtn" onClick={logout}>
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
          <button className="primaryBtn" onClick={openCreateModal}>
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
                  <div className={`avatar ${expense.person === 'Marido' ? 'avatarBlue' : 'avatarPink'}`}>
                    <UserRound size={18} />
                  </div>

                  <div className="expenseInfo">
                    <strong>{expense.title}</strong>
                    <p>
                      <span className={expense.person === 'Marido' ? 'blueText' : 'pinkText'}>{expense.person}</span>
                      <span className="dot">•</span>
                      <span>{formatDate(expense.spent_at)}</span>
                    </p>
                  </div>

                  <div className="expenseActions">
                    <strong>{formatCurrency(expense.amount)}</strong>
                    <div className="inlineActions">
                      <button className="iconBtn" onClick={() => openEditModal(expense)} title="Editar">
                        <Pencil size={16} />
                      </button>
                      <button className="iconBtn danger" onClick={() => onDelete(expense.id)} title="Excluir">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </section>

      {showModal && (
        <div className="modalOverlay" onClick={() => setShowModal(false)}>
          <div className="modalCard" onClick={(event) => event.stopPropagation()}>
            <div className="modalHeader">
              <div>
                <h3>{form.id ? 'Editar Gasto' : 'Cadastrar Novo Gasto'}</h3>
                <p>{form.id ? 'Altere as informações abaixo' : 'Adicione os detalhes do gasto realizado'}</p>
              </div>
              <button className="closeBtn" onClick={() => setShowModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form className="formGrid" onSubmit={onSubmit}>
              <label>
                <span>O que é?</span>
                <input
                  placeholder="Ex: Supermercado, Gasolina..."
                  value={form.title}
                  onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                  required
                />
              </label>

              <label>
                <span>Quanto foi?</span>
                <input
                  placeholder="0,00"
                  inputMode="decimal"
                  value={form.amount}
                  onChange={(event) => setForm((prev) => ({ ...prev, amount: event.target.value }))}
                  required
                />
              </label>

              <label>
                <span>Quem gastou?</span>
                <select
                  value={form.person}
                  onChange={(event) => setForm((prev) => ({ ...prev, person: event.target.value as Perfil }))}
                >
                  <option value="Marido">Marido</option>
                  <option value="Mulher">Mulher</option>
                </select>
              </label>

              <label>
                <span>Data</span>
                <input
                  type="date"
                  value={form.spent_at}
                  onChange={(event) => setForm((prev) => ({ ...prev, spent_at: event.target.value }))}
                  required
                />
              </label>

              <div className="formActions">
                <button type="submit" className="primaryBtn" disabled={saving}>
                  {saving ? 'Salvando...' : form.id ? 'Salvar Alterações' : 'Salvar Gasto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
