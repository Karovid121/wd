"use client";

import { useId, useState } from "react";
import { Eye, EyeOff, LoaderCircle } from "lucide-react";

type FieldProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> & {
  label: string;
  error?: string;
  hint?: string;
  prefix?: string;
  onChange: (value: string) => void;
};

export function Field({ label, error, hint, prefix, type, onChange, className = "", ...rest }: FieldProps) {
  const id = useId();
  const [reveal, setReveal] = useState(false);
  const isPassword = type === "password";
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-xs font-semibold tracking-wide text-muted uppercase">
        {label}
      </label>
      <div
        className={`flex items-center rounded-lg border bg-rail transition-colors focus-within:border-accent ${
          error ? "border-danger/70" : "border-line hover:border-faint"
        }`}
      >
        {prefix && <span className="pl-3 text-faint select-none">{prefix}</span>}
        <input
          id={id}
          type={isPassword && reveal ? "text" : type}
          aria-invalid={!!error}
          aria-describedby={error || hint ? `${id}-note` : undefined}
          onChange={(e) => onChange(e.target.value)}
          className={`min-w-0 flex-1 bg-transparent py-2.5 text-[15px] outline-none placeholder:text-faint ${
            prefix ? "pl-1" : "pl-3"
          } pr-3`}
          {...rest}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setReveal((v) => !v)}
            aria-label={reveal ? "Hide password" : "Show password"}
            className="mr-1.5 rounded-md p-1.5 text-muted transition-colors hover:bg-hover hover:text-fg"
          >
            {reveal ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        )}
      </div>
      {(error || hint) && (
        <p id={`${id}-note`} className={`mt-1.5 text-xs ${error ? "text-danger" : "text-faint"}`}>
          {error || hint}
        </p>
      )}
    </div>
  );
}

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "danger";
  loading?: boolean;
};

const VARIANT = {
  primary: "bg-accent text-white hover:bg-accent-strong shadow-lg shadow-accent/20",
  ghost: "bg-hover text-fg hover:bg-line",
  danger: "bg-danger/15 text-danger hover:bg-danger hover:text-white",
};

export function Button({ variant = "primary", loading, disabled, children, className = "", ...rest }: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all duration-150 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100 ${VARIANT[variant]} ${className}`}
      {...rest}
    >
      {loading && <LoaderCircle className="size-4 animate-spin" />}
      {children}
    </button>
  );
}
