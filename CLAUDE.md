# Canchero — Guía de Arquitectura

## Stack

| Capa | Tecnología |
|------|-----------|
| Monorepo | Turborepo + pnpm workspaces |
| Web (dashboard) | Next.js 15 App Router |
| Mobile (clientes) | Expo 54 + Expo Router |
| UI compartida | Tamagui (cross-platform) — `@canchero/ui` |
| Backend | Convex (real-time) — `@canchero/backend` |
| Auth compartida | Clerk — `@canchero/auth` (tipos) + SDK por plataforma |
| Tipado | TypeScript strict |
| Linting | ESLint v9 flat config |

---

## Estructura del monorepo

```
apps/
  web/      → Next.js dashboard (@canchero/web)
  mobile/   → Expo app (@canchero/mobile)

packages/
  backend/  → Convex: schema, functions, tipos generados (@canchero/backend)
  auth/     → Tipos y constantes de auth compartidos (@canchero/auth)
  ui/       → Componentes Tamagui cross-platform (@canchero/ui)
  tsconfig/ → Configuraciones de TypeScript base (@canchero/tsconfig)
```

### REGLA CRÍTICA — Infraestructura compartida

**NUNCA pongas infraestructura compartida dentro de una app.**

Shared = va en `packages/`. La prueba del nueve: ¿lo necesitan dos o más apps? Si sí → `packages/`.

| ¿Dónde va? | Ejemplos |
|------------|---------|
| `packages/backend/convex/` | Schema, functions, auth.config.ts |
| `packages/auth/src/` | Tipos de usuario, constantes de rutas de auth |
| `packages/ui/src/` | Componentes Tamagui reutilizables |
| `apps/web/` | Middleware de Next.js, providers de @clerk/nextjs |
| `apps/mobile/` | Providers de @clerk/expo, configuración de Expo |

---

## Backend — `packages/backend`

El directorio `convex/` vive en `packages/backend/convex/`. Contiene:

```
packages/backend/
  convex/
    schema.ts           → Definición de entidades
    auth.config.ts      → Configuración de Clerk para Convex
    functions/          → Casos de uso por dominio
      reservations/
      courts/
      venues/
    lib/                → Lógica de dominio pura (sin ctx de Convex)
    _generated/         → Generado por npx convex dev — NO editar a mano
  src/
    index.ts            → Re-exporta api e internal de _generated
```

### Cómo usar el backend en una app

```ts
// En apps/web o apps/mobile
import { api } from '@canchero/backend'
```

**NUNCA** importes directamente desde `../convex/_generated/api` dentro de una app.

### Correr Convex en desarrollo

```bash
pnpm --filter @canchero/backend dev
# o desde la raíz:
turbo dev  # levanta todo el monorepo
```

### Reglas de backend

- Las funciones en `functions/` son los puertos de entrada (Hexagonal Architecture).
- La lógica de negocio va en `lib/` — sin referencias a `ctx` de Convex.
- Un módulo no importa de otro directamente; si necesita datos de otro, los recibe como parámetro.

---

## Auth — `packages/auth` + SDKs por plataforma

### Qué va en `packages/auth`

Tipos y constantes que son idénticos en todas las plataformas:

```ts
// tipos: UserRole, AuthUser
// constantes: SIGN_IN_URL, SIGN_IN_FALLBACK_REDIRECT
import { UserRole, SIGN_IN_URL } from '@canchero/auth'
```

### Qué va en cada app

| App | SDK | Archivos específicos |
|-----|-----|----------------------|
| `apps/web` | `@clerk/nextjs` | `middleware.ts`, `providers.tsx`, `sign-in/` |
| `apps/mobile` | `@clerk/expo` | `_layout.tsx` con ClerkProvider |

**NUNCA** pongas `@clerk/nextjs` en un paquete compartido — es Next.js only.  
**NUNCA** pongas `@clerk/expo` en un paquete compartido — es Expo only.

La configuración de Clerk para Convex (`auth.config.ts`) vive en `packages/backend/convex/` porque es server-side y compartida.

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
- Las páginas conectan organismos con datos (Convex queries vía `@canchero/backend`).

---

## Tamagui + Next.js App Router

- Todo componente que use Tamagui requiere `'use client'`. Los RSC no tienen React Context ni DOM.
- Las páginas (`app/` route segments) son RSC: fetchean datos y se los pasan a componentes client.
- Todos los atoms, molecules y organisms de `packages/ui` llevan `'use client'` en la primera línea.

## Íconos

- En `apps/web` usar **`lucide-react`** — es el paquete instalado.
- **NUNCA** usar `@tamagui/lucide-icons` en la app web — no está instalado y no resuelve.
- Los íconos de lucide-react usan `currentColor`. **NUNCA** pasarles tokens de Tamagui (`$token`) como prop `color` — llegan como string literal y el SVG no los resuelve. Si necesitás colorear un ícono, poné el color en el componente Tamagui padre y el ícono lo hereda vía CSS.

---

## Deploy — Railway

El deploy apunta a `apps/web` mediante el `Dockerfile` en la raíz del monorepo.

```dockerfile
# Build: instala todo el monorepo, buildea solo la app web
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @canchero/web build

# Run: ejecuta next start desde la app web
WORKDIR /app/apps/web
CMD ["pnpm", "start"]
```

### Reglas de deploy

- El `Dockerfile` va en la **raíz** del monorepo — tiene visibilidad de todos los packages.
- `railway.json` va en la **raíz** con `"builder": "DOCKERFILE"`.
- Variables de entorno `NEXT_PUBLIC_*` se pasan como `ARG` al Docker build (Railway las inyecta).
- **NUNCA** uses `--standalone` de Next.js sin configurar el `output: 'standalone'` en `next.config.ts` primero.
- **NUNCA** agregues `RUN ls`, `RUN echo` ni comandos de debug al Dockerfile.

---

## Desarrollo cross-platform — Web + Mobile

`apps/mobile` corre en **iOS, Android y Web** (Expo Router usa Metro para web). Ambas superficies están activas en desarrollo.

### Librerías que NO funcionan en web

Algunas librerías nativas usan APIs (`codegenNativeComponent`, etc.) que no existen en web:

| Librería | Problema en web |
|----------|----------------|
| `react-native-maps` | `codegenNativeComponent` no existe |

### Patrón obligatorio: shim `.web.tsx`

Cuando un componente usa una librería nativa incompatible con web, creá un archivo paralelo con extensión `.web.tsx`. Metro lo toma automáticamente en web.

```
CourtMap.tsx        → implementación nativa (react-native-maps, etc.)
CourtMap.web.tsx    → fallback web (sin la dependencia nativa)
```

**Reglas:**

- El `.web.tsx` debe exportar el mismo componente con la misma interfaz (mismas props).
- **NUNCA** uses `Platform.OS === 'web'` inline para ocultar imports nativos — el bundler los incluye igual y rompe en web.
- El fallback puede mostrar un placeholder/mensaje; no tiene que ser funcional, pero sí no crashear.
- Si la feature es irrelevante en web (ej: mapa nativo), un placeholder con mensaje claro alcanza.

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
