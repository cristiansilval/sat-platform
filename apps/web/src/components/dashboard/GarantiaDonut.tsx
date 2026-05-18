'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'

interface GarantiaDonutProps {
  activas: number
  pendientes: number
  anuladas: number
}

const COLORS = { activa: '#22c55e', pendiente: '#f59e0b', anulada: '#ef4444' }

export function GarantiaDonut({ activas, pendientes, anuladas }: GarantiaDonutProps) {
  const data = [
    { name: 'Activas',    value: activas,    color: COLORS.activa },
    { name: 'Pendientes', value: pendientes, color: COLORS.pendiente },
    { name: 'Anuladas',   value: anuladas,   color: COLORS.anulada },
  ].filter(d => d.value > 0)

  const total = activas + pendientes + anuladas

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">Estado de Garantías</h3>
        <p className="text-xs text-gray-500">{total} equipos en total</p>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={80}
            paddingAngle={3}
            dataKey="value"
          >
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => [`${value} equipos`, '']} />
          <Legend
            formatter={(value) => <span className="text-xs text-gray-600 dark:text-gray-300">{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Leyenda numérica */}
      <div className="mt-2 grid grid-cols-3 gap-2 text-center">
        {[
          { label: 'Activas', value: activas, color: 'text-green-600' },
          { label: 'Pendientes', value: pendientes, color: 'text-amber-600' },
          { label: 'Anuladas', value: anuladas, color: 'text-red-600' },
        ].map(item => (
          <div key={item.label}>
            <p className={`text-xl font-bold ${item.color}`}>{item.value}</p>
            <p className="text-xs text-gray-500">{item.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
