import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { type ColumnDef } from '@tanstack/react-table'
import { Plus, Pencil, Trash2, Clock } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatDateShort } from '@/lib/utils'
import { PageHeader } from '@/components/admin/PageHeader'
import { DataTable } from '@/components/admin/DataTable'
import { Button } from '@/components/ui/Button'
import { Badge, StatusBadge } from '@/components/ui/Badge'
import { ConfirmDialog } from '@/components/ui/Modal'
import { toast } from '@/components/ui/Toast'
import { BlogPostForm } from './BlogPostForm'
import type { BlogPost } from '@/types/models'

async function fetchPosts(): Promise<BlogPost[]> {
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*, category:categories(id, name, slug, type), author:profiles(id, name)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data as BlogPost[]
}

export default function AdminBlog() {
  const qc = useQueryClient()
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<BlogPost | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const { data = [], isLoading } = useQuery({ queryKey: ['admin-blog'], queryFn: fetchPosts })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('blog_posts').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-blog'] })
      qc.invalidateQueries({ queryKey: ['blog-home'] })
      toast.success('Artigo excluído.')
      setDeletingId(null)
    },
    onError: () => toast.error('Erro ao excluir artigo.'),
  })

  const columns: ColumnDef<BlogPost>[] = [
    {
      accessorKey: 'title',
      header: 'Artigo',
      cell: ({ row }) => {
        const p = row.original
        return (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
              {p.cover_url
                ? <img src={p.cover_url} alt={p.title} className="w-full h-full object-cover" />
                : <div className="w-full h-full bg-gradient-to-br from-primary-50 to-gray-100 flex items-center justify-center text-primary-200 font-bold">{p.title[0]}</div>
              }
            </div>
            <div>
              <p className="font-medium text-gray-900 text-sm line-clamp-1">{p.title}</p>
              <p className="text-xs text-gray-400 line-clamp-1">{p.excerpt}</p>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: 'category',
      header: 'Categoria',
      cell: ({ row }) => row.original.category?.name
        ? <Badge variant="primary">{row.original.category!.name}</Badge>
        : <span className="text-gray-300">—</span>,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: 'read_time',
      header: 'Leitura',
      cell: ({ row }) => row.original.read_time
        ? (
          <span className="flex items-center gap-1 text-xs text-gray-500">
            <Clock size={11} />{row.original.read_time} min
          </span>
        )
        : <span className="text-gray-300">—</span>,
    },
    {
      accessorKey: 'published_at',
      header: 'Publicado em',
      cell: ({ row }) => row.original.published_at
        ? <span className="text-xs text-gray-500">{formatDateShort(row.original.published_at)}</span>
        : <span className="text-gray-300">—</span>,
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex items-center gap-1 justify-end">
          <Button variant="ghost" size="icon-sm" title="Editar"
            onClick={() => { setEditing(row.original); setFormOpen(true) }}>
            <Pencil size={14} />
          </Button>
          <Button variant="danger-ghost" size="icon-sm" title="Excluir"
            onClick={() => setDeletingId(row.original.id)}>
            <Trash2 size={14} />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Blog"
        description={`${data.length} artigo${data.length !== 1 ? 's' : ''} cadastrado${data.length !== 1 ? 's' : ''}`}
        actions={
          <Button leftIcon={<Plus size={15} />} onClick={() => { setEditing(null); setFormOpen(true) }}>
            Novo artigo
          </Button>
        }
      />
      <DataTable data={data} columns={columns} isLoading={isLoading} searchPlaceholder="Buscar artigo..." />
      <BlogPostForm open={formOpen} onClose={() => { setFormOpen(false); setEditing(null) }} post={editing} />
      <ConfirmDialog
        open={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={() => deletingId && deleteMutation.mutate(deletingId)}
        title="Excluir artigo"
        description="Esta ação não pode ser desfeita. O artigo será removido permanentemente."
        confirmLabel="Excluir"
        loading={deleteMutation.isPending}
      />
    </div>
  )
}
