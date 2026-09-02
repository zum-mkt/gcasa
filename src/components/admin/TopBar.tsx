import { AlertTriangle, Bell, ChevronDown, LogOut, User } from 'lucide-react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { formatDistanceToNowStrict } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useAuth } from '@/hooks/useAuth'
import { useNotifications } from '@/hooks/useNotifications'
import { getInitials } from '@/lib/utils'
import { useNavigate } from 'react-router-dom'

export function TopBar() {
  const { profile, user, signOut } = useAuth()
  const navigate = useNavigate()
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications()
  const urgentUnread = notifications.some((n) => !n.read_at && n.type === 'tabloid_unlock_request')

  const displayName = profile?.name ?? user?.email ?? 'Usuário'
  const initials = getInitials(displayName)
  // Antes só distinguia admin/"resto" (caindo em "Editor" até pra associado,
  // que nunca deveria estar vendo essa tela) — agora cobre os 3 papéis reais.
  const roleLabel: Record<string, string> = { admin: 'Administrador', editor: 'Editor', associate: 'Associado' }
  const role = roleLabel[profile?.role ?? ''] ?? 'Editor'

  const handleSignOut = async () => {
    await signOut()
    navigate('/admin')
  }

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 flex-shrink-0">
      <div />

      <div className="flex items-center gap-3">
        {/* Notifications */}
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button className={`relative p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors ${urgentUnread ? 'text-amber-700 bg-amber-50 hover:bg-amber-100' : ''}`}>
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className={`absolute top-0.5 right-0.5 min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full text-white text-[10px] font-bold leading-none ${urgentUnread ? 'bg-amber-500' : 'bg-red-500'}`}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content
              className="bg-white rounded-xl shadow-dropdown border border-gray-200 w-80 max-h-[70vh] overflow-y-auto z-50"
              align="end"
              sideOffset={8}
            >
              <div className="flex items-center justify-between px-3 py-2.5 border-b border-gray-100 sticky top-0 bg-white">
                <p className="text-sm font-semibold text-gray-900">Notificações</p>
                {unreadCount > 0 && (
                  <button
                    onClick={() => markAllAsRead()}
                    className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                  >
                    Marcar todas como lidas
                  </button>
                )}
              </div>

              {notifications.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8 px-4">Nenhuma notificação por enquanto.</p>
              ) : (
                <div className="py-1">
                  {notifications.map((n) => (
                    <DropdownMenu.Item
                      key={n.id}
                      className={`flex flex-col items-start gap-0.5 px-3 py-2.5 outline-none cursor-pointer border-b border-gray-50 last:border-0 hover:bg-gray-50 ${
                        n.type === 'tabloid_unlock_request' && !n.read_at
                          ? 'bg-amber-50'
                          : n.read_at ? 'opacity-60' : 'bg-primary-50/40'
                      }`}
                      onSelect={() => {
                        if (!n.read_at) markAsRead(n.id)
                        if (n.link) navigate(n.link)
                      }}
                    >
                      <div className="flex items-center gap-1.5 w-full">
                        {n.type === 'tabloid_unlock_request' && !n.read_at
                          ? <AlertTriangle size={12} className="text-amber-600 flex-shrink-0" />
                          : !n.read_at ? <span className="w-1.5 h-1.5 rounded-full bg-primary-500 flex-shrink-0" /> : null}
                        <p className="text-sm font-medium text-gray-900 leading-snug">{n.title}</p>
                      </div>
                      {n.message && <p className="text-xs text-gray-500 leading-snug">{n.message}</p>}
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        {formatDistanceToNowStrict(new Date(n.created_at), { addSuffix: true, locale: ptBR })}
                      </p>
                    </DropdownMenu.Item>
                  ))}
                </div>
              )}
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>

        {/* User menu */}
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button className="flex items-center gap-2.5 pl-1 pr-2 py-1 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt={displayName} className="w-full h-full rounded-full object-cover" />
                ) : (
                  initials
                )}
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-sm font-medium text-gray-900 leading-tight">{displayName}</p>
                <p className="text-xs text-gray-500">{role}</p>
              </div>
              <ChevronDown size={14} className="text-gray-400" />
            </button>
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content
              className="bg-white rounded-xl shadow-dropdown border border-gray-200 p-1 min-w-[180px] z-50"
              align="end"
              sideOffset={8}
            >
              <DropdownMenu.Item
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-gray-50 cursor-pointer outline-none"
                onSelect={() => navigate('/admin/configuracoes')}
              >
                <User size={15} />
                Meu perfil
              </DropdownMenu.Item>

              <DropdownMenu.Separator className="my-1 h-px bg-gray-100" />

              <DropdownMenu.Item
                className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 rounded-lg hover:bg-red-50 cursor-pointer outline-none"
                onSelect={handleSignOut}
              >
                <LogOut size={15} />
                Sair
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
    </header>
  )
}
