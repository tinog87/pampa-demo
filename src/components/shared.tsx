"use client";

import Link from "next/link";
import { useState } from "react";
import { getComercio, reglaVigente } from "@/lib/data";
import { useApp, estadoEfectivo } from "@/lib/store";
import {
  ACCION_LABEL,
  ESTADO_LABEL,
  ESTADO_MONTO_LABEL,
  LINEA_LABEL,
  ROL_LABEL,
  cn,
  estadoMontoTono,
  estadoTono,
  usd,
} from "@/lib/format";
import type { Decision, EstadoDecision, Rol } from "@/lib/types";
import type { PorEstado } from "@/lib/data";
import { Badge, Card } from "./ui";
import { FridgeSvg } from "./FridgeSvg";

const MOTIVOS_RECHAZO = [
  "No corresponde a la zona",
  "El comercio lo renegoció",
  "Mejor esperar otra visita",
  "Otro",
];

// "¿Por qué?" — esconde el detalle técnico: motivo en una frase, la foto y la regla.
export function Porque({ d }: { d: Decision }) {
  const c = getComercio(d.comercioId);
  const regla = d.reglaId ? reglaVigente(d.reglaId) : undefined;
  return (
    <details className="group mt-1">
      <summary className="inline-flex cursor-pointer list-none items-center gap-1 text-xs font-medium text-muted hover:text-ink">
        ¿Por qué?
        <svg className="size-3 transition-transform group-open:rotate-90" viewBox="0 0 16 16" fill="none" aria-hidden>
          <path d="m6 4 4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </summary>
      <div className="mt-2 space-y-2 rounded-lg bg-card p-3">
        <p className="text-sm text-ink-soft">{d.motivo}</p>
        {d.condicion ? (
          <p className="text-xs text-ink-soft">
            <span className="font-medium text-ink">Condición:</span> {d.condicion}
          </p>
        ) : null}
        {c?.fotoFrio ? (
          <div className="flex items-start gap-3">
            <div className="w-20 shrink-0">
              <FridgeSvg estado={c.fotoFrio.estado} />
            </div>
            <div className="space-y-0.5 text-xs text-muted">
              {c.fotoFrio.lectura.map((l) => (
                <div key={l.label}>
                  {l.label}: <span className="text-ink">{l.valor}</span>
                </div>
              ))}
            </div>
          </div>
        ) : null}
        {regla ? (
          <p className="font-mono text-[11px] text-faint">
            Regla: {d.reglaId} v{d.reglaVersion} — {regla.condicion}
          </p>
        ) : null}
      </div>
    </details>
  );
}

type Transicion = { label: string; to: EstadoDecision; tono: "ink" | "line" | "bad"; pideMotivo?: boolean };

function transiciones(rol: Rol, estado: EstadoDecision, d: Decision): Transicion[] {
  const miNivel = rol === d.apruebaRol;
  if (estado === "esperando" && miNivel)
    return [
      { label: "Aprobar", to: "aprobada", tono: "ink" },
      { label: "Pedir foto", to: "pide_foto", tono: "line" },
      { label: "Rechazar", to: "rechazada", tono: "bad", pideMotivo: true },
    ];
  if (estado === "a_validar" && miNivel)
    return [
      { label: "Validar registro", to: "aprobada", tono: "ink" },
      { label: "Dar de baja", to: "rechazada", tono: "bad", pideMotivo: true },
    ];
  if (estado === "pide_foto" && rol === "preventista")
    return [{ label: "Subir foto y enviar", to: "esperando", tono: "ink" }];
  if (estado === "aprobada" && rol === "preventista" && d.accion === "corregir")
    return [{ label: "Marcar hecho", to: "ejecutada", tono: "ink" }];
  return [];
}

export function DecisionActions({ d }: { d: Decision }) {
  const rol = useApp((s) => s.rol);
  const estados = useApp((s) => s.estados);
  const setEstado = useApp((s) => s.setEstado);
  const [pidiendoMotivo, setPidiendoMotivo] = useState<EstadoDecision | null>(null);

  const estado = estadoEfectivo(estados, d.id, d.estadoInicial);
  const trans = transiciones(rol, estado, d);

  if (pidiendoMotivo) {
    return (
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-xs text-muted">Motivo:</span>
        {MOTIVOS_RECHAZO.map((m) => (
          <button
            key={m}
            onClick={() => {
              setEstado(d.id, pidiendoMotivo, estado);
              setPidiendoMotivo(null);
            }}
            className="rounded-md border border-line-strong px-2.5 py-1 text-xs text-ink-soft hover:bg-card"
          >
            {m}
          </button>
        ))}
        <button onClick={() => setPidiendoMotivo(null)} className="px-1.5 text-xs text-faint hover:text-ink">
          Cancelar
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge tono={estadoTono(estado)} dot>
        {ESTADO_LABEL[estado]}
      </Badge>
      {d.auto && estado === "aprobada" ? (
        <span className="text-xs text-muted">Automática · monto bajo, dato claro</span>
      ) : null}
      {trans.length > 0 ? (
        <div className="ml-auto flex flex-wrap gap-1.5">
          {trans.map((t) => (
            <button
              key={t.label}
              onClick={() => (t.pideMotivo ? setPidiendoMotivo(t.to) : setEstado(d.id, t.to, estado))}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                t.tono === "ink" && "bg-ink text-white hover:bg-ink-soft",
                t.tono === "line" && "border border-line-strong text-ink-soft hover:bg-card",
                t.tono === "bad" && "border border-bad/30 text-bad-ink hover:bg-bad-bg"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      ) : estado === "esperando" && rol !== d.apruebaRol ? (
        <span className="ml-auto text-xs text-faint">Aprueba {ROL_LABEL[d.apruebaRol as Rol] ?? d.apruebaRol}</span>
      ) : null}
    </div>
  );
}

// Tarjeta de decisión: una acción principal, el resto detrás de ¿Por qué?.
export function DecisionCard({ d }: { d: Decision }) {
  const c = getComercio(d.comercioId);
  return (
    <Card className="p-4">
      <div className="mb-1.5 flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <Link href={`/comercio?id=${d.comercioId}`} className="text-sm font-semibold text-ink hover:underline">
            {c?.nombre ?? d.comercioId}
          </Link>
          {c ? <span className="ml-2 text-xs text-faint">{c.barrio}</span> : null}
        </div>
        <div className="flex items-center gap-2">
          <Badge tono="neutro">{LINEA_LABEL[d.linea]}</Badge>
          {d.vencida ? <Badge tono="bad" dot>Vencida</Badge> : null}
        </div>
      </div>

      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
        <span className="text-lg font-bold text-ink">{ACCION_LABEL[d.accion]}</span>
        <span className="text-sm font-medium text-ink">
          {usd(d.montoActual)} → {usd(d.montoPropuesto)}
          {d.estimado ? <span className="ml-1 text-xs text-faint">estimado</span> : null}
        </span>
      </div>

      <Porque d={d} />

      <div className="mt-3 border-t border-line pt-3">
        <DecisionActions d={d} />
      </div>
    </Card>
  );
}

export function EstadoMontoBar({ porEstado, className }: { porEstado: PorEstado; className?: string }) {
  const total = porEstado.justificado + porEstado.pendiente + porEstado.a_validar + porEstado.sin_justificar;
  const seg = (v: number) => (total ? `${(v / total) * 100}%` : "0%");
  const color: Record<keyof PorEstado, string> = {
    justificado: "bg-ok",
    pendiente: "bg-warn",
    a_validar: "bg-faint",
    sin_justificar: "bg-bad",
  };
  const orden: (keyof PorEstado)[] = ["justificado", "pendiente", "a_validar", "sin_justificar"];
  return (
    <div className={className}>
      <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-card">
        {orden.map((k) => (
          <div key={k} className={color[k]} style={{ width: seg(porEstado[k]) }} />
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
        {orden.map((k) => (
          <span key={k} className="flex items-center gap-1.5 text-xs text-muted">
            <span className={cn("size-2 rounded-full", color[k])} />
            {ESTADO_MONTO_LABEL[k]} <span className="tnum text-ink">{usd(porEstado[k])}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

export { estadoMontoTono };
