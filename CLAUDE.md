# Canchero — Guía de Arquitectura

## Stack

| Capa | Tecnología |
|------|-----------|
| Monorepo | Turborepo + pnpm workspaces |
| Web (dashboard) | Next.js 15 App Router |
| Mobile (clientes) | Expo 54 + Expo Router |
| UI compartida | Tamagui (cross-platform) |
| Backend | Convex (real-time) |
| Tipado | TypeScript strict |
| Linting | ESLint v9 flat config |

---

## Arquitectura Frontend — Atomic Design

Todas las UI en `packages/ui` y en cada app siguen Atomic Design estricto.

```
atoms/        → Unidad mínima. Sin estado propio. Ej: Button, Text, Input, Icon
molecules/    → Combinación de atoms. Ej: SearchBar, FormField, Badge
organisms/    → Sección completa. Ej: Sidebar, ReservationCard, StatsPanel
templates/    → Layout de página sin datos reales. Solo estructura.
pages/        → Template + datos reales. En Next.js: app/ route segments.
```

### Reglas

- Un átomo NO importa moléculas ni organismos.
- Una molécula NO importa organismos.
- Los organismos pueden importar moléculas y átomos.
- Los templates no tienen lógica de negocio.
- Las páginas conectan organismos con datos (Convex queries).

---

## Arquitectura Backend — Hexagonal (Ports & Adapters)

Cuando arranquemos el backend (Convex), usamos separación de responsabilidades:

```
convex/
  schema.ts           → Definición de entidades (el "qué")
  functions/          → Casos de uso (queries y mutations por dominio)
    reservations/
    courts/
    venues/
    ...
  lib/                → Lógica de dominio pura (sin dependencias de Convex)
    validators.ts
    helpers.ts
```

### Reglas

- Las funciones en `functions/` son los puertos de entrada.
- La lógica de negocio va en `lib/` — sin referencias a `ctx` de Convex.
- Un módulo de dominio (ej: reservations) no importa de otro módulo directamente. Si necesita datos de otro, los recibe como parámetro.

---

## Convenciones de código

- Siempre TypeScript strict. `any` es un error de lint.
- Nombres de archivos: `kebab-case.ts`, componentes: `PascalCase.tsx`.
- Exports nombrados, nunca default en componentes.
- Cada carpeta de feature tiene su propio `index.ts` barrel.
- No instalar dependencias sin que el módulo que las necesita esté siendo implementado.

---

## Flujo de desarrollo

1. Front primero, módulo por módulo.
2. Cada módulo = feature branch.
3. Los datos se mockean hasta que el backend esté listo.
4. Las dependencias se instalan cuando el módulo las necesita, no antes.

---

## Jerarquía de entidades del dominio

```
Admin
 └── valida → Dueño
               └── tiene → Sede (1 o muchas)
                             └── tiene → Cancha (1 o muchas)
```

Los roles son: Admin, Dueño, Empleado, Cliente.
