-- ============================================================================
-- Relu · Pampa Bottlers — Modelo de datos (núcleo)
-- ----------------------------------------------------------------------------
-- Espeja el documento técnico (sección 5). El sistema real tiene ~29 tablas en
-- tres grupos; aquí están las clave. La demo usa datos seedeados en el repo con
-- esta misma forma, de modo que este schema sirve como migración si se decide
-- persistir (Postgres / Supabase) más adelante.
--
-- Principios que el modelo hace cumplir (documento técnico, "Cuatro principios"):
--   1. Toda decisión se puede reconstruir  -> se guarda regla + versión + datos
--   2. Las reglas se cambian sin programar -> regla_version, con historial
--   3. El registro no se edita ni se borra  -> cada cambio agrega una fila
--   4. Cada dato dice cuánto se puede confiar en él -> columnas `confianza`
-- ============================================================================

create type confianza   as enum ('alta', 'media', 'baja');
create type canal        as enum ('almacen', 'kiosco', 'autoservicio', 'gastronomia');
create type tamano       as enum ('chico', 'mediano', 'grande');
create type linea        as enum ('frio', 'descuentos', 'acuerdos', 'exhibicion');
create type accion        as enum
  ('mantener','corregir','mover','sumar','derivar','renovar','ajustar','condicionar','cortar');
create type estado_decision as enum
  ('propuesta','esperando','aprobada','en_ejecucion','ejecutada','medida','devuelta','rechazada','proximo_ciclo');
create type rol          as enum ('preventista','supervisor','gerente','trade','finanzas','direccion');

-- ---------------------------------------------------------------------------
-- Grupo 1 · Datos de la operación
-- ---------------------------------------------------------------------------

create table zona (
  id                text primary key,
  nombre            text not null,
  piloto            boolean not null default false,
  competencia_activa boolean not null default false
);

create table comercio (
  id                text primary key,       -- código único, cruzado entre fuentes
  nombre            text not null,
  zona_id           text not null references zona(id),
  canal             canal not null,
  tamano            tamano not null,
  puertas           int  not null default 0, -- puertas de heladera (0 = sin heladera)
  competencia_activa boolean not null default false,
  confianza         confianza not null default 'alta'
);

-- Lo que el comercio le COMPRA a Pampa (sell-in). No es venta al consumidor.
create table compra (
  id                bigserial primary key,
  comercio_id       text not null references comercio(id),
  periodo           date not null,          -- mes
  producto          text,
  formato           text,                   -- individual / retornable / etc.
  unidades          numeric not null default 0,
  importe_usd       numeric not null default 0
);

create table heladera_en_comercio (
  id                bigserial primary key,
  comercio_id       text not null references comercio(id),
  puertas           int not null,
  antiguedad_anios  int,
  confianza         confianza not null default 'media' -- ~10% del registro es dudoso
);

-- ---------------------------------------------------------------------------
-- Indicador central: compra del comercio / compra del comercio del medio de su grupo
-- (mismo canal, tipo, tamaño, zona y puertas), en una ventana de 3 a 6 meses.
-- ---------------------------------------------------------------------------
create table indicador_comercio (
  id                bigserial primary key,
  comercio_id       text not null references comercio(id),
  linea             linea not null,
  ventana_meses     int not null default 4,
  compra_vs_parecidos numeric not null,     -- 1.0 = igual que sus parecidos
  n_parecidos       int not null,           -- tamaño del grupo (confianza)
  calculado_en      timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Grupo 2 · Trazabilidad del presupuesto
-- ---------------------------------------------------------------------------

create table presupuesto_aprobado (
  id                bigserial primary key,
  ciclo             text not null,          -- '2026'
  zona_id           text not null references zona(id),
  linea             linea not null,
  monto_usd         numeric not null,
  version           int not null default 1,
  aprobado_por      rol not null default 'finanzas',
  aprobado_en       timestamptz not null default now()
);

-- Una fila por comercio, línea y período. El corazón de la trazabilidad.
create table inversion (
  id                bigserial primary key,
  comercio_id       text not null references comercio(id),
  linea             linea not null,
  periodo           text not null,          -- '2026'
  monto_usd         numeric not null,
  motivo            text,                   -- null => "sin justificación" (hallazgo)
  decision_origen_id bigint,                -- qué decisión la generó
  confianza         confianza not null default 'media',
  unique (comercio_id, linea, periodo)
);

create table gasto (
  id                bigserial primary key,
  inversion_id      bigint not null references inversion(id),
  importe_usd       numeric not null,
  comprobante       text,                   -- de facturación / contabilidad
  registrado_en     timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Grupo 3 · Reglas, decisiones y ejecución
-- ---------------------------------------------------------------------------

-- La regla es texto + parámetros. Una versión no se modifica: se crea la siguiente.
create table regla (
  id                text primary key,       -- 'heladera_candidata_mover'
  nombre            text not null,
  descripcion       text
);

create table regla_version (
  regla_id          text not null references regla(id),
  version           int  not null,
  define            rol  not null,
  condicion         text not null,
  necesita          text,
  se_confirma       text,
  excepcion         text,
  propone           accion not null,
  params            jsonb not null default '{}',
  cambio            text,                   -- qué cambió vs la versión anterior
  estado            text not null default 'activa', -- activa | en_prueba | archivada
  creada_en         timestamptz not null default now(),
  primary key (regla_id, version)
);

-- Una decisión en camino a ejecutarse. Guarda la versión de la regla usada.
create table decision (
  id                bigserial primary key,
  comercio_id       text not null references comercio(id),
  linea             linea not null,
  accion            accion not null,
  monto_actual_usd  numeric not null default 0,
  monto_propuesto_usd numeric not null default 0,
  monto_neto_usd    numeric not null default 0,
  motivo            text not null,
  indicador         text,
  regla_id          text references regla(id),
  regla_version     int,
  aprueba_rol       rol not null,
  auto              boolean not null default false, -- monto bajo + confianza alta
  estado            estado_decision not null default 'propuesta',
  fecha_limite      date,
  foto_id           bigint,
  confianza         confianza not null default 'media',
  creada_en         timestamptz not null default now(),
  foreign key (regla_id, regla_version) references regla_version(regla_id, version)
);

-- Lo que Finanzas ve: presupuesto del próximo ciclo, abierto por comercio y línea.
create table presupuesto_detalle (
  id                bigserial primary key,
  ciclo             text not null,          -- próximo ciclo
  comercio_id       text not null references comercio(id),
  linea             linea not null,
  monto_actual_usd  numeric not null,
  monto_propuesto_usd numeric not null,
  accion            accion not null,
  motivo            text,
  indicador         text,
  regla_id          text,
  regla_version     int,
  aprobado_por      rol,
  estado            text not null default 'a_validar' -- justificado | a_validar | pendiente
);

-- ---------------------------------------------------------------------------
-- Fotos y lectura de IA (acuerdos de exhibición + estado de heladera)
-- ---------------------------------------------------------------------------

create table foto (
  id                bigserial primary key,
  comercio_id       text not null references comercio(id),
  visita            int not null,
  tomada_en         date not null,
  estado_heladera   text    -- llena_pampa | vacia | otra_marca | rota | sin_heladera
);

create table lectura_ia (
  id                bigserial primary key,
  foto_id           bigint not null references foto(id),
  campo             text not null,          -- 'marca_predomina', 'cabeceras', ...
  valor             text not null,
  confianza         confianza not null,
  -- la alerta automática solo se dispara sobre campos cuya precisión ya se midió
  precision_medida  numeric
);

create table acuerdo (
  id                bigserial primary key,
  comercio_id       text not null references comercio(id),
  vigencia_desde    date,
  vigencia_hasta    date,
  contrato_pdf      text                    -- vínculo al PDF original
);

create table punto_acuerdo (
  id                bigserial primary key,
  acuerdo_id        bigint not null references acuerdo(id),
  pactado           text not null,          -- '2 cabeceras'
  verificado_foto   text,                   -- '1 cabecera'
  cumple            boolean
);

-- ---------------------------------------------------------------------------
-- Usuarios y registro inmutable
-- ---------------------------------------------------------------------------

create table usuario (
  id                bigserial primary key,
  nombre            text not null,
  rol               rol not null,
  zona_id           text references zona(id),
  reporta_a         bigint references usuario(id)   -- preventista -> supervisor -> gerente
);

-- El registro no se edita ni se borra: cada cambio agrega una fila.
create table registro (
  id                bigserial primary key,
  entidad           text not null,          -- 'decision', 'regla', 'inversion'
  entidad_id        text not null,
  cambio            text not null,          -- 'esperando -> aprobada'
  valores_antes     jsonb,
  valores_despues   jsonb,
  por_usuario       bigint references usuario(id),
  cuando            timestamptz not null default now()
);

create index on inversion (comercio_id);
create index on decision (comercio_id, estado);
create index on indicador_comercio (comercio_id, linea);
create index on registro (entidad, entidad_id);
