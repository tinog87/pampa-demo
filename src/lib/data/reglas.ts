import type { Regla } from "../types";

// Reglas con parámetros y versiones. Una "En prueba" corre sin efecto: no genera
// propuestas, solo muestra cuántos casos habría marcado contra el año anterior.
// Solo las "Activas" proponen. Los parámetros son criterios de Pampa (A definir).

export const REGLAS: Regla[] = [
  {
    id: "heladera_candidata_mover",
    nombre: "Heladera candidata a mover",
    descripcion:
      "Marca una heladera cuyo comercio compra mucho menos que sus parecidos y, por la foto, no está aprovechada.",
    versions: [
      {
        version: 1,
        fecha: "2026-09-02",
        define: "Gerente de zona",
        condicion: "compra contra parecidos menor a 0,6",
        necesita: "una foto de la heladera",
        seConfirma: "si se ve llena de producto Pampa",
        excepcion: "—",
        propone: "mover",
        params: { umbral_compra: 0.6, fotos_necesarias: 1 },
        estado: "archivada",
      },
      {
        version: 2,
        fecha: "2026-09-18",
        define: "Gerente de zona",
        condicion: "compra contra parecidos menor a 0,5, en los últimos 4 meses",
        necesita: "una foto de la heladera",
        seConfirma: "si se ve llena de producto Pampa",
        excepcion: "zona con competencia activa → va al gerente",
        propone: "mover",
        params: { umbral_compra: 0.5, ventana_meses: 4, fotos_necesarias: 1 },
        cambio:
          "Bajó el umbral de 0,6 a 0,5 y se acotó a 4 meses: con 0,6 entraban comercios estacionales que después remontaban.",
        estado: "archivada",
      },
      {
        version: 3,
        fecha: "2026-10-06",
        define: "Gerente de zona",
        condicion:
          "compra contra parecidos menor a 0,5, llena de producto Pampa en 2 visitas y casi sin reposición",
        necesita: "foto de la heladera en 2 visitas seguidas",
        seConfirma: "si se ve llena de producto Pampa en las 2",
        excepcion: "zona con competencia activa → va al gerente",
        propone: "mover",
        params: {
          umbral_compra: 0.5,
          ventana_meses: 4,
          fotos_necesarias: 2,
        },
        cambio:
          "Pasó de 1 foto a 2 visitas: con una sola foto se movieron 3 heladeras que en la segunda visita sí tenían reposición. La doble foto evita el falso positivo.",
        estado: "activa",
      },
    ],
  },
  {
    id: "heladera_sumar",
    nombre: "Comercio candidato a sumar heladera",
    descripcion:
      "Marca un comercio que compra más que sus parecidos y no tiene heladera, o la tiene chica para lo que mueve.",
    versions: [
      {
        version: 1,
        fecha: "2026-09-10",
        define: "Gerente de zona",
        condicion: "compra contra parecidos mayor a 1,5 y sin heladera",
        necesita: "confirmar que hay una heladera liberada cerca",
        seConfirma: "el gerente valida el encaje",
        excepcion: "si no hay equipo liberado, pasa a compra nueva (monto alto)",
        propone: "sumar",
        params: { umbral_compra: 1.5 },
        estado: "activa",
      },
    ],
  },
  {
    id: "acuerdo_cumplimiento",
    nombre: "Acuerdo de exhibición incumplido",
    descripcion:
      "Compara lo pactado en el contrato contra lo que muestra la foto de la visita. Solo en zonas piloto.",
    versions: [
      {
        version: 1,
        fecha: "2026-10-09",
        define: "Trade",
        condicion:
          "la foto muestra menos cabeceras o menos espacio que lo pactado, con tolerancia 10%",
        necesita: "foto de la góndola en la visita (solo piloto)",
        seConfirma:
          "alerta automática si la IA supera el umbral de precisión; si no, al supervisor",
        excepcion: "foto dudosa, monto alto o zona con competencia activa → al supervisor",
        propone: "corregir",
        params: { tolerancia_espacio: 0.1, umbral_precision_ia: "A definir" },
        estado: "activa",
      },
    ],
  },
  {
    id: "descuento_sin_efecto",
    nombre: "Descuento que no movió volumen",
    descripcion:
      "Marca descuentos cuyo comercio no compró más que sus parecidos durante la vigencia.",
    versions: [
      {
        version: 1,
        fecha: "2026-10-12",
        define: "Finanzas",
        condicion:
          "compra contra parecidos menor a 1,0 mientras tuvo descuento activo",
        necesita: "comparar la ventana con y sin descuento",
        seConfirma: "el gerente revisa la recomendación",
        excepcion: "descuento dado para frenar competencia → se registra el motivo",
        propone: "condicionar",
        params: { umbral_compra: 1.0 },
        cambio: "Primera versión. Corre en prueba contra el año anterior antes de activarse.",
        estado: "en_prueba",
      },
    ],
  },
];

export function getRegla(id: string): Regla | undefined {
  return REGLAS.find((r) => r.id === id);
}

export function reglaVigente(id: string) {
  const r = getRegla(id);
  return r ? r.versions[r.versions.length - 1] : undefined;
}

export function reglaEstaActiva(id: string): boolean {
  return reglaVigente(id)?.estado === "activa";
}
