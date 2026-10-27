import type { ReactNode } from "react";
import { cn, type Tono } from "@/lib/format";

export function PageTitle({
  children,
  sub,
}: {
  children: ReactNode;
  sub?: ReactNode;
}) {
  return (
    <header className="mb-8">
      <span className="brand-rule mb-4" />
      <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-[28px]">
        {children}
      </h1>
      {sub ? <p className="mt-2 max-w-2xl text-sm text-muted">{sub}</p> : null}
    </header>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="mb-3 text-sm font-semibold tracking-tight text-ink">
      {children}
    </h2>
  );
}

const TONO_CLASS: Record<Tono, string> = {
  ok: "bg-ok-bg text-ok-ink",
  warn: "bg-warn-bg text-warn-ink",
  bad: "bg-bad-bg text-bad-ink",
  neutro: "bg-card text-ink-soft",
  ink: "bg-ink text-white",
};

const DOT_CLASS: Record<Tono, string> = {
  ok: "bg-ok",
  warn: "bg-warn",
  bad: "bg-bad",
  neutro: "bg-faint",
  ink: "bg-white",
};

export function Badge({
  tono = "neutro",
  dot = false,
  children,
}: {
  tono?: Tono;
  dot?: boolean;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        TONO_CLASS[tono]
      )}
    >
      {dot ? <span className={cn("size-1.5 rounded-full", DOT_CLASS[tono])} /> : null}
      {children}
    </span>
  );
}

export function StatTile({
  value,
  label,
  tono = "neutro",
}: {
  value: ReactNode;
  label: ReactNode;
  tono?: Tono;
}) {
  const accent =
    tono === "ok"
      ? "text-ok-ink"
      : tono === "warn"
        ? "text-warn-ink"
        : tono === "bad"
          ? "text-bad-ink"
          : "text-ink";
  return (
    <div className="rounded-lg border border-line bg-paper p-4">
      <div className={cn("text-2xl font-bold tracking-tight tnum", accent)}>
        {value}
      </div>
      <div className="mt-1 text-xs leading-snug text-muted">{label}</div>
    </div>
  );
}

export function Card({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-lg border border-line bg-paper", className)}>
      {children}
    </div>
  );
}

// Barra horizontal comparativa (presupuesto / pares).
export function Bar({
  value,
  max,
  tono = "ink",
}: {
  value: number;
  max: number;
  tono?: "ink" | "ok" | "warn" | "bad";
}) {
  const pct = max > 0 ? Math.max(2, Math.round((value / max) * 100)) : 0;
  const fill =
    tono === "ok"
      ? "bg-ok"
      : tono === "warn"
        ? "bg-warn"
        : tono === "bad"
          ? "bg-bad"
          : "bg-ink";
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-card">
      <div className={cn("h-full rounded-full", fill)} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Note({ children }: { children: ReactNode }) {
  return <p className="text-xs leading-relaxed text-muted">{children}</p>;
}

// Etiqueta "A definir con Pampa" — marca lo que es parámetro acordado, no supuesto nuestro.
export function PampaTag() {
  return (
    <span className="inline-flex items-center rounded border border-line-strong bg-card px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-ink-soft uppercase">
      A definir con Pampa
    </span>
  );
}
