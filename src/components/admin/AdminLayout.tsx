import { useUiStore } from '@/stores/uiStore'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'

interface AdminLayoutProps {
  children: React.ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { isAdminSidebarCollapsed } = useUiStore()

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar />

      <div
        className="flex flex-col flex-1 overflow-hidden transition-all duration-300"
        style={{ marginLeft: isAdminSidebarCollapsed ? '72px' : '256px' }}
      >
        <TopBar />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
