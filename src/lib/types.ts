// Modelo de datos de la demo.
// Espeja las 5 tablas clave del documento técnico:
// comercio · inversion · presupuesto_detalle (aquí: campos de inversion) · decision · regla · foto

export type Confianza = "alta" | "media" | "baja";

export type Canal = "almacen" | "kiosco" | "autoservicio" | "gastronomia";
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
  | "proximo_ciclo";

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
  short: string; // abreviatura para el mapa
  piloto: boolean;
  competenciaActiva: boolean;
  mapX: number; // 0–100, oeste → este
  mapY: number; // 0–100, norte → sur
};

export type Inversion = {
  linea: Linea;
  periodo: string;
  montoActual: number; // USD / año, ciclo en curso
  montoPropuesto: number; // USD / año, próximo ciclo
  accion: Accion;
  motivo: string | null; // null => "sin justificación": hallazgo, no tarea
  justificado: boolean;
  confianza: Confianza;
};

export type Comercio = {
  id: string; // slug
  codigo: string; // código único cruzado entre fuentes
  nombre: string;
  zonaId: string;
  canal: Canal;
  tamano: Tamano;
  puertas: number; // puertas de heladera (0 = sin heladera)
  competenciaActiva: boolean;
  confianza: Confianza; // confianza del dato del comercio
  // Indicador central: compra del comercio dividida por la del comercio del medio de su grupo.
  // 1 = igual que sus parecidos. <1 compra menos. >1 compra más. Es sell-in, no venta al consumidor.
  compraVsParecidos: number;
  inversiones: Inversion[];
};

export type Decision = {
  id: string;
  comercioId: string;
  linea: Linea;
  accion: Accion;
  montoActual: number;
  montoPropuesto: number;
  montoNeto: number; // propuesto - actual (negativo = libera plata)
  motivo: string;
  indicador: string; // la señal que la disparó
  reglaId: string;
  reglaVersion: number;
  apruebaRol: Rol; // quién tiene que aprobar (o "auto")
  auto: boolean; // monto bajo + confianza alta => automático
  estadoInicial: EstadoDecision;
  fechaLimite?: string;
  vencida?: boolean;
  fotoId?: string;
  confianza: Confianza;
};

export type ReglaVersion = {
  version: number;
  fecha: string;
  define: string; // rol que la define
  condicion: string;
  necesita: string;
  seConfirma: string;
  excepcion: string;
  propone: Accion;
  params: Record<string, string | number>;
  cambio?: string; // qué cambió respecto de la versión anterior
  estado: "activa" | "en_prueba" | "archivada";
};

export type Regla = {
  id: string;
  nombre: string;
  descripcion: string;
  versions: ReglaVersion[]; // la última es la vigente
};

export type LecturaCampo = {
  label: string;
  valor: string;
  confianza: Confianza;
};

export type EstadoHeladera = "llena_pampa" | "vacia" | "otra_marca" | "rota" | "sin_heladera";

export type AcuerdoLinea = {
  pactado: string;
  foto: string;
  cumple: boolean;
};

export type Foto = {
  id: string;
  comercioId: string;
  estadoHeladera: EstadoHeladera;
  fecha: string;
  visita: number;
  lectura: LecturaCampo[];
  acuerdo?: AcuerdoLinea[]; // verificación de exhibición pactada
};
