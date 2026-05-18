/**
 * Pantalla: Escáner QR / Código de barras
 * Lee el número de serie del motor y carga el equipo + modelo de Supabase.
 */
import { useState, useEffect, useRef } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, Vibration } from 'react-native'
import { CameraView, useCameraPermissions } from 'expo-camera'
import { router } from 'expo-router'
import * as Haptics from 'expo-haptics'
import { supabase } from '@/lib/supabase'
import { useInstalacionStore } from '@/store/instalacion.store'
import * as Location from 'expo-location'

type ScanState = 'scanning' | 'loading' | 'found' | 'not_found' | 'error'

export default function EscanerScreen() {
  const [permission, requestPermission] = useCameraPermissions()
  const [scanState, setScanState] = useState<ScanState>('scanning')
  const [equipoInfo, setEquipoInfo] = useState<string>('')
  const scannedRef = useRef(false)

  const { iniciarInstalacion } = useInstalacionStore()

  useEffect(() => {
    if (!permission?.granted) requestPermission()
  }, [])

  async function handleBarCodeScanned({ data }: { data: string }) {
    if (scannedRef.current || scanState !== 'scanning') return
    scannedRef.current = true

    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    setScanState('loading')

    try {
      const { data: equipo, error } = await supabase
        .from('equipos_instalados')
        .select(`
          *,
          motores_modelos (
            id, codigo, nombre, tipo_central, manual_url,
            checklist_plantilla (id, orden, titulo, tipo_paso, es_critico, valor_min, valor_max, unidad, descripcion)
          )
        `)
        .eq('numero_serie', data.trim())
        .single()

      if (error || !equipo) {
        setScanState('not_found')
        setEquipoInfo(data)
        return
      }

      // Verificar que no tenga ya una instalación activa
      const { data: instalActiva } = await supabase
        .from('instalaciones_historial')
        .select('id')
        .eq('equipo_id', equipo.id)
        .is('completado_en', null)
        .single()

      if (instalActiva) {
        Alert.alert(
          'Instalación en curso',
          'Este equipo ya tiene una instalación en progreso. ¿Deseas continuar la instalación existente?',
          [
            { text: 'Cancelar', onPress: () => { scannedRef.current = false; setScanState('scanning') } },
            { text: 'Continuar', onPress: () => router.push('/instalacion/wizard') },
          ]
        )
        return
      }

      if (equipo.garantia_estado === 'activa') {
        Alert.alert(
          'Garantía ya activa',
          `Este motor (${data}) ya tiene garantía activa. ¿Deseas abrir un ticket de soporte?`,
          [
            { text: 'Cancelar', onPress: () => { scannedRef.current = false; setScanState('scanning') } },
            { text: 'Abrir ticket', onPress: () => router.push(`/tickets/nuevo?equipo=${equipo.id}`) },
          ]
        )
        return
      }

      // Obtener GPS
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High }).catch(() => null)
      const modelo = equipo.motores_modelos as any
      const pasos = modelo?.checklist_plantilla ?? []

      // Crear instalación en Supabase
      const { data: nuevaInstalacion, error: errInstal } = await supabase
        .from('instalaciones_historial')
        .insert({
          equipo_id: equipo.id,
          tecnico_id: (await supabase.auth.getUser()).data.user!.id,
          total_pasos: pasos.length,
          pasos_completados: 0,
          gps_inicio: loc
            ? `SRID=4326;POINT(${loc.coords.longitude} ${loc.coords.latitude})`
            : null,
        })
        .select()
        .single()

      if (errInstal || !nuevaInstalacion) throw new Error(errInstal?.message)

      // Inicializar store con la instalación
      iniciarInstalacion({
        instalacion_id: nuevaInstalacion.id,
        equipo_id: equipo.id,
        numero_serie: equipo.numero_serie,
        modelo_id: modelo.id,
        modelo_nombre: modelo.nombre,
        cliente_nombre: equipo.cliente_nombre,
        total_pasos: pasos.length,
        iniciado_en: new Date().toISOString(),
        gps_inicio_lat: loc?.coords.latitude,
        gps_inicio_lng: loc?.coords.longitude,
      })

      setScanState('found')
      setTimeout(() => router.push('/instalacion/wizard'), 1200)

    } catch (err) {
      console.error('[escaner]', err)
      setScanState('error')
    }
  }

  function resetScanner() {
    scannedRef.current = false
    setScanState('scanning')
    setEquipoInfo('')
  }

  if (!permission) return <View style={styles.centered}><ActivityIndicator /></View>

  if (!permission.granted) {
    return (
      <View style={styles.centered}>
        <Text style={styles.permText}>Se requiere acceso a la cámara</Text>
        <TouchableOpacity style={styles.btn} onPress={requestPermission}>
          <Text style={styles.btnText}>Otorgar permiso</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {scanState === 'scanning' && (
        <>
          <CameraView
            style={StyleSheet.absoluteFillObject}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ['qr', 'code128', 'code39', 'ean13'] }}
            onBarcodeScanned={handleBarCodeScanned}
          />
          {/* Overlay con visor */}
          <View style={styles.overlay}>
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Escanear motor</Text>
              <Text style={styles.headerSub}>Apunta al código QR o código de barras del número de serie</Text>
            </View>
            <View style={styles.viewfinder}>
              <View style={[styles.corner, styles.cornerTL]} />
              <View style={[styles.corner, styles.cornerTR]} />
              <View style={[styles.corner, styles.cornerBL]} />
              <View style={[styles.corner, styles.cornerBR]} />
            </View>
            <Text style={styles.hint}>El código se detecta automáticamente</Text>
          </View>
        </>
      )}

      {scanState === 'loading' && (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Buscando equipo...</Text>
        </View>
      )}

      {scanState === 'found' && (
        <View style={[styles.centered, { backgroundColor: '#f0fdf4' }]}>
          <Text style={{ fontSize: 48 }}>✅</Text>
          <Text style={[styles.loadingText, { color: '#16a34a' }]}>¡Equipo encontrado!</Text>
          <Text style={{ color: '#6b7280' }}>Iniciando asistente de instalación...</Text>
        </View>
      )}

      {(scanState === 'not_found' || scanState === 'error') && (
        <View style={styles.centered}>
          <Text style={{ fontSize: 48 }}>{scanState === 'not_found' ? '🔍' : '⚠️'}</Text>
          <Text style={[styles.loadingText, { color: '#dc2626' }]}>
            {scanState === 'not_found' ? 'Número de serie no registrado' : 'Error de conexión'}
          </Text>
          <Text style={{ color: '#6b7280', marginBottom: 24, textAlign: 'center', paddingHorizontal: 32 }}>
            {scanState === 'not_found'
              ? `"${equipoInfo}" no está en el sistema. Verifica el número de serie.`
              : 'No se pudo conectar al servidor. Verifica tu conexión.'}
          </Text>
          <TouchableOpacity style={styles.btn} onPress={resetScanner}>
            <Text style={styles.btnText}>Volver a escanear</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', gap: 12 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 60,
  },
  header: { alignItems: 'center', gap: 6 },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: '700', textShadowColor: '#000', textShadowRadius: 4, textShadowOffset: { width: 0, height: 1 } },
  headerSub: { color: 'rgba(255,255,255,0.8)', fontSize: 13, textAlign: 'center', paddingHorizontal: 32 },
  viewfinder: { width: 260, height: 260, position: 'relative' },
  corner: { position: 'absolute', width: 28, height: 28, borderColor: '#3b82f6', borderWidth: 3 },
  cornerTL: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 },
  cornerTR: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 },
  cornerBL: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 },
  cornerBR: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 },
  hint: { color: 'rgba(255,255,255,0.7)', fontSize: 13 },
  loadingText: { fontSize: 18, fontWeight: '600', color: '#374151' },
  permText: { fontSize: 16, color: '#374151', marginBottom: 16, textAlign: 'center', paddingHorizontal: 32 },
  btn: { backgroundColor: '#3b82f6', paddingHorizontal: 28, paddingVertical: 12, borderRadius: 10 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
})
