/**
 * Store de Zustand para el wizard de instalación.
 * Persiste en MMKV para resistir pérdidas de conexión y cierres de la app.
 */
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { MMKV } from 'react-native-mmkv'
import type { PasoTipo } from '@sat/supabase-client'

const mmkv = new MMKV({ id: 'instalacion-store' })

const mmkvStorage = {
  getItem: (key: string) => mmkv.getString(key) ?? null,
  setItem: (key: string, value: string) => mmkv.set(key, value),
  removeItem: (key: string) => mmkv.delete(key),
}

export interface RespuestaPaso {
  paso_id: string
  orden: number
  titulo_paso: string
  tipo_paso: PasoTipo
  confirmacion?: boolean
  valor_numerico?: number
  foto_uri?: string          // URI local mientras está offline
  foto_url?: string          // URL Supabase Storage (después de subir)
  foto_thumbnail_url?: string
  completado: boolean
  gps_lat?: number
  gps_lng?: number
  observacion?: string
  pendiente_sync: boolean    // true = no subido aún a Supabase
}

export interface InstalacionEnCurso {
  instalacion_id: string | null
  equipo_id: string
  numero_serie: string
  modelo_nombre: string
  modelo_id: string
  cliente_nombre: string
  paso_actual: number
  total_pasos: number
  respuestas: Record<string, RespuestaPaso>  // key = paso_id
  iniciado_en: string
  gps_inicio_lat?: number
  gps_inicio_lng?: number
  sincronizado: boolean
}

interface InstalacionStore {
  instalacion: InstalacionEnCurso | null
  iniciarInstalacion: (data: Omit<InstalacionEnCurso, 'paso_actual' | 'respuestas' | 'sincronizado'>) => void
  responderPaso: (paso_id: string, respuesta: Partial<RespuestaPaso>) => void
  avanzarPaso: () => void
  retrocederPaso: () => void
  marcarSincronizado: (paso_id: string, foto_url: string) => void
  limpiarInstalacion: () => void
  getPasoActualRespuesta: () => RespuestaPaso | null
  getPasosPendienteSync: () => RespuestaPaso[]
}

export const useInstalacionStore = create<InstalacionStore>()(
  persist(
    (set, get) => ({
      instalacion: null,

      iniciarInstalacion: (data) => set({
        instalacion: {
          ...data,
          paso_actual: 0,
          respuestas: {},
          sincronizado: false,
        }
      }),

      responderPaso: (paso_id, respuesta) => set((state) => {
        if (!state.instalacion) return state
        const existente = state.instalacion.respuestas[paso_id] ?? {}
        return {
          instalacion: {
            ...state.instalacion,
            respuestas: {
              ...state.instalacion.respuestas,
              [paso_id]: {
                ...existente,
                ...respuesta,
                paso_id,
                pendiente_sync: true,
              } as RespuestaPaso,
            },
          },
        }
      }),

      avanzarPaso: () => set((state) => {
        if (!state.instalacion) return state
        const siguiente = Math.min(state.instalacion.paso_actual + 1, state.instalacion.total_pasos - 1)
        return { instalacion: { ...state.instalacion, paso_actual: siguiente } }
      }),

      retrocederPaso: () => set((state) => {
        if (!state.instalacion) return state
        const anterior = Math.max(state.instalacion.paso_actual - 1, 0)
        return { instalacion: { ...state.instalacion, paso_actual: anterior } }
      }),

      marcarSincronizado: (paso_id, foto_url) => set((state) => {
        if (!state.instalacion) return state
        const resp = state.instalacion.respuestas[paso_id]
        if (!resp) return state
        return {
          instalacion: {
            ...state.instalacion,
            respuestas: {
              ...state.instalacion.respuestas,
              [paso_id]: { ...resp, foto_url, pendiente_sync: false },
            },
          },
        }
      }),

      limpiarInstalacion: () => set({ instalacion: null }),

      getPasoActualRespuesta: () => {
        const { instalacion } = get()
        if (!instalacion) return null
        const respuestasArr = Object.values(instalacion.respuestas)
        return respuestasArr.find(r => r.orden === instalacion.paso_actual) ?? null
      },

      getPasosPendienteSync: () => {
        const { instalacion } = get()
        if (!instalacion) return []
        return Object.values(instalacion.respuestas).filter(r => r.pendiente_sync)
      },
    }),
    {
      name: 'instalacion-en-curso',
      storage: createJSONStorage(() => mmkvStorage),
    }
  )
)
