"use client";

import { useState } from "react";
import Link from "next/link";
import {
  COMERCIOS,
  DECISIONES,
  PRECISION_IA,
  estadoDe,
  getComercio,
  inboxDe,
  statsRol,
} from "@/lib/data";
import { useApp } from "@/lib/store";
import { CONFIANZA_LABEL, cn, pct } from "@/lib/format";
import { Badge, Card, Note, PageTitle, StatTile } from "./ui";
import { DecisionCard } from "./shared";
import { FridgeSvg } from "./FridgeSvg";

export function SupervisorAprobar() {
  const { zona, estados } = useApp();
  const inbox = inboxDe("supervisor", zona, estados);
  const stats = statsRol("supervisor", zona, estados);

  return (
    <div>
      <PageTitle sub="Lo de tu nivel en tu zona. Aprobás de un clic; para rechazar, elegís el motivo.">Para aprobar</PageTitle>
      <div className="mb-8 grid grid-cols-3 gap-3">
        <StatTile value={stats.esperan} label="esperan tu aprobación" tono={stats.esperan > 0 ? "warn" : "ok"} />
        <StatTile value={stats.aprobadas} label="aprobadas" tono="ok" />
        <StatTile value={stats.vencidas} label="vencidas" tono={stats.vencidas > 0 ? "bad" : "neutro"} />
      </div>
      {inbox.length === 0 ? (
        <Card className="p-5"><Note>Nada pendiente de tu nivel en la zona.</Note></Card>
      ) : (
        <div className="space-y-3">{inbox.map((d) => <DecisionCard key={d.id} d={d} />)}</div>
      )}
    </div>
  );
}

export function SupervisorFotos() {
  const { zona } = useApp();
  const conFoto = COMERCIOS.filter((c) => c.zonaId === zona && c.fotoFrio).slice(0, 12);

  return (
    <div>
      <PageTitle sub="La foto, lo que lee la IA y tu confirmación. La IA lee; vos decidís.">Revisar fotos</PageTitle>

      <Card className="mb-6 flex flex-wrap items-center justify-between gap-3 p-4">
        <div>
          <div className="text-sm font-semibold text-ink">Precisión de la IA: {pct(PRECISION_IA.actual)}</div>
          <div className="text-xs text-muted">Lecturas confirmadas sobre revisadas.</div>
        </div>
        <Badge tono="warn" dot>
          Alertas automáticas inactivas hasta el {pct(PRECISION_IA.umbral)} (A definir)
        </Badge>
      </Card>

      {conFoto.length === 0 ? (
        <Card className="p-5"><Note>No hay fotos para revisar en esta zona.</Note></Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {conFoto.map((c) => <FotoCard key={c.id} id={c.id} />)}
        </div>
      )}
    </div>
  );
}

function FotoCard({ id }: { id: string }) {
  const c = getComercio(id)!;
  const [revisada, setRevisada] = useState<"ok" | "corregir" | null>(null);
  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        <div className="w-24 shrink-0">
          <FridgeSvg estado={c.fotoFrio!.estado} />
        </div>
        <div className="min-w-0 flex-1">
          <Link href={`/comercio?id=${c.id}`} className="text-sm font-semibold text-ink hover:underline">{c.nombre}</Link>
          <div className="mt-1 space-y-0.5 text-xs text-muted">
            {c.fotoFrio!.lectura.map((l) => (
              <div key={l.label} className="flex items-center gap-1.5">
                <span>{l.label}:</span> <span className="text-ink">{l.valor}</span>
                <span className={cn("rounded-full px-1.5 text-[10px]", l.confianza === "alta" ? "bg-ok-bg text-ok-ink" : l.confianza === "media" ? "bg-warn-bg text-warn-ink" : "bg-bad-bg text-bad-ink")}>{CONFIANZA_LABEL[l.confianza]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-3 border-t border-line pt-3">
        {revisada ? (
          <Badge tono={revisada === "ok" ? "ok" : "warn"} dot>{revisada === "ok" ? "Confirmada" : "Marcada para corregir"}</Badge>
        ) : (
          <div className="flex gap-2">
            <button onClick={() => setRevisada("ok")} className="rounded-md bg-ink px-3 py-1.5 text-sm font-medium text-white hover:bg-ink-soft">Está bien</button>
            <button onClick={() => setRevisada("corregir")} className="rounded-md border border-line-strong px-3 py-1.5 text-sm text-ink-soft hover:bg-card">Corregir</button>
          </div>
        )}
      </div>
    </Card>
  );
}

const PREVENTISTAS = ["Acosta", "Benítez", "Cardozo"];

export function SupervisorEquipo() {
  const { zona, estados } = useApp();
  const vencidas = DECISIONES.filter(
    (d) => getComercio(d.comercioId)?.zonaId === zona && d.vencida && estadoDe(d, estados) === "esperando"
  );
  // Reparto determinístico por preventista.
  const porPrev = PREVENTISTAS.map((nombre, i) => ({
    nombre,
    tareas: vencidas.filter((d) => hash(d.comercioId) % PREVENTISTAS.length === i),
  }));

  return (
    <div>
      <PageTitle sub="Tareas vencidas por preventista. Reasigná si hace falta.">Mi equipo</PageTitle>
      <div className="space-y-3">
        {porPrev.map((p) => (
          <Card key={p.nombre} className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-ink">Preventista {p.nombre}</div>
              <Badge tono={p.tareas.length > 0 ? "bad" : "ok"} dot>{p.tareas.length} vencidas</Badge>
            </div>
            {p.tareas.length > 0 ? (
              <div className="mt-3 space-y-1.5">
                {p.tareas.slice(0, 4).map((d) => {
                  const c = getComercio(d.comercioId);
                  return (
                    <div key={d.id} className="flex items-center justify-between text-sm">
                      <Link href={`/comercio?id=${d.comercioId}`} className="text-ink hover:underline">{c?.nombre}</Link>
                      <button className="rounded-md border border-line-strong px-2.5 py-1 text-xs text-ink-soft hover:bg-card">Reasignar</button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <Note>Sin tareas vencidas.</Note>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}
