"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";
import { motion, HTMLMotionProps } from "framer-motion";

type Variant = "primary" | "secondary" | "danger" | "ghost";

type ButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof HTMLMotionProps<"button">> &
  HTMLMotionProps<"button"> & {
    variant?: Variant;
  };

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-gold-gradient text-ink-950 shadow-glow-sm hover:shadow-glow disabled:opacity-40 disabled:shadow-none",
  secondary:
    "border border-white/15 bg-white/[0.03] text-parchment hover:border-gold/40 hover:bg-white/[0.06] disabled:opacity-40",
  danger:
    "border border-rose-soft/30 bg-rose-soft/10 text-rose-soft hover:bg-rose-soft/20 disabled:opacity-40",
  ghost: "bg-transparent text-parchment-muted hover:text-parchment disabled:opacity-40",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", className = "", disabled, ...props }, ref) => {
    return (
      <motion.button
        ref={ref}
        whileHover={disabled ? undefined : { scale: 1.02 }}
        whileTap={disabled ? undefined : { scale: 0.98 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        disabled={disabled}
        className={`inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-medium tracking-wide transition-colors disabled:cursor-not-allowed ${variantClasses[variant]} ${className}`}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
