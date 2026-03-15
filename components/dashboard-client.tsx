"use client";

import { useMemo, useState } from "react";
import { CalendarDays, Pencil, Plus, Trash2, User, UserRound, Wallet, X } from "lucide-react";
import Link from "next/link";
import { formatCurrency, formatDate, monthLabel } from "@/lib/format";
import { ExpenseItem, Person, Summary } from "@/lib/types";

type Props = {
  initialSummary: Summary;
  selectedProfile: "marido" | "mulher";
};

type FormState = {
  id?: string;
  description: string;
  amount: string;
  person: Person;
  spentAt: string;
};

const emptyForm = (person: Person): FormState => ({
  description: "",
  amount: "",
  person,
  spentAt: new Date().toISOString().slice(0, 10),
});

export default function DashboardClient({ initialSummary, selectedProfile }: Props) {
  const defaultPerson = selectedProfile === "mulher" ? "MULHER" : "MARIDO";
  const [summary, setSummary] = useState(initialSummary);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm(defaultPerson));

  const totalMax = useMemo(() => {
    const values = summary.byDay.flatMap((item) => [item.husband, item.wife]);
    return Math.max(...values, 1);
  }, [summary.byDay]);

  async function refreshSummary() {
    const res = await fetch("/api/summary", { cache: "no-store" });
    const data = await res.json();
    setSummary(data);
  }

  function closeModal() {
    setOpen(false);
    setForm(emptyForm(defaultPerson));
  }

  function openNewModal() {
    setForm(emptyForm(defaultPerson));
    setOpen(true);
  }

  function openEditModal(expense: ExpenseItem) {
    setForm({
      id: expense.id,
      description: expense.description,
      amount: String(expense.amount).replace(".", ","),
      person: expense.person,
      spentAt: expense.spentAt.slice(0, 10),
    });
    setOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      const payload = {
        description: form.description,
        amount: Number(form.amount.replace(".", "").replace(",", ".")),
        person: form.person,
        spentAt: form.spentAt,
      };

      const method = form.id ? "PUT" : "POST";
      const url = form.id ? `/api/expenses/${form.id}` : "/api/expenses";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error("Não foi possível salvar o gasto.");
      }

      await refreshSummary();
      closeModal();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(expense: ExpenseItem) {
    const confirmed = window.confirm(`Excluir o gasto \"${expense.description}\"?`);
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/expenses/${expense.id}`, { method: "DELETE" });
      if (!res.ok) {
        throw new Error("Não foi possível excluir o gasto.");
      }
      await refreshSummary();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Erro ao excluir.");
    }
  }

  return (
    <main className="page-shell">
      <header className="topbar">
        <div className="brand-wrap">
          <div className="brand-icon">
            <Wallet size={22} />
          </div>
          <div>
            <h1>Controle de Gastos</h1>
            <p className="muted">Bem-vindo(a), {selectedProfile === "mulher" ? "Mulher" : "Marido"}</p>
          </div>
        </div>

        <Link href="/" className="logout-button">
          Sair
        </Link>
      </header>

      <section className="content-area">
        <div className="section-header">
          <div className="title-wrap">
            <CalendarDays size={22} />
            <h2>Relatório de {monthLabel()}</h2>
          </div>
          <button className="primary-button" onClick={openNewModal}>
            <Plus size={18} />
            Cadastrar Gasto
          </button>
        </div>

        <div className="stats-grid">
          <article className="card stat-card">
            <span className="card-label">Total do Mês</span>
            <strong className="money-total">{formatCurrency(summary.total)}</strong>
            <span className="muted">{summary.count} gastos registrados</span>
          </article>

          <article className="card stat-card">
            <span className="card-label">Gastos do Marido</span>
            <strong className="money-blue">{formatCurrency(summary.husbandTotal)}</strong>
            <span className="muted">
              {summary.total > 0 ? ((summary.husbandTotal / summary.total) * 100).toFixed(1) : "0.0"}% do total
            </span>
          </article>

          <article className="card stat-card">
            <span className="card-label">Gastos da Mulher</span>
            <strong className="money-pink">{formatCurrency(summary.wifeTotal)}</strong>
            <span className="muted">
              {summary.total > 0 ? ((summary.wifeTotal / summary.total) * 100).toFixed(1) : "0.0"}% do total
            </span>
          </article>
        </div>

        <section className="card chart-card">
          <h3>Gastos por Dia do Mês</h3>
          <p className="muted">Visualização dos dias de maior gasto</p>

          <div className="chart-box">
            {summary.byDay.length === 0 ? (
              <div className="empty-state">Nenhum gasto neste mês ainda.</div>
            ) : (
              <div className="bars-grid">
                {summary.byDay.map((item) => (
                  <div key={item.day} className="bar-group">
                    <div className="bars-pair">
                      <div
                        className="bar blue"
                        style={{ height: `${Math.max((item.husband / totalMax) * 220, item.husband > 0 ? 8 : 0)}px` }}
                        title={`Marido: ${formatCurrency(item.husband)}`}
                      />
                      <div
                        className="bar pink"
                        style={{ height: `${Math.max((item.wife / totalMax) * 220, item.wife > 0 ? 8 : 0)}px` }}
                        title={`Mulher: ${formatCurrency(item.wife)}`}
                      />
                    </div>
                    <span className="bar-label">Dia {item.day}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="legend">
            <span><i className="legend-dot blue" /> Marido</span>
            <span><i className="legend-dot pink" /> Mulher</span>
          </div>
        </section>

        <section className="card statement-card">
          <h3>Extrato Detalhado</h3>
          <p className="muted">Todos os gastos registrados neste mês</p>

          <div className="statement-list">
            {summary.expenses.length === 0 ? (
              <div className="empty-state left">Nenhum gasto cadastrado.</div>
            ) : (
              summary.expenses.map((expense) => (
                <article key={expense.id} className="expense-row">
                  <div className={`avatar ${expense.person === "MARIDO" ? "avatar-blue" : "avatar-pink"}`}>
                    {expense.person === "MARIDO" ? <User size={18} /> : <UserRound size={18} />}
                  </div>

                  <div className="expense-main">
                    <strong>{expense.description}</strong>
                    <div className="expense-meta">
                      <span className={expense.person === "MARIDO" ? "text-blue" : "text-pink"}>
                        {expense.person === "MARIDO" ? "Marido" : "Mulher"}
                      </span>
                      <span>•</span>
                      <span>{formatDate(expense.spentAt)}</span>
                    </div>
                  </div>

                  <div className="expense-actions">
                    <strong>{formatCurrency(expense.amount)}</strong>
                    <div className="action-buttons">
                      <button type="button" className="icon-button" onClick={() => openEditModal(expense)} title="Editar gasto">
                        <Pencil size={16} />
                      </button>
                      <button type="button" className="icon-button danger" onClick={() => handleDelete(expense)} title="Excluir gasto">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      </section>

      {open ? (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3>{form.id ? "Editar Gasto" : "Cadastrar Novo Gasto"}</h3>
                <p className="muted">{form.id ? "Atualize os dados do gasto" : "Adicione os detalhes do gasto realizado"}</p>
              </div>
              <button type="button" className="icon-button" onClick={closeModal}>
                <X size={18} />
              </button>
            </div>

            <form className="expense-form" onSubmit={handleSubmit}>
              <label>
                <span>O que é?</span>
                <input
                  required
                  placeholder="Ex: Supermercado, Gasolina..."
                  value={form.description}
                  onChange={(e) => setForm((current) => ({ ...current, description: e.target.value }))}
                />
              </label>

              <label>
                <span>Quanto foi?</span>
                <input
                  required
                  inputMode="decimal"
                  placeholder="0,00"
                  value={form.amount}
                  onChange={(e) => setForm((current) => ({ ...current, amount: e.target.value }))}
                />
              </label>

              <label>
                <span>Quem gastou?</span>
                <select
                  value={form.person}
                  onChange={(e) => setForm((current) => ({ ...current, person: e.target.value as Person }))}
                >
                  <option value="MARIDO">Marido</option>
                  <option value="MULHER">Mulher</option>
                </select>
              </label>

              <label>
                <span>Data</span>
                <input
                  required
                  type="date"
                  value={form.spentAt}
                  onChange={(e) => setForm((current) => ({ ...current, spentAt: e.target.value }))}
                />
              </label>

              <div className="form-actions">
                <button type="button" className="ghost-button" onClick={closeModal}>
                  Cancelar
                </button>
                <button type="submit" className="primary-button" disabled={saving}>
                  {saving ? "Salvando..." : form.id ? "Salvar Alterações" : "Salvar Gasto"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </main>
  );
}
