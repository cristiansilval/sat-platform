// AUTO-GENERADO por: yarn db:types
// Regenerar después de cada migración

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type UserRole = 'admin' | 'tecnico_oficial' | 'tecnico_externo'
export type GarantiaEstado = 'pendiente' | 'activa' | 'anulada'
export type PasoTipo = 'confirmacion' | 'valor_numerico' | 'foto_obligatoria' | 'mixto'
export type TicketEstado = 'abierto' | 'en_progreso' | 'resuelto' | 'cerrado'
export type TicketPrioridad = 'baja' | 'media' | 'alta' | 'critica'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string
          phone: string | null
          empresa: string | null
          ciudad: string | null
          rol: UserRole
          avatar_url: string | null
          activo: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
      }
      motores_modelos: {
        Row: {
          id: string
          codigo: string
          nombre: string
          descripcion: string | null
          peso_max_kg: number | null
          voltaje_v: number | null
          corriente_max_a: number | null
          tipo_central: string | null
          longitud_riel_max_m: number | null
          manual_url: string | null
          imagen_url: string | null
          activo: boolean
          creado_por: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['motores_modelos']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['motores_modelos']['Insert']>
      }
      checklist_plantilla: {
        Row: {
          id: string
          modelo_id: string
          orden: number
          titulo: string
          descripcion: string | null
          tipo_paso: PasoTipo
          valor_min: number | null
          valor_max: number | null
          unidad: string | null
          foto_referencia_url: string | null
          es_critico: boolean
          activo: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['checklist_plantilla']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['checklist_plantilla']['Insert']>
      }
      equipos_instalados: {
        Row: {
          id: string
          numero_serie: string
          modelo_id: string
          cliente_nombre: string
          cliente_email: string | null
          cliente_telefono: string | null
          cliente_direccion: string | null
          ubicacion: string | null
          ubicacion_descripcion: string | null
          garantia_estado: GarantiaEstado
          garantia_inicio: string | null
          garantia_meses: number
          garantia_vence: string | null
          instalado_por: string | null
          fecha_instalacion: string | null
          validado_por: string | null
          fecha_validacion: string | null
          notas_admin: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['equipos_instalados']['Row'], 'id' | 'garantia_vence' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['equipos_instalados']['Insert']>
      }
      instalaciones_historial: {
        Row: {
          id: string
          equipo_id: string
          tecnico_id: string
          gps_inicio: string | null
          gps_fin: string | null
          iniciado_en: string
          completado_en: string | null
          aprobado: boolean | null
          total_pasos: number
          pasos_completados: number
          observaciones: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['instalaciones_historial']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['instalaciones_historial']['Insert']>
      }
      instalacion_respuestas: {
        Row: {
          id: string
          instalacion_id: string
          paso_id: string
          orden: number
          titulo_paso: string
          tipo_paso: PasoTipo
          confirmacion: boolean | null
          valor_numerico: number | null
          foto_url: string | null
          foto_thumbnail_url: string | null
          completado: boolean
          gps_captura: string | null
          capturado_en: string | null
          observacion_tecnico: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['instalacion_respuestas']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['instalacion_respuestas']['Insert']>
      }
      codigos_error: {
        Row: {
          id: string
          modelo_id: string | null
          codigo: string
          descripcion: string
          causa: string
          solucion: string
          imagen_url: string | null
          es_critico: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['codigos_error']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['codigos_error']['Insert']>
      }
      tickets_soporte: {
        Row: {
          id: string
          numero: number
          equipo_id: string
          reportado_por: string
          asignado_a: string | null
          titulo: string
          descripcion: string
          codigo_error_id: string | null
          estado: TicketEstado
          prioridad: TicketPrioridad
          repuestos_solicitados: Json | null
          solucion_aplicada: string | null
          resuelto_en: string | null
          aplica_garantia: boolean | null
          garantia_cubierta: boolean | null
          fotos_urls: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['tickets_soporte']['Row'], 'id' | 'numero' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['tickets_soporte']['Insert']>
      }
      ticket_notas: {
        Row: {
          id: string
          ticket_id: string
          autor_id: string
          nota: string
          es_interna: boolean
          fotos_urls: string[] | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['ticket_notas']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['ticket_notas']['Insert']>
      }
    }
    Views: {
      dashboard_metricas: {
        Row: {
          total_equipos: number
          garantias_activas: number
          garantias_pendientes: number
          garantias_anuladas: number
          tasa_aprobacion_pct: number | null
          instalados_este_mes: number
        }
      }
      fallos_mas_comunes: {
        Row: {
          codigo: string
          descripcion: string
          causa: string
          total_tickets: number
          cubiertos_garantia: number
        }
      }
      instalaciones_pendientes_validacion: {
        Row: {
          equipo_id: string
          numero_serie: string
          modelo_nombre: string
          modelo_codigo: string
          cliente_nombre: string
          cliente_direccion: string | null
          tecnico_nombre: string
          tecnico_empresa: string | null
          tecnico_rol: UserRole
          instalacion_id: string | null
          completado_en: string | null
          total_pasos: number | null
          pasos_completados: number | null
          completitud_pct: number | null
          created_at: string
        }
      }
    }
    Functions: {
      completar_instalacion: {
        Args: { p_instalacion_id: string; p_gps_fin?: string }
        Returns: Json
      }
      validar_garantia: {
        Args: { p_equipo_id: string; p_aprobar: boolean; p_notas?: string }
        Returns: Json
      }
      get_my_rol: {
        Args: Record<string, never>
        Returns: UserRole
      }
    }
  }
}
