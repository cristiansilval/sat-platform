/**
 * Pantalla: Guía de Programación y Errores
 * Funciona 100% offline después de la primera carga.
 * Cachea los códigos en SQLite local.
 */
import { useState, useEffect, useCallback } from 'react'
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl
} from 'react-native'
import * as SQLite from 'expo-sqlite'
import * as Network from 'expo-network'
import { supabase } from '@/lib/supabase'

interface CodigoError {
  id: string
  codigo: string
  descripcion: string
  causa: string
  solucion: string
  es_critico: boolean
  modelo_id: string | null
}

const db = SQLite.openDatabaseSync('sat_offline.db')

// Inicializar tabla local si no existe
db.execSync(`
  CREATE TABLE IF NOT EXISTS codigos_error_cache (
    id TEXT PRIMARY KEY,
    codigo TEXT NOT NULL,
    descripcion TEXT NOT NULL,
    causa TEXT NOT NULL,
    solucion TEXT NOT NULL,
    es_critico INTEGER NOT NULL DEFAULT 0,
    modelo_id TEXT,
    cached_at INTEGER NOT NULL
  );
`)

export default function GuiaErroresScreen() {
  const [codigos, setCodigos] = useState<CodigoError[]>([])
  const [filtrados, setFiltrados] = useState<CodigoError[]>([])
  const [busqueda, setBusqueda] = useState('')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [soloOffline, setSoloOffline] = useState(false)
  const [expandido, setExpandido] = useState<string | null>(null)

  const cargarDesdeCache = useCallback(() => {
    const rows = db.getAllSync<CodigoError>('SELECT * FROM codigos_error_cache ORDER BY codigo')
    setCodigos(rows)
    setFiltrados(rows)
    return rows
  }, [])

  const sincronizarDesdeAPI = useCallback(async () => {
    try {
      const net = await Network.getNetworkStateAsync()
      if (!net.isConnected || !net.isInternetReachable) {
        setSoloOffline(true)
        return
      }

      setSoloOffline(false)
      const { data, error } = await supabase
        .from('codigos_error')
        .select('*')
        .order('codigo')

      if (error || !data) return

      // Guardar en caché SQLite
      const now = Date.now()
      db.withTransactionSync(() => {
        db.runSync('DELETE FROM codigos_error_cache')
        for (const item of data) {
          db.runSync(
            `INSERT INTO codigos_error_cache (id, codigo, descripcion, causa, solucion, es_critico, modelo_id, cached_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [item.id, item.codigo, item.descripcion, item.causa, item.solucion,
              item.es_critico ? 1 : 0, item.modelo_id ?? null, now]
          )
        }
      })

      setCodigos(data as CodigoError[])
      setFiltrados(data as CodigoError[])
    } catch (err) {
      console.warn('[guia-errores] Error sync:', err)
    }
  }, [])

  useEffect(() => {
    async function init() {
      setLoading(true)
      // 1. Mostrar caché inmediatamente
      const cached = cargarDesdeCache()
      // 2. Intentar actualizar en background
      await sincronizarDesdeAPI()
      setLoading(false)
    }
    init()
  }, [])

  useEffect(() => {
    if (!busqueda.trim()) {
      setFiltrados(codigos)
      return
    }
    const q = busqueda.toLowerCase()
    setFiltrados(codigos.filter(c =>
      c.codigo.toLowerCase().includes(q) ||
      c.descripcion.toLowerCase().includes(q) ||
      c.causa.toLowerCase().includes(q) ||
      c.solucion.toLowerCase().includes(q)
    ))
  }, [busqueda, codigos])

  async function handleRefresh() {
    setRefreshing(true)
    await sincronizarDesdeAPI()
    setRefreshing(false)
  }

  if (loading && codigos.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={{ color: '#6b7280', marginTop: 8 }}>Cargando guía de errores...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Guía de Errores</Text>
        {soloOffline && (
          <View style={styles.offlineBadge}>
            <Text style={styles.offlineBadgeText}>📴 Modo offline</Text>
          </View>
        )}
        <TextInput
          style={styles.search}
          placeholder="Buscar código, síntoma o solución..."
          value={busqueda}
          onChangeText={setBusqueda}
          clearButtonMode="while-editing"
          placeholderTextColor="#9ca3af"
        />
        <Text style={styles.resultCount}>
          {filtrados.length} código{filtrados.length !== 1 ? 's' : ''}
          {codigos.length !== filtrados.length ? ` de ${codigos.length}` : ''}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 40, gap: 10 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {filtrados.length === 0 ? (
          <View style={styles.empty}>
            <Text style={{ fontSize: 32 }}>🔍</Text>
            <Text style={{ color: '#6b7280' }}>Sin resultados para "{busqueda}"</Text>
          </View>
        ) : filtrados.map(item => (
          <TouchableOpacity
            key={item.id}
            style={[styles.card, item.es_critico && styles.cardCritico]}
            onPress={() => setExpandido(expandido === item.id ? null : item.id)}
            activeOpacity={0.85}
          >
            {/* Cabecera */}
            <View style={styles.cardHeader}>
              <View style={styles.codigoBadge}>
                <Text style={styles.codigoBadgeText}>{item.codigo}</Text>
              </View>
              <Text style={styles.descripcion} numberOfLines={expandido === item.id ? undefined : 2}>
                {item.descripcion}
              </Text>
              {item.es_critico && (
                <View style={styles.criticoBadge}>
                  <Text style={styles.criticoBadgeText}>⚠️ Crítico</Text>
                </View>
              )}
            </View>

            {/* Detalle expandible */}
            {expandido === item.id && (
              <View style={styles.cardDetail}>
                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>🔧 Causa</Text>
                  <Text style={styles.detailText}>{item.causa}</Text>
                </View>
                <View style={[styles.detailSection, styles.solucionSection]}>
                  <Text style={styles.detailLabel}>✅ Solución</Text>
                  <Text style={styles.detailText}>{item.solucion}</Text>
                </View>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { backgroundColor: '#fff', padding: 20, paddingTop: 56, borderBottomWidth: 1, borderBottomColor: '#e5e7eb', gap: 10 },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#111827' },
  offlineBadge: { backgroundColor: '#fef3c7', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, alignSelf: 'flex-start' },
  offlineBadgeText: { color: '#92400e', fontSize: 12, fontWeight: '600' },
  search: { backgroundColor: '#f3f4f6', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, color: '#111827' },
  resultCount: { fontSize: 12, color: '#9ca3af' },
  empty: { alignItems: 'center', paddingVertical: 40, gap: 8 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#e5e7eb' },
  cardCritico: { borderLeftWidth: 3, borderLeftColor: '#ef4444' },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, flexWrap: 'wrap' },
  codigoBadge: { backgroundColor: '#eff6ff', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  codigoBadgeText: { color: '#1d4ed8', fontWeight: '700', fontSize: 13 },
  descripcion: { flex: 1, color: '#374151', fontSize: 14, lineHeight: 20 },
  criticoBadge: { backgroundColor: '#fef2f2', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  criticoBadgeText: { color: '#dc2626', fontSize: 11, fontWeight: '600' },
  cardDetail: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f3f4f6', gap: 10 },
  detailSection: { gap: 4 },
  solucionSection: { backgroundColor: '#f0fdf4', padding: 10, borderRadius: 8 },
  detailLabel: { fontSize: 12, fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5 },
  detailText: { fontSize: 14, color: '#374151', lineHeight: 20 },
})
