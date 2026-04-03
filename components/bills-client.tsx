'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Loader,
  CheckCircle2,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/format';
import { Bill, Perfil, BillStatus } from '@/lib/types';

type FormState = {
  id?: number;
  title: string;
  amount: string;
  person: Perfil;
  due_date: string;
  description: string;
};

const initialForm = (): FormState => ({
  title: '',
  amount: '',
  person: 'Marido',
  due_date: new Date().toISOString().slice(0, 10),
  description: '',
});

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface BillsClientProps {
  onAddToast: (message: string, type: ToastType) => void;
}

export default function BillsClient({ onAddToast }: BillsClientProps) {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<FormState>(initialForm());
  const [saving, setSaving] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'paid'>('all');

  useEffect(() => {
    void loadBills();
  }, []);

  async function loadBills() {
    setLoading(true);
    try {
      const response = await fetch('/api/bills', { cache: 'no-store' });
      const data = await response.json();
      setBills(Array.isArray(data) ? data : []);
    } catch (error) {
      onAddToast('Erro ao carregar contas', 'error');
    } finally {
      setLoading(false);
    }
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

    const date = new Date(form.due_date);
    if (!form.due_date) {
      errors.due_date = 'Data é obrigatória';
    } else if (isNaN(date.getTime())) {
      errors.due_date = 'Data inválida';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function openCreateModal() {
    setForm(initialForm());
    setFormErrors({});
    setShowModal(true);
  }

  function openEditModal(bill: Bill) {
    setForm({
      id: bill.id,
      title: bill.title,
      amount: String(bill.amount).replace('.', ','),
      person: bill.person,
      due_date: bill.due_date.slice(0, 10),
      description: bill.description || '',
    });
    setFormErrors({});
    setShowModal(true);
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!validateForm()) {
      onAddToast('Verifique os erros no formulário', 'error');
      return;
    }

    setSaving(true);

    const normalizedAmount = Number(form.amount.replace(',', '.'));
    const payload = {
      title: form.title.trim(),
      amount: normalizedAmount,
      person: form.person,
      due_date: form.due_date,
      description: form.description.trim(),
    };

    const isEditing = Boolean(form.id);
    const url = isEditing ? `/api/bills/${form.id}` : '/api/bills';
    const method = isEditing ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha ao salvar conta.');
      }

      setShowModal(false);
      setForm(initialForm());
      setFormErrors({});
      await loadBills();
      onAddToast(
        isEditing ? 'Conta atualizada com sucesso!' : 'Conta cadastrada com sucesso!',
        'success'
      );
    } catch (error) {
      onAddToast(error instanceof Error ? error.message : 'Erro inesperado.', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(id: number) {
    const confirmed = window.confirm('Deseja realmente excluir esta conta?');
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/bills/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha ao excluir conta.');
      }

      await loadBills();
      onAddToast('Conta excluída com sucesso!', 'success');
    } catch (error) {
      onAddToast(error instanceof Error ? error.message : 'Erro inesperado.', 'error');
    }
  }

  async function toggleBillStatus(bill: Bill) {
    const action = bill.status === 'pending' ? 'mark_paid' : 'mark_pending';
    const actionText = bill.status === 'pending' ? 'Baixar' : 'Reabrir';

    try {
      const response = await fetch(`/api/bills/${bill.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Falha ao ${actionText.toLowerCase()} conta.`);
      }

      await loadBills();
      onAddToast(
        `Conta ${action === 'mark_paid' ? 'baixada' : 'reabierta'} com sucesso!`,
        'success'
      );
    } catch (error) {
      onAddToast(error instanceof Error ? error.message : 'Erro inesperado.', 'error');
    }
  }

  const summary = useMemo(() => {
    const pending = bills.filter((b) => b.status === 'pending');
    const paid = bills.filter((b) => b.status === 'paid');

    const pendingTotal = pending.reduce((sum, bill) => sum + bill.amount, 0);
    const paidTotal = paid.reduce((sum, bill) => sum + bill.amount, 0);

    return {
      total: bills.length,
      pending: pending.length,
      paid: paid.length,
      pendingTotal,
      paidTotal,
    };
  }, [bills]);

  const filteredBills = useMemo(() => {
    if (filterStatus === 'all') return bills;
    return bills.filter((bill) => bill.status === filterStatus);
  }, [bills, filterStatus]);

  const isOverdue = (dueDate: string, status: BillStatus) => {
    if (status === 'paid') return false;
    return new Date(dueDate) < new Date();
  };

  return (
    <section className="panel">
      <div className="panelHead">
        <div>
          <h3>Contas a Pagar</h3>
          <p>Gerencie suas contas e compromissos financeiros</p>
        </div>
        <button
          className="primaryBtn"
          onClick={openCreateModal}
          aria-label="Abrir formulário para cadastrar nova conta"
        >
          <Plus size={18} />
          Nova Conta
        </button>
      </div>

      {/* Summary Cards */}
      <div className="billsSummary">
        <div className="billCard">
          <div className="billCardHead">
            <span>Pendentes</span>
            <Clock size={16} />
          </div>
          <strong>{summary.pending}</strong>
          <p>{formatCurrency(summary.pendingTotal)}</p>
        </div>

        <div className="billCard">
          <div className="billCardHead">
            <span>Pagas</span>
            <CheckCircle2 size={16} />
          </div>
          <strong>{summary.paid}</strong>
          <p>{formatCurrency(summary.paidTotal)}</p>
        </div>

        <div className="billCard">
          <div className="billCardHead">
            <span>Total</span>
            <AlertCircle size={16} />
          </div>
          <strong>{summary.total}</strong>
          <p>{formatCurrency(summary.pendingTotal + summary.paidTotal)}</p>
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="billsFilter">
        <button
          className={`filterBtn ${filterStatus === 'all' ? 'active' : ''}`}
          onClick={() => setFilterStatus('all')}
        >
          Todas ({bills.length})
        </button>
        <button
          className={`filterBtn ${filterStatus === 'pending' ? 'active' : ''}`}
          onClick={() => setFilterStatus('pending')}
        >
          Pendentes ({summary.pending})
        </button>
        <button
          className={`filterBtn ${filterStatus === 'paid' ? 'active' : ''}`}
          onClick={() => setFilterStatus('paid')}
        >
          Pagas ({summary.paid})
        </button>
      </div>

      {/* Bills List */}
      {loading ? (
        <div className="emptyState">Carregando contas...</div>
      ) : filteredBills.length === 0 ? (
        <div className="emptyState">
          {filterStatus === 'all'
            ? 'Nenhuma conta cadastrada ainda.'
            : `Nenhuma conta ${filterStatus === 'pending' ? 'pendente' : 'paga'}.`}
        </div>
      ) : (
        <div className="billsList">
          {filteredBills.map((bill) => (
            <article
              key={bill.id}
              className={`billItem ${bill.status === 'paid' ? 'billPaid' : ''} ${
                isOverdue(bill.due_date, bill.status) ? 'billOverdue' : ''
              }`}
            >
              <div className="billStatus">
                {bill.status === 'paid' ? (
                  <CheckCircle2 size={20} className="statusPaid" />
                ) : isOverdue(bill.due_date, bill.status) ? (
                  <AlertCircle size={20} className="statusOverdue" />
                ) : (
                  <Clock size={20} className="statusPending" />
                )}
              </div>

              <div className="billInfo">
                <strong>{bill.title}</strong>
                {bill.description && <p className="billDescription">{bill.description}</p>}
                <p className="billMeta">
                  <span>{bill.person}</span>
                  <span className="dot">•</span>
                  <span>Vencimento: {formatDate(bill.due_date)}</span>
                  {bill.status === 'paid' && bill.paid_at && (
                    <>
                      <span className="dot">•</span>
                      <span>Pago em: {formatDate(bill.paid_at)}</span>
                    </>
                  )}
                </p>
              </div>

              <div className="billAmount">
                <strong>{formatCurrency(bill.amount)}</strong>
                <span className={`billStatusBadge billStatusBadge-${bill.status}`}>
                  {bill.status === 'paid' ? 'Paga' : 'Pendente'}
                </span>
              </div>

              <div className="billActions">
                <button
                  className={`iconBtn ${bill.status === 'paid' ? 'secondary' : 'success'}`}
                  onClick={() => toggleBillStatus(bill)}
                  title={bill.status === 'paid' ? 'Reabrir conta' : 'Baixar conta'}
                  aria-label={`${bill.status === 'paid' ? 'Reabrir' : 'Baixar'} conta: ${bill.title}`}
                >
                  {bill.status === 'paid' ? <Clock size={16} /> : <CheckCircle2 size={16} />}
                </button>
                <button
                  className="iconBtn"
                  onClick={() => openEditModal(bill)}
                  title="Editar conta"
                  aria-label={`Editar conta: ${bill.title}`}
                >
                  <Pencil size={16} />
                </button>
                <button
                  className="iconBtn danger"
                  onClick={() => onDelete(bill.id)}
                  title="Excluir conta"
                  aria-label={`Excluir conta: ${bill.title}`}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modalOverlay" onClick={() => setShowModal(false)}>
          <div className="modalCard" onClick={(e) => e.stopPropagation()}>
            <div className="modalHeader">
              <h2>{form.id ? 'Editar Conta' : 'Nova Conta a Pagar'}</h2>
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
                  <label htmlFor="bill-title">Descrição *</label>
                  <input
                    id="bill-title"
                    type="text"
                    placeholder="Ex: Conta de luz"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    maxLength={100}
                    aria-invalid={!!formErrors.title}
                    aria-describedby={formErrors.title ? 'bill-title-error' : undefined}
                  />
                  {formErrors.title && (
                    <span id="bill-title-error" className="errorMessage">
                      {formErrors.title}
                    </span>
                  )}
                </div>

                <div className="formGroup">
                  <label htmlFor="bill-amount">Valor (R$) *</label>
                  <input
                    id="bill-amount"
                    type="text"
                    placeholder="0,00"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    aria-invalid={!!formErrors.amount}
                    aria-describedby={formErrors.amount ? 'bill-amount-error' : undefined}
                  />
                  {formErrors.amount && (
                    <span id="bill-amount-error" className="errorMessage">
                      {formErrors.amount}
                    </span>
                  )}
                </div>

                <div className="formGroup">
                  <label htmlFor="bill-person">Responsável *</label>
                  <select
                    id="bill-person"
                    value={form.person}
                    onChange={(e) => setForm({ ...form, person: e.target.value as Perfil })}
                  >
                    <option value="Marido">Marido</option>
                    <option value="Mulher">Mulher</option>
                  </select>
                </div>

                <div className="formGroup">
                  <label htmlFor="bill-due-date">Data de Vencimento *</label>
                  <input
                    id="bill-due-date"
                    type="date"
                    value={form.due_date}
                    onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                    aria-invalid={!!formErrors.due_date}
                    aria-describedby={formErrors.due_date ? 'bill-due-date-error' : undefined}
                  />
                  {formErrors.due_date && (
                    <span id="bill-due-date-error" className="errorMessage">
                      {formErrors.due_date}
                    </span>
                  )}
                </div>

                <div className="formGroup formGroupFull">
                  <label htmlFor="bill-description">Descrição Adicional</label>
                  <textarea
                    id="bill-description"
                    placeholder="Adicione detalhes sobre a conta (opcional)"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={3}
                    maxLength={500}
                  />
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
    </section>
  );
}
