"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import {
  COMERCIOS,
  DECISIONES,
  alertasDe,
  estadoDe,
  getComercio,
  getDecision,
  inboxDe,
  preventistaDe,
  statsRol,
  zonaRollup,
} from "@/lib/data";
import { useApp } from "@/lib/store";
import type { RegistroEntrada } from "@/lib/store";
import { ACCION_LABEL, ESTADO_LABEL, LINEA_LABEL, TIPO_LABEL, cn, estadoTono, usd } from "@/lib/format";
import type { Alerta } from "@/lib/data";
import type { Accion, Linea } from "@/lib/types";
import { Badge, Card, Note, PageTitle, StatTile } from "./ui";
import { DecisionCard, EstadoMontoBar } from "./shared";

type OrigenF = "todo" | "sistema" | "gerente";
type LineaF = "todo" | Linea;
const LINEAS_F: Linea[] = ["frio", "descuentos", "acuerdos", "exhibicion"];

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
        active ? "border-ink bg-ink text-white" : "border-line text-ink-soft hover:bg-card"
      )}
    >
      {children}
    </button>
  );
}

function ejecucionFrase(a: Accion): string {
  switch (a) {
    case "mover": return "reubica la heladera en la próxima visita";
    case "sumar": return "instala la heladera en la próxima visita";
    case "corregir": return "corrige el pedido o el espacio en el comercio";
    case "condicionar": return "aplica la promoción condicionada";
    default: return "ejecuta el cambio en la próxima visita";
  }
}

// Una decisión que el gerente tocó, con qué pasó después y a quién le llegó.
function SeguimientoCard({ r }: { r: RegistroEntrada }) {
  const estados = useApp((s) => s.estados);
  const d = getDecision(r.decisionId);
  if (!d) return null;
  const c = getComercio(d.comercioId);
  const prev = preventistaDe(d.comercioId);
  const estadoActual = estadoDe(d, estados);

  const accion =
    r.a === "aprobada" ? "La aprobaste"
    : r.a === "rechazada" ? "La rechazaste"
    : r.a === "pide_foto" ? "Pediste una foto"
    : r.a === "ejecutada" ? "La marcaste ejecutada"
    : ESTADO_LABEL[r.a];

  const disparo =
    r.a === "aprobada" ? `Se generó la tarea para el preventista ${prev}: ${ejecucionFrase(d.accion)}.`
    : r.a === "pide_foto" ? `Se generó la tarea de foto para el preventista ${prev}.`
    : r.a === "rechazada" ? "No se genera tarea. El monto vuelve al presupuesto de la zona."
    : null;

  return (
    <Card className="p-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <Link href={`/comercio?id=${d.comercioId}`} className="text-sm font-semibold text-ink hover:underline">
          {c?.nombre}
        </Link>
        <Badge tono={estadoTono(estadoActual)} dot>{ESTADO_LABEL[estadoActual]}</Badge>
      </div>
      <ol className="space-y-1.5 border-l border-line pl-3 text-xs">
        <li className="text-muted">
          <span className="font-medium text-ink">{d.origen === "sistema" ? "El sistema lo propuso" : "Lo pediste vos"}</span>
          {" · "}{ACCION_LABEL[d.accion]} {LINEA_LABEL[d.linea].toLowerCase()}
        </li>
        <li className="text-muted">
          <span className="font-medium text-ink">{accion}</span> · {r.cuando}
        </li>
        {disparo ? <li className="text-ink-soft">↳ {disparo}</li> : null}
      </ol>
    </Card>
  );
}

export function GerenteBandeja() {
  const { zona, estados, registro } = useApp();
  const alertas = alertasDe("gerente", zona, estados);
  const inbox = inboxDe("gerente", zona, estados);
  const stats = statsRol("gerente", zona, estados);

  const [origenF, setOrigenF] = useState<OrigenF>("todo");
  const [lineaF, setLineaF] = useState<LineaF>("todo");
  const inboxF = inbox.filter(
    (d) => (origenF === "todo" || d.origen === origenF) && (lineaF === "todo" || d.linea === lineaF)
  );

  const enZona = (cid: string) => getComercio(cid)?.zonaId === zona;

  // Seguimiento: lo que el gerente fue decidiendo (del registro vivo), 1 por decisión.
  const vistos = new Set<string>();
  const seguimiento: RegistroEntrada[] = [];
  for (const r of registro) {
    if (r.por === "gerente" && !vistos.has(r.decisionId)) {
      vistos.add(r.decisionId);
      seguimiento.push(r);
    }
  }

  const ejecutadas = DECISIONES.filter(
    (d) => enZona(d.comercioId) && d.apruebaRol === "gerente" && ["aprobada", "ejecutada", "medida"].includes(estadoDe(d, estados))
  ).slice(0, 5);
  const sinResolver = DECISIONES.filter(
    (d) => enZona(d.comercioId) && ["pide_foto", "a_validar"].includes(estadoDe(d, estados))
  ).slice(0, 6);

  return (
    <div>
      <PageTitle sub="Lo que espera tu aprobación, el seguimiento de lo que decidiste y lo que quedó trabado en tu zona.">Bandeja</PageTitle>

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
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-ink">Espera tu aprobación</h2>
          {inbox.length > 0 ? <span className="text-xs text-muted">mostrando {inboxF.length} de {inbox.length}</span> : null}
        </div>

        {inbox.length > 0 ? (
          <div className="mb-4 flex flex-wrap items-center gap-1.5">
            <Chip active={origenF === "todo"} onClick={() => setOrigenF("todo")}>Todo</Chip>
            <Chip active={origenF === "sistema"} onClick={() => setOrigenF("sistema")}>Del sistema</Chip>
            <Chip active={origenF === "gerente"} onClick={() => setOrigenF("gerente")}>Mis pedidos</Chip>
            <span className="mx-1 h-5 w-px bg-line" />
            <Chip active={lineaF === "todo"} onClick={() => setLineaF("todo")}>Todas</Chip>
            {LINEAS_F.map((l) => (
              <Chip key={l} active={lineaF === l} onClick={() => setLineaF(l)}>{LINEA_LABEL[l]}</Chip>
            ))}
          </div>
        ) : null}

        {inbox.length === 0 ? (
          <Card className="p-5"><Note>Nada pendiente en {zona === "norte" ? "Norte GBA" : "tu zona"}. Probá aprobar desde otro rol y volvé.</Note></Card>
        ) : inboxF.length === 0 ? (
          <Card className="p-5"><Note>Ningún caso con esos filtros. Tocá &quot;Todo&quot; / &quot;Todas&quot; para ver todo.</Note></Card>
        ) : (
          <div className="space-y-3">{inboxF.map((d) => <DecisionCard key={d.id} d={d} />)}</div>
        )}
      </section>

      <section className="mb-8">
        <h2 className="mb-1 text-sm font-semibold text-ink">Seguimiento de lo que decidiste</h2>
        <p className="mb-3 text-xs text-muted">Qué pasó con cada cosa que aprobaste, rechazaste o mandaste a foto.</p>
        {seguimiento.length === 0 ? (
          <Card className="p-5"><Note>Todavía no decidiste nada en esta sesión. Cuando apruebes, rechaces o pidas una foto arriba, acá vas a ver a qué preventista le llegó la tarea y en qué estado está.</Note></Card>
        ) : (
          <div className="space-y-3">{seguimiento.map((r) => <SeguimientoCard key={r.decisionId} r={r} />)}</div>
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
          <h2 className="mb-3 text-sm font-semibold text-ink">Ya ejecutado en tu zona</h2>
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
