# CANCHERO — Project Init

## Vision

Sistema web-mobile para la gestión integral de reservas de canchas deportivas en Argentina.
Orientado a cuatro roles diferenciados con distintos niveles de acceso y responsabilidad.

---

## Roles

| Rol | Descripción |
|-----|-------------|
| Admin | Valida que los dueños dados de alta en el sistema sean legítimos. Rol anti-fraude, no operativo. |
| Dueño | Gestiona su negocio: puede tener una o múltiples sedes, cada una con sus propias canchas. |
| Empleado | Acceso operativo limitado. Gestiona reservas y calendario, sin acceso a finanzas ni configuración. |
| Cliente | Reserva canchas desde la app mobile. Ve su historial y próximas reservas. |

---

## Jerarquía de entidades

```
Admin
 └── valida →  Dueño
                └── tiene →  Sede (1 o muchas)
                              └── tiene →  Cancha (1 o muchas)
```

---

## Layout general del Dashboard

### Sidebar

Navegación principal del dashboard, siempre visible, colapsable.

#### Estados

| Estado | Comportamiento |
|--------|----------------|
| **Expandida** | Muestra icono + etiqueta de cada sección |
| **Compacta** | Muestra solo iconos. Tooltip con el nombre al hacer hover. |

- El toggle expand/colapsar se activa con un botón o ícono dentro de la misma sidebar.
- El estado persiste entre navegaciones (no se resetea al cambiar de sección).

#### Estructura

```
┌─────────────────┐
│  Logo / Brand   │  ← visible en ambos estados
├─────────────────┤
│  Reservas       │
│  Calendario     │
│  Canchas        │
│  Clientes       │
│  Finanzas       │  ← ítems de navegación
│  Estadísticas   │
│  Sedes          │
│  Configuración  │
├─────────────────┤
│  [Avatar]       │
│  Nombre         │  ← usuario logueado (al pie)
│  Rol            │
└─────────────────┘
```

#### Usuario al pie

Muestra siempre al final de la sidebar:
- Avatar o inicial del nombre
- Nombre completo _(solo en estado expandido)_
- Rol activo _(solo en estado expandido)_

---

## Módulos del Dashboard (Owner)

| # | Módulo | Descripción |
|---|--------|-------------|
| 1 | Reservas | Vista general con KPIs y tabla de reservas recientes |
| 2 | Calendario | Vista tipo timeline por cancha con cards de reservas |
| 3 | Canchas | ABM de canchas |
| 4 | Clientes | ABM de clientes |
| 5 | Finanzas | Ingresos, pagos, pendientes |
| 6 | Estadísticas | Métricas del negocio |
| 7 | Sedes | Gestión de múltiples sedes |
| 8 | Configuración | Ajustes de cuenta y negocio |

---

## Módulo 1 — Reservas (Dashboard Overview)

Vista principal del dashboard. Muestra el estado del negocio en tiempo real.

### KPIs

| KPI | Descripción |
|-----|-------------|
| Reservas de hoy | Total de turnos agendados para el día |
| Ingreso semanal | Suma de pagos confirmados en la semana |
| Pagos pendientes | Reservas sin cobro completo |
| Canchas activas | Canchas habilitadas en este momento |

### Tabla de reservas recientes

| Columna | Detalle |
|---------|---------|
| Cliente | Nombre del cliente |
| Cancha | Cancha asignada |
| Horario | Franja horaria de la reserva |
| Estado | `Pagado` / `Señado` / `Paga en cancha` |
| Total | Monto total de la reserva |

---

## Módulo 2 — Calendario

### Modos de vista

El calendario soporta tres modos de visualización, seleccionables desde un control tipo toggle/tab:

| Modo | Descripción |
|------|-------------|
| **Día** | Vista detallada. Timeline por cancha con cards completas y acciones. Vista por defecto. |
| **Semana** | Vista compacta. Muestra los 7 días con indicadores de ocupación por cancha. Sin acciones directas. |
| **Mes** | Vista general. Calendario mensual con densidad de reservas por día. Sin acciones directas. |

---

### Navegación

- Flechas `‹ ›` para avanzar o retroceder en el periodo activo (día / semana / mes).
- Botón **Hoy** para volver al periodo actual.
- Selector de fecha (date picker) para saltar a cualquier día directamente.

---

### Vista Día (detallada)

Vista tipo **timeline horizontal por cancha**. Cada columna representa una cancha activa. Las reservas se muestran como cards dentro de la columna correspondiente.

- **Eje Y (izquierda):** horarios del día, con una línea que marca el momento actual.
- **Columnas:** una por cada cancha activa.
- **Cards:** representan reservas, con estado visual diferenciado.

---

### Vista Semana (compacta)

- Filas: canchas activas.
- Columnas: días de la semana (Lun → Dom).
- Cada celda muestra un resumen visual de ocupación (ej: barra de progreso o cantidad de reservas).
- Click en una celda → navega a la Vista Día de esa cancha en ese día.

---

### Vista Mes (general)

- Calendario mensual estándar.
- Cada día muestra el total de reservas agendadas.
- Click en un día → navega a la Vista Día de ese día.

---

### Estados de cards

#### Señado / Pagó en app — cobra en cancha
El cliente reservó y pagó la seña desde la app, pero abona el resto presencialmente.

**Acciones al clickear:**
- Confirmar cobro en cancha → modalidad: efectivo o Mercado Pago
- Cancelar reserva por ausencia del cliente → retener seña

---

#### En cancha — jugando
El cliente está actualmente en cancha.

**Información visible:**
- Tiempo transcurrido
- Tiempo restante
- Estado de la siguiente franja horaria (disponible / ocupada)

**Acciones al clickear:**
- Extender la reserva → muestra diferencia a pagar y tiempo agregado

---

#### Ausente
El cliente no se presentó.

---

#### Pagado completo
Reserva cobrada en su totalidad.

---

### Acción sobre espacio vacío

Al hacer hover sobre un espacio libre en el calendario, aparece la opción de añadir:

| Tipo | Descripción |
|------|-------------|
| Reserva | Turno manual (sin app) |
| Mantenimiento | Bloqueo de franja horaria |
| Evento | Reserva de tipo evento especial |

---

### Tipos de nueva entrada

#### Reserva manual
Para clientes que contactan por WhatsApp, llamada, o se presentan en el local.

**Campos:**
- Nombre del cliente
- Inicio de la reserva
- Duración
- Total a cobrar
- _(Opcional)_ Convertir a **turno fijo** → para actividades recurrentes (torneos, profesores, entrenamientos semanales/mensuales)

---

#### Mantenimiento
Bloqueo de una franja horaria por razones operativas.

**Campos:**
- Descripción _(opcional)_
- Inicio
- Duración

---

#### Evento
Reserva de tipo evento especial (ej: cumpleaños).

**Campos:**
- Nombre del evento
- Inicio
- Duración

---

---

## Módulo 3 — Canchas

Vista de gestión de canchas pertenecientes a la sede actualmente seleccionada.

---

### Lista de canchas

Las canchas se muestran como un grid de cards. Cada card contiene:

| Campo | Detalle |
|-------|---------|
| Imagen | Foto principal de la cancha |
| Nombre | Identificador de la cancha (ej: "Cancha 1", "La Principal") |
| Deporte / Tipo | Tipo de cancha (ej: Fútbol 5, Pádel, Tenis) |
| Cobertura | Techada / Aire libre |
| Superficie | Tipo de piso (ej: Sintético, Césped, Cemento, Tierra) |
| Estado | Switch de estado: **Activa** / **Mantenimiento** / **Cerrada** |

El switch de estado permite cambiar rápidamente la disponibilidad de la cancha sin entrar al detalle. Los tres estados posibles son:

| Estado | Efecto |
|--------|--------|
| Activa | Disponible para reservas |
| Mantenimiento | No reservable. Visible en calendario como bloqueada |
| Cerrada | No reservable. No aparece en el flujo de reservas del cliente |

---

### Agregar cancha

Existe una card especial en el grid con un botón / ícono de `+` para agregar una nueva cancha. Al presionarla se abre un modal.

---

### Modal — Nueva cancha

#### Campos

| Campo | Tipo | Detalle |
|-------|------|---------|
| Fotos | Upload múltiple | Mínimo 1 foto. La primera foto es la imagen principal de la card |
| Nombre | Texto | Nombre identificatorio de la cancha |
| Deporte / Tipo | Selector | Ej: Fútbol 5, Fútbol 7, Pádel, Tenis, Básquet |
| Superficie | Selector | Sintético, Césped natural, Cemento, Tierra |
| Cobertura | Toggle | Techada / Aire libre |

---

#### Horario de la cancha

Por defecto, cada cancha **hereda el horario general de la sede**. Sin embargo, es posible configurar un horario particular por cancha que **reemplaza** al de la sede para esa cancha específica.

```
Sede
 └── Horario general (ej: Lun–Dom 08:00–23:00)
       └── Cancha X → sin horario propio → usa el de la sede
       └── Cancha Y → con horario propio → prevalece sobre el de la sede
```

Dentro del modal existe una sección colapsable **"Horario personalizado"**. Si el usuario no la expande ni configura nada, la cancha hereda el horario de la sede automáticamente.

Si el usuario la activa:

| Campo | Detalle |
|-------|---------|
| Días habilitados | Selector múltiple de días (Lun / Mar / Mié / Jue / Vie / Sáb / Dom) |
| Horario de apertura | Hora de inicio para cada día habilitado |
| Horario de cierre | Hora de fin para cada día habilitado |

> El sistema usa este horario para validar la disponibilidad al crear reservas. Si la reserva cae fuera del horario activo de la cancha, no se permite.

---

---

## Módulo 4 — Clientes

Vista de gestión de clientes que reservan en el establecimiento. Accesible por el dueño y el empleado.

---

### Lista de clientes

Vista tabular o en cards de todos los clientes registrados. Información visible por cliente:

| Campo | Detalle |
|-------|---------|
| Avatar / Nombre | Identidad del cliente |
| Reservas totales | Cantidad de turnos históricos |
| Última reserva | Fecha de la reserva más reciente |
| Puntuación | Score del cliente (ver sistema de puntuación) |
| Estado | Activo / Bloqueado / Baneado |

---

### Perfil de cliente

Al hacer click en un cliente se accede a su perfil con estadísticas detalladas:

| Dato | Detalle |
|------|---------|
| Historial de reservas | Lista de reservas pasadas y futuras |
| Cancelaciones | Cantidad y porcentaje de reservas canceladas |
| Inasistencias | Veces que no se presentó sin cancelar |
| Total gastado | Monto acumulado en el establecimiento |
| Cancha favorita | Cancha con mayor cantidad de reservas |
| Puntuación recibida | Score otorgado por el establecimiento |
| Reseñas escritas | Calificaciones que el cliente dejó sobre canchas/sedes |

---

### Acciones sobre el cliente

| Acción | Detalle |
|--------|---------|
| Bloquear | Impide al cliente hacer nuevas reservas temporalmente |
| Banear | Exclusión permanente del establecimiento |
| Recompensar | Reconocimiento positivo al cliente (ver sistema de puntuación) |

---

### Sistema de puntuación _(en definición)_

Sistema bidireccional de reputación entre clientes y establecimientos.

#### Dirección de las calificaciones

| Quién califica | A quién | Cuándo |
|----------------|---------|--------|
| Cliente | Cancha / Sede | Después de una reserva completada |
| Dueño / Empleado | Cliente | Después de una reserva completada |

#### Opciones abiertas a debate

El destino de los puntos acumulados por el cliente aún está en definición. Las opciones posibles son:

**Opción A — Reputacional pura**
Los puntos funcionan como un indicador de confianza. Sin beneficios económicos directos.
Usos posibles: badge de "cliente frecuente", prioridad en disponibilidad, visibilidad para el dueño.

**Opción B — Loyalty con beneficios concretos**
Los puntos se traducen en beneficios canjeables: descuentos, horas gratis, upgrades de cancha.
Requiere definir tabla de conversión y quién absorbe el costo (el dueño lo configura por sede).

**Opción C — Híbrido**
Un score de reputación separado de un programa de fidelización opcional por sede.
El dueño decide si activa el programa de beneficios o solo usa el sistema reputacional.

> **Decisión pendiente.** Se documenta cuando esté definida la dirección.

---

---

## Módulo 5 — Finanzas

Vista compacta de ingresos y movimientos del establecimiento.

---

### KPIs

Filtros disponibles en la parte superior:

| Filtro | Opciones |
|--------|----------|
| Período | Día / Semana / Mes |
| Cancha | Todas / cancha específica |

KPIs visibles según el período y cancha seleccionados:

| KPI | Descripción |
|-----|-------------|
| Total Mercado Pago | Suma de pagos completos procesados por Mercado Pago |
| Total Efectivo | Suma de cobros en efectivo |
| Total Señas | Suma de señas recibidas (parciales, aún no cobradas en su totalidad) |
| Total General | Suma de todos los ingresos del período |

---

### Tabla de transacciones

Listado de movimientos con la siguiente información por fila:

| Columna | Detalle |
|---------|---------|
| Cliente | Nombre del cliente |
| Día y horario | Día de semana + franja horaria de la cancha reservada |
| Fecha de reserva | Fecha en que se realizó la reserva |
| Mercado Pago | Monto cobrado por Mercado Pago |
| Seña | Monto de seña abonado |
| Total | Monto total de la transacción |

Al pie de la tabla: **cantidad total de movimientos** del período filtrado.

---

### Exportación

Botón para exportar la tabla de transacciones a **Excel o CSV**.

> Feature premium — disponible solo en plan pago.

---

## Módulo 6 — Estadísticas / Reportes

> **Estado: Próximamente.** Este módulo estará disponible en una etapa futura del producto como funcionalidad premium.

La idea central es exponer estadísticas históricas derivadas de toda la información recopilada por el sistema: reservas, clientes, canchas, ingresos, ocupación, comportamiento, etc.

El detalle del módulo se define cuando se aborde la etapa premium del producto.

---

## Modelo de planes — Freemium / Premium

CANCHERO opera con un modelo de planes diferenciados. Las funcionalidades premium son opcionales y se habilitan según el plan contratado por el dueño.

### Límites por plan _(valores a definir)_

| Límite | Free / Base | Premium |
|--------|-------------|---------|
| Canchas por sede | N (ej: 2) | Ilimitadas |
| Sedes por cuenta | N (ej: 1) | Ilimitadas |
| Empleados por sede | N (ej: 1) | Ilimitados |

### Features premium

| Feature | Descripción |
|---------|-------------|
| Estadísticas / Reportes | Historial analítico completo del negocio |
| Integración Mercado Pago | Cobros online desde la app del cliente |
| Exportación Excel / CSV | Descarga de datos de reservas, clientes y finanzas |
| _(otras a definir)_ | — |

> Los valores exactos de los límites del plan base y los features adicionales del plan premium están pendientes de definición.

---

---

## Módulo 7 — Sedes

Vista de gestión de sedes del dueño. Permite tener una visión panorámica de cada sede y cambiar el contexto activo del dashboard.

---

### Selector de sede activa

El dashboard opera siempre en el contexto de **una sede activa**. Toda la información que se muestra (canchas, calendario, reservas, finanzas) corresponde a la sede seleccionada.

Al seleccionar una sede desde este módulo, el dashboard completo se recarga con la configuración y datos de esa sede.

> La ubicación del selector de sede en la UI (sidebar, topbar, etc.) está pendiente de definición.

---

### Cards de sedes

Cada sede se muestra como una card con una vista rápida:

| Campo | Detalle |
|-------|---------|
| Nombre de la sede | Identificador de la sede |
| Canchas activas | Listado compacto o conteo de canchas habilitadas |
| Próximo turno | Próxima reserva agendada en esa sede |
| Ingresos | Lo que está generando la sede (período a definir: hoy / semana) |

---

### Crear nueva sede

Existe una card o botón para crear una nueva sede. El detalle del formulario de alta está pendiente de definición.

---

> **Módulo en definición.** La estructura base está clara; el detalle de las cards, el formulario de alta y la ubicación del selector de sede se irán completando.

---

---

## Módulo 8 — Configuración

Ajustes de la sede activa. Organizado en pestañas.

---

### Pestaña: Información General

| Campo | Tipo |
|-------|------|
| Nombre de la sede | Texto |
| Descripción | Textarea |
| Dirección | Texto |
| Teléfono / Celular | Texto |
| Email de contacto | Email |

---

### Pestaña: Horarios

Tabla con una fila por día de la semana (Lunes → Domingo):

| Columna | Detalle |
|---------|---------|
| Día | Nombre del día |
| Activo | Switch encendido / apagado |
| Estado | Abierto / Cerrado (derivado del switch) |
| Apertura | Hora de inicio (picker) |
| Cierre | Hora de fin (picker) |

Los campos de apertura y cierre se deshabilitan cuando el día está inactivo.

---

### Pestaña: Precios y Pagos

#### Tarifas

| Tarifa | Detalle |
|--------|---------|
| Diurna | Precio por hora / fracción en horario diurno |
| Nocturna | Precio por hora / fracción con luces encendidas |

- Input para definir el **inicio del horario nocturno** (ej: 19:00). A partir de esa hora se aplica la tarifa nocturna automáticamente.

---

#### Política de cobro

El dueño define cómo se cobra cada reserva. Opciones:

| Opción | Detalle |
|--------|---------|
| Paga en cancha | El cliente no paga al reservar. Abona presencialmente. |
| Seña parcial | El cliente paga un porcentaje al reservar. Input configurable para definir el % de la seña. |
| Pago completo | El cliente abona el 100% al momento de la reserva. |

---

#### Ventana de reserva

Define con cuántos días de antelación máxima un cliente puede realizar una reserva.

- Input numérico (ej: 30 días).

---

#### Deadline de saldo

Para reservas con seña parcial, define cuántos días antes del turno el cliente debe completar el pago total.

**Regla complementaria — pago anticipado forzado**: si la reserva se realiza con una antelación mayor a N días (configurable), se exige el pago completo al momento de la reserva en lugar de aceptar una seña. Esto protege la disponibilidad de la cancha ante reservas muy anticipadas donde el riesgo de inasistencia es alto.

> Ejemplo: ventana de reserva = 30 días, umbral de pago forzado = 15 días. Si el cliente reserva con más de 15 días de antelación → pago completo obligatorio. Si reserva con menos de 15 días → puede pagar con seña.

---

#### Duraciones de reserva permitidas

El dueño define qué duraciones puede elegir el cliente al reservar. Selección múltiple:

- 60 min
- 90 min
- 120 min
- _(otras duraciones a definir)_

---

### Pestaña: Feriados / Días Cerrados

Gestión de fechas específicas en las que la sede no opera (feriados nacionales, vacaciones, mantenimiento, etc.).

#### Selector de fecha

Componente de calendario mensual navegable. Muestra con un indicador visual las fechas ya cargadas como cerradas.

#### Formulario de alta

| Campo | Tipo | Detalle |
|-------|------|---------|
| Fecha | Date picker | Pre-cargada con la fecha seleccionada en el calendario |
| Motivo | Texto libre | Descripción del cierre (ej: "Feriado Nacional", "Mantenimiento", "Vacaciones") |

Botón **Agregar** para confirmar el alta.

#### Lista de días cerrados

Tabla con las entradas registradas, ordenada por fecha ascendente:

| Columna | Detalle |
|---------|---------|
| Fecha | DD/MM/AAAA |
| Motivo | Texto ingresado |
| Acciones | Botón eliminar |

#### Comportamiento

- Un día cerrado **bloquea todos los turnos** de esa fecha para la sede activa.
- Si ya existen reservas en ese día, se muestra una alerta con la cantidad de reservas afectadas y se requiere confirmación antes de guardar.
- Los días cerrados se reflejan en el Calendario (Módulo 2) con un indicador visual diferenciado.

---

## Estado de documentación

| Módulo | Estado |
|--------|--------|
| Reservas (KPIs + tabla) | Documentado |
| Calendario (timeline + cards + acciones) | Documentado |
| Canchas | Documentado |
| Clientes | Documentado (sistema de puntuación pendiente de definición) |
| Finanzas | Documentado |
| Estadísticas | Documentado (próximamente — feature premium) |
| Sedes | Documentado (en definición) |
| Configuración | Documentado (4 pestañas: Info General, Horarios, Precios y Pagos, Feriados / Días Cerrados) |
| Modelo de planes | Documentado (valores de límites pendientes) |
| Mobile — Navegación global | Documentado |
| Mobile — Explorar (Home) | Documentado |
| Mobile — Buscar | Pendiente |
| Mobile — Mis Reservas | Pendiente |
| Mobile — Perfil | Pendiente |

---

---

## App Mobile — Cliente

La app mobile es el canal de acceso para los clientes. Permite explorar canchas cercanas, filtrar disponibilidad, reservar y gestionar sus turnos.

Stack: Expo 54 + Expo Router + Tamagui.

---

### Navegación global

Bottom tab bar siempre visible. Cuatro secciones:

| Tab | Ícono sugerido | Descripción |
|-----|----------------|-------------|
| Explorar | Mapa / brújula | Home. Descubrí canchas cercanas. |
| Buscar | Lupa | Búsqueda directa por nombre, sede o zona. |
| Mis Reservas | Calendario | Historial y próximos turnos del usuario. |
| Perfil | Avatar | Datos personales, preferencias y ajustes. |

---

### Pantalla — Explorar (Home)

Inspirada en Uber. El usuario abre la app, ve qué tiene cerca, filtra por cuándo quiere jugar y reserva directamente desde la lista o el mapa.

---

#### Layout general

```
┌──────────────────────────────────┐
│  Hola, [Nombre]   📍 [Ubicación] │  ← Saludo + ubicación actual
│                              🔔  │  ← Botón notificaciones
├──────────────────────────────────┤
│  ¿Cuándo querés jugar?           │
│  [ Fecha ]  [ Hora ]  [ Tipo ]   │  ← Filtros
├──────────────────────────────────┤
│  Canchas cerca tuyo              │
│                    [≡ Lista | 🗺] │  ← Toggle vista
│                                  │
│  [ Card cancha ]                 │
│  [ Card cancha ]                 │
│  [ Card cancha ]                 │
│  ...                             │
└──────────────────────────────────┘
```

---

#### Header

| Elemento | Detalle |
|----------|---------|
| Saludo | "Hola, [Nombre del usuario]" |
| Ubicación actual | Muestra la localidad o barrio detectado por GPS. Tappable para cambiar manualmente. |
| Botón notificaciones | Ícono de campana. Badge con conteo de notificaciones no leídas. Navega al centro de notificaciones. |

---

#### Filtros — ¿Cuándo querés jugar?

Tres chips/pills alineados horizontalmente. Al tocar cada uno se abre un bottom sheet con el selector correspondiente.

| Filtro | Comportamiento | Default |
|--------|---------------|---------|
| Fecha | Date picker. Permite seleccionar hoy o cualquier día futuro. | Hoy |
| Hora | Time picker por franja horaria (ej: 18:00 – 19:00). | Cualquier hora |
| Tipo de cancha | Selector múltiple: Fútbol 5, Fútbol 7, Pádel, Tenis, Básquet, etc. | Todas |

Los filtros son aplicados en tiempo real: la lista / mapa se actualiza al confirmar cada selección.

---

#### Toggle de vista

Control en la esquina superior derecha de la sección de resultados.

| Vista | Icono | Descripción |
|-------|-------|-------------|
| Lista | ≡ | Scroll vertical de cards. Default. |
| Mapa | 🗺 | Mapa interactivo con pins por cancha. Al tocar un pin se expande una mini-card. |

---

#### Vista Lista — Cards de cancha

Cada card muestra:

| Campo | Detalle |
|-------|---------|
| Foto | Imagen principal de la cancha. Ocupa el tercio izquierdo o el ancho completo superior de la card. |
| Calificación | Estrellas o score numérico (ej: ★ 4.8) |
| Favorito | Ícono de corazón. Tappable. Agrega / quita de favoritos. |
| Nombre del establecimiento | Nombre de la sede |
| Ubicación | Dirección o barrio |
| Distancia | Kilómetros desde la ubicación actual del usuario (ej: "1.2 km") |
| Precio por hora | Tarifa según el horario seleccionado en el filtro (diurna o nocturna) |
| Botón Reservar | CTA principal. Navega al flujo de reserva de esa cancha. |

---

#### Vista Mapa — Mapa interactivo

- Mapa centrado en la ubicación actual del usuario.
- Un pin por cancha disponible según los filtros activos.
- Al tocar un pin → se expande una mini-card flotante en la parte inferior con: foto, nombre, calificación, precio y botón Reservar.
- Botón "Volver a mi ubicación" si el usuario hizo scroll en el mapa.

---

_Documento vivo — se actualiza a medida que se define cada módulo._
