"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { clearToken, getToken } from "@/lib/auth";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/recommendations", label: "Recommendations" },
  { href: "/link-account", label: "Connect Account" },
];

function Logo() {
  return (
    <span className="font-display text-lg tracking-tight text-parchment">
      Wealth<span className="gold-text italic">Lens</span>
    </span>
  );
}

export function NavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    setAuthed(!!getToken());
  }, [pathname]);

  function handleLogout() {
    clearToken();
    router.push("/login");
  }

  if (!authed) {
    // Marketing header only on the landing page; auth pages keep a clean, nav-free canvas.
    if (pathname !== "/") return null;

    return (
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-ink/70 backdrop-blur-xl">
        <div className="shell flex items-center justify-between py-4">
          <Link href="/">
            <Logo />
          </Link>
          <nav className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/login"
              className="rounded-full px-4 py-2 text-sm font-medium text-parchment-muted transition-colors hover:text-parchment"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="rounded-full bg-gold-gradient px-4 py-2 text-sm font-medium text-ink-950 shadow-glow-sm transition-shadow hover:shadow-glow"
            >
              Get started
            </Link>
          </nav>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-ink/70 backdrop-blur-xl">
      <div className="shell flex items-center justify-between py-4">
        <Link href="/dashboard">
          <Logo />
        </Link>
        <nav className="flex items-center gap-1 sm:gap-1.5">
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-gold/15 text-gold-light"
                    : "text-parchment-muted hover:bg-white/5 hover:text-parchment"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
          <button
            onClick={handleLogout}
            className="ml-1 rounded-full px-3.5 py-1.5 text-sm font-medium text-parchment-muted transition-colors hover:bg-white/5 hover:text-parchment"
          >
            Logout
          </button>
        </nav>
      </div>
    </header>
  );
}
