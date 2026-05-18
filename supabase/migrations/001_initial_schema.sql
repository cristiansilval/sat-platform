-- ============================================================
--  SAT Platform - Motor Automatizados
--  Migration 001: Initial Schema
--  Supabase / PostgreSQL
-- ============================================================

-- Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";    -- Para coordenadas GPS

-- ============================================================
-- ENUMS
-- ============================================================
CREATE TYPE user_role AS ENUM ('admin', 'tecnico_oficial', 'tecnico_externo');
CREATE TYPE garantia_estado AS ENUM ('pendiente', 'activa', 'anulada');
CREATE TYPE paso_tipo AS ENUM ('confirmacion', 'valor_numerico', 'foto_obligatoria', 'mixto');
CREATE TYPE ticket_estado AS ENUM ('abierto', 'en_progreso', 'resuelto', 'cerrado');
CREATE TYPE ticket_prioridad AS ENUM ('baja', 'media', 'alta', 'critica');

-- ============================================================
-- TABLA: profiles  (extiende auth.users de Supabase)
-- ============================================================
CREATE TABLE profiles (
    id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email           TEXT NOT NULL,
    full_name       TEXT NOT NULL,
    phone           TEXT,
    empresa         TEXT,
    ciudad          TEXT,
    rol             user_role NOT NULL DEFAULT 'tecnico_externo',
    avatar_url      TEXT,
    activo          BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLA: motores_modelos
-- ============================================================
CREATE TABLE motores_modelos (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo              TEXT NOT NULL UNIQUE,          -- Ej: "GS-500", "GS-800PRO"
    nombre              TEXT NOT NULL,
    descripcion         TEXT,
    peso_max_kg         NUMERIC(8,2),
    voltaje_v           NUMERIC(5,1),
    corriente_max_a     NUMERIC(5,2),
    tipo_central        TEXT,                          -- Ej: "Central A4", "Central B2 Dual"
    longitud_riel_max_m NUMERIC(5,2),
    manual_url          TEXT,                          -- URL en Supabase Storage
    imagen_url          TEXT,
    activo              BOOLEAN NOT NULL DEFAULT TRUE,
    creado_por          UUID REFERENCES profiles(id),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLA: checklist_plantilla
-- ============================================================
CREATE TABLE checklist_plantilla (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    modelo_id       UUID NOT NULL REFERENCES motores_modelos(id) ON DELETE CASCADE,
    orden           INTEGER NOT NULL,
    titulo          TEXT NOT NULL,                     -- Ej: "Verificar nivelación del riel"
    descripcion     TEXT,
    tipo_paso       paso_tipo NOT NULL,
    valor_min       NUMERIC,                           -- Para tipo valor_numerico
    valor_max       NUMERIC,
    unidad          TEXT,                              -- Ej: "mm", "A", "seg"
    foto_referencia_url TEXT,                          -- Foto guía del paso
    es_critico      BOOLEAN NOT NULL DEFAULT FALSE,    -- Si falla este paso = garantía anulada
    activo          BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(modelo_id, orden)
);

-- ============================================================
-- TABLA: equipos_instalados  (cada motor físico vendido)
-- ============================================================
CREATE TABLE equipos_instalados (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    numero_serie        TEXT NOT NULL UNIQUE,
    modelo_id           UUID NOT NULL REFERENCES motores_modelos(id),
    -- Cliente final
    cliente_nombre      TEXT NOT NULL,
    cliente_email       TEXT,
    cliente_telefono    TEXT,
    cliente_direccion   TEXT,
    -- Ubicación GPS de instalación
    ubicacion           GEOMETRY(Point, 4326),          -- PostGIS
    ubicacion_descripcion TEXT,
    -- Garantía
    garantia_estado     garantia_estado NOT NULL DEFAULT 'pendiente',
    garantia_inicio     DATE,
    garantia_meses      INTEGER NOT NULL DEFAULT 12,
    garantia_vence      DATE GENERATED ALWAYS AS (garantia_inicio + (garantia_meses || ' months')::INTERVAL) STORED,
    -- Trazabilidad
    instalado_por       UUID REFERENCES profiles(id),
    fecha_instalacion   DATE,
    validado_por        UUID REFERENCES profiles(id),
    fecha_validacion    TIMESTAMPTZ,
    notas_admin         TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLA: instalaciones_historial
-- ============================================================
CREATE TABLE instalaciones_historial (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    equipo_id       UUID NOT NULL REFERENCES equipos_instalados(id) ON DELETE RESTRICT,
    tecnico_id      UUID NOT NULL REFERENCES profiles(id),
    -- GPS del momento del escaneo/inicio
    gps_inicio      GEOMETRY(Point, 4326),
    gps_fin         GEOMETRY(Point, 4326),
    -- Control de flujo
    iniciado_en     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completado_en   TIMESTAMPTZ,
    aprobado        BOOLEAN,
    -- Snapshot del checklist al momento de la instalación
    total_pasos     INTEGER NOT NULL DEFAULT 0,
    pasos_completados INTEGER NOT NULL DEFAULT 0,
    observaciones   TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLA: instalacion_respuestas  (respuestas paso a paso)
-- ============================================================
CREATE TABLE instalacion_respuestas (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    instalacion_id      UUID NOT NULL REFERENCES instalaciones_historial(id) ON DELETE CASCADE,
    paso_id             UUID NOT NULL REFERENCES checklist_plantilla(id),
    orden               INTEGER NOT NULL,
    titulo_paso         TEXT NOT NULL,                 -- Snapshot del título al momento
    tipo_paso           paso_tipo NOT NULL,
    -- Respuesta según tipo
    confirmacion        BOOLEAN,                       -- Para tipo 'confirmacion'
    valor_numerico      NUMERIC,                       -- Para tipo 'valor_numerico'
    foto_url            TEXT,                          -- URL en Supabase Storage
    foto_thumbnail_url  TEXT,
    -- Metadatos
    completado          BOOLEAN NOT NULL DEFAULT FALSE,
    gps_captura         GEOMETRY(Point, 4326),
    capturado_en        TIMESTAMPTZ,
    observacion_tecnico TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(instalacion_id, paso_id)
);

-- ============================================================
-- TABLA: codigos_error  (guía offline de la app móvil)
-- ============================================================
CREATE TABLE codigos_error (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    modelo_id       UUID REFERENCES motores_modelos(id),  -- NULL = aplica a todos
    codigo          TEXT NOT NULL,                     -- Ej: "E03", "LED_3X"
    descripcion     TEXT NOT NULL,                     -- "Led parpadea 3 veces"
    causa           TEXT NOT NULL,
    solucion        TEXT NOT NULL,
    imagen_url      TEXT,
    es_critico      BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(modelo_id, codigo)
);

-- ============================================================
-- TABLA: tickets_soporte
-- ============================================================
CREATE TABLE tickets_soporte (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    numero          SERIAL,                            -- Número legible: #1001, #1002...
    equipo_id       UUID NOT NULL REFERENCES equipos_instalados(id),
    reportado_por   UUID NOT NULL REFERENCES profiles(id),
    asignado_a      UUID REFERENCES profiles(id),
    -- Descripción
    titulo          TEXT NOT NULL,
    descripcion     TEXT NOT NULL,
    codigo_error_id UUID REFERENCES codigos_error(id),
    -- Estado
    estado          ticket_estado NOT NULL DEFAULT 'abierto',
    prioridad       ticket_prioridad NOT NULL DEFAULT 'media',
    -- Repuestos
    repuestos_solicitados JSONB,                       -- [{codigo, descripcion, cantidad}]
    -- Resolución
    solucion_aplicada TEXT,
    resuelto_en     TIMESTAMPTZ,
    -- Garantía
    aplica_garantia BOOLEAN,
    garantia_cubierta BOOLEAN,
    -- Media adjunta
    fotos_urls      TEXT[],
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLA: ticket_notas  (hilo de comentarios del ticket)
-- ============================================================
CREATE TABLE ticket_notas (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id   UUID NOT NULL REFERENCES tickets_soporte(id) ON DELETE CASCADE,
    autor_id    UUID NOT NULL REFERENCES profiles(id),
    nota        TEXT NOT NULL,
    es_interna  BOOLEAN NOT NULL DEFAULT FALSE,        -- Solo visible para admins
    fotos_urls  TEXT[],
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ÍNDICES
-- ============================================================
CREATE INDEX idx_equipos_numero_serie ON equipos_instalados(numero_serie);
CREATE INDEX idx_equipos_modelo ON equipos_instalados(modelo_id);
CREATE INDEX idx_equipos_garantia ON equipos_instalados(garantia_estado);
CREATE INDEX idx_equipos_instalado_por ON equipos_instalados(instalado_por);
CREATE INDEX idx_instalaciones_equipo ON instalaciones_historial(equipo_id);
CREATE INDEX idx_instalaciones_tecnico ON instalaciones_historial(tecnico_id);
CREATE INDEX idx_respuestas_instalacion ON instalacion_respuestas(instalacion_id);
CREATE INDEX idx_tickets_equipo ON tickets_soporte(equipo_id);
CREATE INDEX idx_tickets_estado ON tickets_soporte(estado);
CREATE INDEX idx_tickets_asignado ON tickets_soporte(asignado_a);
CREATE INDEX idx_checklist_modelo ON checklist_plantilla(modelo_id, orden);
-- Índice espacial para búsquedas por GPS
CREATE INDEX idx_equipos_ubicacion ON equipos_instalados USING GIST(ubicacion);

-- ============================================================
-- TRIGGERS: updated_at automático
-- ============================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_motores_updated_at
    BEFORE UPDATE ON motores_modelos
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_equipos_updated_at
    BEFORE UPDATE ON equipos_instalados
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_tickets_updated_at
    BEFORE UPDATE ON tickets_soporte
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- TRIGGER: crear profile automáticamente al registrar usuario
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, email, full_name, rol)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        COALESCE((NEW.raw_user_meta_data->>'rol')::user_role, 'tecnico_externo')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();
