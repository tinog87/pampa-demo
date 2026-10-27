"use client";

import { create } from "zustand";
import type { EstadoDecision, Rol } from "./types";

type RegistroEntrada = {
  decisionId: string;
  de: EstadoDecision;
  a: EstadoDecision;
  por: Rol;
  cuando: string;
};

type AppState = {
  rol: Rol;
  estados: Record<string, EstadoDecision>; // override sobre estadoInicial
  registro: RegistroEntrada[];
  setRol: (rol: Rol) => void;
  setEstado: (decisionId: string, a: EstadoDecision, deActual: EstadoDecision) => void;
  reset: () => void;
};

export const useApp = create<AppState>((set) => ({
  rol: "gerente",
  estados: {},
  registro: [],
  setRol: (rol) => set({ rol }),
  setEstado: (decisionId, a, deActual) =>
    set((s) => ({
      estados: { ...s.estados, [decisionId]: a },
      registro: [
        {
          decisionId,
          de: deActual,
          a,
          por: s.rol,
          cuando: new Date().toLocaleTimeString("es-AR", {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
        ...s.registro,
      ],
    })),
  reset: () => set({ estados: {}, registro: [] }),
}));

// Helper no reactivo para leer el estado efectivo de una decisión.
export function estadoEfectivo(
  estados: Record<string, EstadoDecision>,
  decisionId: string,
  estadoInicial: EstadoDecision
): EstadoDecision {
  return estados[decisionId] ?? estadoInicial;
}
