# Relu · Pampa Bottlers — Demo

Demo navegable del sistema propuesto para **trazar, justificar y decidir** la inversión
comercial de Pampa Bottlers, comercio por comercio. Acompaña a los tres documentos de la
entrega (Propuesta, Documento técnico, Supuestos).

La idea que la demo hace tangible: **cada peso de la inversión se puede seguir** desde un
número de Finanzas hasta el comercio, la regla que tomó la decisión y la foto que la
sostiene.

> Datos ilustrativos. Las aprobaciones viven en memoria del navegador: se reinician al
> recargar la página.

📖 **Onboarding de la demo (qué es, roles, pantallas y recorrido guiado): [GUIA.md](GUIA.md).**

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

Arriba a la izquierda hay un selector **"Viendo como"**: cambiá de rol y mirá cómo cambian
el menú, la bandeja y lo que cada persona puede decidir. Cada rol ve solo lo suyo
(2–3 opciones de menú).

| Rol | Ve |
| --- | --- |
| **Gerente de zona** (inicio) | **Bandeja** (propuestas, pedidos, alertas y resueltos), **Mi zona** (lo que pide la zona vs el techo de Finanzas) y **Comercios** (buscador + ficha con la cadena completa y botón para **cargar un pedido**). |
| **Preventista** | **Hoy** y **Hechas**: tareas del día en el celular (sacar foto, ajustar pedido). Nunca ve plata. |
| **Supervisor** | **Para aprobar**, **Revisar fotos** (lectura de IA + precisión) y **Mi equipo**. |
| **Trade** | **Reglas** (con simulador de impacto y versiones) y **Derivados a Trade**. |
| **Finanzas** | **Presupuesto** (techo editable, por zona/línea/motivo, CSV) y **Ciclo en curso**. |
| **Dirección** | **Resumen** por zona y **Presupuesto** en solo lectura. |

La **ficha de un comercio** (clic en una fila) muestra la **cadena de trazabilidad** completa:
presupuesto → inversión → compra vs parecidos → foto → decisión → aprobación → registro.

👉 El recorrido guiado paso a paso está en **[GUIA.md](GUIA.md)**.

---

## Stack técnico

| Herramienta | Versión | Para qué |
| --- | --- | --- |
| [Next.js](https://nextjs.org) (App Router) | 16.4.3 | Framework React y ruteo. Build a sitio estático (`output: export`). |
| [React](https://react.dev) | 19.3.0 | UI. |
| [TypeScript](https://www.typescriptlang.org) | 5.x | Tipado en todo el código. |
| [Tailwind CSS](https://tailwindcss.com) | 4.x | Estilos, con los tokens de marca de Relu. |
| [Zustand](https://zustand.docs.pmnd.rs) | 5.0.x | Estado de las aprobaciones (en memoria del navegador). |
| [Geist / Geist Mono](https://vercel.com/font) | `next/font` | Tipografía (la misma familia de los documentos de Relu). |
| Node.js | 20+ | Entorno para correr y buildear. |

- **Sin backend**: los datos están seedeados en el repo (`src/lib/data/`), con la misma
  forma que el modelo real. Por eso la app es 100% estática y corre en cualquier lado.
- [`schema.sql`](./schema.sql) tiene el **modelo de datos Postgres** real (las tablas clave
  del documento técnico). No lo usa la demo; está para mostrarlo y como migración si alguna
  vez se decide persistir (p. ej. en Supabase).

### Estructura

```
src/
  app/                 Una ruta por pantalla de rol: / (home por rol), mi-zona, comercios,
                       comercio (ficha por ?id=), revisar-fotos, mi-equipo, hechas,
                       reglas, derivados, presupuesto, ciclo, resumen
  components/          AppShell (nav por rol), views-{rol}, cadena de trazabilidad,
                       foto SVG, acciones de decisión, UI
  lib/
    types.ts           El modelo (espeja las tablas clave del técnico)
    data/              Seed: comercios, reglas, derivación de decisiones y presupuesto
    store.ts           Estado de aprobaciones, techos y pedidos (Zustand, en memoria)
    format.ts          Formato y etiquetas
schema.sql             Modelo de datos Postgres (artefacto)
GUIA.md                Onboarding de la demo (roles, pantallas, recorrido guiado)
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

