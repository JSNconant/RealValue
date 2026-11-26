"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from "lucide-react";

// ---- Types -------------------------------------------------

type Variant = "success" | "warning" | "error" | "info";

interface ToastItem {
  id: string;
  message: string;
  variant: Variant;
}

interface ToastAPI {
  toast:   (message: string, variant?: Variant) => void;
  success: (message: string) => void;
  warning: (message: string) => void;
  error:   (message: string) => void;
  info:    (message: string) => void;
}

const ToastContext = createContext<ToastAPI | null>(null);

const DURATION_MS = 4500;
const MAX_VISIBLE = 5;

const ICONS: Record<Variant, typeof CheckCircle2> = {
  success: CheckCircle2,
  warning: AlertTriangle,
  error:   XCircle,
  info:    Info,
};

// ---- Provider ----------------------------------------------

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    (message: string, variant: Variant = "info") => {
      const id = `toast-${Math.random().toString(36).slice(2)}`;
      setToasts((prev) => [...prev.slice(-(MAX_VISIBLE - 1)), { id, message, variant }]);
      setTimeout(() => dismiss(id), DURATION_MS);
    },
    [dismiss],
  );

  const api: ToastAPI = {
    toast:   show,
    success: (m) => show(m, "success"),
    warning: (m) => show(m, "warning"),
    error:   (m) => show(m, "error"),
    info:    (m) => show(m, "info"),
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        className="toast-region"
        role="region"
        aria-label="Notifications"
        aria-live="polite"
        aria-atomic="false"
      >
        {toasts.map((t) => {
          const Icon = ICONS[t.variant];
          return (
            <div key={t.id} className={`toast toast--${t.variant}`} role="status">
              <Icon size={18} aria-hidden style={{ flexShrink: 0, marginTop: 1 }} />
              <span style={{ flex: 1 }}>{t.message}</span>
              <button
                className="toast__dismiss"
                onClick={() => dismiss(t.id)}
                aria-label="Dismiss notification"
              >
                <X size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

// ---- Hook --------------------------------------------------

export function useToast(): ToastAPI {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be called inside <ToastProvider>");
  return ctx;
}
