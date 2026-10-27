import type {
  Comercio,
  Decision,
  EstadoDecision,
  Inversion,
  Linea,
  Rol,
  Zona,
} from "../types";
import { COMERCIOS, FOTOS, ZONAS, getComercio, getFotoByComercio, getZona } from "./comercios";
import { REGLAS } from "./reglas";
import { LINEA_ORDER, usdFull } from "../format";

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

// ----------------------------------------------------------------------------
// Alertas: lo que el sistema empuja hacia la persona, por rol.
// Es lo que separa esto de un tablero: no espera que vayas a buscar, te avisa.
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

function misDecisiones(rol: Rol): Decision[] {
  if (rol === "finanzas" || rol === "direccion") return DECISIONES;
  if (rol === "preventista")
    return DECISIONES.filter((d) => d.estadoInicial === "devuelta" || d.accion === "corregir");
  if (rol === "trade") return DECISIONES.filter((d) => d.accion === "derivar");
  return DECISIONES.filter((d) => d.apruebaRol === rol);
}

export function alertasDe(rol: Rol, estados: Record<string, EstadoDecision>): Alerta[] {
  const est = (d: Decision) => estados[d.id] ?? d.estadoInicial;
  const mias = misDecisiones(rol);
  const alertas: Alerta[] = [];

  // 1. Tareas vencidas
  const vencidas = mias.filter((d) => d.vencida && est(d) === "esperando");
  if (vencidas.length > 0) {
    const c0 = getComercio(vencidas[0].comercioId);
    alertas.push({
      id: "vencidas",
      tono: "bad",
      categoria: "Vencida",
      titulo: `${vencidas.length} tarea${vencidas.length > 1 ? "s" : ""} vencida${vencidas.length > 1 ? "s" : ""}`,
      detalle: `Pasaron su fecha límite y siguen esperando. Empezá por ${c0?.nombre ?? "la primera"}.`,
      href: `/comercio/${vencidas[0].comercioId}`,
      cta: "Resolver",
    });
  }

  // 2. Finanzas: inversión sin justificación
  if (["finanzas", "direccion", "gerente"].includes(rol)) {
    const sinJust = COMERCIOS.flatMap((c) => c.inversiones.filter((i) => !i.justificado));
    const monto = sum(sinJust.map((i) => i.montoActual));
    if (sinJust.length > 0) {
      alertas.push({
        id: "sin-justificar",
        tono: "warn",
        categoria: "Finanzas",
        titulo: `${usdFull(monto)} sin justificación`,
        detalle: `${sinJust.length} inversiones sin motivo ni decisión registrada. Es un hallazgo, no una tarea: quedan marcadas en el presupuesto.`,
        href: "/presupuesto",
        cta: "Ver en presupuesto",
      });
    }
  }

  // 3. Dato dudoso → pedido de foto
  const dudosas = mias.filter((d) => est(d) === "devuelta");
  if (dudosas.length > 0 && ["preventista", "supervisor", "gerente"].includes(rol)) {
    alertas.push({
      id: "dudosas",
      tono: "warn",
      categoria: "Dato dudoso",
      titulo: `${dudosas.length} heladera${dudosas.length > 1 ? "s" : ""} con dato dudoso`,
      detalle:
        "Confianza baja: el sistema no propone nada hasta tener foto. Vuelven como pedido de foto en la visita.",
      href: `/comercio/${dudosas[0].comercioId}`,
      cta: "Ver",
    });
  }

  // 4. Competencia activa: frío frenado hasta revisión
  if (["gerente", "supervisor", "direccion"].includes(rol)) {
    const comp = DECISIONES.filter((d) => {
      const c = getComercio(d.comercioId);
      return c?.competenciaActiva && d.accion === "mover" && est(d) === "esperando";
    });
    if (comp.length > 0) {
      alertas.push({
        id: "competencia",
        tono: "neutro",
        categoria: "Competencia",
        titulo: `${comp.length} freno${comp.length > 1 ? "s" : ""} por competencia activa`,
        detalle:
          "Estas heladeras candidatas a mover quedaron frenadas: en zona con competencia no se retira frío sin tu revisión.",
        href: `/comercio/${comp[0].comercioId}`,
        cta: "Revisar",
      });
    }
  }

  // 5. Regla en prueba
  if (["finanzas", "trade", "direccion"].includes(rol)) {
    const enPrueba = REGLAS.filter(
      (r) => r.versions[r.versions.length - 1].estado === "en_prueba"
    );
    if (enPrueba.length > 0) {
      alertas.push({
        id: "regla-prueba",
        tono: "neutro",
        categoria: "Regla",
        titulo: `${enPrueba.length} regla en prueba`,
        detalle: `"${enPrueba[0].nombre}" se prueba contra el año anterior. Se activa cuando la validás.`,
        href: "/reglas",
        cta: "Ver regla",
      });
    }
  }

  // 6. Todo al día
  if (alertas.length === 0) {
    alertas.push({
      id: "al-dia",
      tono: "ok",
      categoria: "Al día",
      titulo: "Nada urgente para tu rol",
      detalle: "No hay vencidas ni hallazgos pendientes. Revisá la bandeja o el presupuesto.",
      href: "/presupuesto",
      cta: "Ver presupuesto",
    });
  }

  return alertas;
}

// Actividad base del sistema (se combina con el registro en vivo de las acciones).
export type ActividadItem = {
  id: string;
  tono: "ok" | "warn" | "neutro" | "ink";
  texto: string;
  detalle: string;
  cuando: string;
};

export function actividadBase(): ActividadItem[] {
  const autos = DECISIONES.filter((d) => d.auto).slice(0, 3);
  const propuestas = DECISIONES.filter((d) => d.estadoInicial === "esperando").slice(0, 4);
  const items: ActividadItem[] = [];

  autos.forEach((d, i) => {
    const c = getComercio(d.comercioId);
    items.push({
      id: `auto-${d.id}`,
      tono: "ok",
      texto: `Aprobada automática · ${c?.nombre ?? d.comercioId}`,
      detalle: "Monto bajo, dato claro. Quedó registrada sin intervención.",
      cuando: `hoy ${String(8 + (i % 3)).padStart(2, "0")}:${String(12 + i * 7).padStart(2, "0")}`,
    });
  });

  propuestas.forEach((d, i) => {
    const c = getComercio(d.comercioId);
    items.push({
      id: `prop-${d.id}`,
      tono: "neutro",
      texto: `Propuesta ${d.accion} · ${c?.nombre ?? d.comercioId}`,
      detalle: `Creada por el sistema${d.reglaId ? ` con ${d.reglaId} v${d.reglaVersion}` : ""}.`,
      cuando: `ayer ${String(15 + (i % 4)).padStart(2, "0")}:${String(5 + i * 9).padStart(2, "0")}`,
    });
  });

  return items;
}

// ----------------------------------------------------------------------------
// Métricas por zona (para el mapa) y zonas parecidas.
// ----------------------------------------------------------------------------

export type ZonaMetrica = {
  zona: Zona;
  montoActual: number;
  justificadoPct: number;
  comercios: number;
  bajoRetornoPct: number; // share de comercios que compran < 60% de sus parecidos
  vencidas: number;
};

export function zonasConMetricas(): ZonaMetrica[] {
  const roll = presupuestoPorZona();
  return ZONAS.map((z) => {
    const r = roll.find((x) => x.zonaId === z.id)!;
    const comercios = COMERCIOS.filter((c) => c.zonaId === z.id);
    const bajo = comercios.filter((c) => c.compraVsParecidos < 0.6).length;
    const vencidas = DECISIONES.filter((d) => {
      const c = getComercio(d.comercioId);
      return c?.zonaId === z.id && d.vencida && d.estadoInicial === "esperando";
    }).length;
    return {
      zona: z,
      montoActual: r.montoActual,
      justificadoPct: r.montoActual > 0 ? r.justificado / r.montoActual : 0,
      comercios: comercios.length,
      bajoRetornoPct: comercios.length ? bajo / comercios.length : 0,
      vencidas,
    };
  });
}

export function zonaMetrica(id: string): ZonaMetrica | undefined {
  return zonasConMetricas().find((m) => m.zona.id === id);
}

// Zonas más parecidas por perfil: share de bajo retorno + tamaño del parque.
export function zonasParecidas(id: string, n = 3): ZonaMetrica[] {
  const all = zonasConMetricas();
  const self = all.find((m) => m.zona.id === id);
  if (!self) return [];
  return all
    .filter((m) => m.zona.id !== id)
    .map((m) => ({
      m,
      dist:
        Math.abs(m.bajoRetornoPct - self.bajoRetornoPct) +
        Math.abs(m.comercios - self.comercios) / 40,
    }))
    .sort((a, b) => a.dist - b.dist)
    .slice(0, n)
    .map((x) => x.m);
}

function sum(xs: number[]): number {
  return xs.reduce((a, b) => a + b, 0);
}
