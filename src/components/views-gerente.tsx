"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  COMERCIOS,
  DECISIONES,
  alertasDe,
  estadoDe,
  getComercio,
  inboxDe,
  statsRol,
  zonaRollup,
} from "@/lib/data";
import { useApp } from "@/lib/store";
import { ACCION_LABEL, LINEA_LABEL, TIPO_LABEL, cn, usd } from "@/lib/format";
import type { Alerta } from "@/lib/data";
import { Badge, Card, Note, PageTitle, StatTile } from "./ui";
import { DecisionCard, EstadoMontoBar } from "./shared";

export function GerenteBandeja() {
  const { zona, estados } = useApp();
  const alertas = alertasDe("gerente", zona, estados);
  const inbox = inboxDe("gerente", zona, estados);
  const stats = statsRol("gerente", zona, estados);

  const enZona = (cid: string) => getComercio(cid)?.zonaId === zona;
  const ejecutadas = DECISIONES.filter(
    (d) => enZona(d.comercioId) && d.apruebaRol === "gerente" && ["aprobada", "ejecutada", "medida"].includes(estadoDe(d, estados))
  ).slice(0, 5);
  const sinResolver = DECISIONES.filter(
    (d) => enZona(d.comercioId) && ["pide_foto", "a_validar"].includes(estadoDe(d, estados))
  ).slice(0, 6);

  return (
    <div>
      <PageTitle sub="Lo que espera tu aprobación, lo que ya se ejecutó y lo que quedó trabado en tu zona.">Bandeja</PageTitle>

      <div className="mb-8 grid grid-cols-3 gap-3">
        <StatTile value={stats.esperan} label="esperan tu aprobación" tono={stats.esperan > 0 ? "warn" : "ok"} />
        <StatTile value={stats.aprobadas} label="aprobadas o ejecutadas" tono="ok" />
        <StatTile value={stats.vencidas} label="vencidas" tono={stats.vencidas > 0 ? "bad" : "neutro"} />
      </div>

      {alertas.length > 0 ? (
        <section className="mb-8">
          <h2 className="mb-3 text-sm font-semibold text-ink">Alertas</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {alertas.map((a) => <AlertaCard key={a.id} a={a} />)}
          </div>
        </section>
      ) : null}

      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold text-ink">Espera tu aprobación</h2>
        {inbox.length === 0 ? (
          <Card className="p-5"><Note>Nada pendiente en {zona === "norte" ? "Norte GBA" : "tu zona"}. Probá aprobar desde otro rol y volvé.</Note></Card>
        ) : (
          <div className="space-y-3">{inbox.map((d) => <DecisionCard key={d.id} d={d} />)}</div>
        )}
      </section>

      {sinResolver.length > 0 ? (
        <section className="mb-8">
          <h2 className="mb-3 text-sm font-semibold text-ink">Sin resolver</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {sinResolver.map((d) => {
              const c = getComercio(d.comercioId);
              return (
                <Link key={d.id} href={`/comercio?id=${d.comercioId}`} className="flex items-center justify-between rounded-lg border border-line bg-paper px-4 py-2.5 hover:border-ink">
                  <span className="text-sm font-medium text-ink">{c?.nombre}</span>
                  <Badge tono={estadoDe(d, estados) === "pide_foto" ? "bad" : "warn"} dot>
                    {estadoDe(d, estados) === "pide_foto" ? "Pide foto" : "A validar"}
                  </Badge>
                </Link>
              );
            })}
          </div>
        </section>
      ) : null}

      {ejecutadas.length > 0 ? (
        <section>
          <h2 className="mb-3 text-sm font-semibold text-ink">Aprobado y ejecutado</h2>
          <Card className="divide-y divide-line">
            {ejecutadas.map((d) => {
              const c = getComercio(d.comercioId);
              return (
                <div key={d.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                  <Link href={`/comercio?id=${d.comercioId}`} className="font-medium text-ink hover:underline">{c?.nombre}</Link>
                  <span className="text-muted">{ACCION_LABEL[d.accion]} · {LINEA_LABEL[d.linea]}</span>
                </div>
              );
            })}
          </Card>
        </section>
      ) : null}
    </div>
  );
}

export function AlertaCard({ a }: { a: Alerta }) {
  const border = a.tono === "bad" ? "border-l-bad" : a.tono === "warn" ? "border-l-warn" : a.tono === "ok" ? "border-l-ok" : "border-l-ink";
  return (
    <div className={cn("rounded-lg border border-line border-l-4 bg-paper p-4", border)}>
      <Badge tono={a.tono} dot>{a.categoria}</Badge>
      <div className="mt-1.5 text-sm font-semibold text-ink">{a.titulo}</div>
      <p className="mt-1 text-sm text-ink-soft">{a.detalle}</p>
      {a.href && a.cta ? <Link href={a.href} className="mt-2 inline-block text-xs font-medium text-ink underline underline-offset-2">{a.cta} →</Link> : null}
    </div>
  );
}

export function GerenteMiZona() {
  const { zona, estados, propuestas, techos } = useApp();
  const roll = zonaRollup(zona);
  if (!roll) return null;

  const pedidoGerente = propuestas.filter((p) => p.zonaId === zona).reduce((a, p) => a + p.monto, 0);
  const pideZona = roll.montoPropuesto + pedidoGerente;
  const techo = techos[zona] ?? roll.techo;
  const dif = pideZona - techo;

  const vencidas = statsRol("gerente", zona, estados).vencidas;

  return (
    <div>
      <PageTitle sub="Cuánto pide tu zona para el próximo ciclo y cómo queda contra el techo de Finanzas.">Mi zona · {roll.zona.nombre}</PageTitle>

      <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile value={usd(roll.montoActual)} label="inversión actual" />
        <StatTile value={usd(pideZona)} label="lo que pide la zona" tono="warn" />
        <StatTile value={usd(techo)} label="techo de Finanzas" />
        <StatTile value={usd(dif)} label={dif > 0 ? "por encima del techo" : "margen bajo el techo"} tono={dif > 0 ? "bad" : "ok"} />
      </div>

      <Card className="mb-8 p-5">
        <h2 className="mb-3 text-sm font-semibold text-ink">Estado del monto</h2>
        <EstadoMontoBar porEstado={roll.porEstado} />
      </Card>

      <h2 className="mb-3 text-sm font-semibold text-ink">Por línea</h2>
      <Card className="mb-8 divide-y divide-line">
        {roll.lineas.map((l) => (
          <div key={l.linea} className="flex items-center justify-between px-4 py-3">
            <span className="text-sm font-medium text-ink">{LINEA_LABEL[l.linea]}</span>
            <div className="flex items-center gap-6 text-sm">
              <span className="text-muted">actual <span className="text-ink">{usd(l.montoActual)}</span></span>
              <span className="text-muted">pide <span className="text-ink">{usd(l.montoPropuesto)}</span></span>
            </div>
          </div>
        ))}
      </Card>

      {pedidoGerente > 0 ? (
        <Note>Incluye {usd(pedidoGerente)} que propusiste vos este ciclo.</Note>
      ) : null}
      {vencidas > 0 ? <Note><span className="text-bad-ink">Tenés {vencidas} tareas vencidas en la bandeja.</span></Note> : null}
    </div>
  );
}

export function GerenteComercios() {
  const { zona } = useApp();
  const [q, setQ] = useState("");
  const comercios = useMemo(
    () => COMERCIOS.filter((c) => c.zonaId === zona),
    [zona]
  );
  const filtrados = useMemo(() => {
    const t = q.trim().toLowerCase();
    const base = t ? comercios.filter((c) => c.nombre.toLowerCase().includes(t) || c.barrio.toLowerCase().includes(t)) : comercios;
    return base.slice(0, 60);
  }, [comercios, q]);

  return (
    <div>
      <PageTitle sub="Buscá un comercio y entrá a su ficha: la cadena completa y el botón para proponer.">Comercios</PageTitle>

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Buscar por nombre o barrio…"
        className="mb-5 w-full max-w-md rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-ink"
      />

      <div className="mb-3 text-xs text-muted">{comercios.length} comercios en la zona · mostrando {filtrados.length}</div>

      <Card className="divide-y divide-line">
        {filtrados.map((c) => {
          const inv = c.inversiones.reduce((a, i) => a + i.montoActual, 0);
          const tono = c.compraVsParecidos < 0.6 ? "bad" : c.compraVsParecidos > 1.3 ? "ok" : "neutro";
          return (
            <Link key={c.id} href={`/comercio?id=${c.id}`} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-panel">
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-ink">{c.nombre}</div>
                <div className="text-xs text-faint">{TIPO_LABEL[c.tipo]} · {c.barrio}</div>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <Badge tono={tono}>{Math.round(c.compraVsParecidos * 100)}%</Badge>
                <span className="w-24 text-right font-medium text-ink">{usd(inv)}</span>
              </div>
            </Link>
          );
        })}
      </Card>
    </div>
  );
}
