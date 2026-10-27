"use client";

import Link from "next/link";
import { getComercio, inboxDe, statsRol } from "@/lib/data";
import { useApp } from "@/lib/store";
import {
  ACCION_LABEL,
  LINEA_LABEL,
  ROL_LABEL,
  usdFull,
} from "@/lib/format";
import { Badge, Card, Note, PageTitle, StatTile } from "@/components/ui";
import { DecisionActions } from "@/components/DecisionActions";

export default function BandejaPage() {
  const rol = useApp((s) => s.rol);
  const estados = useApp((s) => s.estados);

  const inbox = inboxDe(rol, estados);
  const stats = statsRol(rol, estados);

  const esVista = rol === "finanzas" || rol === "direccion";

  return (
    <div>
      <PageTitle
        sub={`Lo que le toca decidir a ${ROL_LABEL[rol]}. La bandeja se arma sola con las decisiones de su rol y su zona.`}
      >
        Bandeja · {ROL_LABEL[rol]}
      </PageTitle>

      {esVista ? (
        <Card className="p-6">
          <Note>
            {ROL_LABEL[rol]} no aprueba una cola de decisiones: ve el presupuesto completo,
            cuánto está justificado y qué está pendiente.{" "}
            <Link href="/" className="font-medium text-ink underline underline-offset-2">
              Ir al presupuesto →
            </Link>
          </Note>
        </Card>
      ) : (
        <>
          <div className="mb-8 grid grid-cols-3 gap-3">
            <StatTile value={stats.esperan} label="esperan su aprobación" tono="warn" />
            <StatTile value={stats.aprobadas} label="ya aprobadas o ejecutadas" tono="ok" />
            <StatTile value={stats.vencidas} label="vencidas en su zona" tono={stats.vencidas > 0 ? "bad" : "neutro"} />
          </div>

          {inbox.length === 0 ? (
            <Card className="p-6">
              <Note>
                No hay nada pendiente para {ROL_LABEL[rol]} en este momento. Aprobá o pedí
                foto desde otro rol y volvé para ver cómo se actualiza la cola.
              </Note>
            </Card>
          ) : (
            <div className="space-y-3">
              {inbox.map((d) => {
                const c = getComercio(d.comercioId);
                return (
                  <Card key={d.id} className="p-4">
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/comercio/${d.comercioId}`}
                          className="text-sm font-semibold text-ink hover:underline"
                        >
                          {c?.nombre ?? d.comercioId}
                        </Link>
                        <Badge tono="neutro">{LINEA_LABEL[d.linea]}</Badge>
                        <Badge tono="neutro">{ACCION_LABEL[d.accion]}</Badge>
                      </div>
                      <span className="text-sm font-medium text-ink tnum">
                        {usdFull(d.montoActual)} → {usdFull(d.montoPropuesto)}
                      </span>
                    </div>
                    <p className="mb-3 text-sm leading-relaxed text-ink-soft">{d.motivo}</p>
                    <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-muted">
                      <span className="rounded bg-card px-2 py-0.5">{d.indicador}</span>
                      {d.reglaId ? (
                        <span className="rounded bg-card px-2 py-0.5 font-mono">
                          {d.reglaId} v{d.reglaVersion}
                        </span>
                      ) : null}
                      {d.vencida ? <Badge tono="bad" dot>Vencida</Badge> : null}
                    </div>
                    <div className="border-t border-line pt-3">
                      <DecisionActions d={d} />
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
