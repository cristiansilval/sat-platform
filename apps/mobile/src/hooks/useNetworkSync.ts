/**
 * Hook que detecta conectividad y sincroniza automáticamente
 * las respuestas offline pendientes en cuanto hay red.
 */
import { useEffect, useCallback } from 'react'
import * as Network from 'expo-network'
import * as FileSystem from 'expo-file-system'
import { supabase } from '@/lib/supabase'
import { useInstalacionStore } from '@/store/instalacion.store'

export function useNetworkSync() {
  const { instalacion, marcarSincronizado, getPasosPendienteSync } = useInstalacionStore()

  const subirFotosPendientes = useCallback(async () => {
    const pendientes = getPasosPendienteSync()
    if (!pendientes.length || !instalacion) return

    for (const resp of pendientes) {
      if (!resp.foto_uri || resp.foto_url) continue

      try {
        const fileInfo = await FileSystem.getInfoAsync(resp.foto_uri)
        if (!fileInfo.exists) continue

        const fileName = `${instalacion.equipo_id}/${resp.paso_id}_${Date.now()}.jpg`
        const base64 = await FileSystem.readAsStringAsync(resp.foto_uri, {
          encoding: FileSystem.EncodingType.Base64,
        })

        const { data, error } = await supabase.storage
          .from('instalacion-fotos')
          .upload(fileName, decode(base64), {
            contentType: 'image/jpeg',
            upsert: true,
          })

        if (error) {
          console.warn('[sync] Error subiendo foto:', error.message)
          continue
        }

        const { data: urlData } = supabase.storage
          .from('instalacion-fotos')
          .getPublicUrl(fileName)

        marcarSincronizado(resp.paso_id, urlData.publicUrl)

        // Actualizar en BD si ya existe la respuesta
        if (instalacion.instalacion_id) {
          await supabase
            .from('instalacion_respuestas')
            .update({ foto_url: urlData.publicUrl })
            .eq('instalacion_id', instalacion.instalacion_id)
            .eq('paso_id', resp.paso_id)
        }
      } catch (err) {
        console.warn('[sync] Error procesando foto:', err)
      }
    }
  }, [instalacion, getPasosPendienteSync, marcarSincronizado])

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>

    const checkAndSync = async () => {
      const status = await Network.getNetworkStateAsync()
      if (status.isConnected && status.isInternetReachable) {
        await subirFotosPendientes()
      }
    }

    checkAndSync()
    // Revisar cada 30 segundos
    interval = setInterval(checkAndSync, 30_000)

    return () => clearInterval(interval)
  }, [subirFotosPendientes])
}

// Convierte base64 a Uint8Array para el upload de Supabase Storage
function decode(base64: string): Uint8Array {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
  const bytes: number[] = []
  let i = 0
  const str = base64.replace(/=+$/, '')
  while (i < str.length) {
    const a = chars.indexOf(str[i++])
    const b = chars.indexOf(str[i++])
    const c = chars.indexOf(str[i++])
    const d = chars.indexOf(str[i++])
    bytes.push((a << 2) | (b >> 4))
    if (c !== -1) bytes.push(((b & 15) << 4) | (c >> 2))
    if (d !== -1) bytes.push(((c & 3) << 6) | d)
  }
  return new Uint8Array(bytes)
}
