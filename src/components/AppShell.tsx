"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useApp } from "@/lib/store";
import { ROL_LABEL } from "@/lib/format";
import type { Rol } from "@/lib/types";
import { cn } from "@/lib/format";

const NAV: Array<{ href: string; label: string; icon: ReactNode }> = [
  { href: "/", label: "Bandeja", icon: <IconInbox /> },
  { href: "/zonas", label: "Mapa", icon: <IconMap /> },
  { href: "/presupuesto", label: "Presupuesto", icon: <IconBudget /> },
  { href: "/reglas", label: "Reglas", icon: <IconRules /> },
  { href: "/foto", label: "Fotos", icon: <IconPhoto /> },
];

const ROLES: Rol[] = ["preventista", "supervisor", "gerente", "trade", "finanzas", "direccion"];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const rol = useApp((s) => s.rol);
  const setRol = useApp((s) => s.setRol);

  return (
    <div className="flex min-h-dvh">
      {/* Sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-line bg-panel px-4 py-5 md:flex">
        <Link href="/" className="mb-7 flex items-center gap-2 px-2">
          <span className="text-xl font-bold tracking-tight text-ink">Relu</span>
          <span className="mt-0.5 text-[11px] font-medium text-faint">· Pampa</span>
        </Link>

        <div className="mb-6 px-2">
          <label className="mb-1.5 block text-[11px] font-medium text-muted">
            Viendo como
          </label>
          <div className="relative">
            <select
              value={rol}
              onChange={(e) => setRol(e.target.value as Rol)}
              className="w-full appearance-none rounded-md border border-line bg-paper px-3 py-2 pr-8 text-sm font-medium text-ink outline-none focus:border-ink"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROL_LABEL[r]}
                </option>
              ))}
            </select>
            <IconChevron className="pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2 text-faint" />
          </div>
        </div>

        <nav className="flex flex-col gap-0.5">
          {NAV.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : item.href === "/zonas"
                  ? pathname.startsWith("/zonas") || pathname.startsWith("/zona/")
                  : item.href === "/presupuesto"
                    ? pathname.startsWith("/presupuesto") || pathname.startsWith("/comercio")
                    : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active ? "bg-ink text-white" : "text-ink-soft hover:bg-card"
                )}
              >
                <span className={active ? "text-white" : "text-faint"}>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto px-2 pt-6">
          <p className="text-[11px] leading-relaxed text-faint">
            Demo · datos ilustrativos. Cada número baja hasta su evidencia.
          </p>
        </div>
      </aside>

      {/* Columna principal */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-line bg-paper/90 px-5 backdrop-blur md:px-8">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-semibold text-ink">Pampa Bottlers</span>
            <span className="text-faint">·</span>
            <span className="text-muted">Ciclo comercial 2026</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted">
            <span className="hidden sm:inline">Rol activo:</span>
            <span className="rounded-full bg-ink px-2.5 py-1 text-xs font-medium text-white">
              {ROL_LABEL[rol]}
            </span>
          </div>
        </header>

        {/* Nav mobile */}
        <div className="flex gap-1 overflow-x-auto border-b border-line px-4 py-2 md:hidden">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-1.5 text-sm font-medium text-ink-soft hover:bg-card"
            >
              {item.label}
            </Link>
          ))}
        </div>

        <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-8 md:px-8 md:py-10">
          {children}
        </main>
      </div>
    </div>
  );
}

/* ---- Íconos (inline, sin dependencias) ---- */
function IconBudget() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M2 13V3M2 13h12M5 11V7M8.5 11V5M12 11V8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
function IconInbox() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M2 9.5 3.4 3.3A1 1 0 0 1 4.4 2.5h7.2a1 1 0 0 1 1 .8L14 9.5M2 9.5V13h12V9.5M2 9.5h3.2l.8 1.3h4l.8-1.3H14" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
    </svg>
  );
}
function IconRules() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M4 2.5h8v11H4zM6 5.5h4M6 8h4M6 10.5h2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconPhoto() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M2 4.5h2l1-1.3h6l1 1.3h2v8H2z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      <circle cx="8" cy="8.3" r="2.2" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}
function IconMap() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M6 2.5 2.5 4v9.5L6 12l4 1.5 3.5-1.5V2.5L10 4 6 2.5zM6 2.5V12M10 4v9.5" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
    </svg>
  );
}
function IconChevron({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="m4 6 4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
