# SAT Platform — Plataforma de Servicio Técnico y Gestión de Instalaciones

> Sistema para fabricantes de motores para portones automatizados. Controla instalaciones, garantías, tickets de soporte y guía a los técnicos paso a paso con evidencia fotográfica.

---

## Estructura del proyecto (Monorepo)

```
servicio-tecnico/
├── apps/
│   ├── web/          → Panel Admin (Next.js 14, App Router, Tailwind, Shadcn/ui)
│   └── mobile/       → App Técnico (Expo 51, React Native, TypeScript)
├── packages/
│   ├── supabase-client/  → Cliente Supabase tipado + tipos generados
│   └── shared-types/     → Tipos compartidos entre web y mobile
├── supabase/
│   ├── migrations/   → Scripts SQL en orden
│   └── seed/         → Datos de demostración
└── docs/
    └── ERD.md        → Diagrama Entidad-Relación completo
```

---

## Setup inicial

### 1. Supabase

```bash
# Instalar CLI de Supabase
npm install -g supabase

# Linkear con tu proyecto
supabase link --project-ref TU_PROJECT_REF

# Correr migraciones en orden
supabase db push

# Cargar datos de demo
psql "tu-connection-string" -f supabase/seed/001_seed_demo.sql

# Generar tipos TypeScript desde la BD
yarn db:types
```

### 2. Storages necesarios en Supabase Dashboard

| Bucket | Acceso | Uso |
|--------|--------|-----|
| `instalacion-fotos` | Privado | Fotos de evidencia del checklist |
| `manuales` | Público | PDFs de manuales de instalación |
| `avatars` | Público | Fotos de perfil de usuarios |

### 3. Panel Web (Next.js)

```bash
cd apps/web
cp .env.example .env.local
# Editar .env.local con tus keys de Supabase
yarn install
yarn dev   # http://localhost:3000
```

### 4. App Móvil (Expo)

```bash
cd apps/mobile
cp .env.example .env
# Editar .env con tus keys de Supabase
yarn install
yarn start
# Escanear con Expo Go o usar emulador
```

---

## Flujos principales implementados

### Panel Admin (Web)
| Ruta | Descripción |
|------|-------------|
| `/` | Dashboard con métricas, KPIs y gráficos |
| `/validaciones` | Lista de instalaciones pendientes de aprobación |
| `/validaciones/[equipoId]` | Detalle con checklist completo + fotos |
| `/equipos` | Gestión de equipos instalados |
| `/tickets` | Tickets de soporte SAT |
| `/modelos` | Modelos de motores y checklist |
| `/usuarios` | Gestión de técnicos |

### App Móvil
| Pantalla | Descripción |
|----------|-------------|
| `(tabs)/escaner` | Escáner QR/Barcode — lee N° de serie e inicia instalación |
| `instalacion/wizard` | Wizard paso a paso bloqueante |
| `instalacion/completado` | Confirmación de envío |
| `(tabs)/guia-errores` | Guía offline de códigos de error con caché SQLite |

---

## Decisiones de arquitectura

### Modo offline en app móvil
- **Zustand + MMKV**: El estado del wizard persiste en disco. Si se cierra la app o se pierde conexión, el técnico puede retomar exactamente donde estaba.
- **SQLite (expo-sqlite)**: La guía de errores se cachea localmente. Funciona sin internet.
- **Sync automático**: El hook `useNetworkSync` sube las fotos pendientes en cuanto detecta conexión (polling cada 30s).
- **Foto pipeline**: URI local → subida a Supabase Storage → URL pública → actualización en BD.

### Seguridad (RLS)
- Los técnicos solo ven y modifican sus propias instalaciones.
- Solo admins pueden validar garantías o acceder a datos de otros técnicos.
- Las funciones críticas (`completar_instalacion`, `validar_garantia`) son `SECURITY DEFINER` para evitar escalada de privilegios.

---

## Próximos pasos sugeridos

- [ ] Pantalla de inicio de sesión (web + mobile)
- [ ] Módulo de gestión de equipos con mapa (MapView)
- [ ] Push notifications cuando admin valida garantía
- [ ] Módulo de tickets desde la app móvil
- [ ] Panel de modelos con editor de checklist drag-and-drop
- [ ] Exportar reportes PDF de instalación
- [ ] Tests E2E con Playwright (web) y Detox (mobile)
