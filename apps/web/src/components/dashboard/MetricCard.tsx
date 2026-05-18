'use client'

import Link from 'next/link'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MetricCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  color: 'blue' | 'green' | 'amber' | 'purple' | 'red'
  href?: string
  badge?: string
  subtitle?: string
}

const colorMap = {
  blue:   { bg: 'bg-blue-50 dark:bg-blue-900/20',   icon: 'text-blue-600',   badge: 'bg-blue-100 text-blue-700' },
  green:  { bg: 'bg-green-50 dark:bg-green-900/20',  icon: 'text-green-600',  badge: 'bg-green-100 text-green-700' },
  amber:  { bg: 'bg-amber-50 dark:bg-amber-900/20',  icon: 'text-amber-600',  badge: 'bg-amber-100 text-amber-700' },
  purple: { bg: 'bg-purple-50 dark:bg-purple-900/20',icon: 'text-purple-600', badge: 'bg-purple-100 text-purple-700' },
  red:    { bg: 'bg-red-50 dark:bg-red-900/20',      icon: 'text-red-600',    badge: 'bg-red-100 text-red-700' },
}

export function MetricCard({ title, value, icon: Icon, color, href, badge, subtitle }: MetricCardProps) {
  const colors = colorMap[color]

  const content = (
    <div className="flex items-start justify-between rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
      <div className="space-y-1">
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
        <p className="text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
        {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
      </div>
      <div className={cn('flex flex-col items-end gap-2')}>
        <div className={cn('rounded-lg p-2', colors.bg)}>
          <Icon className={cn('h-5 w-5', colors.icon)} />
        </div>
        {badge && (
          <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', colors.badge)}>
            {badge}
          </span>
        )}
      </div>
    </div>
  )

  if (href) return <Link href={href}>{content}</Link>
  return content
}
