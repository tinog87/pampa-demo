import type { Canal, Comercio, Foto, Inversion, Tamano, Zona } from "../types";

// Las 14 zonas del caso, con una posición esquemática para el mapa
// (mapX: oeste→este, mapY: norte→sur). No es geografía exacta.
export const ZONAS: Zona[] = [
  { id: "norte", nombre: "Norte GBA", short: "NOR", piloto: true, competenciaActiva: true, mapX: 70, mapY: 40 },
  { id: "oeste", nombre: "Oeste GBA", short: "OES", piloto: false, competenciaActiva: true, mapX: 60, mapY: 54 },
  { id: "sur", nombre: "Sur GBA", short: "SUR", piloto: false, competenciaActiva: true, mapX: 72, mapY: 61 },
  { id: "caba", nombre: "CABA Centro", short: "CABA", piloto: false, competenciaActiva: true, mapX: 73, mapY: 49 },
  { id: "la-plata", nombre: "La Plata", short: "LP", piloto: false, competenciaActiva: false, mapX: 80, mapY: 66 },
  { id: "litoral", nombre: "Litoral", short: "LIT", piloto: true, competenciaActiva: false, mapX: 55, mapY: 27 },
  { id: "cordoba-cap", nombre: "Córdoba Capital", short: "CBA", piloto: false, competenciaActiva: false, mapX: 40, mapY: 42 },
  { id: "cordoba-int", nombre: "Córdoba Interior", short: "CBI", piloto: false, competenciaActiva: false, mapX: 28, mapY: 40 },
  { id: "cuyo", nombre: "Cuyo", short: "CUY", piloto: false, competenciaActiva: false, mapX: 13, mapY: 47 },
  { id: "rosario", nombre: "Rosario", short: "ROS", piloto: false, competenciaActiva: true, mapX: 51, mapY: 50 },
  { id: "mardel", nombre: "Mar del Plata", short: "MDP", piloto: false, competenciaActiva: false, mapX: 76, mapY: 78 },
  { id: "noa", nombre: "Noroeste (NOA)", short: "NOA", piloto: false, competenciaActiva: false, mapX: 22, mapY: 13 },
  { id: "nea", nombre: "Nordeste (NEA)", short: "NEA", piloto: false, competenciaActiva: false, mapX: 61, mapY: 12 },
  { id: "patagonia", nombre: "Patagonia Norte", short: "PAT", piloto: false, competenciaActiva: false, mapX: 40, mapY: 87 },
];

const PRECIO_EQUIPO = 500; // USD / año por heladera (supuesto, a validar con Finanzas)

// ----------------------------------------------------------------------------
// Los 4 comercios del documento, cableados punta a punta.
// ----------------------------------------------------------------------------

const HEROES: Comercio[] = [
  {
    id: "don-tito",
    codigo: "NOR-013-0421",
    nombre: "Almacén Don Tito",
    zonaId: "norte",
    canal: "almacen",
    tamano: "chico",
    puertas: 2,
    competenciaActiva: false,
    confianza: "alta",
    compraVsParecidos: 0.4,
    inversiones: [
      {
        linea: "frio",
        periodo: "2026",
        montoActual: 1000,
        montoPropuesto: 500,
        accion: "mover",
        motivo:
          "Compra 40% de lo que compran sus parecidos. La foto la muestra llena de producto Pampa en 2 visitas: hay equipo, no demanda.",
        justificado: true,
        confianza: "alta",
      },
      {
        linea: "descuentos",
        periodo: "2026",
        montoActual: 800,
        montoPropuesto: 800,
        accion: "condicionar",
        motivo:
          "Tuvo descuento todo el ciclo y no compró más que sus parecidos. Se mantiene atado a un objetivo de compra.",
        justificado: true,
        confianza: "media",
      },
    ],
  },
  {
    id: "la-esquina",
    codigo: "NOR-013-0588",
    nombre: "Kiosco La Esquina",
    zonaId: "norte",
    canal: "kiosco",
    tamano: "chico",
    puertas: 0,
    competenciaActiva: false,
    confianza: "alta",
    compraVsParecidos: 1.8,
    inversiones: [
      {
        linea: "frio",
        periodo: "2026",
        montoActual: 0,
        montoPropuesto: 500,
        accion: "sumar",
        motivo:
          "Compra 80% más que sus parecidos y no tiene heladera. Recibe la heladera liberada de Almacén Don Tito: suma sin compra nueva.",
        justificado: true,
        confianza: "alta",
      },
    ],
  },
  {
    id: "el-sol",
    codigo: "NOR-013-0092",
    nombre: "Autoservicio El Sol",
    zonaId: "norte",
    canal: "autoservicio",
    tamano: "mediano",
    puertas: 3,
    competenciaActiva: false,
    confianza: "alta",
    compraVsParecidos: 0.55,
    inversiones: [
      {
        linea: "frio",
        periodo: "2026",
        montoActual: 1500,
        montoPropuesto: 1500,
        accion: "corregir",
        motivo:
          "Compra 55% de sus parecidos. La foto muestra producto de otra marca ocupando el espacio frío. Se recupera el espacio, sin gastar.",
        justificado: true,
        confianza: "alta",
      },
      {
        linea: "acuerdos",
        periodo: "2026",
        montoActual: 3600,
        montoPropuesto: 3600,
        accion: "corregir",
        motivo:
          "Acuerdo de 2 cabeceras y 50% del espacio de gaseosas. La foto muestra 1 cabecera y 30%. Se reclama lo pactado.",
        justificado: true,
        confianza: "alta",
      },
    ],
  },
  {
    id: "sosa",
    codigo: "NOR-013-0310",
    nombre: "Almacén Sosa",
    zonaId: "norte",
    canal: "almacen",
    tamano: "chico",
    puertas: 1,
    competenciaActiva: false,
    confianza: "baja",
    compraVsParecidos: 0.92,
    inversiones: [
      {
        linea: "frio",
        periodo: "2026",
        montoActual: 500,
        montoPropuesto: 500,
        accion: "mantener",
        motivo: null,
        justificado: false,
        confianza: "baja",
      },
    ],
  },
];

export const FOTOS: Foto[] = [
  {
    id: "foto-don-tito",
    comercioId: "don-tito",
    estadoHeladera: "llena_pampa",
    fecha: "2026-10-14",
    visita: 2,
    lectura: [
      { label: "Qué tan llena", valor: "Llena (90%)", confianza: "alta" },
      { label: "Marca que predomina", valor: "Pampa", confianza: "alta" },
      { label: "¿Funciona?", valor: "Sí, enciende y enfría", confianza: "alta" },
      { label: "Reposición entre visitas", valor: "Baja", confianza: "media" },
    ],
  },
  {
    id: "foto-el-sol",
    comercioId: "el-sol",
    estadoHeladera: "otra_marca",
    fecha: "2026-10-12",
    visita: 1,
    lectura: [
      { label: "Qué tan llena", valor: "Llena (80%)", confianza: "alta" },
      { label: "Marca que predomina", valor: "Mixta: 40% otra marca", confianza: "media" },
      { label: "Cabeceras Pampa", valor: "1 de 2 pactadas", confianza: "alta" },
      { label: "Espacio de gaseosas", valor: "30% (pactado 50%)", confianza: "media" },
    ],
    acuerdo: [
      { pactado: "2 cabeceras", foto: "1 cabecera", cumple: false },
      { pactado: "50% del espacio de gaseosas", foto: "30%", cumple: false },
      { pactado: "Material en la vidriera", foto: "Está", cumple: true },
    ],
  },
  {
    id: "foto-sosa",
    comercioId: "sosa",
    estadoHeladera: "vacia",
    fecha: "2026-10-15",
    visita: 1,
    lectura: [
      { label: "Qué tan llena", valor: "Dudosa: foto movida", confianza: "baja" },
      { label: "Marca que predomina", valor: "No se distingue", confianza: "baja" },
      { label: "¿Funciona?", valor: "No se ve", confianza: "baja" },
    ],
  },
];

// ----------------------------------------------------------------------------
// Relleno determinístico: comercios de las 14 zonas para dar cuerpo a la tabla.
// ----------------------------------------------------------------------------

function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const NOMBRES_POR_CANAL: Record<Canal, string[]> = {
  almacen: [
    "Almacén La Providencia",
    "Almacén Rivas",
    "Almacén Doña Nelly",
    "Almacén El Progreso",
    "Despensa San Cayetano",
    "Almacén Los Hermanos",
  ],
  kiosco: [
    "Kiosco Mitre",
    "Kiosco 24 Horas",
    "Kiosco La Parada",
    "Maxikiosco Belgrano",
    "Kiosco El Túnel",
    "Kiosco Las Vías",
  ],
  autoservicio: [
    "Autoservicio La Famiglia",
    "Super Las Américas",
    "Autoservicio Don Pedro",
    "Mercadito Sur",
    "Autoservicio El Trébol",
  ],
  gastronomia: [
    "Bar El Fondín",
    "Pizzería Nápoles",
    "Café de la Plaza",
    "Rotisería El Buen Sabor",
  ],
};

const CANALES: Canal[] = ["almacen", "kiosco", "autoservicio", "gastronomia"];
const TAMANOS: Tamano[] = ["chico", "mediano", "grande"];

function generados(): Comercio[] {
  const rnd = mulberry32(42);
  const pick = <T,>(arr: T[]) => arr[Math.floor(rnd() * arr.length)];
  const out: Comercio[] = [];
  const usados = new Set<string>();

  // Reparto por zona (norte suma además los 4 comercios cableados a mano).
  const plan: Array<[string, number]> = [
    ["norte", 6],
    ["oeste", 7],
    ["sur", 6],
    ["caba", 8],
    ["la-plata", 5],
    ["litoral", 7],
    ["cordoba-cap", 7],
    ["cordoba-int", 5],
    ["cuyo", 5],
    ["rosario", 7],
    ["mardel", 5],
    ["noa", 5],
    ["nea", 5],
    ["patagonia", 4],
  ];

  let n = 1;
  for (const [zonaId, cantidad] of plan) {
    const zona = ZONAS.find((z) => z.id === zonaId)!;
    for (let i = 0; i < cantidad; i++) {
      const canal = pick(CANALES);
      const nombresDisp = NOMBRES_POR_CANAL[canal].filter((x) => !usados.has(x));
      const nombre =
        nombresDisp.length > 0
          ? pick(nombresDisp)
          : `${pick(NOMBRES_POR_CANAL[canal])} ${n}`;
      usados.add(nombre);

      const tamano = pick(TAMANOS);
      const puertasBase = tamano === "chico" ? 1 : tamano === "mediano" ? 2 : 4;
      // ~1 de cada 6 sin heladera
      const sinHeladera = rnd() < 0.16;
      const puertas = sinHeladera ? 0 : puertasBase;

      // Distribución de compra vs parecidos: la mayoría cerca de 1, colas a los lados.
      const r = rnd();
      let ratio: number;
      if (r < 0.2) ratio = 0.3 + rnd() * 0.25; // bajo retorno
      else if (r < 0.35) ratio = 1.4 + rnd() * 0.7; // compra mucho
      else ratio = 0.75 + rnd() * 0.4; // normal

      const competenciaActiva = zona.competenciaActiva && rnd() < 0.4;
      const confianza = rnd() < 0.78 ? "alta" : rnd() < 0.6 ? "media" : "baja";

      out.push({
        id: `cm-${String(n).padStart(3, "0")}`,
        codigo: `${zonaId.slice(0, 3).toUpperCase()}-${String(
          10 + Math.floor(rnd() * 80)
        )}-${String(Math.floor(rnd() * 9000) + 1000)}`,
        nombre,
        zonaId,
        canal,
        tamano,
        puertas,
        competenciaActiva,
        confianza,
        compraVsParecidos: Math.round(ratio * 100) / 100,
        inversiones: inversionesPara(puertas, ratio, confianza, rnd),
      });
      n++;
    }
  }
  return out;
}

function inversionesPara(
  puertas: number,
  ratio: number,
  confianza: Comercio["confianza"],
  rnd: () => number
): Inversion[] {
  const inv: Inversion[] = [];

  // Frío
  if (puertas > 0) {
    const montoActual = puertas * PRECIO_EQUIPO;
    if (confianza === "baja") {
      inv.push(frio(montoActual, montoActual, "mantener", null, false, "baja"));
    } else if (ratio < 0.5) {
      inv.push(
        frio(
          montoActual,
          Math.max(0, montoActual - PRECIO_EQUIPO),
          "mover",
          "Compra muy por debajo de sus parecidos y la heladera no está aprovechada.",
          true,
          confianza
        )
      );
    } else if (ratio < 0.85) {
      inv.push(
        frio(
          montoActual,
          montoActual,
          "corregir",
          "Rinde por debajo de sus parecidos: se revisa ejecución en el comercio, sin gastar.",
          true,
          confianza
        )
      );
    } else {
      inv.push(frio(montoActual, montoActual, "mantener", "Rinde en línea con sus parecidos.", true, confianza));
    }
  } else if (ratio > 1.5) {
    inv.push(
      frio(
        0,
        PRECIO_EQUIPO,
        "sumar",
        "Compra bastante más que sus parecidos y no tiene heladera.",
        true,
        confianza
      )
    );
  }

  // Descuentos (algunos)
  if (rnd() < 0.4) {
    const m = 500 + Math.floor(rnd() * 3500);
    const movio = ratio > 1.0;
    inv.push({
      linea: "descuentos",
      periodo: "2026",
      montoActual: m,
      montoPropuesto: m,
      accion: movio ? "renovar" : "condicionar",
      motivo: movio
        ? "Movió volumen durante la vigencia del descuento."
        : "No compró más que sus parecidos con el descuento activo.",
      justificado: true,
      confianza: confianza === "baja" ? "baja" : "media",
    });
  }

  // Acuerdos (algunos)
  if (rnd() < 0.3) {
    const m = 2000 + Math.floor(rnd() * 4000);
    const cumple = rnd() < 0.6;
    inv.push({
      linea: "acuerdos",
      periodo: "2026",
      montoActual: m,
      montoPropuesto: m,
      accion: cumple ? "renovar" : "corregir",
      motivo: cumple
        ? "Cumple lo pactado según la última foto."
        : "La foto muestra menos espacio que lo pactado.",
      justificado: true,
      confianza: "media",
    });
  }

  // Exhibición (por zona en este ciclo; aquí se asigna al comercio para la demo)
  if (rnd() < 0.5) {
    const m = 1500 + Math.floor(rnd() * 3500);
    inv.push({
      linea: "exhibicion",
      periodo: "2026",
      montoActual: m,
      montoPropuesto: m,
      accion: "mantener",
      motivo: ratio > 1.1 ? "Reparto en línea con lo que compra." : null,
      justificado: ratio > 1.1,
      confianza: "media",
    });
  }

  return inv;
}

function frio(
  montoActual: number,
  montoPropuesto: number,
  accion: Inversion["accion"],
  motivo: string | null,
  justificado: boolean,
  confianza: Inversion["confianza"]
): Inversion {
  return { linea: "frio", periodo: "2026", montoActual, montoPropuesto, accion, motivo, justificado, confianza };
}

export const COMERCIOS: Comercio[] = [...HEROES, ...generados()];

export function getComercio(id: string): Comercio | undefined {
  return COMERCIOS.find((c) => c.id === id);
}

export function getFotoByComercio(comercioId: string): Foto | undefined {
  return FOTOS.find((f) => f.comercioId === comercioId);
}

export function getZona(id: string): Zona | undefined {
  return ZONAS.find((z) => z.id === id);
}
