"use client";

import { useState } from "react";
import Link from "next/link";
import {
  COMERCIOS,
  DECISIONES,
  estadoDe,
  getComercio,
  presupuestoPorZona,
  totalesMuestra,
} from "@/lib/data";
import { useApp } from "@/lib/store";
import {
  ACCION_LABEL,
  LINEA_LABEL,
  cn,
  pct,
  usd,
} from "@/lib/format";
import type { Accion } from "@/lib/types";
import { Badge, Card, Note, PageTitle, StatTile } from "./ui";
import { EstadoMontoBar } from "./shared";

function sum(xs: number[]) {
  return xs.reduce((a, b) => a + b, 0);
}

export function FinanzasPresupuesto({ readOnly = false }: { readOnly?: boolean }) {
  const { techos, setTecho, propuestas } = useApp();
  const zonas = presupuestoPorZona();
  const totales = totalesMuestra();
  const [abiertas, setAbiertas] = useState<Set<string>>(new Set());

  const techoDe = (id: string, def: number) => techos[id] ?? def;
  const techoTotal = sum(zonas.map((z) => techoDe(z.zona.id, z.techo)));
  const pedidoGerente = sum(propuestas.map((p) => p.monto));
  const pidenZonas = sum(zonas.map((z) => z.montoPropuesto)) + pedidoGerente;
  const proponeSistema = sum(zonas.map((z) => z.montoPropuesto));
  const dif = pidenZonas - techoTotal;

  function exportar() {
    const rows = [["Zona", "Línea", "Actual", "Propuesto", "% justificado"]];
    for (const z of zonas) {
      for (const l of z.lineas) {
        const justPct = l.montoActual ? l.porEstado.justificado / l.montoActual : 0;
        rows.push([z.zona.nombre, LINEA_LABEL[l.linea], String(l.montoActual), String(l.montoPropuesto), pct(justPct)]);
      }
    }
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "presupuesto-pampa.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  // Por motivo
  const porAccion = new Map<Accion, { count: number; monto: number }>();
  for (const c of COMERCIOS)
    for (const i of c.inversiones) {
      const cur = porAccion.get(i.accion) ?? { count: 0, monto: 0 };
      cur.count++;
      cur.monto += i.montoPropuesto;
      porAccion.set(i.accion, cur);
    }
  const motivos: Accion[] = ["cortar", "mover", "sumar", "renovar", "condicionar"];

  return (
    <div>
      <PageTitle sub="El próximo ciclo, el acumulado de todas las zonas de la muestra. Fijás el techo y los montos de aprobación.">
        Presupuesto · próximo ciclo
      </PageTitle>

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile value={usd(techoTotal)} label={readOnly ? "techo de Finanzas" : "techo (editable abajo)"} />
        <StatTile value={usd(pidenZonas)} label="piden las zonas" tono="warn" />
        <StatTile value={usd(proponeSistema)} label="propone el sistema" />
        <StatTile value={usd(dif)} label={dif > 0 ? "por encima del techo" : "margen bajo el techo"} tono={dif > 0 ? "bad" : "ok"} />
      </div>

      <Card className="mb-6 p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ink">Estado del monto</h2>
          <button onClick={exportar} className="rounded-md border border-line-strong px-3 py-1.5 text-xs font-medium text-ink-soft hover:bg-card">Exportar CSV</button>
        </div>
        <EstadoMontoBar porEstado={totales.porEstado} />
      </Card>

      {/* Por motivo */}
      <h2 className="mb-3 text-sm font-semibold text-ink">Por motivo</h2>
      <Card className="mb-8 divide-y divide-line">
        {motivos.map((a) => {
          const d = porAccion.get(a);
          if (!d) return null;
          return (
            <div key={a} className="flex items-center justify-between px-4 py-2.5 text-sm">
              <span className="font-medium text-ink">{ACCION_LABEL[a]}</span>
              <div className="flex items-center gap-6">
                <span className="text-muted">{d.count.toLocaleString("es-AR")} casos</span>
                <span className="w-28 text-right font-medium text-ink">{usd(d.monto)}</span>
              </div>
            </div>
          );
        })}
      </Card>

      {/* Tabla por zona */}
      <h2 className="mb-3 text-sm font-semibold text-ink">Por zona</h2>
      <Card className="mb-8 overflow-x-auto">
        <table className="w-full min-w-160 border-collapse text-sm">
          <thead>
            <tr className="bg-ink text-left text-xs font-medium text-white">
              <th className="px-4 py-2.5 font-medium">Zona</th>
              <th className="px-3 py-2.5 text-right font-medium">Actual</th>
              <th className="px-3 py-2.5 text-right font-medium">Pedido</th>
              <th className="px-3 py-2.5 text-right font-medium">Techo</th>
              <th className="px-3 py-2.5 text-right font-medium">% justif.</th>
            </tr>
          </thead>
          <tbody>
            {zonas.map((z) => {
              const abierta = abiertas.has(z.zona.id);
              const techo = techoDe(z.zona.id, z.techo);
              const justPct = z.montoActual ? z.porEstado.justificado / z.montoActual : 0;
              return (
                <ZonaFilas key={z.zona.id} abierta={abierta} toggle={() => {
                  const n = new Set(abiertas);
                  if (n.has(z.zona.id)) n.delete(z.zona.id);
                  else n.add(z.zona.id);
                  setAbiertas(n);
                }} z={z} techo={techo} justPct={justPct} readOnly={readOnly} setTecho={setTecho} />
              );
            })}
          </tbody>
        </table>
      </Card>

      {!readOnly ? <Note>El techo se edita por zona en la columna Techo. Los montos de corte de aprobación se definen con Pampa.</Note> : null}
    </div>
  );
}

function ZonaFilas({ z, abierta, toggle, techo, justPct, readOnly, setTecho }: {
  z: ReturnType<typeof presupuestoPorZona>[number];
  abierta: boolean;
  toggle: () => void;
  techo: number;
  justPct: number;
  readOnly: boolean;
  setTecho: (id: string, m: number) => void;
}) {
  return (
    <>
      <tr className="border-b border-line">
        <td className="px-4 py-2.5">
          <button onClick={toggle} className="flex items-center gap-2 font-medium text-ink">
            <svg className={cn("size-3.5 text-faint transition-transform", abierta && "rotate-90")} viewBox="0 0 16 16" fill="none"><path d="m6 4 4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
            {z.zona.nombre}
            {z.zona.piloto ? <Badge tono="ink">Piloto</Badge> : null}
          </button>
        </td>
        <td className="px-3 py-2.5 text-right font-medium text-ink">{usd(z.montoActual)}</td>
        <td className="px-3 py-2.5 text-right text-ink">{usd(z.montoPropuesto)}</td>
        <td className="px-3 py-2.5 text-right">
          {readOnly ? (
            <span className="text-ink">{usd(techo)}</span>
          ) : (
            <input type="number" value={techo} onChange={(e) => setTecho(z.zona.id, Number(e.target.value))} className="w-24 rounded border border-line bg-paper px-2 py-1 text-right text-sm text-ink outline-none focus:border-ink" />
          )}
        </td>
        <td className="px-3 py-2.5 text-right text-ink">{pct(justPct)}</td>
      </tr>
      {abierta ? (
        <tr className="border-b border-line bg-panel">
          <td colSpan={5} className="px-4 py-3">
            <div className="space-y-1.5">
              {z.lineas.map((l) => (
                <div key={l.linea} className="flex items-center justify-between text-xs">
                  <span className="text-ink-soft">{LINEA_LABEL[l.linea]}</span>
                  <span className="text-muted">actual <span className="text-ink">{usd(l.montoActual)}</span> · pide <span className="text-ink">{usd(l.montoPropuesto)}</span></span>
                </div>
              ))}
            </div>
          </td>
        </tr>
      ) : null}
    </>
  );
}

export function FinanzasCiclo() {
  const zonas = presupuestoPorZona();
  return (
    <div>
      <PageTitle sub="Trazabilidad del ciclo en curso: de dónde salió cada peso, por zona y línea.">Ciclo en curso</PageTitle>
      <Card className="overflow-x-auto">
        <table className="w-full min-w-160 border-collapse text-sm">
          <thead>
            <tr className="bg-ink text-left text-xs font-medium text-white">
              <th className="px-4 py-2.5 font-medium">Zona</th>
              <th className="px-3 py-2.5 text-right font-medium">Asignado</th>
              <th className="px-3 py-2.5 text-right font-medium">Sin motivo</th>
              <th className="px-3 py-2.5 text-right font-medium">A validar</th>
              <th className="px-3 py-2.5 text-right font-medium">Bajo retorno</th>
            </tr>
          </thead>
          <tbody>
            {zonas.map((z) => {
              const bajo = COMERCIOS.filter((c) => c.zonaId === z.zona.id && c.compraVsParecidos < 0.6).reduce((a, c) => a + c.inversiones.reduce((s, i) => s + i.montoActual, 0), 0);
              return (
                <tr key={z.zona.id} className="border-b border-line">
                  <td className="px-4 py-2.5 font-medium text-ink">{z.zona.nombre}</td>
                  <td className="px-3 py-2.5 text-right text-ink">{usd(z.montoActual)}</td>
                  <td className="px-3 py-2.5 text-right text-bad-ink">{usd(z.porEstado.sin_justificar)}</td>
                  <td className="px-3 py-2.5 text-right text-warn-ink">{usd(z.porEstado.a_validar)}</td>
                  <td className="px-3 py-2.5 text-right text-ink-soft">{usd(bajo)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
      <Note>&quot;Sin motivo&quot; es inversión actual sin justificación registrada: un hallazgo, no una tarea.</Note>
    </div>
  );
}

export function DireccionResumen() {
  const { estados } = useApp();
  const zonas = presupuestoPorZona();

  return (
    <div>
      <PageTitle sub="Por zona: avance de aprobaciones, lo pedido contra el techo y, en las piloto, el efecto medido.">Resumen</PageTitle>
      <div className="grid gap-3 sm:grid-cols-2">
        {zonas.map((z) => {
          const propias = DECISIONES.filter((d) => getComercio(d.comercioId)?.zonaId === z.zona.id);
          const resueltas = propias.filter((d) => ["aprobada", "ejecutada", "medida", "rechazada"].includes(estadoDe(d, estados))).length;
          const avance = propias.length ? resueltas / propias.length : 1;
          return (
            <Card key={z.zona.id} className="p-4">
              <div className="flex items-center justify-between">
                <Link href="/presupuesto" className="text-sm font-semibold text-ink hover:underline">{z.zona.nombre}</Link>
                {z.zona.piloto ? <Badge tono="ink">Piloto</Badge> : null}
              </div>
              <div className="mt-3 space-y-1.5 text-sm">
                <Row k="Avance de aprobaciones" v={pct(avance)} />
                <Row k="Pide la zona" v={usd(z.montoPropuesto)} />
                <Row k="Techo" v={usd(z.techo)} />
                {z.zona.piloto ? <Row k="Efecto medido (vs sin intervención)" v="+6% compra" ok /> : null}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function Row({ k, v, ok }: { k: string; v: string; ok?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted">{k}</span>
      <span className={cn("font-medium", ok ? "text-ok-ink" : "text-ink")}>{v}</span>
    </div>
  );
}
