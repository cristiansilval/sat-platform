-- ============================================================
--  SAT Platform - Migration 003: Views & Functions para Dashboard
-- ============================================================

-- ========================
-- VIEW: dashboard_metricas
-- Consumida por el Panel Admin
-- ========================
CREATE OR REPLACE VIEW dashboard_metricas AS
SELECT
    -- Totales de equipos
    COUNT(*)                                            AS total_equipos,
    COUNT(*) FILTER (WHERE garantia_estado = 'activa')  AS garantias_activas,
    COUNT(*) FILTER (WHERE garantia_estado = 'pendiente') AS garantias_pendientes,
    COUNT(*) FILTER (WHERE garantia_estado = 'anulada') AS garantias_anuladas,
    -- Tasa de aprobación (activas / total completadas)
    ROUND(
        COUNT(*) FILTER (WHERE garantia_estado = 'activa')::NUMERIC /
        NULLIF(COUNT(*) FILTER (WHERE garantia_estado IN ('activa','anulada')), 0) * 100,
        1
    )                                                   AS tasa_aprobacion_pct,
    -- Instalados este mes
    COUNT(*) FILTER (WHERE fecha_instalacion >= DATE_TRUNC('month', NOW()))
                                                        AS instalados_este_mes
FROM equipos_instalados;

-- ========================
-- VIEW: fallos_mas_comunes
-- Top 10 códigos de error más reportados en tickets
-- ========================
CREATE OR REPLACE VIEW fallos_mas_comunes AS
SELECT
    ce.codigo,
    ce.descripcion,
    ce.causa,
    COUNT(ts.id) AS total_tickets,
    COUNT(ts.id) FILTER (WHERE ts.garantia_cubierta = TRUE) AS cubiertos_garantia
FROM tickets_soporte ts
JOIN codigos_error ce ON ce.id = ts.codigo_error_id
WHERE ts.created_at >= NOW() - INTERVAL '6 months'
GROUP BY ce.id, ce.codigo, ce.descripcion, ce.causa
ORDER BY total_tickets DESC
LIMIT 10;

-- ========================
-- VIEW: instalaciones_pendientes_validacion
-- Para que el admin vea qué revisar
-- ========================
CREATE OR REPLACE VIEW instalaciones_pendientes_validacion AS
SELECT
    ei.id                       AS equipo_id,
    ei.numero_serie,
    mm.nombre                   AS modelo_nombre,
    mm.codigo                   AS modelo_codigo,
    ei.cliente_nombre,
    ei.cliente_direccion,
    p.full_name                 AS tecnico_nombre,
    p.empresa                   AS tecnico_empresa,
    p.rol                       AS tecnico_rol,
    ih.id                       AS instalacion_id,
    ih.completado_en,
    ih.total_pasos,
    ih.pasos_completados,
    ROUND(ih.pasos_completados::NUMERIC / NULLIF(ih.total_pasos, 0) * 100, 0)
                                AS completitud_pct,
    ei.created_at
FROM equipos_instalados ei
JOIN motores_modelos mm ON mm.id = ei.modelo_id
JOIN profiles p ON p.id = ei.instalado_por
LEFT JOIN instalaciones_historial ih ON ih.equipo_id = ei.id AND ih.completado_en IS NOT NULL
WHERE ei.garantia_estado = 'pendiente'
ORDER BY ei.created_at DESC;

-- ========================
-- FUNCTION: completar_instalacion
-- Llamada desde la app móvil al finalizar el wizard
-- ========================
CREATE OR REPLACE FUNCTION completar_instalacion(
    p_instalacion_id UUID,
    p_gps_fin        GEOMETRY(Point, 4326) DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_instalacion   instalaciones_historial%ROWTYPE;
    v_total_pasos   INTEGER;
    v_pasos_ok      INTEGER;
    v_pasos_criticos_fallidos INTEGER;
BEGIN
    SELECT * INTO v_instalacion
    FROM instalaciones_historial
    WHERE id = p_instalacion_id AND tecnico_id = auth.uid();

    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Instalación no encontrada');
    END IF;

    IF v_instalacion.completado_en IS NOT NULL THEN
        RETURN json_build_object('success', false, 'error', 'Instalación ya fue completada');
    END IF;

    -- Contar pasos
    SELECT COUNT(*), COUNT(*) FILTER (WHERE ir.completado = TRUE)
    INTO v_total_pasos, v_pasos_ok
    FROM instalacion_respuestas ir
    WHERE ir.instalacion_id = p_instalacion_id;

    -- Verificar pasos críticos
    SELECT COUNT(*)
    INTO v_pasos_criticos_fallidos
    FROM instalacion_respuestas ir
    JOIN checklist_plantilla cp ON cp.id = ir.paso_id
    WHERE ir.instalacion_id = p_instalacion_id
      AND cp.es_critico = TRUE
      AND ir.completado = FALSE;

    -- Marcar instalación como completada
    UPDATE instalaciones_historial
    SET completado_en       = NOW(),
        gps_fin             = COALESCE(p_gps_fin, gps_inicio),
        total_pasos         = v_total_pasos,
        pasos_completados   = v_pasos_ok,
        aprobado            = (v_pasos_criticos_fallidos = 0)
    WHERE id = p_instalacion_id;

    -- Actualizar equipo
    UPDATE equipos_instalados
    SET fecha_instalacion = CURRENT_DATE,
        garantia_inicio   = CURRENT_DATE,
        garantia_estado   = CASE
            WHEN v_pasos_criticos_fallidos > 0 THEN 'anulada'::garantia_estado
            ELSE 'pendiente'::garantia_estado
        END,
        instalado_por     = auth.uid()
    WHERE id = v_instalacion.equipo_id;

    RETURN json_build_object(
        'success', true,
        'total_pasos', v_total_pasos,
        'pasos_completados', v_pasos_ok,
        'pasos_criticos_fallidos', v_pasos_criticos_fallidos,
        'garantia_estado', CASE WHEN v_pasos_criticos_fallidos > 0 THEN 'anulada' ELSE 'pendiente' END
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================
-- FUNCTION: validar_garantia (Admin)
-- ========================
CREATE OR REPLACE FUNCTION validar_garantia(
    p_equipo_id UUID,
    p_aprobar   BOOLEAN,
    p_notas     TEXT DEFAULT NULL
)
RETURNS JSON AS $$
BEGIN
    IF get_my_rol() != 'admin' THEN
        RETURN json_build_object('success', false, 'error', 'Sin permisos');
    END IF;

    UPDATE equipos_instalados
    SET garantia_estado  = CASE WHEN p_aprobar THEN 'activa'::garantia_estado ELSE 'anulada'::garantia_estado END,
        garantia_inicio  = CASE WHEN p_aprobar AND garantia_inicio IS NULL THEN CURRENT_DATE ELSE garantia_inicio END,
        validado_por     = auth.uid(),
        fecha_validacion = NOW(),
        notas_admin      = COALESCE(p_notas, notas_admin)
    WHERE id = p_equipo_id;

    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Equipo no encontrado');
    END IF;

    RETURN json_build_object('success', true, 'nuevo_estado', CASE WHEN p_aprobar THEN 'activa' ELSE 'anulada' END);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
