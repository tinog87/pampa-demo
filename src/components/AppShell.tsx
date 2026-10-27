"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useApp } from "@/lib/store";
import { ROL_LABEL, cn, rolTieneZona } from "@/lib/format";
import { ZONAS, MUESTRA } from "@/lib/data";
import type { Rol } from "@/lib/types";

type NavItem = { href: string; label: string };

const NAV: Record<Rol, NavItem[]> = {
  preventista: [
    { href: "/", label: "Hoy" },
    { href: "/hechas", label: "Hechas" },
  ],
  supervisor: [
    { href: "/", label: "Para aprobar" },
    { href: "/revisar-fotos", label: "Revisar fotos" },
    { href: "/mi-equipo", label: "Mi equipo" },
  ],
  gerente: [
    { href: "/", label: "Bandeja" },
    { href: "/mi-zona", label: "Mi zona" },
    { href: "/comercios", label: "Comercios" },
  ],
  trade: [
    { href: "/", label: "Reglas" },
    { href: "/derivados", label: "Derivados a Trade" },
  ],
  finanzas: [
    { href: "/", label: "Presupuesto" },
    { href: "/ciclo", label: "Ciclo en curso" },
  ],
  direccion: [
    { href: "/", label: "Resumen" },
    { href: "/presupuesto", label: "Presupuesto" },
  ],
};

const ROLES: Rol[] = ["preventista", "supervisor", "gerente", "trade", "finanzas", "direccion"];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { rol, zona, setRol, setZona } = useApp();

  const nav = NAV[rol];
  const conZona = rolTieneZona(rol);
  const zonaNombre = ZONAS.find((z) => z.id === zona)?.nombre ?? "";

  function cambiarRol(nuevo: Rol) {
    setRol(nuevo);
    router.push("/");
  }

  return (
    <div className="flex min-h-dvh flex-col">
      {/* Banner de muestra, una sola vez, arriba */}
      <div className="w-full bg-ink px-4 py-1.5 text-center text-xs text-white/90">
        {MUESTRA.banner}
      </div>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-line bg-panel px-4 py-5 md:flex">
          <Link href="/" className="mb-6 flex items-center gap-2 px-2">
            <span className="text-xl font-bold tracking-tight text-ink">Relu</span>
            <span className="mt-0.5 text-[11px] font-medium text-faint">· Pampa</span>
          </Link>

          <div className="mb-3 px-2">
            <label className="mb-1 block text-[11px] font-medium text-muted">Viendo como</label>
            <Select value={rol} onChange={(v) => cambiarRol(v as Rol)} options={ROLES.map((r) => ({ value: r, label: ROL_LABEL[r] }))} />
          </div>

          {conZona ? (
            <div className="mb-5 px-2">
              <label className="mb-1 block text-[11px] font-medium text-muted">Zona</label>
              <Select value={zona} onChange={setZona} options={ZONAS.map((z) => ({ value: z.id, label: z.nombre }))} />
            </div>
          ) : (
            <div className="mb-5 px-2 text-[11px] text-faint">Ve todas las zonas.</div>
          )}

          <nav className="flex flex-col gap-0.5">
            {nav.map((item) => {
              const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    active ? "bg-ink text-white" : "text-ink-soft hover:bg-card"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto px-2 pt-6">
            <p className="text-[11px] leading-relaxed text-faint">
              Demo con datos ilustrativos. La lectura de fotos está simulada.
            </p>
          </div>
        </aside>

        {/* Columna principal */}
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-10 flex h-14 items-center justify-between gap-3 border-b border-line bg-paper/90 px-5 backdrop-blur md:px-8">
            <div className="flex min-w-0 items-center gap-2 text-sm">
              <span className="font-semibold text-ink">Pampa Bottlers</span>
              <span className="text-faint">·</span>
              <span className="truncate text-muted">
                Viendo como {ROL_LABEL[rol]}
                {conZona ? ` · ${zonaNombre}` : ""}
              </span>
            </div>
            {/* Nav mobile */}
            <div className="flex gap-1 overflow-x-auto md:hidden">
              {nav.map((item) => (
                <Link key={item.href} href={item.href} className="whitespace-nowrap rounded-md bg-card px-2.5 py-1 text-xs font-medium text-ink-soft">
                  {item.label}
                </Link>
              ))}
            </div>
          </header>

          {/* Selector de rol en mobile */}
          <div className="flex items-center gap-2 border-b border-line px-4 py-2 md:hidden">
            <Select value={rol} onChange={(v) => cambiarRol(v as Rol)} options={ROLES.map((r) => ({ value: r, label: ROL_LABEL[r] }))} />
            {conZona ? (
              <Select value={zona} onChange={setZona} options={ZONAS.map((z) => ({ value: z.id, label: z.nombre }))} />
            ) : null}
          </div>

          <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 md:px-8 md:py-10">{children}</main>
        </div>
      </div>
    </div>
  );
}

function Select({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none rounded-md border border-line bg-paper px-3 py-2 pr-8 text-sm font-medium text-ink outline-none focus:border-ink"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <svg className="pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2 text-faint" viewBox="0 0 16 16" fill="none" aria-hidden>
        <path d="m4 6 4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}
