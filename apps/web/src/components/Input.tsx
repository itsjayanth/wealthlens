"use client";

import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, hint, id, className = "", ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={id} className="text-xs font-medium uppercase tracking-wider text-parchment-muted">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={`rounded-lg border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-sm text-parchment placeholder:text-parchment-dim/60 outline-none transition-colors focus:border-gold/50 focus:bg-white/[0.05] focus:ring-1 focus:ring-gold/30 ${className}`}
          {...props}
        />
        {hint && <p className="text-xs text-parchment-dim">{hint}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
