"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { zonasConMetricas, type ZonaMetrica } from "@/lib/data";
import { cn, pct, usdFull } from "@/lib/format";
import { Badge, Card, PageTitle } from "@/components/ui";

function heatFill(t: number): string {
  const l = Math.round(240 - Math.min(t, 1) * 222);
  return `rgb(${l},${l},${l})`;
}

export default function ZonasPage() {
  const router = useRouter();
  const metricas = zonasConMetricas();
  const [hover, setHover] = useState<string | null>(null);
  const maxProblema = 0.4;

  const ranking = [...metricas].sort((a, b) => b.montoActual - a.montoActual);

  return (
    <div>
      <PageTitle sub="Las 14 zonas, por share de bajo retorno (comercios que compran menos del 60% de sus parecidos). Clic en una zona para ver sus comercios y sus zonas parecidas.">
        Mapa de zonas
      </PageTitle>

      <div className="grid gap-6 lg:grid-cols-[1.25fr_1fr]">
        {/* Mapa */}
        <Card className="p-4">
          <svg viewBox="0 0 100 100" className="w-full" role="img" aria-label="Mapa de zonas">
            {metricas.map((m) => {
              const t = Math.min(m.bajoRetornoPct / maxProblema, 1);
              const activo = hover === m.zona.id;
              const x = m.zona.mapX - 6.5;
              const y = m.zona.mapY - 4.5;
              return (
                <g
                  key={m.zona.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/zona/${m.zona.id}`)}
                  onMouseEnter={() => setHover(m.zona.id)}
                  onMouseLeave={() => setHover(null)}
                >
                  <rect
                    x={x}
                    y={y}
                    width={13}
                    height={9}
                    rx={2}
                    fill={heatFill(t)}
                    stroke={activo ? "#0a0a0a" : m.zona.piloto ? "#0a0a0a" : "#d4d4d8"}
                    strokeWidth={activo ? 1.4 : m.zona.piloto ? 1 : 0.6}
                    strokeDasharray={m.zona.piloto ? "0" : "0"}
                  />
                  <text
                    x={m.zona.mapX}
                    y={m.zona.mapY + 1.4}
                    textAnchor="middle"
                    fontSize={3.4}
                    fontWeight={600}
                    fill={t > 0.5 ? "#ffffff" : "#0a0a0a"}
                    style={{ pointerEvents: "none" }}
                  >
                    {m.zona.short}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Leyenda */}
          <div className="mt-2 flex items-center justify-between gap-3 border-t border-line pt-3">
            <div className="flex items-center gap-2 text-xs text-muted">
              <span>menos bajo retorno</span>
              <span className="h-2 w-24 rounded-full" style={{ background: "linear-gradient(90deg,#f0f0f0,#0a0a0a)" }} />
              <span>más</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted">
              <span className="inline-block size-3 rounded-sm border border-ink" />
              piloto
            </div>
          </div>
        </Card>

        {/* Ranking */}
        <div>
          <div className="mb-2 px-1 text-xs font-medium text-muted">
            Por inversión · clic para entrar
          </div>
          <Card className="divide-y divide-line">
            {ranking.map((m) => (
              <ZonaRow
                key={m.zona.id}
                m={m}
                maxProblema={maxProblema}
                hover={hover === m.zona.id}
                onEnter={() => setHover(m.zona.id)}
                onLeave={() => setHover(null)}
                onClick={() => router.push(`/zona/${m.zona.id}`)}
              />
            ))}
          </Card>
        </div>
      </div>
    </div>
  );
}

function ZonaRow({
  m,
  maxProblema,
  hover,
  onEnter,
  onLeave,
  onClick,
}: {
  m: ZonaMetrica;
  maxProblema: number;
  hover: boolean;
  onEnter: () => void;
  onLeave: () => void;
  onClick: () => void;
}) {
  const t = Math.min(m.bajoRetornoPct / maxProblema, 1);
  return (
    <button
      onClick={onClick}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      className={cn(
        "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors",
        hover ? "bg-card" : "hover:bg-panel"
      )}
    >
      <span className="w-12 shrink-0 font-mono text-[11px] text-faint">{m.zona.short}</span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium text-ink">{m.zona.nombre}</span>
          {m.zona.piloto ? <Badge tono="ink">Piloto</Badge> : null}
          {m.vencidas > 0 ? <Badge tono="bad" dot>{m.vencidas}</Badge> : null}
        </div>
        <div className="mt-1 flex items-center gap-2">
          <div className="h-1.5 w-20 overflow-hidden rounded-full bg-card">
            <div className="h-full rounded-full bg-ink" style={{ width: `${Math.max(4, t * 100)}%` }} />
          </div>
          <span className="text-[11px] text-muted">{pct(m.bajoRetornoPct)} bajo retorno</span>
        </div>
      </div>
      <div className="shrink-0 text-right">
        <div className="text-sm font-semibold text-ink tnum">{usdFull(m.montoActual)}</div>
        <div className="text-[11px] text-faint">{m.comercios} comercios</div>
      </div>
    </button>
  );
}
