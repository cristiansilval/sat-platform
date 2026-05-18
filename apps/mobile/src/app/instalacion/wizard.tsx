/**
 * Pantalla: Wizard / Asistente de Instalación paso a paso
 * Bloquea el avance si el paso actual no está completado.
 * Funciona offline: guarda localmente y sincroniza cuando hay red.
 */
import { useState, useCallback } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, Alert, ActivityIndicator, Image, Switch
} from 'react-native'
import { router } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
import * as Location from 'expo-location'
import * as Haptics from 'expo-haptics'
import { supabase } from '@/lib/supabase'
import { useInstalacionStore, type RespuestaPaso } from '@/store/instalacion.store'
import { useNetworkSync } from '@/hooks/useNetworkSync'

export default function WizardScreen() {
  useNetworkSync() // Sincronización en background

  const {
    instalacion,
    responderPaso,
    avanzarPaso,
    retrocederPaso,
    limpiarInstalacion,
  } = useInstalacionStore()

  const [saving, setSaving] = useState(false)

  if (!instalacion) {
    router.replace('/(tabs)/escaner')
    return null
  }

  const pasoIdx = instalacion.paso_actual
  const total = instalacion.total_pasos
  const progreso = total > 0 ? ((pasoIdx) / total) * 100 : 0

  // Obtener checklist del store o de Supabase (se cargó en el escáner)
  // Aquí usamos las respuestas ya guardadas
  const respuestaActual = Object.values(instalacion.respuestas).find(r => r.orden === pasoIdx)

  const estaCompleto = !!respuestaActual?.completado

  async function tomarFoto() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Permiso requerido', 'Necesitamos acceso a la cámara para tomar la foto de evidencia.')
      return
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.75,
      allowsEditing: false,
    })

    if (!result.canceled && result.assets[0] && respuestaActual) {
      const gps = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }).catch(() => null)
      responderPaso(respuestaActual.paso_id, {
        foto_uri: result.assets[0].uri,
        completado: true,
        gps_lat: gps?.coords.latitude,
        gps_lng: gps?.coords.longitude,
        pendiente_sync: true,
      })
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    }
  }

  async function handleAvanzar() {
    if (!estaCompleto) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      Alert.alert('Paso incompleto', 'Debes completar este paso antes de continuar.')
      return
    }

    // Guardar respuesta en Supabase (si hay conexión)
    if (respuestaActual && instalacion.instalacion_id) {
      setSaving(true)
      try {
        await supabase.from('instalacion_respuestas').upsert({
          instalacion_id: instalacion.instalacion_id,
          paso_id: respuestaActual.paso_id,
          orden: respuestaActual.orden,
          titulo_paso: respuestaActual.titulo_paso,
          tipo_paso: respuestaActual.tipo_paso,
          confirmacion: respuestaActual.confirmacion ?? null,
          valor_numerico: respuestaActual.valor_numerico ?? null,
          foto_url: respuestaActual.foto_url ?? null,
          completado: true,
          observacion_tecnico: respuestaActual.observacion ?? null,
        }, { onConflict: 'instalacion_id,paso_id' })
      } catch {
        // Offline: el hook useNetworkSync lo sincronizará después
      } finally {
        setSaving(false)
      }
    }

    if (pasoIdx >= total - 1) {
      await handleFinalizar()
    } else {
      avanzarPaso()
    }
  }

  async function handleFinalizar() {
    Alert.alert(
      '¿Finalizar instalación?',
      'Se enviará el checklist completo para validación del administrador. Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Finalizar', onPress: async () => {
            setSaving(true)
            try {
              if (instalacion.instalacion_id) {
                const gps = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High }).catch(() => null)
                const result = await supabase.rpc('completar_instalacion', {
                  p_instalacion_id: instalacion.instalacion_id,
                  p_gps_fin: gps
                    ? `SRID=4326;POINT(${gps.coords.longitude} ${gps.coords.latitude})`
                    : null,
                })
                if (result.error) throw result.error
              }
              limpiarInstalacion()
              router.replace('/instalacion/completado')
            } catch (err) {
              Alert.alert('Error', 'No se pudo completar. Verifica tu conexión e intenta de nuevo.')
            } finally {
              setSaving(false)
            }
          }
        },
      ]
    )
  }

  if (!respuestaActual) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator />
        <Text>Cargando paso...</Text>
      </View>
    )
  }

  const esUltimoPaso = pasoIdx >= total - 1

  return (
    <View style={styles.container}>
      {/* Header con progreso */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.pasoLabel}>Paso {pasoIdx + 1} de {total}</Text>
          {respuestaActual.tipo_paso && (
            <View style={[
              styles.tipoBadge,
              respuestaActual.tipo_paso === 'foto_obligatoria' ? styles.badgeFoto
                : respuestaActual.tipo_paso === 'confirmacion' ? styles.badgeConfirm
                : styles.badgeValor
            ]}>
              <Text style={styles.tipoBadgeText}>
                {respuestaActual.tipo_paso === 'foto_obligatoria' ? '📷 Foto' :
                  respuestaActual.tipo_paso === 'confirmacion' ? '✅ Confirmar' : '🔢 Valor'}
              </Text>
            </View>
          )}
        </View>

        {/* Barra de progreso */}
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progreso}%` }]} />
        </View>

        <Text style={styles.titulo}>{respuestaActual.titulo_paso}</Text>
      </View>

      <ScrollView style={styles.body} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Control según tipo de paso */}

        {/* ── FOTO OBLIGATORIA ── */}
        {(respuestaActual.tipo_paso === 'foto_obligatoria' || respuestaActual.foto_uri) && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Evidencia fotográfica *</Text>
            {respuestaActual.foto_uri ? (
              <View>
                <Image source={{ uri: respuestaActual.foto_uri }} style={styles.fotoPreview} />
                {respuestaActual.pendiente_sync && (
                  <Text style={styles.syncPending}>⏳ Pendiente de sincronización</Text>
                )}
                <TouchableOpacity style={styles.btnSecondary} onPress={tomarFoto}>
                  <Text style={styles.btnSecondaryText}>Retomar foto</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.fotoPlaceholder} onPress={tomarFoto}>
                <Text style={{ fontSize: 36 }}>📷</Text>
                <Text style={styles.fotoPlaceholderText}>Toca para tomar la foto</Text>
                <Text style={{ fontSize: 12, color: '#9ca3af' }}>La foto es obligatoria para avanzar</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* ── CONFIRMACIÓN SÍ/NO ── */}
        {respuestaActual.tipo_paso === 'confirmacion' && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Confirmación *</Text>
            <View style={styles.switchRow}>
              <Switch
                value={respuestaActual.confirmacion ?? false}
                onValueChange={(val) => responderPaso(respuestaActual.paso_id, {
                  confirmacion: val,
                  completado: val,
                })}
                trackColor={{ false: '#d1d5db', true: '#3b82f6' }}
                thumbColor={respuestaActual.confirmacion ? '#fff' : '#9ca3af'}
              />
              <Text style={styles.switchLabel}>
                {respuestaActual.confirmacion ? '✓ Confirmado' : 'Sin confirmar'}
              </Text>
            </View>
          </View>
        )}

        {/* ── VALOR NUMÉRICO ── */}
        {respuestaActual.tipo_paso === 'valor_numerico' && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Valor medido *</Text>
            <View style={styles.valorRow}>
              <TextInput
                style={styles.valorInput}
                keyboardType="numeric"
                placeholder="0.00"
                value={respuestaActual.valor_numerico?.toString() ?? ''}
                onChangeText={(text) => {
                  const num = parseFloat(text)
                  if (!isNaN(num)) {
                    const ok = true // validar min/max según modelo si es necesario
                    responderPaso(respuestaActual.paso_id, {
                      valor_numerico: num,
                      completado: ok,
                    })
                  }
                }}
              />
            </View>
          </View>
        )}

        {/* Observación opcional */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Observación (opcional)</Text>
          <TextInput
            style={styles.obsInput}
            multiline
            numberOfLines={3}
            placeholder="Notas adicionales para el administrador..."
            value={respuestaActual.observacion ?? ''}
            onChangeText={(text) => responderPaso(respuestaActual.paso_id, { observacion: text })}
          />
        </View>
      </ScrollView>

      {/* Footer de navegación */}
      <View style={styles.footer}>
        {pasoIdx > 0 && (
          <TouchableOpacity style={styles.btnBack} onPress={retrocederPaso}>
            <Text style={styles.btnBackText}>← Anterior</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.btnNext, !estaCompleto && styles.btnDisabled, saving && styles.btnDisabled]}
          onPress={handleAvanzar}
          disabled={!estaCompleto || saving}
        >
          {saving
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.btnNextText}>{esUltimoPaso ? '🏁 Finalizar instalación' : 'Siguiente →'}</Text>
          }
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  header: { backgroundColor: '#fff', padding: 20, paddingTop: 56, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  pasoLabel: { fontSize: 13, color: '#6b7280', fontWeight: '500' },
  tipoBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  badgeFoto: { backgroundColor: '#eff6ff' },
  badgeConfirm: { backgroundColor: '#f0fdf4' },
  badgeValor: { backgroundColor: '#fefce8' },
  tipoBadgeText: { fontSize: 12, fontWeight: '600' },
  progressTrack: { height: 6, backgroundColor: '#e5e7eb', borderRadius: 3, marginBottom: 12, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#3b82f6', borderRadius: 3 },
  titulo: { fontSize: 18, fontWeight: '700', color: '#111827', lineHeight: 26 },
  body: { flex: 1, padding: 20 },
  section: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#e5e7eb' },
  sectionLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 10 },
  fotoPlaceholder: { height: 180, borderRadius: 10, borderWidth: 2, borderStyle: 'dashed', borderColor: '#93c5fd', backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center', gap: 6 },
  fotoPlaceholderText: { color: '#3b82f6', fontWeight: '600', fontSize: 15 },
  fotoPreview: { width: '100%', height: 240, borderRadius: 10, marginBottom: 8 },
  syncPending: { color: '#d97706', fontSize: 12, marginBottom: 8, textAlign: 'center' },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  switchLabel: { fontSize: 15, fontWeight: '500', color: '#374151' },
  valorRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  valorInput: { flex: 1, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 12, fontSize: 20, fontWeight: '700', textAlign: 'center', color: '#111827' },
  obsInput: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 12, fontSize: 14, color: '#374151', textAlignVertical: 'top', minHeight: 80 },
  btnSecondary: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 10, alignItems: 'center', marginTop: 4 },
  btnSecondaryText: { color: '#6b7280', fontWeight: '500' },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e5e7eb', padding: 16, paddingBottom: 32, flexDirection: 'row', gap: 10 },
  btnBack: { paddingHorizontal: 16, paddingVertical: 14, borderRadius: 10, borderWidth: 1, borderColor: '#d1d5db', alignItems: 'center', justifyContent: 'center' },
  btnBackText: { color: '#374151', fontWeight: '600' },
  btnNext: { flex: 1, backgroundColor: '#3b82f6', paddingVertical: 14, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  btnNextText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  btnDisabled: { opacity: 0.5 },
})
