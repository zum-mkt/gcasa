import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { type ColumnDef } from '@tanstack/react-table'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { slugify } from '@/lib/utils'
import { PageHeader } from '@/components/admin/PageHeader'
import { DataTable } from '@/components/admin/DataTable'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ConfirmDialog, Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { ImageUpload } from '@/components/admin/ImageUpload'
import { toast } from '@/components/ui/Toast'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { Partner } from '@/types/models'

async function fetchPartners(): Promise<Partner[]> {
  const { data, error } = await supabase.from('partners').select('*').order('order_index')
  if (error) throw error
  return data as Partner[]
}

const schema = z.object({
  name: z.string().min(2, 'Nome obrigatório'),
  slug: z.string().min(2),
  logo_url: z.string().nullable().optional(),
  site_url: z.string().url('URL inválida').optional().or(z.literal('')),
  active: z.boolean().default(true),
  order_index: z.coerce.number().default(0),
})
type FormData = z.infer<typeof schema>

function PartnerForm({ open, onClose, item }: { open: boolean; onClose: () => void; item: Partner | null }) {
  const qc = useQueryClient()
  const isEdit = !!item
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema), defaultValues: { active: true, order_index: 0 },
  })

  useEffect(() => {
    if (item) reset({ name: item.name, slug: item.slug, logo_url: item.logo_url, site_url: item.site_url ?? '', active: item.active, order_index: item.order_index })
    else reset({ active: true, order_index: 0 })
  }, [item, reset])

  const nameValue = watch('name')
  useEffect(() => { if (!isEdit && nameValue) setValue('slug', slugify(nameValue)) }, [nameValue, isEdit, setValue])

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const payload = { ...data, site_url: data.site_url || null, logo_url: data.logo_url || null }
      if (isEdit) { const { error } = await supabase.from('partners').update(payload).eq('id', item.id); if (error) throw error }
      else { const { error } = await supabase.from('partners').insert(payload); if (error) throw error }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-partners'] }); qc.invalidateQueries({ queryKey: ['partners-home'] }); toast.success(isEdit ? 'Parceiro atualizado!' : 'Parceiro criado!'); onClose() },
    onError: (e: Error) => toast.error('Erro ao salvar', e.message),
  })

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Editar parceiro' : 'Novo parceiro'} size="lg"
      footer={<><Button variant="outline" onClick={onClose}>Cancelar</Button><Button loading={mutation.isPending} onClick={handleSubmit(d => mutation.mutate(d))}>{isEdit ? 'Salvar' : 'Criar'}</Button></>}>
      <form className="space-y-4">
        <ImageUpload label="Logo do parceiro" value={watch('logo_url')} onChange={url => setValue('logo_url', url)} folder="partners" />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Nome *" error={errors.name?.message} {...register('name')} placeholder="Nome da empresa" />
          <Input label="Slug *" error={errors.slug?.message} {...register('slug')} />
        </div>
        <Input label="Site" error={errors.site_url?.message} {...register('site_url')} placeholder="https://exemplo.com" />
        <div className="grid grid-cols-2 gap-4">
          <label className="flex items-center gap-2 cursor-pointer mt-4">
            <input type="checkbox" {...register('active')} className="w-4 h-4 accent-primary-600 rounded" />
            <span className="text-sm text-gray-700">Parceiro ativo</span>
          </label>
          <Input label="Ordem de exibição" type="number" {...register('order_index')} />
        </div>
      </form>
    </Modal>
  )
}

export default function AdminParceiros() {
  const qc = useQueryClient()
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Partner | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const { data = [], isLoading } = useQuery({ queryKey: ['admin-partners'], queryFn: fetchPartners })
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from('partners').delete().eq('id', id); if (error) throw error },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-partners'] }); toast.success('Parceiro excluído.'); setDeletingId(null) },
    onError: () => toast.error('Erro ao excluir.'),
  })
  const columns: ColumnDef<Partner>[] = [
    { accessorKey: 'name', header: 'Parceiro', cell: ({ row }) => {
      const p = row.original
      return <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-gray-50 border border-gray-100 overflow-hidden flex-shrink-0 flex items-center justify-center">{p.logo_url ? <img src={p.logo_url} alt={p.name} className="w-full h-full object-contain p-1" /> : <span className="text-gray-400 font-bold">{p.name[0]}</span>}</div><span className="font-medium text-gray-900 text-sm">{p.name}</span></div>
    }},
    { accessorKey: 'site_url', header: 'Site', cell: ({ row }) => row.original.site_url ? <a href={row.original.site_url} target="_blank" rel="noreferrer" className="text-xs text-primary-600 hover:underline truncate max-w-[200px] block">{row.original.site_url}</a> : <span className="text-gray-300">—</span> },
    { accessorKey: 'active', header: 'Status', cell: ({ row }) => <Badge variant={row.original.active ? 'success' : 'default'}>{row.original.active ? 'Ativo' : 'Inativo'}</Badge> },
    { id: 'actions', header: '', cell: ({ row }) => <div className="flex items-center gap-1 justify-end"><Button variant="ghost" size="icon-sm" onClick={() => { setEditing(row.original); setFormOpen(true) }}><Pencil size={14} /></Button><Button variant="danger-ghost" size="icon-sm" onClick={() => setDeletingId(row.original.id)}><Trash2 size={14} /></Button></div> },
  ]
  return (
    <div className="space-y-6">
      <PageHeader title="Parceiros & Fornecedores Nacionais" description={`${data.length} parceiro${data.length !== 1 ? 's' : ''}`} actions={<Button leftIcon={<Plus size={15} />} onClick={() => { setEditing(null); setFormOpen(true) }}>Novo parceiro</Button>} />
      <DataTable data={data} columns={columns} isLoading={isLoading} searchPlaceholder="Buscar parceiro..." />
      <PartnerForm open={formOpen} onClose={() => { setFormOpen(false); setEditing(null) }} item={editing} />
      <ConfirmDialog open={!!deletingId} onClose={() => setDeletingId(null)} onConfirm={() => deletingId && deleteMutation.mutate(deletingId)} title="Excluir parceiro" description="Esta ação não pode ser desfeita." confirmLabel="Excluir" loading={deleteMutation.isPending} />
    </div>
  )
}
