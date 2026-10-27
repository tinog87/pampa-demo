# Relu · Pampa Bottlers — Demo

Demo navegable del sistema propuesto para **trazar, justificar y decidir** la inversión
comercial de Pampa Bottlers, comercio por comercio. Acompaña a los tres documentos de la
entrega (Propuesta, Documento técnico, Supuestos).

La idea que la demo hace tangible: **cada peso de la inversión se puede seguir** desde un
número de Finanzas hasta el comercio, la regla que tomó la decisión y la foto que la
sostiene.

> Datos ilustrativos. Las aprobaciones viven en memoria del navegador: se reinician al
> recargar la página.

---

## Cómo correrlo

Necesitás **Node.js 20 o superior** ([descargar](https://nodejs.org)).

```bash
npm install
npm run dev
```

Abrí **http://localhost:3000**. Listo.

Para ver el build de producción tal como se publica:

```bash
npm run build      # genera la carpeta estática out/
npx serve out      # servir out/ en http://localhost:3000
```

---

## Qué hay para ver

Arriba a la izquierda hay un selector **"Viendo como"**: cambiá de rol
(Preventista, Supervisor, Gerente, Trade, Finanzas, Dirección) y mirá cómo cambia lo que
cada persona ve y puede decidir.

| Pantalla | Qué muestra |
| --- | --- |
| **Presupuesto** | El contexto nacional (USD 51,5 M), los indicadores del ciclo y el presupuesto por zona → línea → comercio. Cada comercio es clickeable. |
| **Comercio** (clic en una fila) | La **cadena de trazabilidad**: presupuesto → inversión → compra vs parecidos → foto → decisión → aprobación → resultado. El doble click del sistema. |
| **Bandeja** | Lo que le toca aprobar al rol activo. Aprobar / pedir foto / rechazar actualiza los contadores en vivo. |
| **Reglas** | Las reglas como texto con parámetros y **versiones**, con su historial y qué cambió en cada una. |
| **Fotos** | La lectura de IA de la foto de la visita y la verificación de acuerdos de exhibición (lo pactado vs la foto). |

---

## Cómo está hecho

- **Next.js 16** (App Router) + **React 19** + **TypeScript** + **Tailwind CSS v4**.
- Tipografía **Geist** (la misma familia de los documentos de Relu).
- Estado de las aprobaciones con **Zustand** (en memoria).
- **Sin backend**: los datos están seedeados en el repo (`src/lib/data/`), con la misma
  forma que el modelo real. Por eso la app es 100% estática y corre en cualquier lado.
- [`schema.sql`](./schema.sql) tiene el **modelo de datos Postgres** real (las tablas clave
  del documento técnico). No lo usa la demo; está para mostrarlo y como migración si alguna
  vez se decide persistir (p. ej. en Supabase).

### Estructura

```
src/
  app/                 Rutas (Presupuesto, comercio/[id], bandeja, reglas, foto/[id])
  components/          AppShell, cadena de trazabilidad, foto SVG, acciones de decisión, UI
  lib/
    types.ts           El modelo (espeja las 5 tablas clave del técnico)
    data/              Seed: comercios, reglas, derivación de decisiones y presupuesto
    store.ts           Estado de aprobaciones (Zustand)
    format.ts          Formato y etiquetas
schema.sql             Modelo de datos Postgres (artefacto)
```

---

## Publicarlo (para pasar un link)

La app es estática, así que se puede hostear en cualquier lado. Dos caminos fáciles:

### Opción A — Vercel (lo más simple para Next)

1. Subí el repo a GitHub.
2. En [vercel.com](https://vercel.com) → **Add New → Project** → importá el repo.
3. Deploy. Vercel detecta Next solo y te da la URL. Cada push la actualiza.

### Opción B — GitHub Pages (repo + link en el mismo lugar)

Ya está el workflow en [`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml).

1. Subí el repo a GitHub con el nombre **`pampa-demo`**
   (si usás otro nombre, cambiá `NEXT_PUBLIC_BASE_PATH` en el workflow por `/<tu-repo>`).
2. En el repo: **Settings → Pages → Source: "GitHub Actions"**.
3. Cada push a `main` buildea y publica en `https://<tu-usuario>.github.io/pampa-demo/`.

