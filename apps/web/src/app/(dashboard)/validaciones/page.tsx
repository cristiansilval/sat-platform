import { createServerClient } from '@/lib/supabase-server'
import { ValidacionCard } from '@/components/validacion/ValidacionCard'
import { ShieldCheck, AlertCircle } from 'lucide-react'

export const revalidate = 0

export default async function ValidacionesPage() {
  const supabase = createServerClient()
  const { data: pendientes } = await supabase
    .from('instalaciones_pendientes_validacion')
    .select('*')
    .order('created_at', { ascending: true })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Validación de Instalaciones</h1>
          <p className="text-sm text-gray-500">
            Revisa el checklist y las fotos antes de activar la garantía
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-amber-50 px-4 py-2 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm font-medium">{pendientes?.length ?? 0} pendientes</span>
        </div>
      </div>

      {!pendientes?.length ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 py-20 text-gray-400">
          <ShieldCheck className="mb-3 h-12 w-12" />
          <p className="font-medium">Todo al día</p>
          <p className="text-sm">No hay instalaciones pendientes de validación</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {pendientes.map(item => (
            <ValidacionCard key={item.equipo_id} instalacion={item} />
          ))}
        </div>
      )}
    </div>
  )
}
