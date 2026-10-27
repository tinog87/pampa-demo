"use client";

import Link from "next/link";
import {
  decisionesDeComercio,
  presupuestoPorZona,
  zonaMetrica,
  zonasParecidas,
} from "@/lib/data";
import { useApp, estadoEfectivo } from "@/lib/store";
import {
  CANAL_LABEL,
  LINEA_LABEL,
  cn,
  compraTexto,
  pct,
  usdFull,
} from "@/lib/format";
import type { Comercio } from "@/lib/types";
import { Badge, Bar, Card, Note, StatTile } from "@/components/ui";

export function ZonaDetail({ id }: { id: string }) {
  const estados = useApp((s) => s.estados);
  const metrica = zonaMetrica(id);
  const roll = presupuestoPorZona().find((z) => z.zonaId === id);
  const parecidas = zonasParecidas(id, 3);

  if (!metrica || !roll) {
    return (
      <div>
        <Link href="/zonas" className="text-sm text-muted hover:text-ink">
          ← Mapa de zonas
        </Link>
        <p className="mt-6 text-sm text-muted">No se encontró la zona.</p>
      </div>
    );
  }

  const z = metrica.zona;
  const maxLinea = Math.max(...roll.lineas.map((l) => l.montoActual), 1);

  return (
    <div>
      <Link href="/zonas" className="text-sm text-muted hover:text-ink">
        ← Mapa de zonas
      </Link>

      {/* Header */}
      <div className="mt-4 mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <span className="brand-rule mb-3" />
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-[28px]">
              {z.nombre}
            </h1>
            {z.piloto ? <Badge tono="ink">Piloto</Badge> : null}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
            <span className="font-mono text-xs text-faint">{z.short}</span>
            <span>·</span>
            <span>{metrica.comercios} comercios</span>
            {z.competenciaActiva ? (
              <>
                <span>·</span>
                <Badge tono="warn" dot>Competencia activa</Badge>
              </>
            ) : null}
          </div>
        </div>
      </div>

      {/* Tiles */}
      <div className="mb-10 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile value={usdFull(metrica.montoActual)} label="inversión en el ciclo" />
        <StatTile value={pct(metrica.justificadoPct)} label="del monto, justificado" tono="ok" />
        <StatTile value={pct(metrica.bajoRetornoPct)} label="comercios de bajo retorno" tono="warn" />
        <StatTile value={metrica.vencidas} label="tareas vencidas" tono={metrica.vencidas > 0 ? "bad" : "neutro"} />
      </div>

      {/* Líneas */}
      <h2 className="mb-3 text-sm font-semibold text-ink">Inversión por línea</h2>
      <Card className="mb-10 p-5">
        <div className="grid gap-x-8 gap-y-2.5 sm:grid-cols-2">
          {roll.lineas.map((l) => (
            <div key={l.linea} className="flex items-center gap-3">
              <span className="w-40 shrink-0 text-sm text-ink-soft">{LINEA_LABEL[l.linea]}</span>
              <Bar value={l.montoActual} max={maxLinea} />
              <span className="w-16 shrink-0 text-right text-sm font-medium text-ink tnum">
                {usdFull(l.montoActual)}
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* Comercios */}
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-ink">Comercios de la zona</h2>
        <span className="text-xs text-muted">{roll.comercios.length} comercios</span>
      </div>
      <Card className="mb-12 p-5">
        <div className="overflow-x-auto">
          <table className="w-full min-w-160 border-collapse text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs font-medium text-muted">
                <th className="pb-2 pr-3 font-medium">Comercio</th>
                <th className="pb-2 pr-3 font-medium">Canal</th>
                <th className="pb-2 pr-3 font-medium">Compra vs parecidos</th>
                <th className="pb-2 pr-3 text-right font-medium">Inversión</th>
                <th className="pb-2 pr-3 font-medium">Estado</th>
                <th className="pb-2" />
              </tr>
            </thead>
            <tbody>
              {roll.comercios.map((c) => (
                <ComercioRow key={c.id} c={c} estados={estados} />
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Zonas parecidas */}
      <h2 className="mb-1 text-sm font-semibold text-ink">Zonas parecidas</h2>
      <p className="mb-4 text-xs text-muted">
        Mismo perfil: share de bajo retorno y tamaño de parque similares. Sirven de vara para
        comparar la de acá.
      </p>
      <div className="grid gap-3 sm:grid-cols-3">
        {parecidas.map((p) => (
          <Link
            key={p.zona.id}
            href={`/zona/${p.zona.id}`}
            className="group rounded-lg border border-line bg-paper p-4 transition-colors hover:border-ink"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-ink group-hover:underline">
                {p.zona.nombre}
              </span>
              {p.zona.piloto ? <Badge tono="ink">Piloto</Badge> : null}
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-muted">
              <span>{pct(p.bajoRetornoPct)} bajo retorno</span>
              <span>{p.comercios} comercios</span>
            </div>
            <div className="mt-1 text-sm font-medium text-ink tnum">{usdFull(p.montoActual)}</div>
          </Link>
        ))}
      </div>

      {parecidas.length === 0 ? <Note>No hay otras zonas cargadas para comparar.</Note> : null}
    </div>
  );
}

function ComercioRow({
  c,
  estados,
}: {
  c: Comercio;
  estados: Record<string, import("@/lib/types").EstadoDecision>;
}) {
  const inv = c.inversiones.reduce((a, i) => a + i.montoActual, 0);
  const decs = decisionesDeComercio(c.id);
  const algunaEspera = decs.some(
    (d) => estadoEfectivo(estados, d.id, d.estadoInicial) === "esperando"
  );
  const sinJustificar = c.inversiones.some((i) => !i.justificado);
  const ratio = c.compraVsParecidos;
  const ratioTono = ratio < 0.6 ? "bad" : ratio < 0.85 ? "warn" : ratio > 1.3 ? "ok" : "ink";
  const estado = algunaEspera
    ? { t: "warn" as const, l: "Esperando" }
    : sinJustificar
      ? { t: "bad" as const, l: "A validar" }
      : { t: "ok" as const, l: "Trazado" };

  return (
    <tr className="group border-b border-line/70 last:border-0">
      <td className="py-2.5 pr-3">
        <Link href={`/comercio/${c.id}`} className="font-medium text-ink hover:underline">
          {c.nombre}
        </Link>
        <div className="font-mono text-[11px] text-faint">{c.codigo}</div>
      </td>
      <td className="py-2.5 pr-3 text-ink-soft">{CANAL_LABEL[c.canal]}</td>
      <td className="py-2.5 pr-3">
        <div className="flex items-center gap-2">
          <div className="w-24">
            <Bar value={Math.min(ratio, 2)} max={2} tono={ratioTono} />
          </div>
          <span className={cn("text-xs tnum", ratioTono === "bad" ? "text-bad-ink" : "text-muted")}>
            {Math.round(ratio * 100)}%
          </span>
        </div>
        <div className="text-[11px] text-faint">{compraTexto(ratio)}</div>
      </td>
      <td className="py-2.5 pr-3 text-right font-medium text-ink tnum">{usdFull(inv)}</td>
      <td className="py-2.5 pr-3">
        <Badge tono={estado.t} dot>
          {estado.l}
        </Badge>
      </td>
      <td className="py-2.5 text-right">
        <Link
          href={`/comercio/${c.id}`}
          className="text-faint transition-colors group-hover:text-ink"
          aria-label={`Ver ${c.nombre}`}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden className="inline">
            <path d="m6 4 4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      </td>
    </tr>
  );
}
