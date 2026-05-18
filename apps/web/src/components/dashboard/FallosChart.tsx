'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface FalloItem {
  codigo: string
  descripcion: string
  total_tickets: number
  cubiertos_garantia: number
}

export function FallosChart({ data }: { data: FalloItem[] }) {
  const chartData = data.map(item => ({
    name: item.codigo,
    total: item.total_tickets,
    garantia: item.cubiertos_garantia,
    descripcion: item.descripcion,
  }))

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">
          Fallos más comunes (últimos 6 meses)
        </h3>
        <p className="text-xs text-gray-500">Basado en tickets de soporte cerrados</p>
      </div>

      {data.length === 0 ? (
        <div className="flex h-48 items-center justify-center text-gray-400">
          Sin datos de fallos registrados
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null
                const d = payload[0].payload
                return (
                  <div className="rounded-lg border bg-white p-3 shadow-lg dark:bg-gray-800">
                    <p className="font-semibold text-gray-900 dark:text-white">{d.name}</p>
                    <p className="text-xs text-gray-500 mb-2">{d.descripcion}</p>
                    <p className="text-sm">Total tickets: <strong>{d.total}</strong></p>
                    <p className="text-sm text-amber-600">Con garantía: <strong>{d.garantia}</strong></p>
                  </div>
                )
              }}
            />
            <Bar dataKey="total" radius={[4, 4, 0, 0]} maxBarSize={40}>
              {chartData.map((_, i) => (
                <Cell key={i} fill={i % 2 === 0 ? '#3b82f6' : '#60a5fa'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
