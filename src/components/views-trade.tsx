"use client";

import { useState } from "react";
import Link from "next/link";
import {
  REGLAS,
  derivadosTrade,
  habriaMarcadoDescuento,
  simularDescuento,
  simularMover,
} from "@/lib/data";
import { ACCION_LABEL, TIPO_LABEL, cn, pct, usd } from "@/lib/format";
import type { Regla } from "@/lib/types";
import { Badge, Card, Note, PageTitle, PampaTag } from "./ui";

export function TradeReglas() {
  const [sel, setSel] = useState(REGLAS[0].id);
  const regla = REGLAS.find((r) => r.id === sel)!;
  const vigente = regla.versions[regla.versions.length - 1];
  const anteriores = [...regla.versions].slice(0, -1).reverse();
  const enPrueba = vigente.estado === "en_prueba";

  return (
    <div>
      <PageTitle sub="Cada regla es texto con parámetros y versiones. Una en prueba corre sin efecto: solo cuenta cuántos casos habría marcado. Solo las activas proponen.">Reglas</PageTitle>

      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        <div className="space-y-1.5">
          {REGLAS.map((r) => {
            const v = r.versions[r.versions.length - 1];
            return (
              <button key={r.id} onClick={() => setSel(r.id)} className={cn("w-full rounded-lg border px-3 py-2.5 text-left", r.id === sel ? "border-ink bg-card" : "border-line hover:bg-panel")}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-ink">{r.nombre}</span>
                  <EstadoReglaBadge estado={v.estado} />
                </div>
              </button>
            );
          })}
        </div>

        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold text-ink">{regla.nombre}</h2>
            <EstadoReglaBadge estado={vigente.estado} />
            <PampaTag />
          </div>
          <p className="mb-4 text-sm text-muted">{regla.descripcion}</p>

          {enPrueba ? (
            <Card className="mb-5 border-l-4 border-l-warn p-4">
              <div className="text-sm font-semibold text-ink">En prueba: no propone nada</div>
              <p className="mt-1 text-sm text-ink-soft">Contra el año anterior, habría marcado <span className="font-semibold">{habriaMarcadoDescuento()} casos</span>. Se activa cuando la validás.</p>
            </Card>
          ) : null}

          <div className="mb-5 overflow-x-auto rounded-lg border border-line bg-panel p-4 font-mono text-[13px] leading-relaxed">
            <div className="mb-2 border-b border-line pb-2 font-semibold text-ink">regla: {regla.id} · v{vigente.version} · define: {vigente.define}</div>
            {([["condición", vigente.condicion], ["necesita", vigente.necesita], ["se confirma", vigente.seConfirma], ["excepción", vigente.excepcion], ["propone", ACCION_LABEL[vigente.propone]]] as [string, string][]).map(([k, v]) => (
              <div key={k} className="flex gap-3">
                <span className="w-24 shrink-0 text-muted">{k}:</span>
                <span className="text-ink">{v}</span>
              </div>
            ))}
          </div>

          <Simulador regla={regla} />

          <div className="mt-8">
            <h3 className="mb-3 text-sm font-semibold text-ink">Historial de versiones</h3>
            <Card className="divide-y divide-line">
              <VersionRow v={vigente.version} fecha={vigente.fecha} define={vigente.define} cambio={vigente.cambio} vigente />
              {anteriores.map((v) => <VersionRow key={v.version} v={v.version} fecha={v.fecha} define={v.define} cambio={v.cambio} />)}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function Simulador({ regla }: { regla: Regla }) {
  const vigente = regla.versions[regla.versions.length - 1];
  const umbralInicial = typeof vigente.params.umbral_compra === "number" ? vigente.params.umbral_compra : null;
  const [umbral, setUmbral] = useState(umbralInicial ?? 0.5);

  if (umbralInicial === null) return null;

  const esMover = regla.id === "heladera_candidata_mover";
  const sim = esMover ? simularMover(umbral) : simularDescuento(umbral);

  return (
    <Card className="p-4">
      <h3 className="mb-1 text-sm font-semibold text-ink">Probar un cambio</h3>
      <p className="mb-3 text-xs text-muted">Mové el umbral y mirá el impacto antes de activar. No cambia nada hasta que lo apliques.</p>
      <div className="flex items-center gap-3">
        <span className="text-xs text-muted">umbral de compra</span>
        <input type="range" min={0.3} max={1.2} step={0.05} value={umbral} onChange={(e) => setUmbral(Number(e.target.value))} className="flex-1 accent-black" />
        <span className="w-10 text-right text-sm font-semibold text-ink tnum">{umbral.toFixed(2)}</span>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3">
        {esMover ? (
          <>
            <Stat label="heladeras candidatas" value={(sim as ReturnType<typeof simularMover>).candidatas.toLocaleString("es-AR")} />
            <Stat label="inversión que se libera" value={usd((sim as ReturnType<typeof simularMover>).inversionLiberada)} />
          </>
        ) : (
          <>
            <Stat label="descuentos marcados" value={(sim as ReturnType<typeof simularDescuento>).cortados.toLocaleString("es-AR")} />
            <Stat label="inversión alcanzada" value={usd((sim as ReturnType<typeof simularDescuento>).inversion)} />
          </>
        )}
      </div>
      <button className="mt-4 rounded-md border border-line-strong px-3 py-1.5 text-sm text-ink-soft hover:bg-card">Crear versión con este umbral</button>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-card p-3">
      <div className="text-lg font-bold text-ink tnum">{value}</div>
      <div className="text-xs text-muted">{label}</div>
    </div>
  );
}

function VersionRow({ v, fecha, define, cambio, vigente }: { v: number; fecha: string; define: string; cambio?: string; vigente?: boolean }) {
  return (
    <div className="flex items-start gap-3 px-4 py-3">
      <span className={cn("mt-0.5 rounded px-1.5 py-0.5 font-mono text-[11px] font-semibold", vigente ? "bg-ink text-white" : "border border-line-strong text-muted")}>v{v}</span>
      <div className="text-sm">
        <span className={vigente ? "font-medium text-ink" : "text-muted"}>{vigente ? "Vigente · " : ""}{fecha} · define: {define}</span>
        {cambio ? <p className="mt-1 text-ink-soft">{cambio}</p> : null}
      </div>
    </div>
  );
}

function EstadoReglaBadge({ estado }: { estado: "activa" | "en_prueba" | "archivada" }) {
  if (estado === "activa") return <Badge tono="ok" dot>Activa</Badge>;
  if (estado === "en_prueba") return <Badge tono="warn" dot>En prueba</Badge>;
  return <Badge tono="neutro">Archivada</Badge>;
}

export function TradeDerivados() {
  const comercios = derivadosTrade();
  return (
    <div>
      <PageTitle sub="Comercios que compran bien pero poco de lo que se quiere impulsar. Candidatos a una acción comercial.">Derivados a Trade</PageTitle>
      {comercios.length === 0 ? (
        <Card className="p-5"><Note>No hay derivados por ahora.</Note></Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {comercios.map((c) => (
            <Card key={c.id} className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <Link href={`/comercio?id=${c.id}`} className="text-sm font-semibold text-ink hover:underline">{c.nombre}</Link>
                  <div className="text-xs text-faint">{TIPO_LABEL[c.tipo]} · {c.barrio}</div>
                </div>
                <Badge tono="ok">{pct(c.compraVsParecidos - 1 > 0 ? c.compraVsParecidos - 1 : 0)} más</Badge>
              </div>
              <p className="mt-2 text-sm text-ink-soft">Compra bien en general, pero poco frío. Candidato a una acción comercial.</p>
              <button className="mt-3 rounded-md bg-ink px-3 py-1.5 text-sm font-medium text-white hover:bg-ink-soft">Tomar el caso</button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
