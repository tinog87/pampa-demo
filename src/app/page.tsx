"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CONTEXTO_NACIONAL,
  DECISIONES,
  decisionesDeComercio,
  presupuestoPorZona,
  totalesDemo,
} from "@/lib/data";
import { useApp, estadoEfectivo } from "@/lib/store";
import {
  CANAL_LABEL,
  LINEA_LABEL,
  cn,
  compraTexto,
  millones,
  pct,
  usdFull,
} from "@/lib/format";
import type { Comercio, EstadoDecision } from "@/lib/types";
import { Badge, Bar, Card, Note, PageTitle, SectionTitle, StatTile } from "@/components/ui";

export default function PresupuestoPage() {
  const estados = useApp((s) => s.estados);
  const zonas = presupuestoPorZona();
  const totales = totalesDemo();

  const esperan = DECISIONES.filter(
    (d) => estadoEfectivo(estados, d.id, d.estadoInicial) === "esperando"
  ).length;
  const ejecutadas = DECISIONES.filter((d) =>
    ["aprobada", "ejecutada", "medida"].includes(
      estadoEfectivo(estados, d.id, d.estadoInicial)
    )
  ).length;
  const vencidas = DECISIONES.filter(
    (d) => d.vencida && estadoEfectivo(estados, d.id, d.estadoInicial) === "esperando"
  ).length;

  const maxLinea = Math.max(...CONTEXTO_NACIONAL.lineas.map((l) => l.monto));

  return (
    <div>
      <PageTitle
        sub="El presupuesto del próximo ciclo, por zona y por línea. Desde cualquier número se baja al comercio, a la regla que lo decidió y a la foto que lo sostiene."
      >
        Cada peso trazado
      </PageTitle>

      {/* Contexto nacional */}
      <Card className="mb-8 p-5">
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <SectionTitle>Contexto Pampa · canal tradicional</SectionTitle>
          <span className="text-sm font-semibold text-ink tnum">
            {millones(CONTEXTO_NACIONAL.total)} / año
          </span>
        </div>
        <div className="grid gap-x-8 gap-y-2.5 sm:grid-cols-2">
          {CONTEXTO_NACIONAL.lineas.map((l) => (
            <div key={l.linea} className="flex items-center gap-3">
              <span className="w-40 shrink-0 text-sm text-ink-soft">
                {LINEA_LABEL[l.linea]}
              </span>
              <Bar value={l.monto} max={maxLinea} />
              <span className="w-16 shrink-0 text-right text-sm font-medium text-ink tnum">
                {millones(l.monto)}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-4 border-t border-line pt-3">
          <Note>
            Pampa estima que entre el 25% y el 35% está en comercios de bajo o nulo
            retorno: {millones(CONTEXTO_NACIONAL.malAsignadoMin)} a{" "}
            {millones(CONTEXTO_NACIONAL.malAsignadoMax)} por año. No es un ahorro
            prometido: es lo que el sistema baja a comercio para decidir qué se recupera.
          </Note>
        </div>
      </Card>

      {/* Tiles del sistema */}
      <div className="mb-10 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile value={esperan} label="decisiones esperan aprobación" tono="warn" />
        <StatTile value={ejecutadas} label="aprobadas o ejecutadas" tono="ok" />
        <StatTile value={vencidas} label="tareas vencidas" tono={vencidas > 0 ? "bad" : "neutro"} />
        <StatTile value={pct(totales.pctJustificado)} label="del monto, justificado" />
      </div>

      {/* Presupuesto por zona */}
      <div className="mb-3 flex items-center justify-between">
        <SectionTitle>Presupuesto por zona</SectionTitle>
        <span className="text-xs text-muted">
          {totales.comercios} comercios · {usdFull(totales.montoActual)} trazados
        </span>
      </div>

      <div className="space-y-3">
        {zonas.map((z, i) => (
          <ZonaBlock key={z.zonaId} zona={z} abiertaInicial={i === 0} estados={estados} />
        ))}
      </div>
    </div>
  );
}

function ZonaBlock({
  zona,
  abiertaInicial,
  estados,
}: {
  zona: ReturnType<typeof presupuestoPorZona>[number];
  abiertaInicial: boolean;
  estados: Record<string, EstadoDecision>;
}) {
  const [abierta, setAbierta] = useState(abiertaInicial);
  const maxLinea = Math.max(...zona.lineas.map((l) => l.montoActual), 1);

  return (
    <Card>
      <button
        onClick={() => setAbierta((v) => !v)}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
      >
        <div className="flex items-center gap-3">
          <Chevron abierta={abierta} />
          <span className="font-semibold text-ink">{zona.nombre}</span>
          {zona.piloto ? <Badge tono="ink">Piloto</Badge> : null}
        </div>
        <div className="flex items-center gap-6">
          <div className="hidden text-right sm:block">
            <div className="text-xs text-muted">Justificado</div>
            <div className="text-sm font-medium text-ink tnum">
              {pct(zona.montoActual > 0 ? zona.justificado / zona.montoActual : 0)}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted">Inversión</div>
            <div className="text-sm font-semibold text-ink tnum">
              {usdFull(zona.montoActual)}
            </div>
          </div>
        </div>
      </button>

      {abierta ? (
        <div className="border-t border-line px-5 py-5">
          {/* Líneas */}
          <div className="mb-6 grid gap-x-8 gap-y-2.5 sm:grid-cols-2">
            {zona.lineas.map((l) => (
              <div key={l.linea} className="flex items-center gap-3">
                <span className="w-40 shrink-0 text-sm text-ink-soft">
                  {LINEA_LABEL[l.linea]}
                </span>
                <Bar value={l.montoActual} max={maxLinea} />
                <span className="w-16 shrink-0 text-right text-sm font-medium text-ink tnum">
                  {usdFull(l.montoActual)}
                </span>
              </div>
            ))}
          </div>

          {/* Comercios */}
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
                {zona.comercios.map((c) => (
                  <ComercioRow key={c.id} c={c} estados={estados} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </Card>
  );
}

function ComercioRow({
  c,
  estados,
}: {
  c: Comercio;
  estados: Record<string, EstadoDecision>;
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

function Chevron({ abierta }: { abierta: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden
      className={cn("text-faint transition-transform", abierta && "rotate-90")}
    >
      <path d="m6 4 4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
