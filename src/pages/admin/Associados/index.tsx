import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { type ColumnDef } from '@tanstack/react-table'
import { Plus, Pencil, Trash2, MapPin, Eye, EyeOff } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { PageHeader } from '@/components/admin/PageHeader'
import { DataTable } from '@/components/admin/DataTable'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ConfirmDialog } from '@/components/ui/Modal'
import { toast } from '@/components/ui/Toast'
import { AssociadoForm } from './AssociadoForm'
import type { Associate } from '@/types/models'

async function fetchAssociates(): Promise<Associate[]> {
  const { data, error } = await supabase
    .from('associates')
    .select('*, category:categories(id, name, slug, type)')
    .order('order_index')
  if (error) throw error
  return data as Associate[]
}

export default function AdminAssociados() {
  const qc = useQueryClient()
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Associate | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const { data = [], isLoading } = useQuery({ queryKey: ['admin-associates'], queryFn: fetchAssociates })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('associates').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-associates'] })
      qc.invalidateQueries({ queryKey: ['associates-home'] })
      toast.success('Associado excluído com sucesso.')
      setDeletingId(null)
    },
    onError: () => toast.error('Erro ao excluir associado.'),
  })

  const toggleActive = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from('associates').update({ active }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-associates'] })
      toast.success('Status atualizado.')
    },
    onError: () => toast.error('Erro ao atualizar status.'),
  })

  const columns: ColumnDef<Associate>[] = [
    {
      accessorKey: 'name',
      header: 'Associado',
      cell: ({ row }) => {
        const a = row.original
        return (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
              {a.logo_url
                ? <img src={a.logo_url} alt={a.name} className="w-full h-full object-contain p-1" />
                : <span className="text-sm font-bold text-gray-400">{a.name[0]}</span>
              }
            </div>
            <div>
              <p className="font-medium text-gray-900 text-sm">{a.name}</p>
              {a.city && (
                <p className="text-xs text-gray-400 flex items-center gap-0.5">
                  <MapPin size={10} />{a.city} — {a.state}
                </p>
              )}
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: 'category',
      header: 'Categoria',
      cell: ({ row }) => row.original.category?.name
        ? <Badge>{row.original.category!.name}</Badge>
        : <span className="text-gray-300">—</span>,
    },
    {
      accessorKey: 'active',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant={row.original.active ? 'success' : 'danger'}>
          {row.original.active ? 'Ativo' : 'Inativo'}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const a = row.original
        return (
          <div className="flex items-center gap-1 justify-end">
            <Button variant="ghost" size="icon-sm" title={a.active ? 'Desativar' : 'Ativar'}
              onClick={() => toggleActive.mutate({ id: a.id, active: !a.active })}>
              {a.active ? <EyeOff size={14} /> : <Eye size={14} />}
            </Button>
            <Button variant="ghost" size="icon-sm" title="Editar"
              onClick={() => { setEditing(a); setFormOpen(true) }}>
              <Pencil size={14} />
            </Button>
            <Button variant="danger-ghost" size="icon-sm" title="Excluir"
              onClick={() => setDeletingId(a.id)}>
              <Trash2 size={14} />
            </Button>
          </div>
        )
      },
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Associados"
        description={`${data.length} empresa${data.length !== 1 ? 's' : ''} cadastrada${data.length !== 1 ? 's' : ''}`}
        actions={
          <Button leftIcon={<Plus size={15} />} onClick={() => { setEditing(null); setFormOpen(true) }}>
            Novo associado
          </Button>
        }
      />
      <DataTable data={data} columns={columns} isLoading={isLoading} searchPlaceholder="Buscar associado..." />
      <AssociadoForm open={formOpen} onClose={() => { setFormOpen(false); setEditing(null) }} associate={editing} />
      <ConfirmDialog
        open={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={() => deletingId && deleteMutation.mutate(deletingId)}
        title="Excluir associado"
        description="Esta ação não pode ser desfeita. O associado será removido permanentemente."
        confirmLabel="Excluir"
        loading={deleteMutation.isPending}
      />
    </div>
  )
}
