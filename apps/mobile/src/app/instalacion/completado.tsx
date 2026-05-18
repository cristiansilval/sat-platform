import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { router } from 'expo-router'
import { useEffect } from 'react'
import * as Haptics from 'expo-haptics'

export default function CompletadoScreen() {
  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
  }, [])

  return (
    <View style={styles.container}>
      <Text style={{ fontSize: 80 }}>🎉</Text>
      <Text style={styles.title}>¡Instalación completada!</Text>
      <Text style={styles.subtitle}>
        El checklist fue enviado al administrador para revisión.{'\n'}
        La garantía estará activa una vez validada.
      </Text>

      <View style={styles.infoBox}>
        <Text style={styles.infoText}>📋 Estado: <Text style={{ fontWeight: '700', color: '#d97706' }}>Pendiente de validación</Text></Text>
        <Text style={styles.infoText}>🕐 Recibirás confirmación dentro de 24-48 horas</Text>
      </View>

      <TouchableOpacity
        style={styles.btn}
        onPress={() => router.replace('/(tabs)/escaner')}
      >
        <Text style={styles.btnText}>Nueva instalación</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.btnSecondary}
        onPress={() => router.replace('/(tabs)/guia-errores')}
      >
        <Text style={styles.btnSecondaryText}>Ver guía de errores</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0fdf4', alignItems: 'center', justifyContent: 'center', padding: 32, gap: 16 },
  title: { fontSize: 26, fontWeight: '800', color: '#14532d', textAlign: 'center' },
  subtitle: { fontSize: 15, color: '#374151', textAlign: 'center', lineHeight: 22 },
  infoBox: { backgroundColor: '#fff', borderRadius: 12, padding: 16, width: '100%', gap: 8, borderWidth: 1, borderColor: '#d1fae5' },
  infoText: { fontSize: 14, color: '#374151' },
  btn: { backgroundColor: '#16a34a', paddingVertical: 14, paddingHorizontal: 32, borderRadius: 12, width: '100%', alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  btnSecondary: { paddingVertical: 12, paddingHorizontal: 32, borderRadius: 12, width: '100%', alignItems: 'center', borderWidth: 1, borderColor: '#d1d5db' },
  btnSecondaryText: { color: '#374151', fontWeight: '600', fontSize: 15 },
})
