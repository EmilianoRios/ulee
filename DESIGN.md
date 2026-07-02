---
name: Canchero
description: Dashboard operativo para dueños de complejos deportivos
colors:
  verde-cancha: "oklch(50% 0.18 155)"
  verde-cancha-profundo: "oklch(32% 0.17 155)"
  verde-cancha-activo: "oklch(85% 0.058 155)"
  verde-cancha-fondo: "oklch(84% 0.052 155)"
  acento-terraza: "oklch(55% 0.13 42)"
  acento-terraza-claro: "oklch(92% 0.03 42)"
  texto-nav: "oklch(32% 0.012 75)"
  texto-nav-muted: "oklch(58% 0.01 75)"
  borde-calido: "oklch(88% 0.012 78)"
  superficie: "oklch(92.5% 0.016 224)"
  superficie-contenido: "oklch(97% 0.010 220)"
  superficie-sidebar: "oklch(96.5% 0.008 80)"
  cabecera-oscura: "oklch(22% 0.024 228)"
  texto-primario: "oklch(16% 0.014 222)"
  texto-muted: "oklch(48% 0.012 218)"
  texto-inactivo: "oklch(40% 0.014 224)"
  borde-neutral: "oklch(86% 0.016 222)"
  divisor: "oklch(88% 0.014 222)"
  fondo-hover: "oklch(89% 0.020 224)"
  kpi-strip-fondo: "oklch(28% 0.035 228)"
  kpi-strip-verde-acento: "oklch(56% 0.15 155)"
  kpi-strip-verde-suave: "oklch(56% 0.07 155)"
  kpi-strip-texto-claro: "oklch(97% 0.006 220)"
  kpi-strip-label-claro: "oklch(75% 0.02 228)"
  kpi-strip-divisor-claro: "oklch(97% 0.006 220 / 18%)"
typography:
  display:
    fontFamily: "Poppins, system-ui, sans-serif"
    fontSize: "24px"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.01em"
  headline:
    fontFamily: "Poppins, system-ui, sans-serif"
    fontSize: "18px"
    fontWeight: 600
    lineHeight: 1.3
  title:
    fontFamily: "Poppins, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 500
    lineHeight: 1.4
  body:
    fontFamily: "Poppins, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Poppins, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.02em"
rounded:
  sm: "4px"
  md: "7px"
  lg: "12px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  2xl: "48px"
components:
  button-primary:
    backgroundColor: "{colors.verde-cancha}"
    textColor: "oklch(98% 0.004 155)"
    rounded: "{rounded.md}"
    padding: "10px 20px"
  button-primary-hover:
    backgroundColor: "{colors.verde-cancha-profundo}"
    textColor: "oklch(98% 0.004 155)"
    rounded: "{rounded.md}"
    padding: "10px 20px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.verde-cancha}"
    rounded: "{rounded.md}"
    padding: "10px 20px"
  button-ghost-hover:
    backgroundColor: "{colors.verde-cancha-activo}"
    textColor: "{colors.verde-cancha-profundo}"
    rounded: "{rounded.md}"
    padding: "10px 20px"
  nav-item-active:
    backgroundColor: "{colors.verde-cancha-activo}"
    textColor: "{colors.verde-cancha-profundo}"
    rounded: "{rounded.md}"
    padding: "8px 12px"
  nav-item-hover:
    backgroundColor: "{colors.fondo-hover}"
    textColor: "{colors.texto-primario}"
    rounded: "{rounded.md}"
    padding: "8px 12px"
---

# Design System: Canchero

## 1. Overview

**Creative North Star: "El Cuaderno Digital"**

Canchero se siente como el cuaderno que el dueño siempre tuvo sobre el escritorio, ahora en una pantalla. No porque imite el papel, sino porque hereda la lógica de una herramienta física de confianza: todo tiene un lugar, nada está escondido, y el sistema trabaja para la persona, no al revés. Un dueño de complejo que viene del Excel o de la libreta debería abrir la app y sentir, en segundos, que ya sabe cómo usarla.

La interfaz gana calidez a través del layout y el espacio negativo, no de la decoración. Los colores confirman acciones. El espaciado crea ritmo. La jerarquía es inmediata. No hay widgets de dashboard compitiendo por la atención, ni métricas heroicas diseñadas para impresionar inversores. La pantalla muestra lo que el dueño necesita en este momento; todo lo demás espera.

Este sistema rechaza explícitamente la estética del dashboard SaaS genérico: paleta azul-blanca, grillas de cards con iconos, números grandes diseñados para verse impresionantes de un vistazo. Rechaza también la estética de herramienta de monitoreo (Grafana, PagerDuty) y el lenguaje visual deportivo estereotipado: sin gradientes, sin neon, sin tipografía de camiseta. Canchero es para un dueño de cancha atendiendo clientes a las 10am, no para un desarrollador en un incident call a las 2am.

**Key Characteristics:**
- Flat y tonal: la profundidad viene de la relación de colores, no de sombras
- Acento dual-cálido: verde para la acción, tierra para la identidad
- Sistema de una sola fuente: Poppins, cinco pesos, contraste de jerarquía fuerte
- Estados táctiles: hover y active son visibles e inmediatos
- Lenguaje del negocio, no del equipo de producto

## 2. Colors: La Paleta del Complejo

Dos familias de acento y una base neutral. El verde confirma, los tonos cálidos anclan, el azul-gris sostiene todo en su lugar.

### Primary
- **Verde Cancha** (`oklch(50% 0.18 155)`): El color interactivo principal. Usado en ítems de navegación activos, estados de confirmación, botones primarios y affordances interactivos. Suficientemente apagado para leerse como profesional; suficientemente saturado para ser inequívocamente accionable. No es el verde neon de una marca deportiva, es el verde funcional de una reserva confirmada.
- **Verde Cancha Profundo** (`oklch(32% 0.17 155)`): Hover y pressed en elementos primarios. También para texto de avatar y badge sobre fondos verde claro. Aporta profundidad sin cambiar de familia de hue.
- **Verde Cancha Activo** (`oklch(85% 0.058 155)`): Wash de fondo para ítems de navegación activos y estados seleccionados. Baja saturación a esta luminosidad; apenas suficiente verde para registrarse como seleccionado sin competir con el texto.
- **Verde Cancha Fondo** (`oklch(84% 0.052 155)`): Fondos de avatar y badge PRO. Misma familia de luminosidad que el fondo activo; algo más de saturación para diferenciación visual.

### Secondary
- **Acento Terraza** (`oklch(55% 0.13 42)`): El acento naranja-marrón cálido. Usado para momentos de marca en el Tamagui config. Evoca terracota, madera, la textura física de un complejo deportivo. Convive con el verde en lugar de reemplazarlo.
- **Acento Terraza Claro** (`oklch(92% 0.03 42)`): Wash muy claro del acento; cromatismo mínimo a esta luminosidad. Tinte de fondo para zonas de sidebar y contextos de UI cálida.

### Tertiary
- **Texto Nav / Headings** (`oklch(32% 0.012 75)`): Títulos de página y texto de navegación en reposo. Oscuro, cálido, terroso. No es negro, no es gris, es un marrón que conecta los headings con la familia terracota sin gritar.
- **Texto Nav Muted** (`oklch(58% 0.01 75)`): Texto de navegación secundario y labels en contextos cálidos. Versión más suave del mismo hue.
- **Borde Cálido** (`oklch(88% 0.012 78)`): Bordes en el contexto del sidebar. Suficientemente claro para ser estructural sin volverse decorativo.

### Neutral
- **Superficie** (`oklch(92.5% 0.016 224)`): Fondo del área de contenido del sidebar. Azul-gris muy bajo en cromatismo, se lee como blanco roto pero con una leve inclinación fría que mantiene legibles los acentos cálidos.
- **Superficie Contenido** (`oklch(97% 0.010 220)`): Fondo del área principal de contenido. Casi blanco con un rastro de azul. La superficie de lectura primaria.
- **Superficie Sidebar** (`oklch(96.5% 0.008 80)`): Fondo alternativo del sidebar en el Tamagui config; leve calidad cálida.
- **Cabecera Oscura** (`oklch(22% 0.024 228)`): Fondo del header oscuro del sidebar. Azul-marino profundo que ancla la esquina superior izquierda de la app. Establece autoridad sin llegar al negro.
- **Texto Primario** (`oklch(16% 0.014 222)`): Texto de cuerpo y label principal. Casi negro con tinte azul, legible en todas las superficies claras.
- **Texto Muted** (`oklch(48% 0.012 218)`): Texto secundario, metadatos, timestamps. Gris medio con el mismo tinte de familia azul.
- **Texto Inactivo** (`oklch(40% 0.014 224)`): Ítems de navegación inactivos y estados deshabilitados.
- **Borde Neutral** (`oklch(86% 0.016 222)`): Bordes por defecto en superficies. Claro, estructural, no decorativo.
- **Divisor** (`oklch(88% 0.014 222)`): Divisores entre secciones. Un paso más claro que el borde.
- **Fondo Hover** (`oklch(89% 0.020 224)`): Fondo para ítems de navegación en hover. Familia azul-gris, claramente distinto del verde activo.

### KPI Strip (Contextual Dark — excepción sancionada)
El strip de KPIs (Reservas, Finanzas, Canchas) es la única superficie de la app con fondo oscuro fuera del sidebar header. Nació de iterar en vivo hasta encontrar el punto que no se sintiera "hero-metric" (número gigante en caja de ícono) ni "SaaS azul-blanco" ni "gris sucio" — un `color-mix` naive entre dos colores de luminosidad muy distinta interpola por una zona desaturada intermedia y siempre lee sucio; los tonos de abajo están **autorados directamente en OKLCH**, no mezclados.

- **KPI Strip Fondo** (`oklch(28% 0.035 228)`): Navy oscuro, misma familia de hue que Cabecera Oscura (228) pero autorado aparte, no derivado de ella por mezcla. Ancla visual que hace eco del header sin duplicarlo.
- **KPI Strip Verde Acento** (`oklch(56% 0.15 155)`): Ícono y valor destacado (Facturado, Total) sobre el fondo oscuro. Mismo hue que Verde Cancha, pero autorado con luminosidad media (56%) para leerse con autoridad sin llegar a neón — el error inicial fue un verde muy claro y saturado (`78% L`) que sí leía neón sobre navy.
- **KPI Strip Verde Suave** (`oklch(56% 0.07 155)`): Misma luminosidad que el acento, menos croma. Diferencia jerarquía por saturación, no por acercarse al blanco — para métricas "pendientes/en curso" (Pendiente de cobro, Señas, A cobrar) que necesitan leerse como la misma familia pero con menos peso.
- **KPI Strip Texto Claro** (`oklch(97% 0.006 220)`): Valor por defecto (no destacado) sobre el fondo oscuro.
- **KPI Strip Label Claro** (`oklch(75% 0.02 228)`): Label uppercase sobre el fondo oscuro.
- **KPI Strip Divisor Claro** (`oklch(97% 0.006 220 / 18%)`): Línea punteada entre métricas, translúcida sobre el navy.

### Named Rules
**The Two-Family Rule.** El verde confirma acción y selección. Los tonos cálidos establecen identidad y jerarquía. Estas dos familias no se sustituyen entre sí. Un estado de confirmación nunca es cálido; un heading nunca es verde.

**The No-Black Rule.** Sin negro puro, sin blanco puro. Cada neutral está teñido hacia la familia azul-gris (cromatismo 0.010–0.024). Los neutrales teñidos mantienen la paleta coherente bajo distintas calibraciones de monitor.

**The No-Naive-Mix Rule.** Nunca usar `color-mix()` entre dos colores de luminosidad muy distinta para generar un tinte de fondo — interpola por una zona desaturada y lee sucio. Autorar el tono final directamente en OKLCH (luminosidad + croma + hue elegidos a mano), como ya hacían Verde Cancha Fondo y Acento Terraza Claro antes de esta regla, y como hace ahora KPI Strip Fondo.

## 3. Typography

**Display / Body Font:** Poppins (con fallback system-ui, sans-serif)

Poppins es la única fuente. Cinco pesos (400, 500, 600, 700, 800) dan rango suficiente para construir jerarquía clara sin introducir una segunda fuente que complique el sistema. A la escala de un dashboard operativo, un single sans geométrico y cálido se lee como autoridad amigable, ni corporativo ni casual.

**Character:** Geométrico, redondeado, cálido. Poppins a 600 en un heading se lee confiado sin ser rígido. A 400 en cuerpo de texto, es cómodo de recorrer con rapidez. El contraste de peso (400 → 600 entre niveles) mantiene la jerarquía legible sin depender solo del tamaño.

### Hierarchy
- **Display** (peso 600, 24px, line-height 1.2, tracking -0.01em): Títulos de página y héroes de sección. Usado una vez por vista, máximo. Color: `texto-nav` (el marrón cálido ata los headings a la identidad de marca).
- **Headline** (peso 600, 18px, line-height 1.3): Headings de sección y títulos de panel dentro de una vista.
- **Title** (peso 500, 16px, line-height 1.4): Labels de subsección, títulos de card, grupos nombrados.
- **Body** (peso 400, 14px, line-height 1.5): Todo el texto de lectura, filas de tabla, detalles de reserva. Máximo 65ch en superficies con mucho texto.
- **Label** (peso 500, 12px, line-height 1.4, tracking 0.02em): Chips de estado, badges, ítems del sidebar de navegación, timestamps, labels de sección.

### Named Rules
**The Single Voice Rule.** Una fuente, cinco pesos. Nunca introducir una segunda tipografía para acento, display o branding. La jerarquía se logra solo con contraste de peso y tamaño. Agregar una segunda fuente rompe la quietud del sistema.

**The No-Scale-Compression Rule.** Ratio mínimo entre niveles de jerarquía adyacentes: 1.25. Display (24px) a Headline (18px) es 1.33. Headline a Title es 1.125 — borderline; compensar haciendo el contraste de peso fuerte (600 vs 500). Nunca dos niveles adyacentes con el mismo peso.

## 4. Elevation

Canchero es plano por defecto. Sin sombras decorativas. Las superficies se separan a través del color: un área de contenido más clara (`superficie-contenido`) descansa sobre el área del sidebar (`superficie`), que contrasta con el header oscuro (`cabecera-oscura`). No hay vocabulario de sombras en la implementación actual.

Cuando una superficie necesita sentirse elevada, lo hace a través del contraste de luminosidad del fondo y un borde sutil, no de un drop shadow. El gradiente oscuro-a-claro del panel izquierdo (header navy oscuro → superficie → contenido casi blanco) provee la única profundidad de tres capas en el sistema.

Los estados interactivos (focus, hover, active) usan cambios de color en lugar de elevación: el focus ring es `oklch(48% 0.19 155)` a 2px, un outline verde que anuncia interactividad a través de un cambio de hue, no de un lift espacial.

### Named Rules
**The Flat-by-Default Rule.** Sin `box-shadow` en reposo. Si un componente parece necesitar sombra, probablemente necesita un borde. La sombra está reservada para capas de popover (tooltips, dropdowns, datepickers) que genuinamente flotan sobre el documento.

**The Tonal Depth Rule.** Tres niveles de luminosidad en el layout: oscuro (22%), medio (92–97%), casi blanco (97–99%). Estos niveles hacen el trabajo que las sombras harían en un sistema más decorativo. Respetarlos; no colapsarlos con overrides de fondo.

## 5. Components

### Buttons
Táctiles e inmediatos. Los botones primarios confirman acciones; los ghost ofrecen alternativas sin presión.

- **Shape:** Suavemente redondeado (7px de radio). No pill, no cuadrado. Suficientemente familiar para no sentirse diseñado.
- **Primary:** Fondo Verde Cancha (`oklch(50% 0.18 155)`), texto casi blanco (`oklch(98% 0.004 155)`), padding 10px vertical / 20px horizontal, peso 500.
- **Hover / Focus:** El fondo se profundiza a Verde Cancha Profundo (`oklch(32% 0.17 155)`) en 150ms ease-out. Focus ring: 2px verde en `oklch(48% 0.19 155)` con 7px border-radius, 2px offset.
- **Ghost:** Fondo transparente, texto Verde Cancha. En hover, fondo Verde Cancha Activo y texto Profundo. Usado para acciones secundarias que comparten un panel con una primaria.
- **Sin estado disabled como diseño.** Si una acción no está disponible, ocultarla o reemplazarla con contexto de por qué. Los botones grises generan confusión en usuarios no técnicos.

### Chips / Badges
- **Style:** Pequeños, rounded-full, fondo teñido. Estado (activo/disponible) usa fondo `verde-cancha-fondo` + texto Profundo. Badge PRO usa la misma familia.
- **State:** Sin patrón toggle seleccionado/no seleccionado. Los chips en Canchero indican estado (estado de reserva, disponibilidad de cancha), no filtros. Se leen, no se cliquean.

### Cards / Containers
Las cards existen para entradas de reservas y listados de canchas, contextos donde el límite del ítem importa para el escaneo. No se usan de forma decorativa.

- **Corner Style:** Radio de 7px (consistente con botones).
- **Background:** Superficie Contenido (`oklch(97% 0.010 220)`).
- **Shadow Strategy:** Ninguna en reposo. Si la card es interactiva (clickeable), borde 1px Borde Neutral en reposo, transitando a Borde Cálido en hover.
- **Border:** 1px Borde Neutral. Estructural, no decorativo.
- **Internal Padding:** 16px (md spacing). Todos los bordes iguales salvo si la card tiene una fila de título; en ese caso: 16px en lados y bottom, 12px bajo el título.
- **Las cards anidadas son siempre incorrectas.** Una lista dentro de una card es una tabla. Una card dentro de una card es confusión de layout. Reescribir como sección con divisor.

### Inputs / Fields
- **Style:** Borde 1px Borde Neutral, fondo Superficie Contenido, radio 7px.
- **Focus:** El borde pasa a Verde Cancha (`oklch(50% 0.18 155)`) a 2px. Sin glow, sin blur. El cambio de color es suficiente.
- **Error:** El borde pasa a rojo cálido (a definir cuando se implementen los estados de error). Mensaje de error en peso body debajo del campo, nunca adentro.
- **Disabled:** Fondo Fondo Hover, texto Texto Inactivo. Reducir el borde a 0.5px.

### Navigation
- **Style:** Sidebar izquierdo. Sección de header oscuro (navy `oklch(22% 0.024 228)`) para branding e identidad de usuario; área de superficie más clara debajo para los ítems de nav.
- **Typography:** Escala Label (12px, peso 500) para labels de sección; escala Body (14px, peso 400–500) para ítems de nav.
- **Default state:** Fondo transparente, color Texto Inactivo.
- **Hover:** Fondo Fondo Hover (`oklch(89% 0.020 224)`), color Texto Primario. Transición: 100ms ease-out.
- **Active:** Fondo Verde Cancha Activo (`oklch(85% 0.058 155)`), texto Verde Cancha Profundo (`oklch(32% 0.17 155)`). Sin stripe de borde izquierdo.
- **Mobile:** El sidebar colapsa a una barra de navegación inferior en viewports pequeños (no implementado aún).

### KPI Strip
Franja de métricas al tope de Reservas, Finanzas y Canchas. Reemplaza el patrón hero-metric (caja de ícono + número de 44px) prohibido en este documento.

- **Fondo:** `kpi-strip-fondo` (navy oscuro autorado, ver sección 2). Único lugar de la app con esta excepción al fondo claro — ver Do's and Don'ts.
- **Layout por métrica:** ícono inline junto al label (nunca en caja separada) → valor en negrita debajo → una barra de color de 3px de alto bajo el valor, en vez de icon-box o border-left de acento.
- **Tipografía:** label uppercase 12.5px/500 en `kpi-strip-label-claro`; valor 29px/700 (31px para la métrica de cierre, ej. "Total") en `kpi-strip-texto-claro` por defecto, o `kpi-strip-verde-acento` cuando la métrica es la cifra principal confirmada (Facturado, Total, Ingresos hoy).
- **Color por métrica:** `kpi-strip-verde-acento` para confirmado/cerrado, `kpi-strip-verde-suave` para pendiente/en curso — la jerarquía se expresa en croma, no en acercarse al blanco.
- **Divisores:** línea punteada vertical entre métricas en `kpi-strip-divisor-claro`, nunca sólida ni como accent stripe.
- **Íconos:** 17px, siempre en `kpi-strip-verde-acento`, nunca dos conceptos distintos comparten el mismo ícono entre páginas hermanas (ej. no reusar `Banknote` para "Efectivo" y "Pendiente de cobro" a la vez).

### Sidebar Header (Signature Component)
El sidebar header es el elemento visualmente más distintivo de la implementación actual. Fondo navy oscuro, texto claro para el nombre de la sede, subtexto muted para el subtítulo, un ícono teal-verde a 68% de luminosidad (`oklch(68% 0.16 155)`). El avatar usa la familia verde: fondo `verde-cancha-fondo`, texto `oklch(28% 0.14 155)`.

Este componente rompe deliberadamente el patrón flat-claro del resto de la app: el ancla oscura en la esquina superior izquierda le dice al dueño dónde está antes de leer un solo label.

## 6. Do's and Don'ts

### Do:
- **Do** usar Verde Cancha para todas las confirmaciones interactivas: estados activos, indicadores de éxito, botones primarios. El verde significa "esta es la acción / esto está seleccionado."
- **Do** usar tonos marrón-cálido (`texto-nav`) para los títulos de página y headings. Conectan la identidad con la jerarquía sin introducir una segunda fuente.
- **Do** mantener las superficies planas. Un borde de 1px define cards e inputs; el contraste de luminosidad separa las zonas del layout.
- **Do** usar Poppins 600 para headings y Poppins 400 para cuerpo. El contraste de 2 pesos es la señal de jerarquía primaria.
- **Do** etiquetar los chips de estado con el lenguaje del negocio que usa el dueño: "Disponible", "Reservada", "Ocupada", no "Active", "Pending", "Locked."
- **Do** respetar `prefers-reduced-motion`. Todas las transiciones son respuestas de estado (100–200ms), no coreografía.
- **Do** mantener contraste WCAG AA en todo texto. Texto Primario (`oklch(16% 0.014 222)`) sobre Superficie Contenido (`oklch(97% 0.010 220)`) supera 10:1.

### Don't:
- **Don't** usar una paleta azul-blanca. Si una pantalla se lee como "SaaS dashboard genérico" solo por la paleta, falló. La familia dual cálida + verde es lo que hace reconocible a Canchero.
- **Don't** construir layouts hero-metric: número grande, label pequeño, stats de soporte, acento con gradiente. Ese patrón está prohibido. Un dueño de cancha lee su lista de reservas, no una torre de KPIs.
- **Don't** usar dark mode ni estética de herramienta de monitoreo (paleta Grafana, PagerDuty). Canchero es para uso diurno en la oficina del complejo. Claro, cálido, limpio. **Excepción sancionada:** el KPI Strip (sección 5) usa fondo oscuro deliberadamente, decisión explícita del dueño del producto tras iterar en vivo — no extender este tratamiento a otras superficies sin la misma validación.
- **Don't** usar gradientes neon, tipografía jersey/Impact, ni colores de camiseta de equipo. El producto es para operadores de complejos deportivos, no para una campaña de marca deportiva. Nada debe sentirse como una camiseta de fútbol.
- **Don't** usar `border-left` mayor a 1px como stripe de acento de color en ítems de nav, cards ni callouts. Reescribir con tinte de fondo o borde completo.
- **Don't** aplicar `background-clip: text` con un gradiente. Todo el texto es un color sólido único.
- **Don't** llegar a un modal como primera solución para acciones secundarias. Si la acción puede suceder inline o en un panel slide-over, hacerlo primero.
- **Don't** usar grillas de cards idénticas con ícono + heading + texto repetido N veces. Si los datos son tabulares, usar una tabla. Si es una lista, usar una lista.
- **Don't** introducir una segunda fuente. Poppins con cinco pesos es el vocabulario tipográfico completo.
- **Don't** mostrar complejidad que el dueño no pidió. Revelar opciones avanzadas de forma progresiva. La primera pantalla que el dueño ve al abrir Canchero no debería necesitar ninguna explicación.
