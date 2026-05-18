-- ============================================================
--  SAT Platform - Seed: Datos de demostración
-- ============================================================

-- Modelos de motores
INSERT INTO motores_modelos (codigo, nombre, descripcion, peso_max_kg, voltaje_v, corriente_max_a, tipo_central, longitud_riel_max_m) VALUES
('GS-400',    'GS 400 Residencial',         'Motor para portones de hasta 400kg, uso residencial',     400, 220, 3.5,  'Central A4',          8),
('GS-600',    'GS 600 Semi-Industrial',     'Motor para portones de hasta 600kg, uso intensivo',       600, 220, 5.0,  'Central B2',          10),
('GS-800PRO', 'GS 800 Pro Industrial',      'Motor trifásico para portones industriales hasta 800kg',  800, 380, 4.2,  'Central B2 Dual',     14),
('GS-250L',   'GS 250 Lite Residencial',    'Motor económico para portones livianos hasta 250kg',      250, 110, 2.8,  'Central A3 Lite',     6);

-- Checklist para modelo GS-400 (ejemplo completo)
INSERT INTO checklist_plantilla (modelo_id, orden, titulo, descripcion, tipo_paso, valor_min, valor_max, unidad, es_critico) VALUES
((SELECT id FROM motores_modelos WHERE codigo='GS-400'), 1,
 'Verificar nivelación del riel',
 'El riel de deslizamiento debe estar nivelado a ±2mm. Usar nivel de burbuja de 1m.',
 'foto_obligatoria', NULL, NULL, NULL, TRUE),

((SELECT id FROM motores_modelos WHERE codigo='GS-400'), 2,
 'Medir holgura piñón-cremallera',
 'La holgura entre el piñón y la cremallera debe ser de 1.5mm a 2.5mm.',
 'valor_numerico', 1.5, 2.5, 'mm', TRUE),

((SELECT id FROM motores_modelos WHERE codigo='GS-400'), 3,
 'Fotografiar montaje completo del motor',
 'Foto general del motor montado en la columna con todos los tornillos visibles.',
 'foto_obligatoria', NULL, NULL, NULL, FALSE),

((SELECT id FROM motores_modelos WHERE codigo='GS-400'), 4,
 'Confirmar torque de tornillos de anclaje',
 'Apretar los 4 tornillos M10 de anclaje. Confirmar que están bien apretados.',
 'confirmacion', NULL, NULL, NULL, TRUE),

((SELECT id FROM motores_modelos WHERE codigo='GS-400'), 5,
 'Medir amperaje en arranque',
 'Medir la corriente de arranque del motor. No debe superar 3.5A.',
 'valor_numerico', 0.5, 3.5, 'A', TRUE),

((SELECT id FROM motores_modelos WHERE codigo='GS-400'), 6,
 'Programar final de carrera apertura',
 'Ajustar el final de carrera de apertura. El portón debe detenerse a 5cm antes del tope físico.',
 'foto_obligatoria', NULL, NULL, NULL, TRUE),

((SELECT id FROM motores_modelos WHERE codigo='GS-400'), 7,
 'Programar final de carrera cierre',
 'Ajustar el final de carrera de cierre. El portón debe cerrar completamente con sello.',
 'foto_obligatoria', NULL, NULL, NULL, TRUE),

((SELECT id FROM motores_modelos WHERE codigo='GS-400'), 8,
 'Verificar fotocélulas',
 'Las fotocélulas deben estar alineadas y operativas. Interrumpir el haz durante movimiento.',
 'confirmacion', NULL, NULL, NULL, TRUE),

((SELECT id FROM motores_modelos WHERE codigo='GS-400'), 9,
 'Programar tiempo de desaceleración',
 'Ajustar la rampa de desaceleración. Recomendado: 1.5 segundos.',
 'valor_numerico', 0.5, 3.0, 'seg', FALSE),

((SELECT id FROM motores_modelos WHERE codigo='GS-400'), 10,
 'Foto de instalación finalizada + placa QR',
 'Foto de la instalación completa con la placa de número de serie visible.',
 'foto_obligatoria', NULL, NULL, NULL, TRUE);

-- Códigos de error comunes
INSERT INTO codigos_error (modelo_id, codigo, descripcion, causa, solucion, es_critico) VALUES
(NULL, 'E01', 'Led parpadea 1 vez', 'Sobrecarga de motor o bloqueo mecánico', 'Verificar que el portón deslice libremente. Revisar holgura piñón-cremallera. Medir amperaje.', FALSE),
(NULL, 'E02', 'Led parpadea 2 veces', 'Falla en encoder / sensor de velocidad', 'Revisar conector del encoder. Limpiar sensor magnético. Reemplazar si persiste.', TRUE),
(NULL, 'E03', 'Led parpadea 3 veces', 'Falla en fotocélula o sensor de seguridad', 'Verificar alineación de fotocélulas. Limpiar lentes. Revisar cableado. Verificar que no haya obstáculos.', TRUE),
(NULL, 'E04', 'Led parpadea 4 veces', 'Falla en final de carrera de apertura', 'Revisar y ajustar posición del final de carrera de apertura. Verificar cable.', FALSE),
(NULL, 'E05', 'Led parpadea 5 veces', 'Falla en final de carrera de cierre', 'Revisar y ajustar posición del final de carrera de cierre. Verificar cable.', FALSE),
(NULL, 'E06', 'Led parpadea 6 veces', 'Sobrecalentamiento del motor', 'Dejar enfriar 30 minutos. Verificar frecuencia de ciclos. Revisar ventilación del motor.', TRUE),
(NULL, 'E07', 'Led parpadea 7 veces', 'Error de comunicación con control remoto', 'Re-programar control remoto. Verificar frecuencia (433MHz). Reemplazar batería del control.', FALSE),
(NULL, 'E08', 'Led parpadea 8 veces', 'Tensión de alimentación fuera de rango', 'Medir tensión en bornes de alimentación. Rango aceptable: 200-240V AC.', TRUE),
((SELECT id FROM motores_modelos WHERE codigo='GS-800PRO'), 'E_TRI_01', 'Alarma trifásica - desequilibrio de fases', 'Una o más fases con tensión incorrecta o ausente', 'Verificar tablero eléctrico. Medir las 3 fases con voltímetro. Contactar electricista.', TRUE);
