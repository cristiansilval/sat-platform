# Diagrama Entidad-Relación — SAT Platform

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                         SAT Platform — Diagrama ER                                  │
└─────────────────────────────────────────────────────────────────────────────────────┘

 ┌──────────────────┐          ┌──────────────────────┐         ┌──────────────────────┐
 │   auth.users     │          │   motores_modelos     │         │  checklist_plantilla │
 │  (Supabase Auth) │          │──────────────────────│         │──────────────────────│
 │──────────────────│          │ PK id                 │         │ PK id                │
 │ PK id            │          │    codigo (UNIQUE)    │◄────────│ FK modelo_id         │
 │    email         │          │    nombre             │    1:N  │    orden             │
 │    ...           │          │    peso_max_kg        │         │    titulo            │
 └────────┬─────────┘          │    voltaje_v          │         │    tipo_paso         │
          │ 1:1                │    tipo_central       │         │    valor_min/max      │
          ▼                    │    manual_url         │         │    es_critico         │
 ┌──────────────────┐          └──────────┬────────────┘         └──────────────────────┘
 │     profiles     │                     │ 1:N
 │──────────────────│                     ▼
 │ PK id (= auth.id)│          ┌──────────────────────┐
 │    full_name     │          │   equipos_instalados  │
 │    rol (ENUM)    │          │──────────────────────│
 │    empresa       │          │ PK id                 │
 │    activo        │          │    numero_serie (UNIQ)│
 └──┬───────────────┘          │ FK modelo_id          │
    │                          │    cliente_nombre     │
    │                          │    ubicacion (GPS)    │
    │ 1:N (instalado_por)      │    garantia_estado    │
    │ 1:N (validado_por)       │    garantia_vence     │
    └─────────────────────────►│ FK instalado_por      │
                               │ FK validado_por       │
                               └──────────┬────────────┘
                                          │ 1:N
                                          ▼
                               ┌──────────────────────┐         ┌────────────────────────┐
                               │ instalaciones_historial│         │  instalacion_respuestas │
                               │──────────────────────│         │────────────────────────│
                               │ PK id                 │◄────────│ PK id                  │
                               │ FK equipo_id          │   1:N   │ FK instalacion_id       │
                               │ FK tecnico_id         │         │ FK paso_id              │
                               │    gps_inicio/fin     │         │    confirmacion (BOOL)  │
                               │    completado_en      │         │    valor_numerico        │
                               │    aprobado           │         │    foto_url             │
                               │    total_pasos        │         │    completado           │
                               └──────────────────────┘         └────────────────────────┘

                               ┌──────────────────────┐
                               │   tickets_soporte    │         ┌──────────────────┐
                               │──────────────────────│         │   ticket_notas   │
                               │ PK id                 │◄────────│ FK ticket_id     │
                               │ FK equipo_id          │   1:N   │ FK autor_id      │
                               │ FK reportado_por      │         │    nota          │
                               │ FK asignado_a         │         │    es_interna    │
                               │ FK codigo_error_id    │         └──────────────────┘
                               │    estado (ENUM)      │
                               │    repuestos (JSONB)  │         ┌──────────────────────┐
                               └──────────────────────┘         │   codigos_error      │
                                          ▲                      │──────────────────────│
                                          └──────────────────────│ PK id                │
                                                     N:1         │ FK modelo_id (NULL=*)│
                                                                 │    codigo            │
                                                                 │    descripcion       │
                                                                 │    causa             │
                                                                 │    solucion          │
                                                                 └──────────────────────┘
```

## Cardinalidades clave

| Relación | Tipo | Descripción |
|---|---|---|
| auth.users → profiles | 1:1 | Trigger automático al crear usuario |
| motores_modelos → checklist_plantilla | 1:N | Cada modelo tiene sus propios pasos |
| motores_modelos → equipos_instalados | 1:N | Un modelo puede tener muchos equipos físicos |
| equipos_instalados → instalaciones_historial | 1:N | Un equipo puede re-instalarse |
| instalaciones_historial → instalacion_respuestas | 1:N | Una instalación = N respuestas (una por paso) |
| equipos_instalados → tickets_soporte | 1:N | Un equipo puede tener múltiples tickets |
| codigos_error → tickets_soporte | 1:N | Código de error referenciado en tickets |
| tickets_soporte → ticket_notas | 1:N | Hilo de comentarios por ticket |

## Estados de Garantía (State Machine)

```
[pendiente] ──── Admin aprueba ────► [activa]
     │
     └──── Paso crítico fallido ──► [anulada]
     └──── Admin rechaza ──────────► [anulada]
```

## Flujo principal de instalación (app móvil)

```
Técnico escanea QR/Serie
         │
         ▼
Busca equipo_instalado por numero_serie
         │
         ▼
Crea instalacion_historial (gps_inicio)
         │
         ▼
Carga checklist_plantilla del modelo
         │
         ▼
Wizard paso a paso ──► crear instalacion_respuestas
(bloquea si paso crítico no completado)
         │
         ▼
llama completar_instalacion()
         │
         ▼
garantia_estado = 'pendiente' (o 'anulada' si hubo paso crítico fallido)
         │
         ▼
Admin revisa en Panel Web ──► llama validar_garantia()
         │
         ▼
garantia_estado = 'activa' | 'anulada'
```
