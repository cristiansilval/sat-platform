'use client'

import { useState } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { CheckCircle2, XCircle, Eye, User, MapPin, Package, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface InstalacionPendiente {
  equipo_id: string
  numero_serie: string
  modelo_nombre: string
  modelo_codigo: string
  cliente_nombre: string
  cliente_direccion: string | null
  tecnico_nombre: string
  tecnico_empresa: string | null
  tecnico_rol: string
  instalacion_id: string | null
  completado_en: string | null
  total_pasos: number | null
  pasos_completados: number | null
  completitud_pct: number | null
  created_at: string
}

export function ValidacionCard({ instalacion }: { instalacion: InstalacionPendiente }) {
  const [loading, setLoading] = useState(false)
  const completitud = instalacion.completitud_pct ?? 0

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/20">
              <Package className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">
                {instalacion.numero_serie}
              </p>
              <p className="text-xs text-gray-500">
                {instalacion.modelo_nombre} ({instalacion.modelo_codigo})
              </p>
            </div>
          </div>

          {/* Barra de completitud */}
          <div className="text-right">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">{completitud}%</p>
            <p className="text-xs text-gray-400">completado</p>
          </div>
        </div>

        {/* Progreso */}
        <div className="mt-4">
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
            <div
              className={cn(
                'h-full rounded-full transition-all',
                completitud === 100 ? 'bg-green-500' : completitud >= 70 ? 'bg-amber-400' : 'bg-red-400'
              )}
              style={{ width: `${completitud}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-gray-400">
            {instalacion.pasos_completados ?? 0} de {instalacion.total_pasos ?? 0} pasos completados
          </p>
        </div>

        {/* Info grid */}
        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-start gap-2 text-gray-600 dark:text-gray-400">
            <User className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <div>
              <p className="font-medium text-gray-800 dark:text-gray-200">{instalacion.tecnico_nombre}</p>
              <p className="text-xs">{instalacion.tecnico_empresa ?? instalacion.tecnico_rol}</p>
            </div>
          </div>
          <div className="flex items-start gap-2 text-gray-600 dark:text-gray-400">
            <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <p className="text-xs">{instalacion.cliente_direccion ?? 'Sin dirección'}</p>
          </div>
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <Clock className="h-3.5 w-3.5 shrink-0" />
            <p className="text-xs">
              {instalacion.completado_en
                ? format(new Date(instalacion.completado_en), "d MMM yyyy, HH:mm", { locale: es })
                : 'En progreso'}
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 border-t border-gray-100 p-4 dark:border-gray-700">
        <Link
          href={`/validaciones/${instalacion.equipo_id}`}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          <Eye className="h-4 w-4" />
          Ver detalle y fotos
        </Link>

        {completitud === 100 && (
          <>
            <ValidarButton equipoId={instalacion.equipo_id} aprobar={true} />
            <ValidarButton equipoId={instalacion.equipo_id} aprobar={false} />
          </>
        )}
      </div>
    </div>
  )
}

function ValidarButton({ equipoId, aprobar }: { equipoId: string; aprobar: boolean }) {
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    setLoading(true)
    try {
      const res = await fetch('/api/validar-garantia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ equipo_id: equipoId, aprobar }),
      })
      const data = await res.json()
      if (data.success) {
        window.location.reload()
      }
    } finally {
      setLoading(false)
    }
  }

  if (aprobar) {
    return (
      <button
        onClick={handleClick}
        disabled={loading}
        className="flex items-center gap-1.5 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50"
      >
        <CheckCircle2 className="h-4 w-4" />
        {loading ? 'Activando...' : 'Activar garantía'}
      </button>
    )
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
    >
      <XCircle className="h-4 w-4" />
      {loading ? '...' : 'Rechazar'}
    </button>
  )
}
