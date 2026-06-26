import { useQuery } from '@tanstack/react-query'
import {
  Building2, Truck, FileText, Calendar, Inbox, TrendingUp,
  ArrowRight, Clock, Eye,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatDate } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import type { DashboardStats, ActivityLog } from '@/types/models'

async function fetchDashboardStats(): Promise<DashboardStats> {
  const [associates, suppliers, posts, events, submissions] = await Promise.all([
    supabase.from('associates').select('id', { count: 'exact', head: true }).eq('active', true),
    supabase.from('suppliers').select('id', { count: 'exact', head: true }).eq('active', true),
    supabase.from('blog_posts').select('id', { count: 'exact', head: true }).eq('status', 'published'),
    supabase.from('events').select('id', { count: 'exact', head: true }).eq('status', 'published'),
    supabase.from('form_submissions').select('id', { count: 'exact', head: true }),
  ])

  const { count: unread } = await supabase
    .from('form_submissions')
    .select('id', { count: 'exact', head: true })
    .eq('read', false)

  return {
    associates: associates.count ?? 0,
    suppliers: suppliers.count ?? 0,
    blog_posts: posts.count ?? 0,
    events: events.count ?? 0,
    form_submissions: submissions.count ?? 0,
    unread_submissions: unread ?? 0,
  }
}

async function fetchRecentActivity(): Promise<ActivityLog[]> {
  const { data } = await supabase
    .from('activity_logs')
    .select('*, user:profiles(name, avatar_url)')
    .order('created_at', { ascending: false })
    .limit(10)

  return (data ?? []) as ActivityLog[]
}

const statCards = (stats: DashboardStats) => [
  {
    label: 'Associados',
    value: stats.associates,
    icon: Building2,
    href: '/admin/associados',
    color: 'bg-blue-500',
  },
  {
    label: 'Fornecedores',
    value: stats.suppliers,
    icon: Truck,
    href: '/admin/fornecedores',
    color: 'bg-purple-500',
  },
  {
    label: 'Artigos publicados',
    value: stats.blog_posts,
    icon: FileText,
    href: '/admin/blog',
    color: 'bg-green-500',
  },
  {
    label: 'Eventos',
    value: stats.events,
    icon: Calendar,
    href: '/admin/eventos',
    color: 'bg-orange-500',
  },
  {
    label: 'Formulários',
    value: stats.form_submissions,
    icon: Inbox,
    href: '/admin/formularios',
    color: 'bg-primary-600',
    badge: stats.unread_submissions > 0 ? stats.unread_submissions : undefined,
  },
]

export default function Dashboard() {
  const { profile } = useAuth()

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: fetchDashboardStats,
  })

  const { data: activity } = useQuery({
    queryKey: ['recent-activity'],
    queryFn: fetchRecentActivity,
  })

  const greeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Bom dia'
    if (hour < 18) return 'Boa tarde'
    return 'Boa noite'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            {greeting()}, {profile?.name?.split(' ')[0] ?? 'Admin'} 👋
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {formatDate(new Date())}
          </p>
        </div>
        <a
          href="/"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 bg-white border border-gray-200 rounded-lg px-3 py-2 transition-colors"
        >
          <Eye size={14} />
          Ver site
        </a>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5 gap-4">
        {statsLoading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-5 shadow-card animate-pulse">
                <div className="h-10 w-10 bg-gray-200 rounded-xl mb-3" />
                <div className="h-7 w-12 bg-gray-200 rounded mb-1" />
                <div className="h-4 w-24 bg-gray-100 rounded" />
              </div>
            ))
          : stats && statCards(stats).map((card) => {
              const Icon = card.icon
              return (
                <a
                  key={card.label}
                  href={card.href}
                  className="group bg-white rounded-2xl p-5 shadow-card hover:shadow-lg transition-all relative overflow-hidden"
                >
                  <div className={`w-10 h-10 ${card.color} rounded-xl flex items-center justify-center mb-3`}>
                    <Icon size={18} className="text-white" />
                  </div>
                  <div className="flex items-end gap-2">
                    <p className="text-3xl font-bold text-gray-900">{card.value}</p>
                    {card.badge && (
                      <span className="mb-1 bg-primary-100 text-primary-700 text-xs font-bold px-2 py-0.5 rounded-full">
                        {card.badge} novo{card.badge > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">{card.label}</p>
                  <div className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ArrowRight size={14} className="text-gray-400" />
                  </div>
                </a>
              )
            })}
      </div>

      {/* Quick actions + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick actions */}
        <div className="bg-white rounded-2xl p-5 shadow-card">
          <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp size={16} className="text-primary-600" />
            Ações rápidas
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Novo associado', href: '/admin/associados', icon: Building2 },
              { label: 'Novo artigo', href: '/admin/blog', icon: FileText },
              { label: 'Novo evento', href: '/admin/eventos', icon: Calendar },
              { label: 'Ver formulários', href: '/admin/formularios', icon: Inbox },
            ].map((action) => {
              const Icon = action.icon
              return (
                <a
                  key={action.label}
                  href={action.href}
                  className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-primary-50 hover:border-primary-200 border border-gray-100 rounded-xl transition-colors text-sm text-gray-700 hover:text-primary-700"
                >
                  <Icon size={15} className="flex-shrink-0" />
                  {action.label}
                </a>
              )
            })}
          </div>
        </div>

        {/* Recent activity */}
        <div className="bg-white rounded-2xl p-5 shadow-card">
          <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Clock size={16} className="text-primary-600" />
            Atividades recentes
          </h2>

          {(!activity || activity.length === 0) ? (
            <p className="text-sm text-gray-400 text-center py-6">Nenhuma atividade registrada ainda.</p>
          ) : (
            <ul className="space-y-3">
              {activity.slice(0, 6).map((log) => (
                <li key={log.id} className="flex items-start gap-3">
                  <div className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-gray-600">
                    {log.user?.name ? log.user.name[0].toUpperCase() : '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700 truncate">{log.action}</p>
                    <p className="text-xs text-gray-400">{formatDate(log.created_at)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
