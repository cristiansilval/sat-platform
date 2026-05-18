import { createServerClient } from '@/lib/supabase-server'
import { MetricCard } from '@/components/dashboard/MetricCard'
import { FallosChart } from '@/components/dashboard/FallosChart'
import { GarantiaDonut } from '@/components/dashboard/GarantiaDonut'
import { UltimasInstalaciones } from '@/components/dashboard/UltimasInstalaciones'
import { Activity, CheckCircle2, Clock, XCircle, TrendingUp } from 'lucide-react'

export const revalidate = 60 // Revalidar cada 60 segundos

async function getDashboardData() {
  const supabase = createServerClient()

  const [metricas, fallos, pendientes] = await Promise.all([
    supabase.from('dashboard_metricas').select('*').single(),
    supabase.from('fallos_mas_comunes').select('*').limit(8),
    supabase.from('instalaciones_pendientes_validacion').select('*').limit(5),
  ])

  return {
    metricas: metricas.data,
    fallos: fallos.data ?? [],
    pendientes: pendientes.data ?? [],
  }
}

export default async function DashboardPage() {
  const { metricas, fallos, pendientes } = await getDashboardData()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-sm text-gray-500">Resumen general de instalaciones y garantías</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Equipos"
          value={metricas?.total_equipos ?? 0}
          icon={Activity}
          color="blue"
        />
        <MetricCard
          title="Garantías Activas"
          value={metricas?.garantias_activas ?? 0}
          icon={CheckCircle2}
          color="green"
        />
        <MetricCard
          title="Pendientes Validación"
          value={metricas?.garantias_pendientes ?? 0}
          icon={Clock}
          color="amber"
          href="/validaciones"
          badge="Revisar"
        />
        <MetricCard
          title="Tasa Aprobación"
          value={`${metricas?.tasa_aprobacion_pct ?? 0}%`}
          icon={TrendingUp}
          color="purple"
          subtitle={`${metricas?.instalados_este_mes ?? 0} instalados este mes`}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <FallosChart data={fallos} />
        </div>
        <div>
          <GarantiaDonut
            activas={metricas?.garantias_activas ?? 0}
            pendientes={metricas?.garantias_pendientes ?? 0}
            anuladas={metricas?.garantias_anuladas ?? 0}
          />
        </div>
      </div>

      {/* Pendientes de validación */}
      <UltimasInstalaciones instalaciones={pendientes} />
    </div>
  )
}
