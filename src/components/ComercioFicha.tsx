"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, type ReactNode } from "react";
import { decisionesDeComercio, getComercio, getZona } from "@/lib/data";
import { useApp } from "@/lib/store";
import {
  ACCION_LABEL,
  CONFIANZA_LABEL,
  ESTADO_LABEL,
  LINEA_LABEL,
  ROL_LABEL,
  TIPO_LABEL,
  cn,
  compraTexto,
  confianzaTono,
  usd,
} from "@/lib/format";
import type { Comercio, Linea } from "@/lib/types";
import { Badge, Card, Note } from "./ui";
import { FridgeSvg } from "./FridgeSvg";
import { DecisionActions, Porque } from "./shared";

export function ComercioFicha() {
  const params = useSearchParams();
  const id = params.get("id") ?? "";
  const rol = useApp((s) => s.rol);
  const registro = useApp((s) => s.registro);
  const propuestas = useApp((s) => s.propuestas);
  const c = getComercio(id);

  if (!c) {
    return (
      <div>
        <Link href="/comercios" className="text-sm text-muted hover:text-ink">
          ← Comercios
        </Link>
        <p className="mt-6 text-sm text-muted">No se encontró el comercio.</p>
      </div>
    );
  }

  const zona = getZona(c.zonaId);
  const decs = decisionesDeComercio(c.id);
  const principal = decs.find((d) => d.linea === "frio") ?? decs[0];
  const invTotal = c.inversiones.reduce((a, i) => a + i.montoActual, 0);
  const propsComercio = propuestas.filter((p) => p.comercioId === c.id);

  return (
    <div>
      <Link href="/comercios" className="text-sm text-muted hover:text-ink">
        ← Comercios
      </Link>

      <div className="mt-4 mb-6">
        <span className="brand-rule mb-3" />
        <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-[28px]">{c.nombre}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
          <span>{c.barrio}</span>
          <span>·</span>
          <span>{zona?.nombre}</span>
          <span>·</span>
          <span>{TIPO_LABEL[c.tipo]} {c.tamano}</span>
          <span>·</span>
          <span>{c.puertas === 0 ? "Sin heladera" : `${c.puertas} ${c.puertas === 1 ? "heladera" : "heladeras"}`}</span>
          {c.competenciaActiva ? <Badge tono="warn" dot>Competencia activa</Badge> : null}
        </div>
      </div>

      {/* Resumen */}
      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Card className="p-4">
          <div className="text-xs text-muted">Compra vs parecidos</div>
          <div className={cn("mt-1 text-2xl font-bold", c.compraVsParecidos < 0.6 ? "text-bad-ink" : "text-ink")}>
            {Math.round(c.compraVsParecidos * 100)}%
          </div>
          <div className="mt-1 text-[11px] text-faint">{compraTexto(c.compraVsParecidos)}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted">Inversión (ciclo en curso)</div>
          <div className="mt-1 text-2xl font-bold text-ink">{usd(invTotal)}</div>
          <div className="mt-1 text-[11px] text-faint">{c.inversiones.length} línea{c.inversiones.length === 1 ? "" : "s"}</div>
        </Card>
        <Card className="col-span-2 p-4 sm:col-span-1">
          <div className="text-xs text-muted">Confianza del dato</div>
          <div className="mt-2">
            <Badge tono={confianzaTono(c.confianza)} dot>{CONFIANZA_LABEL[c.confianza]}</Badge>
          </div>
        </Card>
      </div>

      {/* Cadena */}
      <h2 className="mb-4 text-sm font-semibold text-ink">La cadena, de punta a punta</h2>
      <div className="mb-10">
        <Paso n={1} title="Presupuesto aprobado">
          {LINEA_LABEL[(principal?.linea ?? c.inversiones[0]?.linea ?? "frio") as Linea]} · {zona?.nombre} · fijado por Finanzas
        </Paso>
        <Paso n={2} title="Inversión asignada">
          {usd(invTotal)} en el ciclo en curso · {c.puertas === 0 ? "sin heladera" : `${c.puertas} heladeras`}
        </Paso>
        <Paso n={3} title="Compra contra parecidos">
          <span className="font-medium text-ink">{Math.round(c.compraVsParecidos * 100)}%</span> — {compraTexto(c.compraVsParecidos)}.
          <div className="mt-1 text-xs text-faint">
            &quot;Compra&quot; es lo que el comercio le compra a Pampa, no lo que le vende al consumidor.
          </div>
        </Paso>
        <Paso n={4} title="Foto en la visita">
          {c.fotoFrio ? (
            <div className="flex items-start gap-3">
              <div className="w-16 shrink-0">
                <FridgeSvg estado={c.fotoFrio.estado} />
              </div>
              <div className="text-xs text-muted">
                {c.fotoFrio.lectura.map((l) => (
                  <div key={l.label}>{l.label}: <span className="text-ink">{l.valor}</span></div>
                ))}
              </div>
            </div>
          ) : (
            <span className="text-muted">Sin foto todavía: se pide en la próxima visita.</span>
          )}
        </Paso>
        <Paso n={5} title="Decisión" dark last={!principal}>
          {principal ? (
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded bg-white/15 px-2 py-0.5 font-semibold text-white">{ACCION_LABEL[principal.accion]}</span>
                <span className="text-sm text-white/80">neto {usd(principal.montoNeto)}</span>
              </div>
              <p className="mt-2 text-sm text-white/80">{principal.motivo}</p>
            </div>
          ) : (
            <span className="text-white/80">Sin decisión pendiente: la inversión rinde.</span>
          )}
        </Paso>
        {principal ? (
          <Paso n={6} title="Aprobación" last>
            <DecisionActions d={principal} />
          </Paso>
        ) : null}
      </div>

      {/* Proponer (solo gerente) */}
      {rol === "gerente" ? <ProponerForm comercio={c} /> : null}

      {/* Propuestas del gerente ya cargadas */}
      {propsComercio.length > 0 ? (
        <div className="mb-10">
          <h2 className="mb-3 text-sm font-semibold text-ink">Propuestas del gerente</h2>
          <div className="space-y-2">
            {propsComercio.map((p) => (
              <Card key={p.id} className="flex items-center justify-between p-3">
                <div className="text-sm">
                  <span className="font-medium text-ink">{LINEA_LABEL[p.linea]} · {ACCION_LABEL[p.accion]}</span>
                  <span className="text-muted"> · {p.motivo}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-ink">{usd(p.monto)}</span>
                  <Badge tono="warn" dot>Propuesta por el gerente</Badge>
                </div>
              </Card>
            ))}
          </div>
        </div>
      ) : null}

      {/* Decisiones por línea */}
      {decs.length > 0 ? (
        <div className="mb-10">
          <h2 className="mb-3 text-sm font-semibold text-ink">Decisiones por línea</h2>
          <div className="space-y-3">
            {decs.map((d) => (
              <Card key={d.id} className="p-4">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-ink">{LINEA_LABEL[d.linea]} · {ACCION_LABEL[d.accion]}</span>
                  <span className="text-sm font-medium text-ink">{usd(d.montoActual)} → {usd(d.montoPropuesto)}</span>
                </div>
                <Porque d={d} />
                <div className="mt-3 border-t border-line pt-3">
                  <DecisionActions d={d} />
                </div>
              </Card>
            ))}
          </div>
        </div>
      ) : null}

      {/* Registro */}
      <h2 className="mb-1 text-sm font-semibold text-ink">Registro</h2>
      <p className="mb-3 text-xs text-muted">No se edita ni se borra: cada cambio agrega una línea.</p>
      <Card className="divide-y divide-line">
        {decs.map((d) => (
          <div key={d.id} className="flex items-start gap-3 px-4 py-2.5 text-sm">
            <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-faint" />
            <span className="text-muted">
              Propuesta <span className="text-ink">{ACCION_LABEL[d.accion]}</span> en {LINEA_LABEL[d.linea]} · por el sistema
            </span>
          </div>
        ))}
        {registro
          .filter((r) => r.decisionId.startsWith(`${c.id}:`))
          .map((r, i) => (
            <div key={i} className="flex items-start gap-3 px-4 py-2.5 text-sm">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-ink" />
              <span className="text-muted">
                {ESTADO_LABEL[r.de]} → <span className="text-ink">{ESTADO_LABEL[r.a]}</span> · {ROL_LABEL[r.por]} · {r.cuando}
              </span>
            </div>
          ))}
      </Card>
    </div>
  );
}

function Paso({ n, title, children, dark, last }: { n: number; title: string; children: ReactNode; dark?: boolean; last?: boolean }) {
  return (
    <div className="flex gap-4 pb-3">
      <div className="flex flex-col items-center">
        <div className={cn("flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold", dark ? "bg-ink text-white" : "border border-line-strong bg-paper text-ink-soft")}>{n}</div>
        {!last ? <div className="w-px flex-1 bg-line" /> : null}
      </div>
      <div className={cn("min-w-0 flex-1 rounded-lg p-4 text-sm", dark ? "bg-ink text-white/90" : "bg-card text-ink-soft")}>
        <div className={cn("mb-1 font-semibold", dark ? "text-white" : "text-ink")}>{title}</div>
        {children}
      </div>
    </div>
  );
}

const TIPO_PROPUESTA: { linea: Linea; accion: Comercio["inversiones"][number]["accion"]; label: string }[] = [
  { linea: "frio", accion: "sumar", label: "Sumar heladera" },
  { linea: "descuentos", accion: "condicionar", label: "Descuento / promoción" },
  { linea: "acuerdos", accion: "renovar", label: "Acuerdo de exhibición" },
  { linea: "exhibicion", accion: "mantener", label: "Material" },
];

const MOTIVOS_PROP = ["Compra bien, falta impulsar frío", "Punto estratégico de la zona", "Pedido del comercio", "Otro"];

function ProponerForm({ comercio }: { comercio: Comercio }) {
  const addPropuesta = useApp((s) => s.addPropuesta);
  const [abierto, setAbierto] = useState(false);
  const [tipoIdx, setTipoIdx] = useState(0);
  const [monto, setMonto] = useState(1000);
  const [motivo, setMotivo] = useState(MOTIVOS_PROP[0]);
  const [listo, setListo] = useState(false);

  const tipo = TIPO_PROPUESTA[tipoIdx];
  const dataEnContra = comercio.compraVsParecidos < 0.85;

  if (!abierto) {
    return (
      <div className="mb-10">
        <button onClick={() => setAbierto(true)} className="rounded-md bg-ink px-4 py-2 text-sm font-medium text-white hover:bg-ink-soft">
          Proponer para este comercio
        </button>
      </div>
    );
  }

  return (
    <Card className="mb-10 p-5">
      <h2 className="mb-4 text-sm font-semibold text-ink">Proponer para {comercio.nombre}</h2>
      {listo ? (
        <div>
          <Badge tono="ok" dot>Propuesta cargada</Badge>
          <p className="mt-2 text-sm text-muted">Entró como &quot;Propuesta por el gerente&quot; y suma a lo que pide la zona.</p>
          <button onClick={() => { setListo(false); setAbierto(false); }} className="mt-3 text-sm text-ink underline underline-offset-2">Cerrar</button>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-[1fr_1fr]">
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted">Qué propongo</label>
              <div className="flex flex-wrap gap-1.5">
                {TIPO_PROPUESTA.map((t, i) => (
                  <button key={t.label} onClick={() => setTipoIdx(i)} className={cn("rounded-md border px-3 py-1.5 text-sm", i === tipoIdx ? "border-ink bg-ink text-white" : "border-line text-ink-soft hover:bg-card")}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted">Monto (USD / año)</label>
              <input type="number" value={monto} onChange={(e) => setMonto(Number(e.target.value))} className="w-40 rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-ink" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted">Motivo</label>
              <div className="flex flex-wrap gap-1.5">
                {MOTIVOS_PROP.map((m) => (
                  <button key={m} onClick={() => setMotivo(m)} className={cn("rounded-md border px-2.5 py-1 text-xs", m === motivo ? "border-ink bg-card text-ink" : "border-line text-ink-soft hover:bg-card")}>
                    {m}
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={() => {
                addPropuesta({ comercioId: comercio.id, comercioNombre: comercio.nombre, zonaId: comercio.zonaId, linea: tipo.linea, accion: tipo.accion, monto, motivo });
                setListo(true);
              }}
              className="rounded-md bg-ink px-4 py-2 text-sm font-medium text-white hover:bg-ink-soft"
            >
              Proponer
            </button>
          </div>

          {/* Qué dicen los datos */}
          <div className="rounded-lg bg-card p-4">
            <div className="mb-2 text-xs font-semibold text-ink">Qué dicen los datos</div>
            <ul className="space-y-1.5 text-sm text-ink-soft">
              <li>Compra {Math.round(comercio.compraVsParecidos * 100)}% de sus parecidos.</li>
              <li>{comercio.fotoFrio ? "Tiene foto de la heladera." : "No tiene foto todavía."}</li>
              <li>{comercio.compraVsParecidos > 1 ? "Propuestas parecidas rindieron en comercios parecidos." : "Propuestas parecidas rindieron poco en comercios así."}</li>
            </ul>
            {dataEnContra ? (
              <Note>
                <span className="mt-2 block text-warn-ink">
                  Compra menos que sus parecidos: esta propuesta va a necesitar aprobación de Dirección. No te la bloqueo, pero queda marcada.
                </span>
              </Note>
            ) : null}
          </div>
        </div>
      )}
    </Card>
  );
}
