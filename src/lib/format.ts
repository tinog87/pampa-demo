import type {
  Accion,
  Canal,
  Confianza,
  EstadoDecision,
  Linea,
  Rol,
} from "./types";

export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

export function usd(n: number): string {
  const abs = Math.abs(n);
  const s =
    abs >= 1000
      ? `${(abs / 1000).toLocaleString("es-AR", { maximumFractionDigits: 1 })} K`
      : abs.toLocaleString("es-AR");
  return `${n < 0 ? "−" : ""}USD ${s}`;
}

export function usdFull(n: number): string {
  return `USD ${n.toLocaleString("es-AR")}`;
}

export function millones(n: number): string {
  return `USD ${(n / 1_000_000).toLocaleString("es-AR", {
    maximumFractionDigits: 1,
  })} M`;
}

export function pct(n: number): string {
  return `${Math.round(n * 100)}%`;
}

// Compra vs parecidos como texto legible.
export function compraTexto(ratio: number): string {
  if (ratio >= 1.15) return `compra ${Math.round((ratio - 1) * 100)}% más`;
  if (ratio <= 0.85) return `compra ${Math.round((1 - ratio) * 100)}% menos`;
  return "compra como sus parecidos";
}

export const LINEA_LABEL: Record<Linea, string> = {
  frio: "Frío",
  descuentos: "Descuentos",
  acuerdos: "Acuerdos",
  exhibicion: "Exhibición y material",
};

export const LINEA_ORDER: Linea[] = ["frio", "descuentos", "acuerdos", "exhibicion"];

export const CANAL_LABEL: Record<Canal, string> = {
  almacen: "Almacén",
  kiosco: "Kiosco",
  autoservicio: "Autoservicio",
  gastronomia: "Gastronomía",
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
  esperando: "Esperando aprobación",
  aprobada: "Aprobada",
  en_ejecucion: "En ejecución",
  ejecutada: "Ejecutada",
  medida: "Medida",
  devuelta: "Devuelta",
  rechazada: "Rechazada",
  proximo_ciclo: "Para el próximo ciclo",
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
  alta: "Confianza alta",
  media: "Confianza media",
  baja: "Confianza baja",
};

// Tono semántico para badges. El color solo significa estado.
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
      return "bad";
    default:
      return "neutro";
  }
}

export function confianzaTono(c: Confianza): Tono {
  return c === "alta" ? "ok" : c === "media" ? "warn" : "bad";
}
