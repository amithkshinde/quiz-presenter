import { createContext, useCallback, useContext, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import styles from './ToastProvider.module.css';

interface ToastItem {
  id: string;
  message: string;
  tone: 'success' | 'error' | 'neutral';
  actionLabel?: string;
  onAction?: () => void;
}

interface ToastOptions {
  tone?: ToastItem['tone'];
  actionLabel?: string;
  onAction?: () => void;
  durationMs?: number;
}

const ToastContext = createContext<((message: string, options?: ToastOptions) => void) | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const counter = useRef(0);

  const showToast = useCallback((message: string, options: ToastOptions = {}) => {
    const id = `toast_${counter.current++}`;
    const toast: ToastItem = { id, message, tone: options.tone ?? 'neutral', actionLabel: options.actionLabel, onAction: options.onAction };
    setToasts((prev) => [...prev, toast]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, options.durationMs ?? 6000);
  }, []);

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <div className={styles.stack} aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`${styles.toast} ${styles[t.tone]}`}>
            <span>{t.message}</span>
            {t.actionLabel && (
              <button
                className={styles.action}
                onClick={() => {
                  t.onAction?.();
                  setToasts((prev) => prev.filter((x) => x.id !== t.id));
                }}
              >
                {t.actionLabel}
              </button>
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
