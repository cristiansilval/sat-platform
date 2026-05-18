import { createServerClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { CheckCircle2, XCircle, Camera, Hash, ToggleLeft } from 'lucide-react'
import { ValidarAcciones } from '@/components/validacion/ValidarAcciones'
import { cn } from '@/lib/utils'

interface PageProps {
  params: { equipoId: string }
}

export default async function ValidacionDetallePage({ params }: PageProps) {
  const supabase = createServerClient()

  const { data: equipo } = await supabase
    .from('equipos_instalados')
    .select(`*, motores_modelos(*), profiles!instalado_por(full_name, empresa, rol)`)
    .eq('id', params.equipoId)
    .single()

  if (!equipo) notFound()

  const { data: instalacion } = await supabase
    .from('instalaciones_historial')
    .select('*')
    .eq('equipo_id', params.equipoId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  const { data: respuestas } = instalacion
    ? await supabase
        .from('instalacion_respuestas')
        .select('*')
        .eq('instalacion_id', instalacion.id)
        .order('orden')
    : { data: [] }

  const pasoIcono = {
    foto_obligatoria: Camera,
    confirmacion: ToggleLeft,
    valor_numerico: Hash,
    mixto: Hash,
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Validación: {equipo.numero_serie}
            </h1>
            <p className="text-sm text-gray-500">
              {equipo.motores_modelos?.nombre} — Cliente: {equipo.cliente_nombre}
            </p>
          </div>
          <ValidarAcciones equipoId={equipo.id} />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
          {[
            { label: 'Técnico', value: equipo.profiles?.full_name ?? 'N/A' },
            { label: 'Empresa', value: equipo.profiles?.empresa ?? equipo.profiles?.rol ?? 'N/A' },
            { label: 'Completado', value: instalacion?.completado_en ? format(new Date(instalacion.completado_en), "d MMM yyyy", { locale: es }) : 'En proceso' },
            { label: 'Pasos', value: `${instalacion?.pasos_completados ?? 0} / ${instalacion?.total_pasos ?? 0}` },
          ].map(item => (
            <div key={item.label} className="rounded-lg bg-gray-50 p-3 dark:bg-gray-700">
              <p className="text-xs text-gray-500">{item.label}</p>
              <p className="font-medium text-gray-900 dark:text-white">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Respuestas del checklist */}
      <div className="space-y-3">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">
          Checklist de Instalación
        </h2>

        {(respuestas ?? []).map((resp, idx) => {
          const IconPaso = pasoIcono[resp.tipo_paso as keyof typeof pasoIcono] ?? Hash
          const ok = resp.completado

          return (
            <div
              key={resp.id}
              className={cn(
                'rounded-xl border p-4 transition-colors',
                ok
                  ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/10'
                  : 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/10'
              )}
            >
              <div className="flex items-start gap-3">
                {/* Número */}
                <div className={cn(
                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                  ok ? 'bg-green-500 text-white' : 'bg-red-400 text-white'
                )}>
                  {idx + 1}
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <IconPaso className="h-4 w-4 text-gray-500" />
                    <p className="font-medium text-gray-900 dark:text-white">{resp.titulo_paso}</p>
                    {ok
                      ? <CheckCircle2 className="ml-auto h-4 w-4 text-green-600" />
                      : <XCircle className="ml-auto h-4 w-4 text-red-500" />
                    }
                  </div>

                  {/* Respuesta según tipo */}
                  <div className="mt-2 space-y-2">
                    {resp.tipo_paso === 'confirmacion' && (
                      <span className={cn(
                        'inline-block rounded-full px-3 py-0.5 text-xs font-medium',
                        resp.confirmacion ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      )}>
                        {resp.confirmacion ? 'Confirmado ✓' : 'No confirmado'}
                      </span>
                    )}

                    {resp.tipo_paso === 'valor_numerico' && resp.valor_numerico !== null && (
                      <span className="inline-block rounded-full bg-blue-100 px-3 py-0.5 text-xs font-medium text-blue-700">
                        Valor registrado: <strong>{resp.valor_numerico}</strong>
                      </span>
                    )}

                    {resp.foto_url && (
                      <div className="mt-2">
                        <Image
                          src={resp.foto_url}
                          alt={`Foto paso ${idx + 1}`}
                          width={300}
                          height={200}
                          className="rounded-lg object-cover"
                        />
                      </div>
                    )}

                    {resp.observacion_tecnico && (
                      <p className="text-xs italic text-gray-500">
                        Nota técnico: {resp.observacion_tecnico}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
