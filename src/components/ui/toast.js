"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";
import { CircleCheck, CircleAlert, Info, X } from "lucide-react";
import { cn } from "@/lib/format";

const ToastContext = createContext({ toast: () => {} });

const ICON = { success: CircleCheck, error: CircleAlert, info: Info };
const TONE = {
  success: "border-primary text-primary",
  error: "border-danger text-danger",
  info: "border-accent text-accent-deep",
};

export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);
  const idRef = useRef(0);

  const remove = useCallback((id) => setItems((p) => p.filter((t) => t.id !== id)), []);

  const toast = useCallback(
    ({ type = "success", title, description, duration = 4000 }) => {
      const id = ++idRef.current;
      setItems((p) => [...p, { id, type, title, description }]);
      setTimeout(() => remove(id), duration);
    },
    [remove],
  );

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-20 z-[100] flex flex-col items-center gap-2 px-4 md:bottom-6 md:items-end md:px-6"
        aria-live="polite"
      >
        {items.map((t) => {
          const Icon = ICON[t.type] ?? Info;
          return (
            <div
              key={t.id}
              role="status"
              className={cn(
                "pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border-l-4 bg-surface p-4 shadow-card ring-1 ring-line",
                TONE[t.type],
              )}
            >
              <Icon className="mt-0.5 size-5 shrink-0" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-extrabold text-fg">{t.title}</p>
                {t.description && <p className="mt-0.5 text-sm text-muted">{t.description}</p>}
              </div>
              <button onClick={() => remove(t.id)} aria-label="Tutup notifikasi" className="text-muted hover:text-fg">
                <X className="size-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
