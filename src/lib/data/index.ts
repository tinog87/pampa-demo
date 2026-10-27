import type {
  Comercio,
  Decision,
  EstadoDecision,
  EstadoMonto,
  Inversion,
  Linea,
  Rol,
  Zona,
} from "../types";
import {
  COMERCIOS,
  TOTAL_COMERCIOS,
  ZONAS,
  getComercio,
  getZona,
} from "./comercios";
import { REGLAS, getRegla, reglaVigente, reglaEstaActiva } from "./reglas";
import { LINEA_ORDER } from "../format";

export { COMERCIOS, ZONAS, TOTAL_COMERCIOS, getComercio, getZona };
export { REGLAS, getRegla, reglaVigente, reglaEstaActiva };

// Contexto Pampa (del caso). Nunca se mezcla con los totales de la muestra.
export const CONTEXTO_NACIONAL = {
  total: 51_500_000,
  comercios: 52_000,
  heladeras: 38_000,
  zonas: 14,
  // Desglose del caso (contexto, no se mezcla con los totales de la muestra).
  lineas: [
    { label: "Frío", monto: 19_000_000 },
    { label: "Exhibición y espacio pagado", monto: 11_500_000 },
    { label: "Acuerdos", monto: 9_000_000 },
    { label: "Descuentos", monto: 7_500_000 },
    { label: "POP y activaciones", monto: 4_500_000 },
  ],
  malAsignadoMin: 13_000_000,
  malAsignadoMax: 18_000_000,
};

export const MUESTRA = {
  comercios: TOTAL_COMERCIOS,
  banner: `Muestra ilustrativa: ${TOTAL_COMERCIOS.toLocaleString("es-AR")} comercios · Pampa total: USD 51,5 M en 52.000 comercios`,
};

// Precisión de la IA (lecturas confirmadas sobre revisadas). Las alertas
// automáticas están inactivas hasta superar el umbral (A definir con Pampa).
export const PRECISION_IA = {
  actual: 0.82,
  umbral: 0.9, // A definir con Pampa
  get alertasActivas() {
    return this.actual >= this.umbral;
  },
};

// ----------------------------------------------------------------------------
// Decisiones derivadas de las inversiones.
// ----------------------------------------------------------------------------

const ACCIONES_PROPUESTA = new Set<Inversion["accion"]>([
  "mover",
  "sumar",
  "corregir",
  "condicionar",
  "cortar",
  "ajustar",
  "derivar",
]);

function reglaPara(inv: Inversion): { id: string; version: number } {
  if (inv.accion === "mover") return { id: "heladera_candidata_mover", version: 3 };
  if (inv.accion === "sumar") return { id: "heladera_sumar", version: 1 };
  if (inv.accion === "corregir" && inv.linea === "acuerdos")
    return { id: "acuerdo_cumplimiento", version: 1 };
  return { id: "", version: 0 };
}

type Clasif = { apruebaRol: Rol | "auto"; estado: EstadoDecision; auto: boolean };

function clasificar(c: Comercio, inv: Inversion): Clasif {
  if (inv.estadoMonto === "a_validar")
    return { apruebaRol: "supervisor", estado: "a_validar", auto: false };

  const frioSinFoto =
    inv.linea === "frio" &&
    (inv.accion === "corregir" || inv.accion === "mover") &&
    !c.fotoFrio;
  if (frioSinFoto) return { apruebaRol: "preventista", estado: "pide_foto", auto: false };

  const montoRef = Math.max(inv.montoActual, inv.montoPropuesto);

  if (inv.accion === "mover" || inv.accion === "sumar") {
    const rol = c.competenciaActiva || montoRef >= 3000 ? "gerente" : "supervisor";
    return { apruebaRol: rol, estado: "esperando", auto: false };
  }

  if (montoRef < 300 && c.confianza === "alta" && inv.accion === "corregir") {
    return { apruebaRol: "auto", estado: "aprobada", auto: true };
  }
  if (c.competenciaActiva || montoRef >= 3000) {
    return { apruebaRol: "gerente", estado: "esperando", auto: false };
  }
  return { apruebaRol: "supervisor", estado: "esperando", auto: false };
}

function generaDecision(c: Comercio, inv: Inversion): boolean {
  if (inv.estadoMonto === "a_validar") return true; // tarea de validación
  if (
    inv.linea === "frio" &&
    (inv.accion === "corregir" || inv.accion === "mover") &&
    !c.fotoFrio
  )
    return true; // pide foto
  if (inv.linea === "descuentos" && (inv.accion === "mantener" || inv.accion === "renovar"))
    return false;
  if (inv.linea === "exhibicion") return false;
  if (inv.linea === "acuerdos" && inv.accion === "renovar") return false;
  if (inv.accion === "mantener") return false;
  return ACCIONES_PROPUESTA.has(inv.accion);
}

function indicadorDe(c: Comercio, inv: Inversion): string {
  const p = Math.round(c.compraVsParecidos * 100);
  if (inv.accion === "sumar") return `compra ${p}% de sus parecidos… sin heladera`;
  if (inv.linea === "acuerdos") return "foto: menos espacio que lo pactado";
  if (inv.linea === "descuentos") return "promoción propuesta por el gerente";
  return `compra ${p}% de sus parecidos`;
}

function buildDecisiones(): Decision[] {
  const out: Decision[] = [];
  let k = 0;
  for (const c of COMERCIOS) {
    for (const inv of c.inversiones) {
      if (!generaDecision(c, inv)) continue;
      const cls = clasificar(c, inv);
      const regla = reglaPara(inv);
      const vencida = cls.estado === "esperando" && k % 11 === 5;
      const fecha = new Date(2026, 9, 10 + ((k * 3) % 18));
      out.push({
        id: `${c.id}:${inv.linea}`,
        comercioId: c.id,
        linea: inv.linea,
        accion: inv.accion,
        montoActual: inv.montoActual,
        montoPropuesto: inv.montoPropuesto,
        montoNeto: inv.montoPropuesto - inv.montoActual,
        motivo: inv.motivo ?? "Registro dudoso: una persona valida antes de proponer.",
        condicion: inv.condicion,
        reglaId: regla.id,
        reglaVersion: regla.version,
        apruebaRol: cls.apruebaRol,
        auto: cls.auto,
        origen: c.id === "rivas" || c.id === "kiosco-mitre" ? "gerente" : "sistema",
        estadoInicial: cls.estado,
        fechaLimite: fecha.toISOString().slice(0, 10),
        vencida,
        tieneFoto: inv.linea === "frio" ? !!c.fotoFrio : inv.linea === "acuerdos" ? !!c.acuerdo : false,
        confianza: inv.confianza,
        estimado: inv.estimado,
      });
      k++;
    }
  }
  return out;
}

export const DECISIONES: Decision[] = buildDecisiones();
const DEC_BY_COMERCIO = new Map<string, Decision[]>();
for (const d of DECISIONES) {
  const arr = DEC_BY_COMERCIO.get(d.comercioId) ?? [];
  arr.push(d);
  DEC_BY_COMERCIO.set(d.comercioId, arr);
}

export function getDecision(id: string): Decision | undefined {
  return DECISIONES.find((d) => d.id === id);
}

// Preventistas de la zona (demo) y asignación determinística de cada comercio.
export const PREVENTISTAS = ["Acosta", "Benítez", "Cardozo"];
export function preventistaDe(comercioId: string): string {
  let h = 0;
  for (let i = 0; i < comercioId.length; i++) h = (h * 31 + comercioId.charCodeAt(i)) | 0;
  return PREVENTISTAS[Math.abs(h) % PREVENTISTAS.length];
}
export function decisionesDeComercio(comercioId: string): Decision[] {
  return DEC_BY_COMERCIO.get(comercioId) ?? [];
}

export function estadoDe(
  d: Decision,
  estados: Record<string, EstadoDecision>
): EstadoDecision {
  return estados[d.id] ?? d.estadoInicial;
}

// Cuántos casos habría marcado la regla de descuentos (está en prueba: no propone).
export function habriaMarcadoDescuento(): number {
  return COMERCIOS.reduce(
    (acc, c) =>
      acc +
      c.inversiones.filter(
        (i) => i.linea === "descuentos" && i.estadoMonto === "sin_justificar"
      ).length,
    0
  );
}

// ----------------------------------------------------------------------------
// Presupuesto: rollup por zona, con estados de monto.
// ----------------------------------------------------------------------------

export type PorEstado = Record<EstadoMonto, number>;

function estadosVacios(): PorEstado {
  return { justificado: 0, pendiente: 0, a_validar: 0, sin_justificar: 0 };
}

export type LineaRollup = {
  linea: Linea;
  montoActual: number;
  montoPropuesto: number;
  porEstado: PorEstado;
};

export type ZonaRollup = {
  zona: Zona;
  montoActual: number;
  montoPropuesto: number;
  porEstado: PorEstado;
  lineas: LineaRollup[];
  comercios: number;
  techo: number;
  bajoRetornoPct: number;
};

export function techoDefault(zonaId: string): number {
  const comercios = COMERCIOS.filter((c) => c.zonaId === zonaId);
  const actual = sum(comercios.flatMap((c) => c.inversiones.map((i) => i.montoActual)));
  return Math.round((actual * 0.97) / 1000) * 1000; // techo un poco por debajo del actual
}

export function presupuestoPorZona(): ZonaRollup[] {
  return ZONAS.map((z) => {
    const comercios = COMERCIOS.filter((c) => c.zonaId === z.id);
    const invs = comercios.flatMap((c) => c.inversiones);
    const bajo = comercios.filter((c) => c.compraVsParecidos < 0.6).length;
    const lineas: LineaRollup[] = LINEA_ORDER.map((linea) => {
      const li = invs.filter((i) => i.linea === linea);
      const porEstado = estadosVacios();
      for (const i of li) porEstado[i.estadoMonto] += i.montoActual;
      return {
        linea,
        montoActual: sum(li.map((i) => i.montoActual)),
        montoPropuesto: sum(li.map((i) => i.montoPropuesto)),
        porEstado,
      };
    });
    const porEstado = estadosVacios();
    for (const i of invs) porEstado[i.estadoMonto] += i.montoActual;
    return {
      zona: z,
      montoActual: sum(invs.map((i) => i.montoActual)),
      montoPropuesto: sum(invs.map((i) => i.montoPropuesto)),
      porEstado,
      lineas,
      comercios: comercios.length,
      techo: techoDefault(z.id),
      bajoRetornoPct: comercios.length ? bajo / comercios.length : 0,
    };
  });
}

export function zonaRollup(id: string): ZonaRollup | undefined {
  return presupuestoPorZona().find((z) => z.zona.id === id);
}

export function totalesMuestra() {
  const invs = COMERCIOS.flatMap((c) => c.inversiones);
  const porEstado = estadosVacios();
  for (const i of invs) porEstado[i.estadoMonto] += i.montoActual;
  const montoActual = sum(invs.map((i) => i.montoActual));
  return {
    montoActual,
    montoPropuesto: sum(invs.map((i) => i.montoPropuesto)),
    porEstado,
    comercios: TOTAL_COMERCIOS,
    pctJustificado: montoActual ? porEstado.justificado / montoActual : 0,
  };
}

// ----------------------------------------------------------------------------
// Bandejas e inbox por rol (con zona para los roles de calle).
// ----------------------------------------------------------------------------

function enZona(d: Decision, zonaId?: string): boolean {
  if (!zonaId) return true;
  return getComercio(d.comercioId)?.zonaId === zonaId;
}

export function inboxDe(
  rol: Rol,
  zonaId: string | undefined,
  estados: Record<string, EstadoDecision>
): Decision[] {
  return DECISIONES.filter((d) => {
    const e = estadoDe(d, estados);
    if (rol === "preventista") {
      return enZona(d, zonaId) && (e === "pide_foto" || (e === "aprobada" && d.accion === "corregir"));
    }
    if (rol === "trade") return d.accion === "derivar";
    if (rol === "finanzas" || rol === "direccion") return false;
    // supervisor / gerente: lo de su nivel en su zona
    return enZona(d, zonaId) && d.apruebaRol === rol && (e === "esperando" || e === "a_validar");
  });
}

export function statsRol(
  rol: Rol,
  zonaId: string | undefined,
  estados: Record<string, EstadoDecision>
) {
  const propias = DECISIONES.filter((d) => d.apruebaRol === rol && enZona(d, zonaId));
  return {
    esperan: propias.filter((d) => ["esperando", "a_validar"].includes(estadoDe(d, estados))).length,
    aprobadas: propias.filter((d) => ["aprobada", "ejecutada", "medida"].includes(estadoDe(d, estados))).length,
    vencidas: propias.filter((d) => d.vencida && estadoDe(d, estados) === "esperando").length,
  };
}

// ----------------------------------------------------------------------------
// Alertas (lo que el sistema empuja hacia la persona).
// ----------------------------------------------------------------------------

export type Alerta = {
  id: string;
  tono: "bad" | "warn" | "ok" | "neutro";
  categoria: string;
  titulo: string;
  detalle: string;
  href?: string;
  cta?: string;
};

export function alertasDe(
  rol: Rol,
  zonaId: string | undefined,
  estados: Record<string, EstadoDecision>
): Alerta[] {
  const alertas: Alerta[] = [];
  const mias = DECISIONES.filter((d) =>
    rol === "finanzas" || rol === "direccion" ? true : enZona(d, zonaId)
  );

  const vencidas = mias.filter(
    (d) => d.vencida && d.apruebaRol === rol && estadoDe(d, estados) === "esperando"
  );
  if (vencidas.length > 0) {
    const c0 = getComercio(vencidas[0].comercioId);
    alertas.push({
      id: "vencidas",
      tono: "bad",
      categoria: "Vencida",
      titulo: `${vencidas.length} ${vencidas.length > 1 ? "tareas vencidas" : "tarea vencida"}`,
      detalle: `Pasaron su fecha y siguen esperando. Empezá por ${c0?.nombre ?? "la primera"}.`,
      href: `/comercio?id=${vencidas[0].comercioId}`,
      cta: "Resolver",
    });
  }

  if (["gerente", "supervisor", "direccion"].includes(rol)) {
    const comp = mias.filter((d) => {
      const c = getComercio(d.comercioId);
      return c?.competenciaActiva && d.accion === "mover" && estadoDe(d, estados) === "esperando";
    });
    if (comp.length > 0)
      alertas.push({
        id: "competencia",
        tono: "neutro",
        categoria: "Competencia",
        titulo: `${comp.length} ${comp.length > 1 ? "frenos" : "freno"} por competencia`,
        detalle: "No se retira frío en zona con competencia sin tu revisión.",
        href: `/comercio?id=${comp[0].comercioId}`,
        cta: "Revisar",
      });
  }

  if (["finanzas", "direccion"].includes(rol)) {
    const sinJust = COMERCIOS.flatMap((c) => c.inversiones.filter((i) => i.estadoMonto === "sin_justificar"));
    const monto = sum(sinJust.map((i) => i.montoActual));
    if (sinJust.length > 0)
      alertas.push({
        id: "sin-justificar",
        tono: "warn",
        categoria: "Finanzas",
        titulo: `${fmtUsd(monto)} sin justificación`,
        detalle: `${sinJust.length} inversiones sin motivo registrado. Es un hallazgo, no una tarea.`,
        href: "/presupuesto",
        cta: "Ver en presupuesto",
      });
  }

  if (["finanzas", "trade", "direccion"].includes(rol)) {
    const enPrueba = REGLAS.filter((r) => r.versions[r.versions.length - 1].estado === "en_prueba");
    if (enPrueba.length > 0)
      alertas.push({
        id: "regla-prueba",
        tono: "neutro",
        categoria: "Regla",
        titulo: `${enPrueba.length} regla en prueba`,
        detalle: `"${enPrueba[0].nombre}" corre sin efecto: habría marcado ${habriaMarcadoDescuento()} casos. Se activa cuando la validás.`,
        href: "/reglas",
        cta: "Ver regla",
      });
  }

  if (alertas.length === 0)
    alertas.push({
      id: "al-dia",
      tono: "ok",
      categoria: "Al día",
      titulo: "Nada urgente",
      detalle: "No hay vencidas ni hallazgos pendientes para tu rol.",
    });

  return alertas;
}

// Comercios que compran bien pero poco de lo que se quiere impulsar (Derivados a Trade).
export function derivadosTrade(): Comercio[] {
  return COMERCIOS.filter(
    (c) => c.compraVsParecidos > 1.1 && c.inversiones.some((i) => i.linea === "frio" && i.accion === "mantener") && c.puertas > 0
  ).slice(0, 12);
}

// Simulador de reglas para Trade: impacto de mover un parámetro antes de activar.
export function simularMover(umbralCompra: number) {
  const candidatas = COMERCIOS.filter(
    (c) => c.puertas > 0 && c.compraVsParecidos < umbralCompra && c.confianza !== "baja"
  );
  const inversionLiberada = sum(
    candidatas.map((c) => Math.min(c.puertas, 1) * 500)
  );
  return { candidatas: candidatas.length, inversionLiberada };
}

export function simularDescuento(umbralCompra: number) {
  const marcados = COMERCIOS.flatMap((c) =>
    c.inversiones.filter(
      (i) => i.linea === "descuentos" && c.compraVsParecidos < umbralCompra
    )
  );
  return { cortados: marcados.length, inversion: sum(marcados.map((i) => i.montoActual)) };
}

function sum(xs: number[]): number {
  return xs.reduce((a, b) => a + b, 0);
}

function fmtUsd(n: number): string {
  return `USD ${Math.round(n).toLocaleString("es-AR")}`;
}
