"use client";

import { useState } from "react";
import Link from "next/link";
import {
  COMERCIOS,
  DECISIONES,
  EFECTO_PILOTO,
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

// Comercios de una zona que mueven el pedido (actual ≠ propuesto), con la inversión
// que explica el cambio. Ordenados por diferencia: primero los que piden más.
function comerciosQueMueven(zonaId: string) {
  const filas = COMERCIOS.filter((c) => c.zonaId === zonaId)
    .map((c) => {
      const actual = sum(c.inversiones.map((i) => i.montoActual));
      const pide = sum(c.inversiones.map((i) => i.montoPropuesto));
      const driver = [...c.inversiones].sort(
        (a, b) => Math.abs(b.montoPropuesto - b.montoActual) - Math.abs(a.montoPropuesto - a.montoActual)
      )[0];
      return { c, actual, pide, delta: pide - actual, driver };
    })
    .filter((f) => f.delta !== 0);
  filas.sort((a, b) => b.delta - a.delta);
  return filas;
}

function usdSigno(n: number) {
  return `${n > 0 ? "+" : ""}${usd(n)}`;
}

export function FinanzasPresupuesto({ readOnly = false }: { readOnly?: boolean }) {
  const { techos, setTecho, propuestas } = useApp();
  const zonas = presupuestoPorZona();
  const totales = totalesMuestra();
  const [abiertas, setAbiertas] = useState<Set<string>>(new Set());

  const techoDe = (id: string, def: number) => techos[id] ?? def;
  const techoTotal = sum(zonas.map((z) => techoDe(z.zona.id, z.techo)));
  const pedidoGerente = sum(propuestas.map((p) => p.monto));
  const pidenTotal = sum(zonas.map((z) => z.montoPropuesto)) + pedidoGerente;
  const dif = pidenTotal - techoTotal;

  // Qué cambia este ciclo, separando quién lo pidió: el sistema (reglas) o los gerentes.
  // El neto es el efecto sobre el pedido: mover y cortar liberan (negativo), sumar agrega.
  const decSistema = DECISIONES.filter((d) => d.origen === "sistema");
  const decGerente = DECISIONES.filter((d) => d.origen === "gerente");
  const netoSistema = sum(decSistema.map((d) => d.montoNeto));
  const netoGerente = sum(decGerente.map((d) => d.montoNeto)) + pedidoGerente;
  const nSistema = decSistema.length;
  const nGerente = decGerente.length + propuestas.length;

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

  // Por motivo: cuántos casos y el efecto NETO sobre el pedido (propuesto − actual).
  // Mover y cortar liberan plata (negativo); sumar agrega; corregir/renovar no mueven monto.
  const porAccion = new Map<Accion, { count: number; neto: number }>();
  for (const c of COMERCIOS)
    for (const i of c.inversiones) {
      const cur = porAccion.get(i.accion) ?? { count: 0, neto: 0 };
      cur.count++;
      cur.neto += i.montoPropuesto - i.montoActual;
      porAccion.set(i.accion, cur);
    }
  const motivos: Accion[] = ["cortar", "mover", "condicionar", "sumar", "corregir", "renovar"];

  return (
    <div>
      <PageTitle sub="El próximo período, el acumulado de todas las zonas de la muestra. Fijás el techo y los montos de aprobación.">
        Presupuesto · próximo período
      </PageTitle>

      <div className="mb-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile value={usd(techoTotal)} label={readOnly ? "techo de Finanzas" : "techo (editable abajo)"} />
        <StatTile value={usd(pidenTotal)} label="pedido del próximo período" tono="warn" />
        <StatTile value={usd(dif)} label={dif > 0 ? "por encima del techo" : "margen bajo el techo"} tono={dif > 0 ? "bad" : "ok"} />
        <StatTile value={usd(totales.porEstado.a_validar)} label="a validar" tono="warn" />
      </div>

      {/* Quién pidió los cambios: el sistema vs los gerentes (ya no son el mismo número). */}
      <div className="mb-6 grid gap-3 sm:grid-cols-2">
        <Card className="p-3.5">
          <div className="text-xs text-muted">Lo marcó el sistema</div>
          <div className="mt-0.5 text-sm font-medium text-ink">
            {nSistema.toLocaleString("es-AR")} casos · <span className={netoSistema < 0 ? "text-ok-ink" : "text-ink"}>{usdSigno(netoSistema)}</span> sobre el pedido
          </div>
          <div className="mt-0.5 text-[11px] text-faint">Reglas activas: mover y cortar liberan, sumar agrega.</div>
        </Card>
        <Card className="p-3.5">
          <div className="text-xs text-muted">Lo pidieron los gerentes</div>
          <div className="mt-0.5 text-sm font-medium text-ink">
            {nGerente.toLocaleString("es-AR")} casos · <span className={netoGerente < 0 ? "text-ok-ink" : "text-warn-ink"}>{usdSigno(netoGerente)}</span> sobre el pedido
          </div>
          <div className="mt-0.5 text-[11px] text-faint">Pedidos puntuales de los gerentes de zona, marcados aparte.</div>
        </Card>
      </div>

      <Card className="mb-6 p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ink">Estado del monto</h2>
          <button onClick={exportar} className="rounded-md border border-line-strong px-3 py-1.5 text-xs font-medium text-ink-soft hover:bg-card">Exportar CSV</button>
        </div>
        <EstadoMontoBar porEstado={totales.porEstado} />
      </Card>

      {/* Por motivo */}
      <h2 className="mb-1 text-sm font-semibold text-ink">Por motivo</h2>
      <p className="mb-3 text-xs text-muted">Efecto sobre el pedido: mover y cortar liberan plata, sumar agrega, corregir y renovar no mueven el monto.</p>
      <Card className="mb-8 divide-y divide-line">
        {motivos.map((a) => {
          const d = porAccion.get(a);
          if (!d) return null;
          const mueve = d.neto !== 0;
          return (
            <div key={a} className="flex items-center justify-between px-4 py-2.5 text-sm">
              <span className="font-medium text-ink">{ACCION_LABEL[a]}</span>
              <div className="flex items-center gap-6">
                <span className="text-muted">{d.count.toLocaleString("es-AR")} casos</span>
                <span className={cn("w-32 text-right font-medium", !mueve ? "text-faint" : d.neto < 0 ? "text-ok-ink" : "text-warn-ink")}>
                  {mueve ? usdSigno(d.neto) : "sin cambio de monto"}
                </span>
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
            {/* Por línea */}
            <div className="mb-4 grid gap-1.5 sm:grid-cols-2">
              {z.lineas.map((l) => (
                <div key={l.linea} className="flex items-center justify-between rounded-md bg-card px-3 py-1.5 text-xs">
                  <span className="text-ink-soft">{LINEA_LABEL[l.linea]}</span>
                  <span className="text-muted">actual <span className="text-ink">{usd(l.montoActual)}</span> · pide <span className="text-ink">{usd(l.montoPropuesto)}</span></span>
                </div>
              ))}
            </div>

            {/* Detalle por comercio: quién mueve el pedido y por qué */}
            <ComerciosDeZona zonaId={z.zona.id} />
          </td>
        </tr>
      ) : null}
    </>
  );
}

function ComerciosDeZona({ zonaId }: { zonaId: string }) {
  const filas = comerciosQueMueven(zonaId);
  if (filas.length === 0)
    return <p className="text-xs text-faint">Ningún comercio de esta zona cambia su pedido: todo se mantiene.</p>;

  const suben = filas.filter((f) => f.delta > 0).length;
  const bajan = filas.filter((f) => f.delta < 0).length;

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h3 className="text-xs font-semibold text-ink">Comercios que mueven el pedido</h3>
        <span className="text-[11px] text-muted">
          {suben} piden más · {bajan} liberan equipo · {filas.length} en total
        </span>
      </div>
      <div className="overflow-hidden rounded-lg border border-line bg-paper">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="border-b border-line text-left text-[11px] text-muted">
              <th className="px-3 py-1.5 font-medium">Comercio</th>
              <th className="px-3 py-1.5 font-medium">Qué pide y por qué</th>
              <th className="px-3 py-1.5 text-right font-medium">Actual → pide</th>
              <th className="px-3 py-1.5 text-right font-medium">Diferencia</th>
            </tr>
          </thead>
          <tbody>
            {filas.map(({ c, actual, pide, delta, driver }) => (
              <tr key={c.id} className="border-b border-line last:border-0 align-top hover:bg-card">
                <td className="px-3 py-2">
                  <Link href={`/comercio?id=${c.id}`} className="font-medium text-ink hover:underline">
                    {c.nombre}
                  </Link>
                  <div className="text-[11px] text-faint">{c.barrio}</div>
                </td>
                <td className="px-3 py-2">
                  <span className="font-medium text-ink">{ACCION_LABEL[driver.accion]}</span>
                  {driver.motivo ? <span className="text-muted"> — {driver.motivo}</span> : null}
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-right text-ink-soft">
                  {usd(actual)} → {usd(pide)}
                </td>
                <td className={cn("whitespace-nowrap px-3 py-2 text-right font-medium", delta > 0 ? "text-warn-ink" : "text-ok-ink")}>
                  {usdSigno(delta)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-1.5 text-[11px] text-faint">Hacé clic en un comercio para ver la cadena completa: foto, decisión, aprobación y registro.</p>
    </div>
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
          const efecto = EFECTO_PILOTO[z.zona.id];
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
                {efecto ? <Row k={`Efecto en la compra (${efecto.comercios} medidos)`} v={`${efecto.compra} vs parecidos`} ok /> : null}
              </div>
              {efecto ? <p className="mt-2 border-t border-line pt-2 text-[11px] leading-snug text-faint">{efecto.nota}</p> : null}
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
