import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { ArrowRight, MapPin } from 'lucide-react'

interface Instalacion {
  equipo_id: string
  numero_serie: string | null
  modelo_nombre: string | null
  instalado_por_nombre: string | null
  direccion: string | null
  fecha_instalacion: string | null
}

interface UltimasInstalacionesProps {
  instalaciones: Instalacion[]
}

export function UltimasInstalaciones({ instalaciones }: UltimasInstalacionesProps) {
  if (instalaciones.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
        <h2 className="mb-4 text-base font-semibold text-gray-900 dark:text-white">
          Pendientes de Validación
        </h2>
        <p className="text-sm text-gray-500">No hay instalaciones pendientes de validación.</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
      <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">
          Pendientes de Validación
        </h2>
        <Link
          href="/validaciones"
          className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
        >
          Ver todas <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
      <ul className="divide-y divide-gray-100 dark:divide-gray-700">
        {instalaciones.map((inst) => (
          <li key={inst.equipo_id}>
            <Link
              href={`/validaciones/${inst.equipo_id}`}
              className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                <span className="text-xs font-bold">
                  {inst.numero_serie?.slice(-3) ?? '??'}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                  {inst.numero_serie ?? 'S/N'} — {inst.modelo_nombre ?? 'Modelo desconocido'}
                </p>
                <div className="mt-0.5 flex items-center gap-3 text-xs text-gray-500">
                  {inst.direccion && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {inst.direccion}
                    </span>
                  )}
                  {inst.instalado_por_nombre && (
                    <span>Por: {inst.instalado_por_nombre}</span>
                  )}
                </div>
              </div>
              <div className="shrink-0 text-right">
                {inst.fecha_instalacion && (
                  <p className="text-xs text-gray-400">
                    {formatDistanceToNow(new Date(inst.fecha_instalacion), {
                      addSuffix: true,
                      locale: es,
                    })}
                  </p>
                )}
                <span className="mt-1 inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-amber-600/20">
                  Pendiente
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
