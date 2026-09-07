import { HTMLAttributes } from "react";

export function Card({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`glass-panel rounded-2xl p-5 shadow-card ${className}`}
      {...props}
    />
  );
}
