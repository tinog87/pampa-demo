"use client";

import { useState } from "react";
import { REGLAS } from "@/lib/data";
import { ACCION_LABEL, cn } from "@/lib/format";
import type { ReglaVersion } from "@/lib/types";
import { Badge, Card, Note, PageTitle, PampaTag } from "@/components/ui";

export default function ReglasPage() {
  const [sel, setSel] = useState(REGLAS[0].id);
  const regla = REGLAS.find((r) => r.id === sel)!;
  const vigente = regla.versions[regla.versions.length - 1];
  const anteriores = [...regla.versions].slice(0, -1).reverse();

  return (
    <div>
      <PageTitle sub="Cada regla es texto con parámetros y número de versión. Una versión no se modifica: un cambio crea la siguiente, se prueba contra el año anterior y se activa con la aprobación de quien la define.">
        Reglas
      </PageTitle>

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        {/* Lista */}
        <div className="space-y-1.5">
          {REGLAS.map((r) => {
            const v = r.versions[r.versions.length - 1];
            const active = r.id === sel;
            return (
              <button
                key={r.id}
                onClick={() => setSel(r.id)}
                className={cn(
                  "w-full rounded-lg border px-3 py-2.5 text-left transition-colors",
                  active ? "border-ink bg-card" : "border-line bg-paper hover:bg-panel"
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-ink">{r.nombre}</span>
                  <EstadoReglaBadge estado={v.estado} />
                </div>
                <div className="mt-0.5 font-mono text-[11px] text-faint">
                  {r.id} · v{v.version}
                </div>
              </button>
            );
          })}
        </div>

        {/* Detalle */}
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold text-ink">{regla.nombre}</h2>
            <EstadoReglaBadge estado={vigente.estado} />
            <PampaTag />
          </div>
          <p className="mb-5 max-w-2xl text-sm text-muted">{regla.descripcion}</p>

          {/* Versión vigente */}
          <ReglaBlock id={regla.id} v={vigente} />

          {/* Parámetros */}
          <div className="mt-5">
            <h3 className="mb-2 text-sm font-semibold text-ink">Parámetros</h3>
            <div className="flex flex-wrap gap-2">
              {Object.entries(vigente.params).map(([k, val]) => (
                <span
                  key={k}
                  className="rounded-md border border-line bg-paper px-2.5 py-1 font-mono text-xs text-ink-soft"
                >
                  {k} = <span className="font-semibold text-ink">{String(val)}</span>
                </span>
              ))}
            </div>
            <Note>
              <span className="mt-2 block">
                Son criterios de Pampa. Cambiar un parámetro no se programa: crea la versión
                siguiente, con su historial.
              </span>
            </Note>
          </div>

          {/* Historial */}
          <div className="mt-8">
            <h3 className="mb-3 text-sm font-semibold text-ink">Historial de versiones</h3>
            <Card className="divide-y divide-line">
              <div className="flex items-start gap-3 px-4 py-3">
                <span className="mt-0.5 rounded bg-ink px-1.5 py-0.5 font-mono text-[11px] font-semibold text-white">
                  v{vigente.version}
                </span>
                <div className="text-sm">
                  <span className="font-medium text-ink">Vigente</span>
                  <span className="text-muted"> · {vigente.fecha} · define: {vigente.define}</span>
                  {vigente.cambio ? (
                    <p className="mt-1 text-ink-soft">{vigente.cambio}</p>
                  ) : null}
                </div>
              </div>
              {anteriores.map((v) => (
                <div key={v.version} className="flex items-start gap-3 px-4 py-3">
                  <span className="mt-0.5 rounded border border-line-strong px-1.5 py-0.5 font-mono text-[11px] text-muted">
                    v{v.version}
                  </span>
                  <div className="text-sm">
                    <span className="text-muted">{v.fecha} · define: {v.define}</span>
                    {v.cambio ? <p className="mt-1 text-ink-soft">{v.cambio}</p> : null}
                  </div>
                </div>
              ))}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReglaBlock({ id, v }: { id: string; v: ReglaVersion }) {
  const rows: Array<[string, string]> = [
    ["condición", v.condicion],
    ["necesita", v.necesita],
    ["se confirma", v.seConfirma],
    ["excepción", v.excepcion],
    ["propone", ACCION_LABEL[v.propone]],
  ];
  return (
    <div className="overflow-x-auto rounded-lg border border-line bg-panel p-4 font-mono text-[13px] leading-relaxed">
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2 border-b border-line pb-2">
        <span className="font-semibold text-ink">regla: {id}</span>
        <span className="text-muted">
          versión {v.version} · define: {v.define}
        </span>
      </div>
      <table className="border-collapse">
        <tbody>
          {rows.map(([k, val]) => (
            <tr key={k}>
              <td className="py-0.5 pr-4 align-top whitespace-nowrap text-muted">{k}:</td>
              <td className="py-0.5 text-ink">{val}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EstadoReglaBadge({ estado }: { estado: ReglaVersion["estado"] }) {
  if (estado === "activa") return <Badge tono="ok" dot>Activa</Badge>;
  if (estado === "en_prueba") return <Badge tono="warn" dot>En prueba</Badge>;
  return <Badge tono="neutro">Archivada</Badge>;
}
