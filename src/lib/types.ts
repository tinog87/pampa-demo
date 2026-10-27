// Modelo de datos de la demo. Muestra ilustrativa de ~2.000 comercios.
// Todos los totales de la app salen de esta muestra, nunca se mezclan con los 51,5 M.

export type Confianza = "alta" | "media" | "baja";

// "Tipo" de comercio (la columna se llama Tipo en la UI, no Canal).
export type Tipo = "almacen" | "kiosco" | "autoservicio" | "gastronomia";
export type Tamano = "chico" | "mediano" | "grande";

export type Linea = "frio" | "descuentos" | "acuerdos" | "exhibicion";

export type Accion =
  | "mantener"
  | "corregir"
  | "mover"
  | "sumar"
  | "derivar"
  | "renovar"
  | "ajustar"
  | "condicionar"
  | "cortar";

export type EstadoDecision =
  | "propuesta"
  | "esperando"
  | "aprobada"
  | "en_ejecucion"
  | "ejecutada"
  | "medida"
  | "devuelta"
  | "rechazada"
  | "proximo_ciclo"
  | "pide_foto" // frío sin foto: no se propone acción hasta tenerla
  | "a_validar"; // registro dudoso: una persona valida antes de proponer

// Estado de un monto del presupuesto.
export type EstadoMonto = "justificado" | "pendiente" | "a_validar" | "sin_justificar";

export type Rol =
  | "preventista"
  | "supervisor"
  | "gerente"
  | "trade"
  | "finanzas"
  | "direccion";

export type Zona = {
  id: string;
  nombre: string;
  short: string;
  piloto: boolean;
  competenciaActiva: boolean;
};

export type EstadoHeladera =
  | "llena_pampa"
  | "vacia"
  | "otra_marca"
  | "rota"
  | "sin_heladera";

export type LecturaCampo = {
  label: string;
  valor: string;
  confianza: Confianza;
};

export type FotoFrio = {
  estado: EstadoHeladera;
  visitas: number;
  confianza: Confianza;
  lectura: LecturaCampo[];
};

export type AcuerdoLinea = {
  pactado: string;
  foto: string;
  cumple: boolean;
};

export type Inversion = {
  linea: Linea;
  montoActual: number; // ciclo en curso
  montoPropuesto: number; // próximo período
  accion: Accion;
  motivo: string | null; // null => sin justificación (hallazgo, no tarea)
  condicion?: string; // para Condicionar (descuentos): siempre dice la condición
  estadoMonto: EstadoMonto;
  confianza: Confianza;
  estimado?: boolean; // costos marcados como estimados
};

export type Comercio = {
  id: string;
  codigo: string;
  nombre: string;
  barrio: string; // desambigua nombres repetidos
  zonaId: string;
  tipo: Tipo;
  tamano: Tamano;
  puertas: number; // 0 = sin heladera
  competenciaActiva: boolean;
  confianza: Confianza;
  // Compra contra parecidos (sell-in): 1 = igual al grupo. <1 compra menos, >1 más.
  compraVsParecidos: number;
  inversiones: Inversion[];
  fotoFrio?: FotoFrio; // candidatas de frío (14 zonas)
  acuerdo?: AcuerdoLinea[]; // control de exhibición (solo piloto)
};

export type OrigenDecision = "sistema" | "gerente";

export type Decision = {
  id: string;
  comercioId: string;
  linea: Linea;
  accion: Accion;
  montoActual: number;
  montoPropuesto: number;
  montoNeto: number;
  motivo: string;
  condicion?: string;
  reglaId: string;
  reglaVersion: number;
  apruebaRol: Rol | "auto";
  auto: boolean;
  origen: OrigenDecision;
  estadoInicial: EstadoDecision;
  fechaLimite?: string;
  vencida?: boolean;
  tieneFoto: boolean;
  confianza: Confianza;
  estimado?: boolean;
};

export type ReglaVersion = {
  version: number;
  fecha: string;
  define: string;
  condicion: string;
  necesita: string;
  seConfirma: string;
  excepcion: string;
  propone: Accion;
  params: Record<string, string | number>;
  cambio?: string;
  estado: "activa" | "en_prueba" | "archivada";
};

export type Regla = {
  id: string;
  nombre: string;
  descripcion: string;
  // Si la vigente está "en_prueba": no propone, solo cuenta cuántos casos habría marcado.
  habriaMarcado?: number;
  versions: ReglaVersion[];
};
