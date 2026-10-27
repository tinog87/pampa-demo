import type {
  AcuerdoLinea,
  Comercio,
  EstadoHeladera,
  FotoFrio,
  Inversion,
  LecturaCampo,
  Tamano,
  Tipo,
  Zona,
} from "../types";

export const ZONAS: Zona[] = [
  { id: "norte", nombre: "Norte GBA", short: "NOR", piloto: true, competenciaActiva: true },
  { id: "litoral", nombre: "Litoral", short: "LIT", piloto: true, competenciaActiva: false },
  { id: "oeste", nombre: "Oeste GBA", short: "OES", piloto: false, competenciaActiva: true },
  { id: "sur", nombre: "Sur GBA", short: "SUR", piloto: false, competenciaActiva: true },
  { id: "caba", nombre: "CABA Centro", short: "CABA", piloto: false, competenciaActiva: true },
  { id: "la-plata", nombre: "La Plata", short: "LP", piloto: false, competenciaActiva: false },
  { id: "cordoba-cap", nombre: "Córdoba Capital", short: "CBA", piloto: false, competenciaActiva: false },
  { id: "cordoba-int", nombre: "Córdoba Interior", short: "CBI", piloto: false, competenciaActiva: false },
  { id: "cuyo", nombre: "Cuyo", short: "CUY", piloto: true, competenciaActiva: false },
  { id: "rosario", nombre: "Rosario", short: "ROS", piloto: false, competenciaActiva: true },
  { id: "mardel", nombre: "Mar del Plata", short: "MDP", piloto: false, competenciaActiva: false },
  { id: "noa", nombre: "Noroeste (NOA)", short: "NOA", piloto: false, competenciaActiva: false },
  { id: "nea", nombre: "Nordeste (NEA)", short: "NEA", piloto: false, competenciaActiva: false },
  { id: "patagonia", nombre: "Patagonia Norte", short: "PAT", piloto: false, competenciaActiva: false },
];

const PRECIO_EQUIPO = 500; // USD/año por heladera (estimado, a validar con Finanzas)

const BARRIOS: Record<string, string[]> = {
  norte: ["Vicente López", "San Isidro", "Olivos", "Martínez", "Florida", "Munro", "Boulogne"],
  litoral: ["Paraná", "Santa Fe", "Rafaela", "Esperanza", "Sunchales"],
  oeste: ["Morón", "Ramos Mejía", "Haedo", "Castelar", "Ituzaingó", "Merlo"],
  sur: ["Avellaneda", "Lanús", "Lomas", "Quilmes", "Banfield", "Berazategui"],
  caba: ["Palermo", "Caballito", "Flores", "Belgrano", "Boedo", "Villa Urquiza", "Almagro"],
  "la-plata": ["Casco Urbano", "Los Hornos", "Tolosa", "City Bell", "Gonnet"],
  "cordoba-cap": ["Nueva Córdoba", "Alberdi", "Cerro", "General Paz", "Alta Córdoba"],
  "cordoba-int": ["Río Cuarto", "Villa María", "San Francisco", "Carlos Paz"],
  cuyo: ["Godoy Cruz", "Guaymallén", "Las Heras", "San Rafael", "Maipú"],
  rosario: ["Centro", "Fisherton", "Echesortu", "Pichincha", "La Florida"],
  mardel: ["Centro", "La Perla", "Güemes", "Constitución", "Puerto"],
  noa: ["San Miguel", "Yerba Buena", "Salta Centro", "San Salvador"],
  nea: ["Resistencia", "Corrientes", "Posadas", "Formosa"],
  patagonia: ["Neuquén", "Cipolletti", "Roca", "Bariloche"],
};

// ----------------------------------------------------------------------------
// Los 6 comercios de ejemplo (Norte GBA), exactamente como el spec.
// ----------------------------------------------------------------------------

const HEROES: Comercio[] = [
  {
    id: "don-tito",
    codigo: "NOR-013-0421",
    nombre: "Almacén Don Tito",
    barrio: "Florida",
    zonaId: "norte",
    tipo: "almacen",
    tamano: "mediano",
    puertas: 2,
    competenciaActiva: false,
    confianza: "alta",
    compraVsParecidos: 0.4,
    fotoFrio: {
      estado: "llena_pampa",
      visitas: 2,
      confianza: "alta",
      lectura: [
        { label: "Qué tan llena", valor: "Llena (90%)", confianza: "alta" },
        { label: "Marca que predomina", valor: "Pampa", confianza: "alta" },
        { label: "Reposición entre visitas", valor: "Casi nula", confianza: "alta" },
      ],
    },
    inversiones: [
      {
        linea: "frio",
        montoActual: 1000,
        montoPropuesto: 500,
        accion: "mover",
        motivo:
          "Compra 40% de lo que compran sus parecidos. La foto la muestra llena de producto Pampa en 2 visitas: hay equipo, no demanda.",
        estadoMonto: "pendiente",
        confianza: "alta",
      },
    ],
  },
  {
    id: "la-esquina",
    codigo: "NOR-013-0588",
    nombre: "Kiosco La Esquina",
    barrio: "Olivos",
    zonaId: "norte",
    tipo: "kiosco",
    tamano: "chico",
    puertas: 0,
    competenciaActiva: false,
    confianza: "alta",
    compraVsParecidos: 1.8,
    inversiones: [
      {
        linea: "frio",
        montoActual: 0,
        montoPropuesto: 500,
        accion: "sumar",
        motivo:
          "Compra 80% más que sus parecidos y no tiene heladera. Recibe la heladera liberada de Almacén Don Tito: suma sin compra nueva.",
        estadoMonto: "pendiente",
        confianza: "alta",
      },
    ],
  },
  {
    id: "el-sol",
    codigo: "NOR-013-0092",
    nombre: "Autoservicio El Sol",
    barrio: "San Isidro",
    zonaId: "norte",
    tipo: "autoservicio",
    tamano: "grande",
    puertas: 3,
    competenciaActiva: false,
    confianza: "alta",
    compraVsParecidos: 0.95,
    acuerdo: [
      { pactado: "2 cabeceras", foto: "1 cabecera (otra marca)", cumple: false },
      { pactado: "50% del espacio de gaseosas", foto: "30%", cumple: false },
      { pactado: "Material en la vidriera", foto: "Está", cumple: true },
    ],
    inversiones: [
      {
        linea: "acuerdos",
        montoActual: 3600,
        montoPropuesto: 3600,
        accion: "corregir",
        motivo:
          "Acuerdo de 2 cabeceras y 50% del espacio. La foto muestra 1 cabecera, ocupada por otra marca, y 30%. Se reclama lo pactado.",
        estadoMonto: "pendiente",
        confianza: "alta",
      },
    ],
  },
  {
    id: "sosa",
    codigo: "NOR-013-0310",
    nombre: "Almacén Sosa",
    barrio: "Martínez",
    zonaId: "norte",
    tipo: "almacen",
    tamano: "chico",
    puertas: 1,
    competenciaActiva: false,
    confianza: "baja",
    compraVsParecidos: 0.08,
    fotoFrio: {
      estado: "sin_heladera",
      visitas: 1,
      confianza: "baja",
      lectura: [
        { label: "Heladera en la foto", valor: "No se ve", confianza: "baja" },
        { label: "Registro", valor: "1 heladera (dudoso)", confianza: "baja" },
      ],
    },
    inversiones: [
      {
        linea: "frio",
        montoActual: 500,
        montoPropuesto: 500,
        accion: "mantener",
        motivo: null,
        estadoMonto: "a_validar",
        confianza: "baja",
      },
    ],
  },
  {
    id: "kiosco-mitre",
    codigo: "NOR-013-0733",
    nombre: "Kiosco Mitre",
    barrio: "Vicente López",
    zonaId: "norte",
    tipo: "kiosco",
    tamano: "mediano",
    puertas: 0,
    competenciaActiva: false,
    confianza: "alta",
    compraVsParecidos: 2.0,
    inversiones: [
      {
        linea: "frio",
        montoActual: 0,
        montoPropuesto: 1100,
        accion: "sumar",
        motivo:
          "Compra el doble que sus parecidos y no tiene heladera. No hay equipo liberado cerca: va heladera nueva. Inversión nueva justificada por los datos.",
        estadoMonto: "pendiente",
        confianza: "alta",
        estimado: true,
      },
    ],
  },
  {
    id: "rivas",
    codigo: "NOR-013-0145",
    nombre: "Almacén Rivas",
    barrio: "Boulogne",
    zonaId: "norte",
    tipo: "almacen",
    tamano: "mediano",
    puertas: 2,
    competenciaActiva: false,
    confianza: "alta",
    compraVsParecidos: 1.1,
    inversiones: [
      {
        linea: "descuentos",
        montoActual: 0,
        montoPropuesto: 1500,
        accion: "condicionar",
        motivo:
          "Tiene heladera en buen estado y compra bien, pero poco frío. El gerente propone una promoción para activar el frío.",
        condicion: "se mantiene si compra 15% más de frío en 3 meses",
        estadoMonto: "pendiente",
        confianza: "media",
      },
    ],
  },
];

// ----------------------------------------------------------------------------
// Muestra: ~2.000 comercios repartidos en las 14 zonas.
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

// Nombres por combinación prefijo × núcleo: da pools grandes y naturales, suficientes
// para que cada zona tenga nombres distintos sin recurrir a sufijos numéricos.
function combinarNombres(prefijos: string[], nucleos: string[]): string[] {
  const out: string[] = [];
  for (const nuc of nucleos) for (const pre of prefijos) out.push(`${pre} ${nuc}`);
  return out;
}

const NOMBRES: Record<Tipo, string[]> = {
  almacen: combinarNombres(
    ["Almacén", "Despensa", "Provisión"],
    ["La Providencia", "Doña Nelly", "El Progreso", "San Cayetano", "Los Hermanos", "La Esperanza", "El Rincón", "San José", "El Ancla", "Las Violetas", "Don Aníbal", "La Favorita", "Primavera", "El Molino", "Doña Rosa", "Don Carlos", "La Unión", "Santa Rita", "El Trigal", "La Loma", "San Roque", "El Candil", "Los Álamos", "La Estación", "El Fortín", "La Delicia", "San Pedro", "La Bahía", "El Ombú", "La Criolla"]
  ),
  kiosco: combinarNombres(
    ["Kiosco", "Maxikiosco"],
    ["La Parada", "Belgrano", "El Túnel", "Las Vías", "24 Horas", "La Central", "El Faro", "El Puente", "Estación", "San Martín", "La Rambla", "El Cruce", "Primera Junta", "El Recreo", "La Terminal", "La Plaza", "Don Lucho", "La Amistad", "El Nono", "San Juan", "La Vía", "El Pasaje", "Las Heras", "Rivadavia", "El Obelisco", "La Quintana", "Alberdi", "El Tranvía", "La Curva", "El Semáforo", "San Lorenzo", "La Posta", "El Alto", "La Movida", "El Quincho", "La Redonda"]
  ),
  autoservicio: combinarNombres(
    ["Autoservicio", "Super", "Mercadito", "Minimercado"],
    ["La Famiglia", "Las Américas", "Don Pedro", "del Sur", "El Trébol", "La Estrella", "Riachuelo", "El Nene", "La Loma", "Dos Hermanos", "La Economía", "El Ahorro", "San Blas", "La Ribera"]
  ),
  gastronomia: combinarNombres(
    ["Bar", "Café", "Rotisería", "Pizzería", "Parrilla"],
    ["El Fogón", "La Rueda", "Don Rufino", "El Tano", "San Telmo", "El Andén", "Lo de Beto", "El Recreo"]
  ),
};

const TIPOS: Tipo[] = ["almacen", "kiosco", "autoservicio", "gastronomia"];
const TAMANOS: Tamano[] = ["chico", "mediano", "grande"];

function lecturaFrio(estado: EstadoHeladera, conf: "alta" | "media" | "baja"): LecturaCampo[] {
  switch (estado) {
    case "llena_pampa":
      return [
        { label: "Qué tan llena", valor: "Llena (85%)", confianza: conf },
        { label: "Marca que predomina", valor: "Pampa", confianza: conf },
      ];
    case "vacia":
      return [
        { label: "Qué tan llena", valor: "Vacía (20%)", confianza: conf },
        { label: "Faltantes", valor: "Sí, hay demanda sin cubrir", confianza: conf },
      ];
    case "otra_marca":
      return [
        { label: "Qué tan llena", valor: "Llena (80%)", confianza: conf },
        { label: "Marca que predomina", valor: "Otra marca (40%)", confianza: conf },
      ];
    case "rota":
      return [{ label: "Estado", valor: "No enfría / apagada", confianza: conf }];
    default:
      return [{ label: "Heladera en la foto", valor: "No se ve", confianza: "baja" }];
  }
}

function generados(): Comercio[] {
  const rnd = mulberry32(2026);
  const pick = <T,>(arr: T[]): T => arr[Math.floor(rnd() * arr.length)];
  const out: Comercio[] = [];

  const TOTAL_GEN = 1994;
  const base = Math.floor(TOTAL_GEN / ZONAS.length);
  const resto = TOTAL_GEN - base * ZONAS.length;

  let n = 1;
  ZONAS.forEach((zona, zi) => {
    const cantidad = base + (zi < resto ? 1 : 0);
    const barrios = BARRIOS[zona.id] ?? ["Centro"];
    // Un nombre no se repite dentro de la zona: si el elegido ya está, se toma otro
    // del pool (nunca un sufijo numérico). Los pools son grandes para que siempre alcance.
    const usadosZona = new Set<string>();
    const nombreDeZona = (tipo: Tipo): string => {
      const pool = NOMBRES[tipo];
      let idx = Math.floor(rnd() * pool.length);
      let intentos = 0;
      while (usadosZona.has(pool[idx]) && intentos < pool.length) {
        idx = (idx + 1) % pool.length;
        intentos++;
      }
      usadosZona.add(pool[idx]);
      return pool[idx];
    };

    for (let i = 0; i < cantidad; i++) {
      const tipo = weighted(rnd, TIPOS, [0.4, 0.3, 0.2, 0.1]);
      const tamano = weighted(rnd, TAMANOS, [0.55, 0.3, 0.15]);
      const puertasBase = tamano === "chico" ? 1 : tamano === "mediano" ? 2 : 4;
      const sinHeladera = rnd() < 0.16;
      const puertas = sinHeladera ? 0 : puertasBase;

      const r = rnd();
      let ratio: number;
      if (r < 0.2) ratio = 0.3 + rnd() * 0.25;
      else if (r < 0.35) ratio = 1.4 + rnd() * 0.7;
      else ratio = 0.75 + rnd() * 0.4;
      ratio = Math.round(ratio * 100) / 100;

      const competenciaActiva = zona.competenciaActiva && rnd() < 0.35;
      const confRnd = rnd();
      const confianza = confRnd < 0.78 ? "alta" : confRnd < 0.93 ? "media" : "baja";

      const barrio = pick(barrios);
      const nombre = nombreDeZona(tipo);

      const built = construirInversiones(zona.piloto, puertas, ratio, confianza, competenciaActiva, rnd);

      out.push({
        id: `cm-${String(n).padStart(4, "0")}`,
        codigo: `${zona.short}-${String(10 + Math.floor(rnd() * 80))}-${String(Math.floor(rnd() * 9000) + 1000)}`,
        nombre,
        barrio,
        zonaId: zona.id,
        tipo,
        tamano,
        puertas,
        competenciaActiva,
        confianza,
        compraVsParecidos: ratio,
        inversiones: built.inversiones,
        fotoFrio: built.fotoFrio,
        acuerdo: built.acuerdo,
      });
      n++;
    }
  });
  return out;
}

function weighted<T>(rnd: () => number, items: T[], weights: number[]): T {
  const r = rnd();
  let acc = 0;
  for (let i = 0; i < items.length; i++) {
    acc += weights[i];
    if (r < acc) return items[i];
  }
  return items[items.length - 1];
}

function construirInversiones(
  piloto: boolean,
  puertas: number,
  ratio: number,
  confianza: "alta" | "media" | "baja",
  competenciaActiva: boolean,
  rnd: () => number
): { inversiones: Inversion[]; fotoFrio?: FotoFrio; acuerdo?: AcuerdoLinea[] } {
  const inv: Inversion[] = [];
  let fotoFrio: FotoFrio | undefined;
  let acuerdo: AcuerdoLinea[] | undefined;

  // --- Frío ---
  if (puertas > 0) {
    const montoActual = puertas * PRECIO_EQUIPO;
    if (confianza === "baja" && ratio < 0.25) {
      // Registro dudoso: compra casi nula pero figura heladera y la foto no la muestra.
      // No se propone nada: una persona valida el registro primero.
      fotoFrio = { estado: "sin_heladera", visitas: 1, confianza: "baja", lectura: lecturaFrio("sin_heladera", "baja") };
      inv.push(frio(montoActual, montoActual, "mantener", null, "a_validar", "baja"));
    } else if (confianza === "baja") {
      // Dato de compra poco confiable, pero no hay contradicción con la foto: se valida el dato.
      inv.push(frio(montoActual, montoActual, "mantener", null, "a_validar", "baja"));
    } else if (ratio < 0.85) {
      // Candidato de frío. Las compras marcan, la foto confirma o despeja.
      const tieneFoto = rnd() < 0.72;
      if (!tieneFoto) {
        // Sin foto: no se propone acción. Pide foto.
        inv.push(frio(montoActual, montoActual, "corregir", "Compra por debajo de sus parecidos. Falta la foto para decidir qué hacer.", "pendiente", confianza));
      } else {
        let estado: EstadoHeladera;
        if (ratio < 0.5) estado = rnd() < 0.7 ? "llena_pampa" : (rnd() < 0.5 ? "otra_marca" : "rota");
        else estado = weighted(rnd, ["vacia", "otra_marca", "rota", "llena_pampa"] as EstadoHeladera[], [0.4, 0.3, 0.2, 0.1]);
        fotoFrio = { estado, visitas: estado === "llena_pampa" ? 2 : 1, confianza, lectura: lecturaFrio(estado, confianza) };
        if (estado === "llena_pampa" && ratio < 0.5) {
          inv.push(frio(montoActual, Math.max(0, montoActual - PRECIO_EQUIPO), "mover", "Compra muy por debajo de sus parecidos y la heladera está llena de Pampa en 2 visitas: hay equipo, no demanda.", "pendiente", confianza));
        } else if (estado === "llena_pampa") {
          // Compra algo por debajo, pero la foto la muestra llena de Pampa y por encima del
          // umbral de mover: está sana. La foto despeja, no se toca.
          inv.push(frio(montoActual, montoActual, "mantener", "Compra algo por debajo de sus parecidos, pero la foto la muestra llena de Pampa: está sana, no se toca.", "justificado", confianza));
        } else {
          const motivo =
            estado === "vacia"
              ? "Vacía: hay demanda sin cubrir. Se ajusta el pedido."
              : estado === "otra_marca"
                ? "La demanda la aprovecha otra marca. Se recupera el espacio."
                : "Heladera rota o apagada: no puede despachar. Va técnico.";
          inv.push(frio(montoActual, montoActual, "corregir", motivo, "pendiente", confianza));
        }
      }
    } else {
      inv.push(frio(montoActual, montoActual, "mantener", "Compra en línea con sus parecidos.", "justificado", confianza));
    }
  } else if (ratio > 1.5) {
    // Sin heladera y compra mucho: candidato a sumar.
    inv.push(frio(0, PRECIO_EQUIPO, "sumar", "Compra bastante más que sus parecidos y no tiene heladera. Recibe un equipo liberado.", "pendiente", confianza));
  }

  // --- Descuentos (la regla está ACTIVA: propone sobre evidencia de compra) ---
  if (rnd() < 0.3) {
    const m = 300 + Math.floor(rnd() * 1400);
    if (ratio > 1.0) {
      // Movió compra durante la vigencia: el descuento rindió, se renueva.
      inv.push({ linea: "descuentos", montoActual: m, montoPropuesto: m, accion: "renovar", motivo: "Durante la vigencia compró más que sus parecidos: el descuento movió compra. Se renueva.", estadoMonto: "justificado", confianza: "media" });
    } else if (competenciaActiva) {
      // No movió compra, pero la zona tiene competencia: se condiciona en vez de cortar.
      inv.push({ linea: "descuentos", montoActual: m, montoPropuesto: m, accion: "condicionar", motivo: `No movió compra durante la vigencia (compra ${Math.round(ratio * 100)}% de sus parecidos). La zona tiene competencia activa: se condiciona en vez de cortar.`, condicion: "se mantiene si compra 10% más en 3 meses", estadoMonto: "pendiente", confianza: "media" });
    } else {
      // No movió compra y no hay competencia que cubrir: se corta y libera.
      inv.push({ linea: "descuentos", montoActual: m, montoPropuesto: 0, accion: "cortar", motivo: `No movió compra durante la vigencia (compra ${Math.round(ratio * 100)}% de sus parecidos). Sin razón para sostenerlo: se corta y se libera.`, estadoMonto: "pendiente", confianza: "media" });
    }
  }

  // --- Acuerdos (control de foto solo en piloto) ---
  if (rnd() < 0.2) {
    const m = 800 + Math.floor(rnd() * 1500);
    if (piloto) {
      const cumple = rnd() < 0.6;
      if (cumple) {
        inv.push({ linea: "acuerdos", montoActual: m, montoPropuesto: m, accion: "renovar", motivo: "Cumple lo pactado según la última foto.", estadoMonto: "justificado", confianza: "media" });
      } else {
        acuerdo = [
          { pactado: "2 cabeceras", foto: "1 cabecera", cumple: false },
          { pactado: "40% del espacio", foto: "25%", cumple: false },
        ];
        inv.push({ linea: "acuerdos", montoActual: m, montoPropuesto: m, accion: "corregir", motivo: "La foto muestra menos espacio que lo pactado. Se reclama lo acordado.", estadoMonto: "pendiente", confianza: "media" });
      }
    } else {
      // Fuera de piloto no hay foto de exhibición: si falta el contrato, va A validar.
      const sinContrato = rnd() < 0.3;
      inv.push({ linea: "acuerdos", montoActual: m, montoPropuesto: m, accion: "renovar", motivo: sinContrato ? null : "Contrato vigente; sin control de foto fuera de piloto.", estadoMonto: sinContrato ? "a_validar" : "justificado", confianza: "media" });
    }
  }

  // --- Exhibición y material (se asigna por zona según el plan, no por comercio) ---
  if (rnd() < 0.5) {
    const m = 500 + Math.floor(rnd() * 1250);
    // Por defecto queda justificado por el plan de zona. Una minoría no tiene plan
    // cargado: ahí no se puede justificar el reparto (hallazgo para Finanzas).
    const sinPlan = rnd() < 0.18;
    inv.push({ linea: "exhibicion", montoActual: m, montoPropuesto: m, accion: "mantener", motivo: sinPlan ? null : "Exhibición y material del plan de zona (se asigna por zona, no por comercio).", estadoMonto: sinPlan ? "sin_justificar" : "justificado", confianza: "media" });
  }

  return { inversiones: inv, fotoFrio, acuerdo };
}

function frio(
  montoActual: number,
  montoPropuesto: number,
  accion: Inversion["accion"],
  motivo: string | null,
  estadoMonto: Inversion["estadoMonto"],
  confianza: Inversion["confianza"]
): Inversion {
  return { linea: "frio", montoActual, montoPropuesto, accion, motivo, estadoMonto, confianza };
}

export const COMERCIOS: Comercio[] = [...HEROES, ...generados()];

const BY_ID = new Map(COMERCIOS.map((c) => [c.id, c]));

export function getComercio(id: string): Comercio | undefined {
  return BY_ID.get(id);
}

export function getZona(id: string): Zona | undefined {
  return ZONAS.find((z) => z.id === id);
}

export const TOTAL_COMERCIOS = COMERCIOS.length;
