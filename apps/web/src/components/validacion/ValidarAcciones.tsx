'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface ValidarAccionesProps {
  equipoId: string
}

export function ValidarAcciones({ equipoId }: ValidarAccionesProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<'aprobar' | 'rechazar' | null>(null)

  async function handleValidar(accion: 'aprobar' | 'rechazar') {
    setLoading(accion)
    try {
      const res = await fetch('/api/validar-garantia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ equipoId, accion }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error desconocido')
      toast.success(accion === 'aprobar' ? 'Garantía aprobada' : 'Instalación rechazada')
      router.push('/validaciones')
      router.refresh()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={() => handleValidar('rechazar')}
        disabled={loading !== null}
        className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
      >
        {loading === 'rechazar'
          ? <Loader2 className="h-4 w-4 animate-spin" />
          : <XCircle className="h-4 w-4" />
        }
        Rechazar
      </button>
      <button
        onClick={() => handleValidar('aprobar')}
        disabled={loading !== null}
        className="flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
      >
        {loading === 'aprobar'
          ? <Loader2 className="h-4 w-4 animate-spin" />
          : <CheckCircle2 className="h-4 w-4" />
        }
        Aprobar Garantía
      </button>
    </div>
  )
}
