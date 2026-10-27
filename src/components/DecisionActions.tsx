"use client";

import { useApp, estadoEfectivo } from "@/lib/store";
import { ESTADO_LABEL, ROL_LABEL, cn, estadoTono } from "@/lib/format";
import type { Decision, EstadoDecision, Rol } from "@/lib/types";
import { Badge } from "./ui";

type Transicion = { label: string; to: EstadoDecision; tono: "ink" | "line" | "bad" };

function transiciones(rol: Rol, estado: EstadoDecision, d: Decision): Transicion[] {
  const t: Transicion[] = [];
  if (estado === "esperando" && rol === d.apruebaRol) {
    t.push({ label: "Aprobar", to: "aprobada", tono: "ink" });
    t.push({ label: "Pedir foto", to: "devuelta", tono: "line" });
    t.push({ label: "Rechazar", to: "rechazada", tono: "bad" });
  }
  if (estado === "devuelta" && rol === "preventista") {
    t.push({ label: "Subir foto y reenviar", to: "esperando", tono: "ink" });
  }
  if (estado === "aprobada" && rol === "preventista" && d.accion === "corregir") {
    t.push({ label: "Marcar ejecutada", to: "ejecutada", tono: "ink" });
  }
  if (estado === "aprobada" && (rol === "supervisor" || rol === "gerente")) {
    t.push({ label: "Marcar en ejecución", to: "en_ejecucion", tono: "line" });
  }
  return t;
}

export function DecisionActions({ d }: { d: Decision }) {
  const rol = useApp((s) => s.rol);
  const estados = useApp((s) => s.estados);
  const setEstado = useApp((s) => s.setEstado);

  const estado = estadoEfectivo(estados, d.id, d.estadoInicial);
  const trans = transiciones(rol, estado, d);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge tono={estadoTono(estado)} dot>
        {ESTADO_LABEL[estado]}
      </Badge>

      {d.auto && estado === "aprobada" ? (
        <span className="text-xs text-muted">Automática · monto bajo, dato claro</span>
      ) : (
        <span className="text-xs text-muted">
          Aprueba: {ROL_LABEL[d.apruebaRol]}
        </span>
      )}

      {trans.length > 0 ? (
        <div className="ml-auto flex flex-wrap gap-1.5">
          {trans.map((tr) => (
            <button
              key={tr.to + tr.label}
              onClick={() => setEstado(d.id, tr.to, estado)}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                tr.tono === "ink" && "bg-ink text-white hover:bg-ink-soft",
                tr.tono === "line" && "border border-line-strong text-ink-soft hover:bg-card",
                tr.tono === "bad" && "border border-bad/30 text-bad-ink hover:bg-bad-bg"
              )}
            >
              {tr.label}
            </button>
          ))}
        </div>
      ) : rol !== d.apruebaRol && estado === "esperando" ? (
        <span className="ml-auto text-xs text-faint">
          Cambiá a “{ROL_LABEL[d.apruebaRol]}” para decidir
        </span>
      ) : null}
    </div>
  );
}
