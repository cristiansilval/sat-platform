'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, Package, Wrench, Ticket, ShieldCheck,
  Users, Settings, ChevronRight, Zap
} from 'lucide-react'

const navItems = [
  { href: '/',              label: 'Dashboard',       icon: LayoutDashboard },
  { href: '/equipos',       label: 'Equipos',         icon: Package },
  { href: '/validaciones',  label: 'Validaciones',    icon: ShieldCheck,  badge: true },
  { href: '/tickets',       label: 'Tickets SAT',     icon: Ticket },
  { href: '/instalaciones', label: 'Instalaciones',   icon: Wrench },
  { href: '/modelos',       label: 'Modelos',         icon: Zap },
  { href: '/usuarios',      label: 'Usuarios',        icon: Users },
  { href: '/configuracion', label: 'Configuración',   icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="flex h-full w-64 flex-col border-r border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-gray-200 px-6 dark:border-gray-700">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
          <Zap className="h-4 w-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-gray-900 dark:text-white">SAT Platform</p>
          <p className="text-xs text-gray-500">Panel Administrador</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-3">
        <ul className="space-y-1">
          {navItems.map(({ href, label, icon: Icon, badge }) => {
            const isActive = pathname === href || (href !== '/' && pathname.startsWith(href))
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white'
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="flex-1">{label}</span>
                  {badge && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 text-xs font-semibold text-amber-700">
                      !
                    </span>
                  )}
                  {isActive && <ChevronRight className="h-3 w-3" />}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="border-t border-gray-200 p-3 dark:border-gray-700">
        <p className="text-center text-xs text-gray-400">v1.0.0 — SAT Platform</p>
      </div>
    </aside>
  )
}
