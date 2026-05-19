import Link from 'next/link'
import { ShieldX } from 'lucide-react'

export default function NoAutorizadoPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="text-center">
        <div className="mb-4 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <ShieldX className="h-8 w-8 text-red-600" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Acceso no autorizado</h1>
        <p className="mt-2 text-sm text-gray-500">
          No tienes permisos de administrador para acceder a este panel.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Volver al login
        </Link>
      </div>
    </div>
  )
}
