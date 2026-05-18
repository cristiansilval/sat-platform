-- ============================================================
--  SAT Platform - Migration 002: Row Level Security Policies
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE motores_modelos ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_plantilla ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipos_instalados ENABLE ROW LEVEL SECURITY;
ALTER TABLE instalaciones_historial ENABLE ROW LEVEL SECURITY;
ALTER TABLE instalacion_respuestas ENABLE ROW LEVEL SECURITY;
ALTER TABLE codigos_error ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets_soporte ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_notas ENABLE ROW LEVEL SECURITY;

-- Helper: obtener rol del usuario actual
CREATE OR REPLACE FUNCTION get_my_rol()
RETURNS user_role AS $$
    SELECT rol FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ========================
-- PROFILES
-- ========================
CREATE POLICY "Admins ven todos los perfiles"
    ON profiles FOR SELECT
    USING (get_my_rol() = 'admin');

CREATE POLICY "Técnicos ven su propio perfil"
    ON profiles FOR SELECT
    USING (id = auth.uid());

CREATE POLICY "Solo el propio usuario actualiza su perfil"
    ON profiles FOR UPDATE
    USING (id = auth.uid());

CREATE POLICY "Admins actualizan cualquier perfil"
    ON profiles FOR UPDATE
    USING (get_my_rol() = 'admin');

-- ========================
-- MOTORES_MODELOS (lectura pública autenticada, escritura solo admin)
-- ========================
CREATE POLICY "Todos los autenticados leen modelos"
    ON motores_modelos FOR SELECT
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "Solo admins gestionan modelos"
    ON motores_modelos FOR ALL
    USING (get_my_rol() = 'admin');

-- ========================
-- CHECKLIST_PLANTILLA
-- ========================
CREATE POLICY "Todos los autenticados leen checklist"
    ON checklist_plantilla FOR SELECT
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "Solo admins gestionan checklist"
    ON checklist_plantilla FOR ALL
    USING (get_my_rol() = 'admin');

-- ========================
-- EQUIPOS_INSTALADOS
-- ========================
CREATE POLICY "Admins ven todos los equipos"
    ON equipos_instalados FOR SELECT
    USING (get_my_rol() = 'admin');

CREATE POLICY "Técnicos ven equipos que instalaron"
    ON equipos_instalados FOR SELECT
    USING (instalado_por = auth.uid());

CREATE POLICY "Técnicos crean equipos"
    ON equipos_instalados FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins actualizan cualquier equipo"
    ON equipos_instalados FOR UPDATE
    USING (get_my_rol() = 'admin');

-- ========================
-- INSTALACIONES_HISTORIAL
-- ========================
CREATE POLICY "Admins ven todo el historial"
    ON instalaciones_historial FOR SELECT
    USING (get_my_rol() = 'admin');

CREATE POLICY "Técnicos ven su propio historial"
    ON instalaciones_historial FOR SELECT
    USING (tecnico_id = auth.uid());

CREATE POLICY "Técnicos crean/actualizan sus instalaciones"
    ON instalaciones_historial FOR INSERT
    WITH CHECK (tecnico_id = auth.uid());

CREATE POLICY "Técnicos actualizan sus instalaciones activas"
    ON instalaciones_historial FOR UPDATE
    USING (tecnico_id = auth.uid() AND completado_en IS NULL);

-- ========================
-- INSTALACION_RESPUESTAS
-- ========================
CREATE POLICY "Admins ven todas las respuestas"
    ON instalacion_respuestas FOR SELECT
    USING (get_my_rol() = 'admin');

CREATE POLICY "Técnicos ven respuestas de sus instalaciones"
    ON instalacion_respuestas FOR SELECT
    USING (
        instalacion_id IN (
            SELECT id FROM instalaciones_historial WHERE tecnico_id = auth.uid()
        )
    );

CREATE POLICY "Técnicos crean/actualizan respuestas de sus instalaciones"
    ON instalacion_respuestas FOR INSERT
    WITH CHECK (
        instalacion_id IN (
            SELECT id FROM instalaciones_historial
            WHERE tecnico_id = auth.uid() AND completado_en IS NULL
        )
    );

CREATE POLICY "Técnicos actualizan respuestas propias"
    ON instalacion_respuestas FOR UPDATE
    USING (
        instalacion_id IN (
            SELECT id FROM instalaciones_historial
            WHERE tecnico_id = auth.uid() AND completado_en IS NULL
        )
    );

-- ========================
-- CODIGOS_ERROR (lectura para todos autenticados)
-- ========================
CREATE POLICY "Todos leen códigos de error"
    ON codigos_error FOR SELECT
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "Solo admins gestionan códigos de error"
    ON codigos_error FOR ALL
    USING (get_my_rol() = 'admin');

-- ========================
-- TICKETS_SOPORTE
-- ========================
CREATE POLICY "Admins ven todos los tickets"
    ON tickets_soporte FOR SELECT
    USING (get_my_rol() = 'admin');

CREATE POLICY "Técnicos ven tickets que reportaron o tienen asignados"
    ON tickets_soporte FOR SELECT
    USING (reportado_por = auth.uid() OR asignado_a = auth.uid());

CREATE POLICY "Técnicos crean tickets"
    ON tickets_soporte FOR INSERT
    WITH CHECK (reportado_por = auth.uid());

CREATE POLICY "Admins actualizan tickets"
    ON tickets_soporte FOR UPDATE
    USING (get_my_rol() = 'admin');

CREATE POLICY "Técnicos actualizan tickets asignados"
    ON tickets_soporte FOR UPDATE
    USING (asignado_a = auth.uid());

-- ========================
-- TICKET_NOTAS
-- ========================
CREATE POLICY "Admins ven todas las notas"
    ON ticket_notas FOR SELECT
    USING (get_my_rol() = 'admin');

CREATE POLICY "Técnicos ven notas no internas de sus tickets"
    ON ticket_notas FOR SELECT
    USING (
        es_interna = FALSE AND
        ticket_id IN (
            SELECT id FROM tickets_soporte
            WHERE reportado_por = auth.uid() OR asignado_a = auth.uid()
        )
    );

CREATE POLICY "Usuarios autenticados crean notas"
    ON ticket_notas FOR INSERT
    WITH CHECK (autor_id = auth.uid());

-- ========================
-- STORAGE BUCKETS
-- ========================
-- Ejecutar en Supabase Dashboard > Storage o via API:
--
-- bucket: "instalacion-fotos"   (privado, solo autenticados)
-- bucket: "manuales"            (público, lectura libre)
-- bucket: "avatars"             (público, lectura libre)
-- bucket: "error-guide-images"  (público, lectura libre)
