"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import {
  COMERCIOS,
  DECISIONES,
  alertasDe,
  estadoDe,
  getComercio,
  inboxDe,
  preventistaDe,
  statsRol,
  zonaRollup,
} from "@/lib/data";
import { useApp } from "@/lib/store";
import { ACCION_LABEL, ESTADO_LABEL, LINEA_LABEL, TIPO_LABEL, cn, usd } from "@/lib/format";
import type { Alerta } from "@/lib/data";
import type { Tono } from "@/lib/format";
import type { Accion, Decision, EstadoDecision, Linea } from "@/lib/types";
import { Badge, Card, Note, PageTitle, StatTile } from "./ui";
import { DecisionCard, EstadoMontoBar } from "./shared";

const TOPE_COLUMNA = 30;

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

// Columna: título, contador y las tarjetas (con tope para no explotar).
function Columna({ titulo, items, tono, children }: { titulo: string; items: number; tono: Tono; children: ReactNode }) {
  return (
    <div className="rounded-xl bg-panel p-3">
      <div className="mb-3 flex items-center justify-between px-1">
        <h3 className="text-xs font-semibold text-ink">{titulo}</h3>
        <Badge tono={items > 0 ? tono : "neutro"}>{items}</Badge>
      </div>
      <div className="space-y-2.5">{children}</div>
    </div>
  );
}

function ColVacia({ children }: { children: ReactNode }) {
  return <p className="px-1 py-2 text-xs text-faint">{children}</p>;
}

// Tarjeta compacta para lo que el gerente no resuelve él mismo (pide foto / a validar).
function CardMini({ d }: { d: Decision }) {
  const c = getComercio(d.comercioId);
  return (
    <Link href={`/comercio?id=${d.comercioId}`} className="block rounded-lg border border-line bg-paper p-3 hover:border-ink">
      <div className="text-sm font-medium text-ink">{c?.nombre}</div>
      <div className="mt-0.5 text-xs text-faint">{c?.barrio} · {ACCION_LABEL[d.accion]} {LINEA_LABEL[d.linea].toLowerCase()}</div>
    </Link>
  );
}

function quePaso(d: Decision, estado: EstadoDecision, prev: string): string {
  switch (estado) {
    case "aprobada": return `Tarea creada para ${prev}: ${ejecucionFrase(d.accion)}`;
    case "ejecutada": return `${prev} la ejecutó en la visita`;
    case "medida": return "Ejecutada y medida en el piloto";
    case "rechazada": return "Rechazada — no se generó tarea";
    case "devuelta": return `${prev} no la pudo hacer — vuelve a la cola`;
    default: return ESTADO_LABEL[estado];
  }
}

// Tarjeta de seguimiento: una tarea creada y qué está pasando con ella.
function TareaSeguimientoCard({ d }: { d: Decision }) {
  const estados = useApp((s) => s.estados);
  const registro = useApp((s) => s.registro);
  const c = getComercio(d.comercioId);
  const prev = preventistaDe(d.comercioId);
  const estado = estadoDe(d, estados);
  const miAccion = registro.find((r) => r.decisionId === d.id && r.por === "gerente");

  return (
    <Card className="p-3.5">
      <div className="mb-1 flex items-start justify-between gap-2">
        <Link href={`/comercio?id=${d.comercioId}`} className="text-sm font-semibold text-ink hover:underline">{c?.nombre}</Link>
        {miAccion ? <span className="shrink-0 rounded bg-ink px-1.5 py-0.5 text-[10px] font-medium text-white">vos</span> : null}
      </div>
      <div className="mb-2 text-xs text-muted">
        {d.origen === "sistema" ? "Sistema" : "Tu pedido"} · {ACCION_LABEL[d.accion]} {LINEA_LABEL[d.linea].toLowerCase()}
      </div>
      <p className="text-xs text-ink-soft">↳ {quePaso(d, estado, prev)}</p>
      {miAccion ? <p className="mt-0.5 text-[11px] text-faint">La tocaste a las {miAccion.cuando}</p> : null}
    </Card>
  );
}

export function GerenteBandeja() {
  const { zona, estados } = useApp();
  const alertas = alertasDe("gerente", zona, estados);
  const inbox = inboxDe("gerente", zona, estados);
  const stats = statsRol("gerente", zona, estados);

  const [origenF, setOrigenF] = useState<OrigenF>("todo");
  const [lineaF, setLineaF] = useState<LineaF>("todo");
  const pasa = (d: Decision) =>
    (origenF === "todo" || d.origen === origenF) && (lineaF === "todo" || d.linea === lineaF);

  const enZona = (cid: string) => getComercio(cid)?.zonaId === zona;
  const paraAprobar = inbox.filter(pasa);
  const pideFoto = DECISIONES.filter((d) => enZona(d.comercioId) && estadoDe(d, estados) === "pide_foto" && pasa(d));
  const aValidar = DECISIONES.filter((d) => enZona(d.comercioId) && estadoDe(d, estados) === "a_validar" && pasa(d));

  return (
    <div>
      <PageTitle sub="Lo que te toca: lo que espera aprobación, lo que pide foto y lo que hay que validar en la zona.">Bandeja</PageTitle>

      <div className="mb-6 grid grid-cols-3 gap-3">
        <StatTile value={stats.esperan} label="esperan tu aprobación" tono={stats.esperan > 0 ? "warn" : "ok"} />
        <StatTile value={stats.aprobadas} label="aprobadas o ejecutadas" tono="ok" />
        <StatTile value={stats.vencidas} label="vencidas" tono={stats.vencidas > 0 ? "bad" : "neutro"} />
      </div>

      {alertas.length > 0 ? (
        <section className="mb-6">
          <div className="grid gap-3 sm:grid-cols-2">
            {alertas.map((a) => <AlertaCard key={a.id} a={a} />)}
          </div>
        </section>
      ) : null}

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

      <div className="grid gap-4 lg:grid-cols-3">
        <Columna titulo="Para aprobar" items={paraAprobar.length} tono="warn">
          {paraAprobar.length === 0 ? (
            <ColVacia>Nada para aprobar con estos filtros.</ColVacia>
          ) : (
            <>
              {paraAprobar.slice(0, TOPE_COLUMNA).map((d) => <DecisionCard key={d.id} d={d} />)}
              {paraAprobar.length > TOPE_COLUMNA ? <ColVacia>+ {paraAprobar.length - TOPE_COLUMNA} más</ColVacia> : null}
            </>
          )}
        </Columna>

        <Columna titulo="Pide foto" items={pideFoto.length} tono="bad">
          {pideFoto.length === 0 ? (
            <ColVacia>Sin fotos pendientes.</ColVacia>
          ) : (
            <>
              {pideFoto.slice(0, TOPE_COLUMNA).map((d) => <CardMini key={d.id} d={d} />)}
              {pideFoto.length > TOPE_COLUMNA ? <ColVacia>+ {pideFoto.length - TOPE_COLUMNA} más</ColVacia> : null}
            </>
          )}
        </Columna>

        <Columna titulo="A validar" items={aValidar.length} tono="warn">
          {aValidar.length === 0 ? (
            <ColVacia>Nada para validar.</ColVacia>
          ) : (
            <>
              {aValidar.slice(0, TOPE_COLUMNA).map((d) => <CardMini key={d.id} d={d} />)}
              {aValidar.length > TOPE_COLUMNA ? <ColVacia>+ {aValidar.length - TOPE_COLUMNA} más</ColVacia> : null}
            </>
          )}
        </Columna>
      </div>

      <Note>
        Lo que apruebes pasa a <Link href="/seguimiento" className="font-medium text-ink underline underline-offset-2">Seguimiento</Link>, donde ves en qué estado va cada tarea.
      </Note>
    </div>
  );
}

export function GerenteSeguimiento() {
  const { zona, estados } = useApp();
  const enZona = (cid: string) => getComercio(cid)?.zonaId === zona;
  const mias = DECISIONES.filter((d) => enZona(d.comercioId) && d.apruebaRol === "gerente");
  const en = (sts: EstadoDecision[]) => mias.filter((d) => sts.includes(estadoDe(d, estados)));

  const aprobadas = en(["aprobada"]);
  const ejecutadas = en(["ejecutada"]);
  const medidas = en(["medida"]);
  const noProspero = en(["rechazada", "devuelta"]);
  const total = aprobadas.length + ejecutadas.length + medidas.length + noProspero.length;

  const cards = (ds: Decision[]) => ds.slice(0, TOPE_COLUMNA).map((d) => <TareaSeguimientoCard key={d.id} d={d} />);

  return (
    <div>
      <PageTitle sub="Las tareas que se crearon a partir de lo que aprobaste, y en qué estado va cada una.">Seguimiento</PageTitle>

      {total === 0 ? (
        <Card className="p-5">
          <Note>
            Todavía no hay tareas creadas en tu zona. Aprobá algo en la{" "}
            <Link href="/" className="font-medium text-ink underline underline-offset-2">Bandeja</Link> y seguilo acá: vas a ver a qué preventista le llegó y cómo avanza.
          </Note>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Columna titulo="Aprobada · tarea creada" items={aprobadas.length} tono="warn">
            {aprobadas.length === 0 ? <ColVacia>—</ColVacia> : cards(aprobadas)}
          </Columna>
          <Columna titulo="Ejecutada" items={ejecutadas.length} tono="ok">
            {ejecutadas.length === 0 ? <ColVacia>—</ColVacia> : cards(ejecutadas)}
          </Columna>
          <Columna titulo="Medida (piloto)" items={medidas.length} tono="ok">
            {medidas.length === 0 ? <ColVacia>—</ColVacia> : cards(medidas)}
          </Columna>
          <Columna titulo="No prosperó" items={noProspero.length} tono="bad">
            {noProspero.length === 0 ? <ColVacia>—</ColVacia> : cards(noProspero)}
          </Columna>
        </div>
      )}
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
      <PageTitle sub="Cuánto pide tu zona para el próximo período y cómo queda contra el techo de Finanzas.">Mi zona · {roll.zona.nombre}</PageTitle>

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
