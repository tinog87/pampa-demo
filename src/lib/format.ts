import type {
  Accion,
  Confianza,
  EstadoDecision,
  EstadoMonto,
  Linea,
  Rol,
  Tamano,
  Tipo,
} from "./types";

export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

const NBSP = " ";

// Montos en una sola línea: espacio duro entre USD y el número.
export function usd(n: number): string {
  const s = Math.round(n).toLocaleString("es-AR");
  return `${n < 0 ? "−" : ""}USD${NBSP}${s.replace("-", "")}`;
}

export const usdFull = usd;

export function millones(n: number): string {
  return `USD${NBSP}${(n / 1_000_000).toLocaleString("es-AR", {
    maximumFractionDigits: 1,
  })}${NBSP}M`;
}

export function pct(n: number): string {
  return `${Math.round(n * 100)}%`;
}

export function compraTexto(ratio: number): string {
  if (ratio >= 1.15) return `compra ${Math.round((ratio - 1) * 100)}% más`;
  if (ratio <= 0.85) return `compra ${Math.round(ratio * 100)}% de sus parecidos`;
  return "compra como sus parecidos";
}

export const LINEA_LABEL: Record<Linea, string> = {
  frio: "Frío",
  descuentos: "Descuentos",
  acuerdos: "Acuerdos",
  exhibicion: "Exhibición y material",
};

export const LINEA_ORDER: Linea[] = ["frio", "descuentos", "acuerdos", "exhibicion"];

export const TIPO_LABEL: Record<Tipo, string> = {
  almacen: "Almacén",
  kiosco: "Kiosco",
  autoservicio: "Autoservicio",
  gastronomia: "Gastronomía",
};

export const TAMANO_LABEL: Record<Tamano, string> = {
  chico: "chico",
  mediano: "mediano",
  grande: "grande",
};

export const ACCION_LABEL: Record<Accion, string> = {
  mantener: "Mantener",
  corregir: "Corregir",
  mover: "Mover",
  sumar: "Sumar",
  derivar: "Derivar a Trade",
  renovar: "Renovar",
  ajustar: "Ajustar",
  condicionar: "Condicionar",
  cortar: "Cortar",
};

export const ESTADO_LABEL: Record<EstadoDecision, string> = {
  propuesta: "Propuesta",
  esperando: "Pendiente de aprobación",
  aprobada: "Aprobada",
  en_ejecucion: "En ejecución",
  ejecutada: "Ejecutada",
  medida: "Medida",
  devuelta: "Devuelta",
  rechazada: "Rechazada",
  proximo_ciclo: "Para el próximo período",
  pide_foto: "Pide foto",
  a_validar: "A validar",
};

export const ESTADO_MONTO_LABEL: Record<EstadoMonto, string> = {
  justificado: "Justificado",
  pendiente: "Pendiente de aprobación",
  a_validar: "A validar",
  sin_justificar: "Sin justificar",
};

export const ROL_LABEL: Record<Rol, string> = {
  preventista: "Preventista",
  supervisor: "Supervisor",
  gerente: "Gerente de zona",
  trade: "Trade",
  finanzas: "Finanzas",
  direccion: "Dirección Comercial",
};

export const CONFIANZA_LABEL: Record<Confianza, string> = {
  alta: "segura",
  media: "dudosa",
  baja: "muy dudosa",
};

export type Tono = "ok" | "warn" | "bad" | "neutro" | "ink";

export function estadoTono(e: EstadoDecision): Tono {
  switch (e) {
    case "aprobada":
    case "ejecutada":
    case "medida":
      return "ok";
    case "esperando":
    case "propuesta":
    case "en_ejecucion":
    case "proximo_ciclo":
      return "warn";
    case "rechazada":
    case "devuelta":
    case "pide_foto":
      return "bad";
    case "a_validar":
      return "warn";
    default:
      return "neutro";
  }
}

export function estadoMontoTono(e: EstadoMonto): Tono {
  switch (e) {
    case "justificado":
      return "ok";
    case "pendiente":
      return "warn";
    case "a_validar":
      return "warn";
    case "sin_justificar":
      return "bad";
  }
}

export function confianzaTono(c: Confianza): Tono {
  return c === "alta" ? "ok" : c === "media" ? "warn" : "bad";
}

export function rolTieneZona(rol: Rol): boolean {
  return rol === "gerente" || rol === "supervisor" || rol === "preventista";
}
