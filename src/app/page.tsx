"use client";

import Link from "next/link";
import {
  DECISIONES,
  actividadBase,
  alertasDe,
  getComercio,
  inboxDe,
  totalesDemo,
  type Alerta,
} from "@/lib/data";
import { useApp, estadoEfectivo } from "@/lib/store";
import {
  ACCION_LABEL,
  ESTADO_LABEL,
  LINEA_LABEL,
  ROL_LABEL,
  cn,
  usd,
  usdFull,
} from "@/lib/format";
import type { Decision } from "@/lib/types";
import { Badge, Card, Note, PageTitle, StatTile } from "@/components/ui";
import { DecisionActions } from "@/components/DecisionActions";

export default function BandejaPage() {
  const rol = useApp((s) => s.rol);
  const estados = useApp((s) => s.estados);
  const registro = useApp((s) => s.registro);

  const est = (d: Decision) => estadoEfectivo(estados, d.id, d.estadoInicial);
  const alertas = alertasDe(rol, estados);
  const inbox = inboxDe(rol, estados);
  const { sinJustificar } = totalesDemo();

  const aceptadas = DECISIONES.filter((d) =>
    ["aprobada", "ejecutada", "medida"].includes(est(d))
  ).length;
  const vencidas = DECISIONES.filter((d) => d.vencida && est(d) === "esperando").length;

  const esVista = rol === "finanzas" || rol === "direccion";

  return (
    <div>
      <PageTitle sub={`Lo que el sistema necesita de ${ROL_LABEL[rol]} ahora: alertas, decisiones por tomar y lo que ya pasó. Se arma solo con tu rol y tu zona.`}>
        Bandeja de entrada
      </PageTitle>

      {/* Tiles */}
      <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile value={inbox.length} label="te toca ahora" tono={inbox.length > 0 ? "warn" : "ok"} />
        <StatTile value={aceptadas} label="aceptadas en el ciclo" tono="ok" />
        <StatTile value={vencidas} label="tareas vencidas" tono={vencidas > 0 ? "bad" : "neutro"} />
        <StatTile value={usd(sinJustificar)} label="sin justificación · Finanzas" tono="warn" />
      </div>

      {/* Alertas */}
      <section className="mb-10">
        <div className="mb-3 flex items-center gap-2">
          <h2 className="text-sm font-semibold text-ink">Alertas</h2>
          <span className="rounded-full bg-card px-2 py-0.5 text-xs text-muted">
            {alertas.length}
          </span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {alertas.map((a) => (
            <AlertaCard key={a.id} a={a} />
          ))}
        </div>
      </section>

      {/* Te toca decidir */}
      <section className="mb-10">
        <h2 className="mb-3 text-sm font-semibold text-ink">
          {esVista ? "Qué mirar" : "Te toca decidir"}
        </h2>

        {esVista ? (
          <Card className="p-5">
            <Note>
              {ROL_LABEL[rol]} no aprueba una cola: ve el presupuesto completo y cuánto está
              justificado. Las alertas de arriba marcan lo que no cierra.{" "}
              <Link href="/presupuesto" className="font-medium text-ink underline underline-offset-2">
                Ir al presupuesto →
              </Link>
            </Note>
          </Card>
        ) : inbox.length === 0 ? (
          <Card className="p-5">
            <Note>
              No hay nada pendiente para {ROL_LABEL[rol]}. Aprobá o pedí foto desde otro rol y
              volvé: vas a ver cómo se mueven los contadores y la actividad.
            </Note>
          </Card>
        ) : (
          <div className="space-y-3">
            {inbox.map((d) => (
              <InboxCard key={d.id} d={d} />
            ))}
          </div>
        )}
      </section>

      {/* Actividad */}
      <section>
        <h2 className="mb-1 text-sm font-semibold text-ink">Actividad reciente</h2>
        <p className="mb-4 text-xs text-muted">
          Cada acción queda registrada. Lo que hacés acá aparece arriba al instante.
        </p>
        <Card className="divide-y divide-line">
          {registro.map((r, i) => {
            const c = getComercio(r.decisionId.split(":")[0]);
            return (
              <FeedRow
                key={`live-${i}`}
                tono={r.a === "rechazada" || r.a === "devuelta" ? "warn" : "ok"}
                texto={`${ESTADO_LABEL[r.de]} → ${ESTADO_LABEL[r.a]} · ${c?.nombre ?? ""}`}
                detalle={`Por ${ROL_LABEL[r.por]}`}
                cuando={r.cuando}
                vivo
              />
            );
          })}
          {actividadBase().map((it) => (
            <FeedRow
              key={it.id}
              tono={it.tono}
              texto={it.texto}
              detalle={it.detalle}
              cuando={it.cuando}
            />
          ))}
        </Card>
      </section>
    </div>
  );
}

function AlertaCard({ a }: { a: Alerta }) {
  const border =
    a.tono === "bad"
      ? "border-l-bad"
      : a.tono === "warn"
        ? "border-l-warn"
        : a.tono === "ok"
          ? "border-l-ok"
          : "border-l-ink";
  return (
    <div className={cn("rounded-lg border border-line border-l-4 bg-paper p-4", border)}>
      <div className="mb-1.5 flex items-center gap-2">
        <Badge tono={a.tono} dot>
          {a.categoria}
        </Badge>
      </div>
      <div className="text-sm font-semibold text-ink">{a.titulo}</div>
      <p className="mt-1 text-sm leading-relaxed text-ink-soft">{a.detalle}</p>
      {a.href && a.cta ? (
        <Link
          href={a.href}
          className="mt-2.5 inline-flex items-center gap-1 text-xs font-medium text-ink underline underline-offset-2"
        >
          {a.cta}
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden>
            <path d="m6 4 4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      ) : null}
    </div>
  );
}

function InboxCard({ d }: { d: Decision }) {
  const c = getComercio(d.comercioId);
  return (
    <Card className="p-4">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Link href={`/comercio/${d.comercioId}`} className="text-sm font-semibold text-ink hover:underline">
            {c?.nombre ?? d.comercioId}
          </Link>
          <Badge tono="neutro">{LINEA_LABEL[d.linea]}</Badge>
          <Badge tono="neutro">{ACCION_LABEL[d.accion]}</Badge>
          {d.vencida ? <Badge tono="bad" dot>Vencida</Badge> : null}
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
      </div>
      <div className="border-t border-line pt-3">
        <DecisionActions d={d} />
      </div>
    </Card>
  );
}

function FeedRow({
  tono,
  texto,
  detalle,
  cuando,
  vivo = false,
}: {
  tono: "ok" | "warn" | "neutro" | "ink";
  texto: string;
  detalle: string;
  cuando: string;
  vivo?: boolean;
}) {
  const dot =
    tono === "ok" ? "bg-ok" : tono === "warn" ? "bg-warn" : tono === "ink" ? "bg-ink" : "bg-faint";
  return (
    <div className="flex items-start gap-3 px-4 py-3">
      <span className={cn("mt-1.5 size-1.5 shrink-0 rounded-full", dot)} />
      <div className="min-w-0 flex-1">
        <div className="text-sm text-ink">{texto}</div>
        <div className="text-xs text-muted">{detalle}</div>
      </div>
      <div className="flex shrink-0 items-center gap-1.5 text-xs text-faint">
        {vivo ? <span className="rounded-full bg-ok-bg px-1.5 py-0.5 text-[10px] font-medium text-ok-ink">nuevo</span> : null}
        {cuando}
      </div>
    </div>
  );
}
