# Guía de la demo — Pampa Bottlers

> **Demo con datos ilustrativos: muestra el sistema completo. La lectura de fotos está simulada.**

Esta guía es un onboarding de 10 minutos. Explica qué es la demo, cómo moverte por los roles y qué mirar en cada pantalla. No hace falta saber nada del código. (Para correrla o publicarla, ver el `README.md`.)

---

## 1. Qué es esto

Pampa Bottlers es una embotelladora de Coca-Cola del Cono Sur. Invierte **USD 51,5 M por año** en el punto de venta (heladeras, exhibición, acuerdos, descuentos, material) y hoy no puede trazar cada peso hasta el comercio ni justificar por qué está donde está.

Esta demo es el sistema que resuelve eso. Hace tres cosas:

1. **Traza y justifica** el presupuesto comercial hasta cada comercio.
2. **Propone mejoras** (mover una heladera subutilizada, reclamar un acuerdo incumplido, condicionar un descuento que no mueve volumen).
3. **Lleva esas decisiones a la calle** y mide el efecto en las compras.

La demo muestra **la versión completa, la que se apunta**. La propuesta real arranca por partes (ver la sección *El piloto* más abajo); por eso las funciones que recién llegan con el piloto llevan una etiqueta chica: **"Desde el piloto"**.

La app abre como **Gerente de zona · Norte GBA**, que es el rol central. Cómo correrla o publicarla está en el `README.md`.

---

## 2. La regla de oro de las cifras

Arriba de todo hay una franja negra, siempre visible:

> **Muestra ilustrativa: 2.000 comercios · Pampa total: USD 51,5 M en 52.000 comercios**

- **Todos los números de la app** (presupuestos, montos, barras) salen de la **muestra de 2.000 comercios** (unos 140 por zona).
- Los **USD 51,5 M y los 52.000 comercios** son el contexto real de Pampa y aparecen **solo** en esa franja.
- **Nunca** vas a ver una cifra que mezcle las dos escalas.

Las cifras son consistentes entre pantallas: lo que suma "Mi zona" es exactamente lo que aparece por esa zona en "Presupuesto".

---

## 3. Cómo moverte: "Viendo como"

Arriba a la izquierda hay dos selectores:

- **Viendo como** → cambia el rol. Al cambiarlo cambian el menú, la bandeja y lo que se ve.
- **Zona** → solo para los roles de calle (gerente, supervisor, preventista). Por defecto **Norte GBA** (zona piloto). Podés cambiarla para probar.

Finanzas, Trade y Dirección **ven todas las zonas**.

El menú de cada rol tiene **2 o 3 opciones como máximo**: cada uno ve solo lo suyo.

---

## 4. Conceptos en un minuto

Cinco ideas que se repiten en toda la app:

**Compra contra parecidos.** "Parecidos" son comercios del mismo tipo, tamaño, zona y puertas de heladera, en el mismo período. Un valor de **1 = igual al grupo**. 0,4 = compra el 40% de lo que compran sus parecidos. 1,8 = compra 80% más.
*Siempre es "compra" (lo que el comercio le compra a Pampa), nunca "vende". No es la venta al consumidor ni la rentabilidad.*

**Las compras marcan, la foto confirma.** Que un comercio compre poco es una marca para revisar, no una decisión. **Ninguna acción de frío se propone sin foto.** Qué significa la foto cuando compra poco:

| La foto muestra | Qué significa | Acción |
|---|---|---|
| Llena de producto Pampa | No hay demanda | **Mover** (después de corregir y probar) |
| Vacía | Demanda sin cubrir | **Corregir** (ajustar el pedido) |
| Producto de otra marca | La demanda la aprovecha otro | **Corregir** (recuperar el espacio) |
| Rota, apagada o escondida | No puede vender | **Corregir** (técnico) |
| No hay heladera | Registro dudoso | **A validar** |

**Estados de un monto del presupuesto.** Cada peso está en uno de cuatro estados:

- **Justificado** — tiene motivo y dato que lo respaldan.
- **Pendiente de aprobación** — hay una propuesta esperando una decisión.
- **A validar** — el dato es dudoso; su monto no se reasigna hasta confirmarlo.
- **Sin justificar** — inversión actual sin motivo registrado. Es un **hallazgo**, no una tarea.

**Reglas: Activa vs En prueba.** Solo las reglas **Activas** generan propuestas. Una regla **En prueba** corre sin efecto y solo muestra *"con esta regla, el año pasado se habrían marcado N casos"*. Cada cambio de una regla crea una versión nueva con el motivo del cambio.

**De dónde sale cada propuesta.** Dos orígenes, mismo circuito de aprobación:
- **Sistema** — la generan las reglas y las fotos.
- **Gerente** — un pedido que el gerente carga para un comercio.

**Quién aprueba** (los montos de corte están marcados *"A definir con Pampa"*): monto bajo y dato claro → **automático**; monto medio → **supervisor**; monto alto o zona con competencia → **gerente**; mover/sumar heladera → como mínimo **supervisor**; si la zona pide más que su techo → pasa por **Finanzas**.

---

## 5. El piloto

La propuesta real tiene dos tiempos:

- **Semanas 1–10, en las 14 zonas:** trazar y justificar el presupuesto del próximo período. En la calle no cambia nada.
- **Desde la semana 11, en 3 zonas piloto:** el sistema funciona completo en la calle, se ajusta y después se replica.

Las **3 zonas piloto** son **Norte GBA** (con competencia activa), **Litoral** y **Cuyo** (interior). Solo en ellas se ejecutan correcciones en la calle, se controlan acuerdos con foto y se mide el efecto en las compras a los 3 meses contra comercios parecidos sin intervención.

En la demo, las piloto ya muestran ese funcionamiento con la etiqueta **"Desde el piloto"**.

**La IA lee fotos y contratos, pero no decide.** Las alertas automáticas llegan desde el piloto y se activan recién cuando la precisión medida supera un umbral (*A definir con Pampa*). Hasta entonces el supervisor revisa todo. En la demo la precisión está en 82% y el umbral en 90%, así que las alertas automáticas figuran **inactivas**.

---

## 6. Las pantallas, por rol

| Rol | Menú | Zona | Tiene plata a la vista |
|---|---|---|---|
| **Gerente de zona** | Bandeja · Mi zona · Comercios | Sí | Sí |
| **Preventista** | Hoy · Hechas | Sí (celular) | No |
| **Supervisor** | Para aprobar · Revisar fotos · Mi equipo | Sí | Parcial |
| **Trade** | Reglas · Derivados a Trade | Todas | Sí |
| **Finanzas** | Presupuesto · Ciclo en curso | Todas | Sí |
| **Dirección Comercial** | Resumen · Presupuesto (solo lectura) | Todas | Sí |

### Gerente de zona (el rol central)

- **Bandeja** — la pantalla de inicio. Junta lo que espera una decisión: propuestas del sistema, sus propios pedidos y en qué estado están, **alertas** (datos dudosos por monto, frenos por competencia y, desde el piloto, tareas vencidas) y lo que ya resolvió.
- **Mi zona** — cuánto pide su zona para el próximo período: inversión actual, lo que pide la zona, el **techo** asignado por Finanzas y la diferencia, el detalle por línea (frío, descuentos, acuerdos, exhibición y material) y cuánto está justificado, pendiente y a validar.
- **Comercios** — buscador y lista. Cada ficha muestra la **cadena completa**: presupuesto → inversión asignada → compra contra parecidos → foto → decisión → aprobación → registro. Desde la ficha, el botón principal **Cargar un pedido** deja al gerente pedir algo para ese comercio; al lado, el sistema le muestra qué dicen los datos y le avisa si no acompañan (pero no lo bloquea).

### Preventista (pensado para el celular)

- **Hoy** — sus comercios del día, en orden de visita. En las 14 zonas: *"Sacar foto de la heladera"*. Desde el piloto, además: *"Ajustar el pedido"*, *"Pedir técnico"*, *"Sacar foto de la exhibición"*.
- **Hechas** — lo que ya resolvió.
- Cada tarea se cierra con **Hecho** (con foto simulada cuando corresponde) o **No se pudo** (eligiendo un motivo de una lista).
- **Nunca ve plata, presupuesto, reglas ni KPIs. No aprueba nada.**

### Supervisor

- **Para aprobar** — lo de su nivel en su zona. **Aprobar** (un clic), **Rechazar** (eligiendo un motivo) o **Pedir foto**.
- **Revisar fotos** — la foto y la lectura de la IA con su confianza en palabras ("segura", "dudosa"); botones **Está bien** / **Corregir**. Arriba, la precisión acumulada y el estado de las alertas automáticas.
- **Mi equipo** — fotos pendientes por preventista y, desde el piloto, tareas vencidas. Se pueden reasignar.

### Trade

- **Reglas** — cada regla con sus parámetros, la marca *"A definir con Pampa"* y el historial de versiones. El **simulador** deja mover un parámetro y ver el impacto antes de activarlo (cuántas heladeras quedan candidatas, cuánta inversión se libera). Para las reglas en prueba, muestra *"el año pasado se habrían marcado N casos"*.
- **Derivados a Trade** — comercios que compran bien pero poco de lo que se quiere impulsar.

### Finanzas

- **Presupuesto (próximo período)** — el acumulado de todas las zonas: **techo editable**, lo que piden las zonas, cuánto viene del sistema y cuánto de pedidos de gerentes, la diferencia contra el techo y la barra de estados. Se abre por zona, por línea, por motivo y hasta el comercio. **Exportar a CSV.**
- **Ciclo en curso** — trazabilidad de lo que ya está en marcha: aprobado, asignado, sin asignar, sin motivo registrado, gastado (o *"gastado estimado"* si no hay registro de pagos) y en bajo retorno.
- Finanzas no tiene cola de aprobaciones: ve todo, fija el techo y los montos de corte, y decide sobre lo que supera el techo.

### Dirección Comercial

- **Resumen** — por zona: avance de aprobaciones, lo pedido contra el techo y, en las 3 piloto (*"Desde el piloto"*), correcciones hechas, acuerdos corregidos y efecto en las compras.
- **Presupuesto** — la misma pantalla de Finanzas, en **solo lectura**.

---

## 7. Recorrido guiado (5 minutos)

Los seis comercios de ejemplo están todos en **Norte GBA** y muestran cada situación típica. Se ven igual en toda la app.

1. **Entrá como Gerente · Norte GBA.** Mirá la **Bandeja**: propuestas esperando, alertas y resueltos.
2. **Andá a Comercios y buscá "Don Tito".** Almacén mediano, compra 40% de sus parecidos, 2 heladeras. La foto lo muestra lleno de Pampa en 2 visitas → **hay equipo, no demanda** → el sistema propone **Mover una heladera** (USD 1.000 → 500). Abrí el **"¿Por qué?"** para ver el motivo, la foto y la regla detrás.
3. **Buscá "La Esquina".** Kiosco sin heladera que compra 80% más que sus parecidos → **Sumar**, recibiendo justo la heladera liberada de Don Tito (USD 0 → 500). Un movimiento financia al otro.
4. **Buscá "El Sol".** Acuerdo de exhibición de USD 3.600 (2 cabeceras, 50% del espacio). La foto muestra 1 cabecera de otra marca y 30% → **Corregir**, reclamando lo pactado.
5. **Buscá "Sosa".** Registra 1 heladera pero compra casi nada y la foto no muestra heladera → **A validar**: el monto no se reasigna hasta confirmarlo.
6. **Buscá "Mitre" y "Rivas".** Son **pedidos del gerente** (origen "Gerente"): una heladera nueva y una promoción condicionada. Siguen el mismo circuito de aprobación que las propuestas del sistema.
7. **Cambiá a Preventista** (celular): vas a ver las tareas de foto. **Cambiá a Supervisor**: la cola "Para aprobar" y "Revisar fotos". **Cambiá a Finanzas**: el presupuesto completo con el techo y el CSV. **Cambiá a Dirección**: el resumen con el efecto del piloto.

---

## 8. Qué está simulado

- La **lectura de fotos** por IA (la demo trae fotos y lecturas inventadas).
- Los **2.000 comercios** y sus datos: generados de forma determinística, siempre iguales.
- Las **acciones que hacés** (aprobar, rechazar, cargar un pedido, editar el techo) se guardan en memoria del navegador y se ven al instante, pero **se reinician al recargar** la página. Es a propósito: la demo no persiste nada.

---

## 9. Glosario

- **Compra contra parecidos** — cuánto compra el comercio comparado con comercios iguales. 1 = igual al grupo.
- **Rendir menos** — comprar menos que sus parecidos. Marca para revisar, no para decidir.
- **Trazado y justificado** — cada peso del presupuesto con su motivo y su dato. (Nunca "auditado".)
- **Efecto en las compras** — cuánto se movió la compra tras una corrección, contra comercios sin intervención. (Nunca "retorno" ni "rentabilidad".)
- **Sin justificar** — inversión actual sin motivo registrado. Un hallazgo.
- **Registro** — todo cambio queda anotado; no se edita ni se borra.
