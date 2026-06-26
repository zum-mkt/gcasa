import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Home, Users, Truck, Calendar, FileText,
  MessageSquare, Award, Image, Inbox, UserCog, Settings,
  ChevronLeft, ChevronRight, Building2, Megaphone,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUiStore } from '@/stores/uiStore'
import { useAuth } from '@/hooks/useAuth'

const navItems = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Home', href: '/admin/home', icon: Home },
  { label: 'Banners', href: '/admin/banners', icon: Megaphone },
  { label: 'Associados', href: '/admin/associados', icon: Building2 },
  { label: 'Fornecedores', href: '/admin/fornecedores', icon: Truck },
  { label: 'Eventos', href: '/admin/eventos', icon: Calendar },
  { label: 'Blog', href: '/admin/blog', icon: FileText },
  { label: 'Depoimentos', href: '/admin/depoimentos', icon: MessageSquare },
  { label: 'Parceiros', href: '/admin/parceiros', icon: Award },
  { label: 'Galeria', href: '/admin/galeria', icon: Image },
  { label: 'Formulários', href: '/admin/formularios', icon: Inbox },
]

const adminItems = [
  { label: 'Usuários', href: '/admin/usuarios', icon: UserCog },
  { label: 'Configurações', href: '/admin/configuracoes', icon: Settings },
]

export function Sidebar() {
  const { isAdminSidebarCollapsed, toggleSidebar } = useUiStore()
  const { isAdmin } = useAuth()
  const location = useLocation()
  const collapsed = isAdminSidebarCollapsed

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-full bg-dark-900 text-white flex flex-col transition-all duration-300 z-40',
        collapsed ? 'w-[72px]' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-white/10">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-sm">G</span>
            </div>
            <span className="font-bold text-sm text-white">GCasa Admin</span>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center mx-auto">
            <span className="text-white font-bold text-sm">G</span>
          </div>
        )}
        {!collapsed && (
          <button
            onClick={toggleSidebar}
            className="p-1.5 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
        )}
      </div>

      {/* Toggle when collapsed */}
      {collapsed && (
        <button
          onClick={toggleSidebar}
          className="mx-auto mt-2 p-1.5 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors"
        >
          <ChevronRight size={16} />
        </button>
      )}

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto scrollbar-hide">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = location.pathname === item.href
          return (
            <NavLink
              key={item.href}
              to={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium',
                active
                  ? 'bg-primary-600 text-white'
                  : 'text-white/60 hover:bg-white/10 hover:text-white',
                collapsed && 'justify-center px-2'
              )}
            >
              <Icon size={18} className="flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          )
        })}

        {/* Divider */}
        <div className="my-3 border-t border-white/10" />

        {adminItems.map((item) => {
          if (item.href === '/admin/usuarios' && !isAdmin) return null
          const Icon = item.icon
          const active = location.pathname === item.href
          return (
            <NavLink
              key={item.href}
              to={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium',
                active
                  ? 'bg-primary-600 text-white'
                  : 'text-white/60 hover:bg-white/10 hover:text-white',
                collapsed && 'justify-center px-2'
              )}
            >
              <Icon size={18} className="flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          )
        })}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="p-4 border-t border-white/10">
          <NavLink
            to="/"
            target="_blank"
            className="flex items-center gap-2 text-xs text-white/40 hover:text-white/60 transition-colors"
          >
            <span>Ver site público</span>
          </NavLink>
        </div>
      )}
    </aside>
  )
}
