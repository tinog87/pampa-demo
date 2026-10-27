"use client";

import { useState } from "react";
import { COMERCIOS, ZONAS, getComercio, inboxDe } from "@/lib/data";
import { useApp, estadoEfectivo } from "@/lib/store";
import type { Decision } from "@/lib/types";
import { Badge, Card, Note, PageTitle } from "./ui";

const MOTIVOS_NO = ["Comercio cerrado", "No me dejaron sacar la foto", "No estaba el encargado", "Otro"];

function tareaLabel(d: Decision): string {
  const c = getComercio(d.comercioId);
  const estado = c?.fotoFrio?.estado;
  if (d.estadoInicial === "pide_foto") return "Sacar foto de la heladera";
  if (d.accion === "corregir") {
    if (estado === "vacia") return "Ajustar el pedido";
    if (estado === "rota") return "Pedir técnico";
    if (estado === "otra_marca") return "Recuperar el espacio";
    return "Corregir en el comercio";
  }
  return "Revisar el comercio";
}

export function PreventistaHoy() {
  const { zona, estados } = useApp();
  const inbox = inboxDe("preventista", zona, estados);

  // Tareas de foto de exhibición (solo piloto), sintéticas.
  const piloto = ZONAS.find((z) => z.id === zona)?.piloto;
  const exhib = piloto
    ? COMERCIOS.filter((c) => c.zonaId === zona && c.acuerdo).slice(0, 3)
    : [];

  return (
    <div className="mx-auto max-w-md">
      <PageTitle sub="Tus comercios de hoy, en orden de visita. Una cosa por comercio.">Hoy</PageTitle>

      {inbox.length === 0 && exhib.length === 0 ? (
        <Card className="p-5"><Note>No tenés tareas para hoy en esta zona.</Note></Card>
      ) : (
        <div className="space-y-3">
          {inbox.map((d, i) => <TareaCard key={d.id} orden={i + 1} comercioId={d.comercioId} tarea={tareaLabel(d)} decision={d} />)}
          {exhib.map((c, i) => <TareaCard key={c.id} orden={inbox.length + i + 1} comercioId={c.id} tarea="Sacar foto de la exhibición" />)}
        </div>
      )}
    </div>
  );
}

function TareaCard({ orden, comercioId, tarea, decision }: { orden: number; comercioId: string; tarea: string; decision?: Decision }) {
  const c = getComercio(comercioId)!;
  const setEstado = useApp((s) => s.setEstado);
  const estados = useApp((s) => s.estados);
  const [estadoLocal, setEstadoLocal] = useState<"hecho" | "no" | null>(null);
  const [pidiendo, setPidiendo] = useState(false);

  const hacerHecho = () => {
    if (decision) {
      const actual = estadoEfectivo(estados, decision.id, decision.estadoInicial);
      setEstado(decision.id, decision.estadoInicial === "pide_foto" ? "esperando" : "ejecutada", actual);
    }
    setEstadoLocal("hecho");
  };
  const noSePudo = () => {
    if (decision) {
      const actual = estadoEfectivo(estados, decision.id, decision.estadoInicial);
      setEstado(decision.id, "devuelta", actual);
    }
    setEstadoLocal("no");
    setPidiendo(false);
  };

  return (
    <Card className="p-4">
      <div className="mb-1 flex items-center gap-2">
        <span className="flex size-6 items-center justify-center rounded-full bg-ink text-xs font-semibold text-white">{orden}</span>
        <span className="text-sm font-semibold text-ink">{c.nombre}</span>
      </div>
      <div className="mb-3 text-xs text-muted">{c.barrio}</div>
      <div className="mb-3 text-lg font-bold text-ink">{tarea}</div>

      {estadoLocal === "hecho" ? (
        <Badge tono="ok" dot>Hecho{decision?.estadoInicial === "pide_foto" ? " · foto simulada adjunta" : ""}</Badge>
      ) : estadoLocal === "no" ? (
        <Badge tono="warn" dot>No se pudo</Badge>
      ) : pidiendo ? (
        <div className="flex flex-wrap gap-1.5">
          {MOTIVOS_NO.map((m) => (
            <button key={m} onClick={() => noSePudo()} className="rounded-md border border-line-strong px-2.5 py-1.5 text-sm text-ink-soft hover:bg-card">{m}</button>
          ))}
        </div>
      ) : (
        <div className="flex gap-2">
          <button onClick={hacerHecho} className="flex-1 rounded-md bg-ink px-4 py-2.5 text-sm font-semibold text-white hover:bg-ink-soft">Hecho</button>
          <button onClick={() => setPidiendo(true)} className="rounded-md border border-line-strong px-4 py-2.5 text-sm text-ink-soft hover:bg-card">No se pudo</button>
        </div>
      )}
    </Card>
  );
}

export function PreventistaHechas() {
  const registro = useApp((s) => s.registro);
  const hechas = registro.filter((r) => r.por === "preventista");

  return (
    <div className="mx-auto max-w-md">
      <PageTitle sub="Lo que cerraste hoy.">Hechas</PageTitle>
      {hechas.length === 0 ? (
        <Card className="p-5"><Note>Todavía no cerraste tareas. Volvé a &quot;Hoy&quot; y marcá alguna.</Note></Card>
      ) : (
        <Card className="divide-y divide-line">
          {hechas.map((r, i) => {
            const c = getComercio(r.decisionId.split(":")[0]);
            return (
              <div key={i} className="flex items-center justify-between px-4 py-3 text-sm">
                <span className="font-medium text-ink">{c?.nombre}</span>
                <span className="text-xs text-muted">{r.a === "devuelta" ? "No se pudo" : "Hecho"} · {r.cuando}</span>
              </div>
            );
          })}
        </Card>
      )}
    </div>
  );
}
