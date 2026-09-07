"use client";

import { ReactNode } from "react";
import { useRequireAuth } from "@/lib/auth";

/**
 * Wraps a page's content and redirects to /login if no token is present.
 * Renders nothing until the client-side check has completed, to avoid a
 * flash of protected content.
 */
export function AuthGuard({ children }: { children: ReactNode }) {
  const { ready } = useRequireAuth();

  if (!ready) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-slate-400">
        Loading...
      </div>
    );
  }

  return <>{children}</>;
}
