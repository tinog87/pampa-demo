import type {
  Comercio,
  Decision,
  EstadoDecision,
  Inversion,
  Linea,
  Rol,
} from "../types";
import { COMERCIOS, FOTOS, ZONAS, getComercio, getFotoByComercio, getZona } from "./comercios";
import { LINEA_ORDER } from "../format";

export { COMERCIOS, FOTOS, ZONAS, getComercio, getFotoByComercio, getZona };
export { REGLAS, getRegla, reglaVigente } from "./reglas";

// Contexto Pampa (del caso): el total discrecional del canal tradicional.
export const CONTEXTO_NACIONAL = {
  total: 51_500_000,
  lineas: [
    { linea: "frio" as Linea, monto: 19_000_000 },
    { linea: "exhibicion" as Linea, monto: 16_000_000 }, // exhibición + material
    { linea: "acuerdos" as Linea, monto: 9_000_000 },
    { linea: "descuentos" as Linea, monto: 7_500_000 },
  ],
  comercios: 52_000,
  heladeras: 38_000,
  subutilizadas: 7_600,
  malAsignadoMin: 13_000_000,
  malAsignadoMax: 18_000_000,
};

// ----------------------------------------------------------------------------
// Decisiones derivadas de las inversiones (motor de mejora + aprobación).
// ----------------------------------------------------------------------------

const ACCIONES_CON_DECISION = new Set(["mover", "sumar", "corregir", "condicionar", "cortar"]);

function reglaPara(inv: Inversion): { id: string; version: number } | undefined {
  if (inv.accion === "mover") return { id: "heladera_candidata_mover", version: 3 };
  if (inv.accion === "sumar") return { id: "heladera_sumar", version: 1 };
  if (inv.accion === "corregir" && inv.linea === "acuerdos")
    return { id: "acuerdo_cumplimiento", version: 2 };
  if (inv.accion === "condicionar") return { id: "descuento_sin_efecto", version: 1 };
  return undefined;
}

function clasificar(
  c: Comercio,
  inv: Inversion
): { apruebaRol: Rol; estadoInicial: EstadoDecision; auto: boolean } {
  const neto = inv.montoPropuesto - inv.montoActual;
  const montoRef = Math.max(inv.montoActual, inv.montoPropuesto);

  // Confianza baja: no se propone, vuelve como pedido de foto al preventista.
  if (inv.confianza === "baja" || (inv.accion === "mantener" && !inv.justificado)) {
    return { apruebaRol: "preventista", estadoInicial: "devuelta", auto: false };
  }
  // Monto alto o zona con competencia activa: decide el gerente.
  if (montoRef > 3000 || c.competenciaActiva) {
    return { apruebaRol: "gerente", estadoInicial: "esperando", auto: false };
  }
  // Mover o sumar heladeras: siempre un supervisor.
  if (inv.accion === "mover" || inv.accion === "sumar") {
    return { apruebaRol: "supervisor", estadoInicial: "esperando", auto: false };
  }
  // Monto bajo, dato claro, corrección sin costo: automático.
  if (Math.abs(neto) < 300 && inv.confianza === "alta" && inv.accion === "corregir") {
    return { apruebaRol: "supervisor", estadoInicial: "aprobada", auto: true };
  }
  return { apruebaRol: "supervisor", estadoInicial: "esperando", auto: false };
}

function buildDecisiones(): Decision[] {
  const out: Decision[] = [];
  let k = 0;
  for (const c of COMERCIOS) {
    for (const inv of c.inversiones) {
      const esMantenerNoJust = inv.accion === "mantener" && !inv.justificado;
      if (!ACCIONES_CON_DECISION.has(inv.accion) && !esMantenerNoJust) continue;

      const cls = clasificar(c, inv);
      const regla = reglaPara(inv);
      const foto = getFotoByComercio(c.id);
      const neto = inv.montoPropuesto - inv.montoActual;

      // Vencidas: algunas de las que esperan aprobación, de forma determinística.
      const vencida = cls.estadoInicial === "esperando" && k % 9 === 4;
      const diasBase = 7 + (k % 10);
      const fecha = new Date(2026, 9, 10 + ((k * 2) % 18));

      out.push({
        id: `${c.id}:${inv.linea}`,
        comercioId: c.id,
        linea: inv.linea,
        accion: inv.accion,
        montoActual: inv.montoActual,
        montoPropuesto: inv.montoPropuesto,
        montoNeto: neto,
        motivo:
          inv.motivo ??
          "Sin motivo registrado: dato dudoso, vuelve como pedido de foto.",
        indicador: indicadorDe(c, inv),
        reglaId: regla?.id ?? "",
        reglaVersion: regla?.version ?? 0,
        apruebaRol: cls.apruebaRol,
        auto: cls.auto,
        estadoInicial: cls.estadoInicial,
        fechaLimite: fecha.toISOString().slice(0, 10),
        vencida,
        fotoId: foto?.id,
        confianza: inv.confianza,
      });
      k++;
    }
  }
  return out;
}

function indicadorDe(c: Comercio, inv: Inversion): string {
  const r = c.compraVsParecidos;
  if (inv.accion === "sumar") return `Compra ${Math.round((r - 1) * 100)}% más que sus parecidos, sin heladera`;
  if (inv.accion === "mover") return `Compra ${Math.round(r * 100)}% de sus parecidos; foto llena de producto Pampa`;
  if (inv.linea === "acuerdos") return "Foto: menos cabeceras/espacio que lo pactado";
  if (inv.linea === "descuentos") return "No compró más que sus parecidos con el descuento";
  if (inv.accion === "corregir") return `Compra ${Math.round(r * 100)}% de sus parecidos`;
  return `Compra ${Math.round(r * 100)}% de sus parecidos`;
}

export const DECISIONES: Decision[] = buildDecisiones();

export function getDecision(id: string): Decision | undefined {
  return DECISIONES.find((d) => d.id === id);
}

export function decisionesDeComercio(comercioId: string): Decision[] {
  return DECISIONES.filter((d) => d.comercioId === comercioId);
}

// ----------------------------------------------------------------------------
// Presupuesto: rollup zona → línea.
// ----------------------------------------------------------------------------

export type LineaRollup = {
  linea: Linea;
  montoActual: number;
  montoPropuesto: number;
  justificado: number; // monto justificado
  comercios: number;
};

export type ZonaRollup = {
  zonaId: string;
  nombre: string;
  piloto: boolean;
  montoActual: number;
  montoPropuesto: number;
  justificado: number;
  lineas: LineaRollup[];
  comercios: Comercio[];
};

export function presupuestoPorZona(): ZonaRollup[] {
  return ZONAS.map((z) => {
    const comercios = COMERCIOS.filter((c) => c.zonaId === z.id);
    const lineas: LineaRollup[] = LINEA_ORDER.map((linea) => {
      const invs = comercios.flatMap((c) =>
        c.inversiones.filter((i) => i.linea === linea)
      );
      return {
        linea,
        montoActual: sum(invs.map((i) => i.montoActual)),
        montoPropuesto: sum(invs.map((i) => i.montoPropuesto)),
        justificado: sum(invs.filter((i) => i.justificado).map((i) => i.montoActual)),
        comercios: invs.length,
      };
    });
    return {
      zonaId: z.id,
      nombre: z.nombre,
      piloto: z.piloto,
      montoActual: sum(lineas.map((l) => l.montoActual)),
      montoPropuesto: sum(lineas.map((l) => l.montoPropuesto)),
      justificado: sum(lineas.map((l) => l.justificado)),
      lineas,
      comercios,
    };
  });
}

export function totalesDemo() {
  const inv = COMERCIOS.flatMap((c) => c.inversiones);
  const montoActual = sum(inv.map((i) => i.montoActual));
  const justificado = sum(inv.filter((i) => i.justificado).map((i) => i.montoActual));
  const sinJustificar = sum(inv.filter((i) => !i.justificado).map((i) => i.montoActual));
  return {
    montoActual,
    justificado,
    sinJustificar,
    pctJustificado: montoActual > 0 ? justificado / montoActual : 0,
    comercios: COMERCIOS.length,
  };
}

// ----------------------------------------------------------------------------
// Bandeja por rol.
// ----------------------------------------------------------------------------

export function inboxDe(rol: Rol, estados: Record<string, EstadoDecision>): Decision[] {
  return DECISIONES.filter((d) => {
    const estado = estados[d.id] ?? d.estadoInicial;
    if (rol === "preventista") {
      // Tareas de foto (devueltas / confianza baja) y correcciones aprobadas a ejecutar.
      return estado === "devuelta" || (estado === "aprobada" && d.accion === "corregir");
    }
    if (rol === "trade") {
      return d.accion === "derivar";
    }
    if (rol === "finanzas" || rol === "direccion") {
      return false; // ven el presupuesto, no una cola de aprobación
    }
    return d.apruebaRol === rol && estado === "esperando";
  });
}

export function statsRol(rol: Rol, estados: Record<string, EstadoDecision>) {
  const propias = DECISIONES.filter((d) => d.apruebaRol === rol);
  const estadoDe = (d: Decision) => estados[d.id] ?? d.estadoInicial;
  return {
    esperan: propias.filter((d) => estadoDe(d) === "esperando").length,
    aprobadas: propias.filter((d) => ["aprobada", "ejecutada", "medida"].includes(estadoDe(d))).length,
    vencidas: propias.filter((d) => d.vencida && estadoDe(d) === "esperando").length,
  };
}

function sum(xs: number[]): number {
  return xs.reduce((a, b) => a + b, 0);
}
