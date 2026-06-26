import { Bell, ChevronDown, LogOut, User } from 'lucide-react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { useAuth } from '@/hooks/useAuth'
import { getInitials } from '@/lib/utils'
import { useNavigate } from 'react-router-dom'

export function TopBar() {
  const { profile, user, signOut } = useAuth()
  const navigate = useNavigate()

  const displayName = profile?.name ?? user?.email ?? 'Usuário'
  const initials = getInitials(displayName)
  const role = profile?.role === 'admin' ? 'Administrador' : 'Editor'

  const handleSignOut = async () => {
    await signOut()
    navigate('/admin')
  }

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 flex-shrink-0">
      <div />

      <div className="flex items-center gap-3">
        {/* Notifications */}
        <button className="relative p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors">
          <Bell size={18} />
        </button>

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
