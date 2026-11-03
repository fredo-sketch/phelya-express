"use client";

import { useId } from "react";
import { cn } from "@/lib/format";

const base =
  "w-full rounded-xl border bg-surface px-4 text-[15px] text-fg placeholder:text-muted/70 transition " +
  "focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15 disabled:opacity-60";

/**
 * Field = label + kontrol + pesan error/hint.
 * Pesan error ditampilkan di bawah kontrol dan dihubungkan lewat aria-describedby.
 */
export function Field({ label, required, error, hint, children, className, action }) {
  const id = useId();
  const describedBy = error ? `${id}-err` : hint ? `${id}-hint` : undefined;
  const control =
    typeof children === "function" ? children({ id, "aria-describedby": describedBy, "aria-invalid": !!error }) : children;
  return (
    <div className={className}>
      {label && (
        <div className="mb-1.5 flex items-center justify-between gap-3">
          <label htmlFor={id} className="text-sm font-bold">
            {label} {required && <span className="text-danger">*</span>}
          </label>
          {action}
        </div>
      )}
      {control}
      {error ? (
        <p id={`${id}-err`} role="alert" className="mt-1.5 text-xs font-semibold text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function Input({ className, invalid, icon: Icon, right, ...props }) {
  return (
    <div className="relative">
      {Icon && <Icon className="pointer-events-none absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-muted" aria-hidden />}
      <input
        className={cn(base, "h-12", invalid ? "border-danger" : "border-line", Icon && "pl-11", right && "pr-12", className)}
        {...props}
        aria-invalid={invalid || undefined}
      />
      {right && <div className="absolute right-2 top-1/2 -translate-y-1/2">{right}</div>}
    </div>
  );
}

export function Select({ className, invalid, children, ...props }) {
  return (
    <select
      className={cn(base, "h-12 appearance-none bg-no-repeat pr-10", invalid ? "border-danger" : "border-line", className)}
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%237d6a62' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
        backgroundPosition: "right 14px center",
      }}
      {...props}
      aria-invalid={invalid || undefined}
    >
      {children}
    </select>
  );
}

export function Textarea({ className, invalid, ...props }) {
  return (
    <textarea
      className={cn(base, "min-h-28 py-3", invalid ? "border-danger" : "border-line", className)}
      {...props}
      aria-invalid={invalid || undefined}
    />
  );
}
