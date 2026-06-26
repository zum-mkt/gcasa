import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { type ColumnDef } from '@tanstack/react-table'
import { Trash2, Eye, Mail, Phone } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatDateShort } from '@/lib/utils'
import { PageHeader } from '@/components/admin/PageHeader'
import { DataTable } from '@/components/admin/DataTable'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ConfirmDialog, Modal } from '@/components/ui/Modal'
import { toast } from '@/components/ui/Toast'
import type { FormSubmission } from '@/types/models'

async function fetchSubmissions(): Promise<FormSubmission[]> {
  const { data, error } = await supabase.from('form_submissions').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return data as FormSubmission[]
}

const formTypeLabel: Record<string, string> = {
  contact: 'Contato',
  associate: 'Quero me Associar',
  supplier: 'Sou Fornecedor',
}

function SubmissionDetail({ open, onClose, item }: { open: boolean; onClose: () => void; item: FormSubmission | null }) {
  if (!item) return null
  const data = item.data as Record<string, string>
  return (
    <Modal open={open} onClose={onClose} title="Detalhes do formulário" size="lg" footer={<Button onClick={onClose}>Fechar</Button>}>
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Badge variant="primary">{formTypeLabel[item.form_type] ?? item.form_type}</Badge>
          <span className="text-xs text-gray-400">{formatDateShort(item.created_at)}</span>
        </div>
        <div className="bg-gray-50 rounded-xl p-4 space-y-3">
          {Object.entries(data).map(([key, val]) => (
            <div key={key}>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{key}</p>
              <p className="text-sm text-gray-900 mt-0.5">{String(val)}</p>
            </div>
          ))}
        </div>
        {item.ip_address && <p className="text-xs text-gray-400">IP: {item.ip_address}</p>}
      </div>
    </Modal>
  )
}

export default function AdminFormularios() {
  const qc = useQueryClient()
  const [viewing, setViewing] = useState<FormSubmission | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const { data = [], isLoading } = useQuery({ queryKey: ['admin-forms'], queryFn: fetchSubmissions })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from('form_submissions').delete().eq('id', id); if (error) throw error },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-forms'] }); toast.success('Formulário excluído.'); setDeletingId(null) },
    onError: () => toast.error('Erro ao excluir.'),
  })

  const markRead = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from('form_submissions').update({ read: true }).eq('id', id); if (error) throw error },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-forms'] }),
  })

  const columns: ColumnDef<FormSubmission>[] = [
    { accessorKey: 'form_type', header: 'Tipo', cell: ({ row }) => <Badge variant="primary">{formTypeLabel[row.original.form_type] ?? row.original.form_type}</Badge> },
    { id: 'contact', header: 'Contato', cell: ({ row }) => {
      const d = row.original.data as Record<string, string>
      return (
        <div>
          <p className="text-sm font-medium text-gray-900">{d.name ?? d.company_name ?? '—'}</p>
          <div className="flex items-center gap-3 mt-0.5">
            {d.email && <span className="text-xs text-gray-400 flex items-center gap-1"><Mail size={10} />{d.email}</span>}
            {d.phone && <span className="text-xs text-gray-400 flex items-center gap-1"><Phone size={10} />{d.phone}</span>}
          </div>
        </div>
      )
    }},
    { accessorKey: 'created_at', header: 'Recebido em', cell: ({ row }) => <span className="text-xs text-gray-500">{formatDateShort(row.original.created_at)}</span> },
    { accessorKey: 'read', header: 'Lido', cell: ({ row }) => <Badge variant={row.original.read ? 'default' : 'warning'}>{row.original.read ? 'Lido' : 'Novo'}</Badge> },
    { id: 'actions', header: '', cell: ({ row }) => (
      <div className="flex items-center gap-1 justify-end">
        <Button variant="ghost" size="icon-sm" title="Ver detalhes" onClick={() => { markRead.mutate(row.original.id); setViewing(row.original) }}><Eye size={14} /></Button>
        <Button variant="danger-ghost" size="icon-sm" onClick={() => setDeletingId(row.original.id)}><Trash2 size={14} /></Button>
      </div>
    )},
  ]

  const unread = data.filter(f => !f.read).length

  return (
    <div className="space-y-6">
      <PageHeader title="Formulários" description={`${data.length} envio${data.length !== 1 ? 's' : ''}${unread > 0 ? ` · ${unread} novo${unread !== 1 ? 's' : ''}` : ''}`} />
      <DataTable data={data} columns={columns} isLoading={isLoading} searchPlaceholder="Buscar formulário..." />
      <SubmissionDetail open={!!viewing} onClose={() => setViewing(null)} item={viewing} />
      <ConfirmDialog open={!!deletingId} onClose={() => setDeletingId(null)} onConfirm={() => deletingId && deleteMutation.mutate(deletingId)} title="Excluir formulário" description="Esta ação não pode ser desfeita." confirmLabel="Excluir" loading={deleteMutation.isPending} />
    </div>
  )
}
