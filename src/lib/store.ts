"use client";

import { create } from "zustand";
import type { Accion, EstadoDecision, Linea, Rol } from "./types";

export type PropuestaGerente = {
  id: string;
  comercioId: string;
  comercioNombre: string;
  zonaId: string;
  linea: Linea;
  accion: Accion;
  monto: number;
  motivo: string;
  cuando: string;
};

type RegistroEntrada = {
  decisionId: string;
  de: EstadoDecision;
  a: EstadoDecision;
  por: Rol;
  cuando: string;
};

type AppState = {
  rol: Rol;
  zona: string; // zona activa para roles de calle
  estados: Record<string, EstadoDecision>;
  techos: Record<string, number>; // override de Finanzas por zona
  propuestas: PropuestaGerente[];
  registro: RegistroEntrada[];
  setRol: (rol: Rol) => void;
  setZona: (zona: string) => void;
  setEstado: (decisionId: string, a: EstadoDecision, deActual: EstadoDecision) => void;
  setTecho: (zonaId: string, monto: number) => void;
  addPropuesta: (p: Omit<PropuestaGerente, "id" | "cuando">) => void;
  reset: () => void;
};

function ahora(): string {
  return new Date().toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
}

export const useApp = create<AppState>((set) => ({
  rol: "gerente",
  zona: "norte",
  estados: {},
  techos: {},
  propuestas: [],
  registro: [],
  setRol: (rol) => set({ rol }),
  setZona: (zona) => set({ zona }),
  setEstado: (decisionId, a, deActual) =>
    set((s) => ({
      estados: { ...s.estados, [decisionId]: a },
      registro: [{ decisionId, de: deActual, a, por: s.rol, cuando: ahora() }, ...s.registro],
    })),
  setTecho: (zonaId, monto) => set((s) => ({ techos: { ...s.techos, [zonaId]: monto } })),
  addPropuesta: (p) =>
    set((s) => ({
      propuestas: [{ ...p, id: `prop-${Date.now()}`, cuando: ahora() }, ...s.propuestas],
    })),
  reset: () => set({ estados: {}, techos: {}, propuestas: [], registro: [] }),
}));

export function estadoEfectivo(
  estados: Record<string, EstadoDecision>,
  decisionId: string,
  estadoInicial: EstadoDecision
): EstadoDecision {
  return estados[decisionId] ?? estadoInicial;
}
