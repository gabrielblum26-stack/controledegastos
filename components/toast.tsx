'use client';

import { useEffect, useState } from 'react';
import { X, AlertCircle, CheckCircle, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastProps extends Toast {
  onClose: (id: string) => void;
}

function ToastItem({ id, message, type, duration = 3000, onClose }: ToastProps) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => onClose(id), duration);
      return () => clearTimeout(timer);
    }
  }, [id, duration, onClose]);

  const bgColor = {
    success: '#dcfce7',
    error: '#fee2e2',
    info: '#dbeafe',
  }[type];

  const borderColor = {
    success: '#86efac',
    error: '#fca5a5',
    info: '#93c5fd',
  }[type];

  const textColor = {
    success: '#166534',
    error: '#991b1b',
    info: '#1e40af',
  }[type];

  const Icon = {
    success: CheckCircle,
    error: AlertCircle,
    info: Info,
  }[type];

  return (
    <div
      className="toastItem"
      style={{
        backgroundColor: bgColor,
        borderColor: borderColor,
        color: textColor,
      }}
    >
      <Icon size={18} />
      <span>{message}</span>
      <button
        className="toastClose"
        onClick={() => onClose(id)}
        aria-label="Fechar notificação"
      >
        <X size={16} />
      </button>
    </div>
  );
}

export interface ToastContextType {
  toasts: Toast[];
  addToast: (message: string, type: ToastType, duration?: number) => void;
  removeToast: (id: string) => void;
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (message: string, type: ToastType, duration = 3000) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type, duration }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  // Expor funções globalmente
  (window as any).__toastContext = { addToast, removeToast };

  return (
    <div className="toastContainer">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} {...toast} onClose={removeToast} />
      ))}
    </div>
  );
}

export function useToast() {
  return {
    addToast: (message: string, type: ToastType, duration?: number) => {
      (window as any).__toastContext?.addToast(message, type, duration);
    },
    removeToast: (id: string) => {
      (window as any).__toastContext?.removeToast(id);
    },
  };
}
