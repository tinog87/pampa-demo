"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import {
  decisionesDeComercio,
  getComercio,
  getFotoByComercio,
  getZona,
  reglaVigente,
} from "@/lib/data";
import { useApp, estadoEfectivo } from "@/lib/store";
import {
  ACCION_LABEL,
  CANAL_LABEL,
  CONFIANZA_LABEL,
  ESTADO_LABEL,
  LINEA_LABEL,
  cn,
  compraTexto,
  confianzaTono,
  usd,
  usdFull,
} from "@/lib/format";
import type { Comercio, Decision, Foto } from "@/lib/types";
import { Badge, Bar, Card, Note } from "./ui";
import { FridgeSvg } from "./FridgeSvg";
import { DecisionActions } from "./DecisionActions";

export function ComercioDetail({ id }: { id: string }) {
  const c = getComercio(id);
  const estados = useApp((s) => s.estados);
  const registro = useApp((s) => s.registro);

  if (!c) {
    return (
      <div>
        <Link href="/" className="text-sm text-muted hover:text-ink">
          ← Presupuesto
        </Link>
        <p className="mt-6 text-sm text-muted">No se encontró el comercio.</p>
      </div>
    );
  }

  const zona = getZona(c.zonaId);
  const decs = decisionesDeComercio(c.id);
  const foto = getFotoByComercio(c.id);
  const principal = decs.find((d) => d.linea === "frio") ?? decs[0];
  const invTotal = c.inversiones.reduce((a, i) => a + i.montoActual, 0);

  const ratioTono =
    c.compraVsParecidos < 0.6
      ? "bad"
      : c.compraVsParecidos < 0.85
        ? "warn"
        : c.compraVsParecidos > 1.3
          ? "ok"
          : "ink";

  return (
    <div>
      <Link href="/" className="text-sm text-muted hover:text-ink">
        ← Presupuesto
      </Link>

      {/* Header */}
      <div className="mt-4 mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <span className="brand-rule mb-3" />
          <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-[28px]">
            {c.nombre}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
            <span className="font-mono text-xs text-faint">{c.codigo}</span>
            <span>·</span>
            <span>{zona?.nombre}</span>
            <span>·</span>
            <span>
              {CANAL_LABEL[c.canal]} {c.tamano}
            </span>
            <span>·</span>
            <span>{c.puertas === 0 ? "Sin heladera" : `${c.puertas} puertas`}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {c.competenciaActiva ? <Badge tono="warn" dot>Competencia activa</Badge> : null}
          <Badge tono={confianzaTono(c.confianza)} dot>
            {CONFIANZA_LABEL[c.confianza]}
          </Badge>
        </div>
      </div>

      {/* Resumen */}
      <div className="mb-10 grid gap-3 sm:grid-cols-3">
        <Card className="p-4">
          <div className="text-xs text-muted">Compra vs parecidos</div>
          <div className={cn("mt-1 text-2xl font-bold tnum", ratioTono === "bad" ? "text-bad-ink" : "text-ink")}>
            {Math.round(c.compraVsParecidos * 100)}%
          </div>
          <div className="mt-2">
            <Bar value={Math.min(c.compraVsParecidos, 2)} max={2} tono={ratioTono} />
          </div>
          <div className="mt-1.5 text-[11px] text-faint">{compraTexto(c.compraVsParecidos)}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted">Inversión en el ciclo</div>
          <div className="mt-1 text-2xl font-bold text-ink tnum">{usdFull(invTotal)}</div>
          <div className="mt-2 text-[11px] text-faint">
            {c.inversiones.length} línea{c.inversiones.length === 1 ? "" : "s"} de inversión
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted">Decisión principal</div>
          <div className="mt-1 text-2xl font-bold text-ink">
            {principal ? ACCION_LABEL[principal.accion] : "Sin cambios"}
          </div>
          <div className="mt-2 text-[11px] text-faint">
            {principal ? `Monto neto ${usd(principal.montoNeto)}/año` : "La inversión rinde"}
          </div>
        </Card>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.6fr_1fr]">
        {/* Cadena */}
        <section>
          <h2 className="mb-5 text-sm font-semibold text-ink">
            La cadena: de dónde sale hasta la decisión
          </h2>
          <Cadena c={c} zonaNombre={zona?.nombre ?? ""} principal={principal} foto={foto} />
        </section>

        {/* Foto */}
        <section>
          <h2 className="mb-5 text-sm font-semibold text-ink">La foto en la visita</h2>
          {foto ? (
            <div>
              <FridgeSvg estado={foto.estadoHeladera} />
              <div className="mt-3 space-y-1.5">
                {foto.lectura.slice(0, 3).map((l) => (
                  <div key={l.label} className="flex items-center justify-between gap-2 text-xs">
                    <span className="text-muted">{l.label}</span>
                    <span className="flex items-center gap-1.5 text-right font-medium text-ink">
                      {l.valor}
                      <span
                        className={cn(
                          "size-1.5 rounded-full",
                          l.confianza === "alta" ? "bg-ok" : l.confianza === "media" ? "bg-warn" : "bg-bad"
                        )}
                      />
                    </span>
                  </div>
                ))}
              </div>
              <Link
                href={`/foto/${c.id}`}
                className="mt-3 inline-block text-xs font-medium text-ink underline underline-offset-2"
              >
                Ver control de foto completo →
              </Link>
            </div>
          ) : (
            <Card className="p-5">
              <Note>
                Este comercio no tiene foto en el ciclo. La compra contra parecidos marca
                para revisar; la foto se pide en la próxima visita.
              </Note>
            </Card>
          )}
        </section>
      </div>

      {/* Decisiones por línea */}
      <section className="mt-12">
        <h2 className="mb-4 text-sm font-semibold text-ink">Decisiones por línea</h2>
        <div className="space-y-3">
          {decs.length === 0 ? (
            <Card className="p-5">
              <Note>Ninguna línea requiere decisión: la inversión rinde en línea con sus parecidos.</Note>
            </Card>
          ) : (
            decs.map((d) => <LineaCard key={d.id} d={d} />)
          )}
        </div>
      </section>

      {/* Registro */}
      <section className="mt-12">
        <h2 className="mb-1 text-sm font-semibold text-ink">Registro</h2>
        <p className="mb-4 text-xs text-muted">
          No se edita ni se borra: cada cambio agrega una línea.
        </p>
        <Card className="divide-y divide-line">
          {decs.map((d) => {
            const regla = d.reglaId ? reglaVigente(d.reglaId) : undefined;
            return (
              <div key={d.id} className="flex items-start gap-3 px-4 py-3 text-sm">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-faint" />
                <div>
                  <span className="text-ink">
                    Propuesta <strong>{ACCION_LABEL[d.accion]}</strong> en {LINEA_LABEL[d.linea]}
                  </span>
                  <span className="text-muted">
                    {" "}
                    · creada por el sistema
                    {regla ? ` con la regla ${d.reglaId} v${d.reglaVersion}` : ""}
                  </span>
                </div>
              </div>
            );
          })}
          {registro
            .filter((r) => r.decisionId.startsWith(`${c.id}:`))
            .map((r, i) => (
              <div key={i} className="flex items-start gap-3 px-4 py-3 text-sm">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-ink" />
                <div>
                  <span className="text-ink">
                    {ESTADO_LABEL[r.de]} → <strong>{ESTADO_LABEL[r.a]}</strong>
                  </span>
                  <span className="text-muted">
                    {" "}
                    · {r.por} · {r.cuando}
                  </span>
                </div>
              </div>
            ))}
        </Card>
      </section>
    </div>
  );
}

/* ---- Cadena de trazabilidad ---- */

function Cadena({
  c,
  zonaNombre,
  principal,
  foto,
}: {
  c: Comercio;
  zonaNombre: string;
  principal?: Decision;
  foto?: Foto;
}) {
  const estados = useApp((s) => s.estados);
  const frio = c.inversiones.find((i) => i.linea === "frio") ?? c.inversiones[0];

  if (!frio) {
    return (
      <Card className="p-5">
        <Note>
          Este comercio no tiene inversión discrecional trazada en el ciclo. La compra
          contra sus parecidos se sigue igual; si aparece una señal, entra al motor.
        </Note>
      </Card>
    );
  }

  const regla = principal?.reglaId ? reglaVigente(principal.reglaId) : undefined;
  const estadoPrincipal = principal
    ? estadoEfectivo(estados, principal.id, principal.estadoInicial)
    : undefined;

  return (
    <div>
      <Step n={1} title="Presupuesto aprobado">
        <Row k="Línea · zona" v={`${LINEA_LABEL[frio.linea]} · ${zonaNombre}`} />
        <Row k="Fijado por" v="Finanzas (última versión aprobada)" />
      </Step>

      <Step n={2} title="Inversión asignada al comercio">
        <Row k="Monto del ciclo" v={`${usdFull(frio.montoActual)}/año`} />
        <Row k="Equipo" v={c.puertas === 0 ? "Sin heladera" : `${c.puertas} puertas de heladera`} />
      </Step>

      <Step n={3} title="Compra contra sus parecidos">
        <div className="mb-2 flex items-center gap-3">
          <div className="w-32">
            <Bar
              value={Math.min(c.compraVsParecidos, 2)}
              max={2}
              tono={c.compraVsParecidos < 0.6 ? "bad" : c.compraVsParecidos > 1.3 ? "ok" : "ink"}
            />
          </div>
          <span className="text-sm font-medium text-ink tnum">
            {Math.round(c.compraVsParecidos * 100)}% · {compraTexto(c.compraVsParecidos)}
          </span>
        </div>
        <Note>
          Es sell-in: lo que el comercio le compra a Pampa, no su venta al consumidor.
          Marca para revisar; no alcanza para decidir.
        </Note>
      </Step>

      <Step n={4} title="Foto en la visita">
        {foto ? (
          <Row
            k="Lectura IA"
            v={`${foto.lectura[0]?.valor ?? "—"} · ${foto.lectura[1]?.valor ?? ""}`}
          />
        ) : (
          <Note>Sin foto todavía: se pide en la próxima visita.</Note>
        )}
      </Step>

      {principal ? (
        <>
          {/* Nodo decisión — negro, la conclusión del sistema */}
          <Step n={5} title="Decisión" dark>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded bg-white/15 px-2 py-0.5 text-sm font-semibold text-white">
                {ACCION_LABEL[principal.accion]}
              </span>
              <span className="text-sm text-white/80 tnum">
                Monto neto {usd(principal.montoNeto)}/año
              </span>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-white/80">{principal.motivo}</p>
            {regla ? (
              <Link
                href="/reglas"
                className="mt-2 inline-block font-mono text-xs text-white/70 underline underline-offset-2 hover:text-white"
              >
                {principal.reglaId} v{principal.reglaVersion} →
              </Link>
            ) : (
              <span className="mt-2 inline-block text-xs text-white/50">
                Corrección de ejecución · sin regla de inversión
              </span>
            )}
          </Step>

          <Step n={6} title="Aprobación" last={!estadoPrincipal || estadoPrincipal !== "medida"}>
            <DecisionActions d={principal} />
          </Step>

          <Step n={7} title="Resultado" last>
            <Note>
              A los 3 meses: compra del comercio contra sus parecidos sin intervención.
              {estadoPrincipal === "medida" ? "" : " Pendiente de medición."}
            </Note>
          </Step>
        </>
      ) : (
        <Step n={5} title="Sin decisión pendiente" dark last>
          <p className="text-sm text-white/80">La inversión rinde en línea con sus parecidos.</p>
        </Step>
      )}
    </div>
  );
}

function Step({
  n,
  title,
  children,
  dark = false,
  last = false,
}: {
  n: number;
  title: string;
  children: ReactNode;
  dark?: boolean;
  last?: boolean;
}) {
  return (
    <div className="relative flex gap-4 pb-4">
      {/* Rail */}
      <div className="flex flex-col items-center">
        <div
          className={cn(
            "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
            dark ? "bg-ink text-white" : "border border-line-strong bg-paper text-ink-soft"
          )}
        >
          {n}
        </div>
        {!last ? <div className="w-px flex-1 bg-line" /> : null}
      </div>
      {/* Contenido */}
      <div className={cn("min-w-0 flex-1 rounded-lg p-4", dark ? "bg-ink" : "bg-card")}>
        <div className={cn("mb-2 text-sm font-semibold", dark ? "text-white" : "text-ink")}>
          {title}
        </div>
        {children}
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-0.5 text-sm">
      <span className="text-muted">{k}</span>
      <span className="text-right font-medium text-ink">{v}</span>
    </div>
  );
}

function LineaCard({ d }: { d: Decision }) {
  return (
    <Card className="p-4">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-ink">{LINEA_LABEL[d.linea]}</span>
          <Badge tono="neutro">{ACCION_LABEL[d.accion]}</Badge>
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
