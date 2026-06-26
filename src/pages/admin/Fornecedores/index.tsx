import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { type ColumnDef } from '@tanstack/react-table'
import { Plus, Pencil, Trash2, Eye, EyeOff } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { slugify } from '@/lib/utils'
import { PageHeader } from '@/components/admin/PageHeader'
import { DataTable } from '@/components/admin/DataTable'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ConfirmDialog, Modal } from '@/components/ui/Modal'
import { Input, Textarea } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { ImageUpload } from '@/components/admin/ImageUpload'
import { toast } from '@/components/ui/Toast'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { Supplier, Category } from '@/types/models'

async function fetchSuppliers(): Promise<Supplier[]> {
  const { data, error } = await supabase.from('suppliers').select('*, category:categories(id, name, slug, type)').order('order_index')
  if (error) throw error
  return data as Supplier[]
}

const schema = z.object({
  name: z.string().min(2, 'Nome obrigatório'),
  slug: z.string().min(2),
  logo_url: z.string().nullable().optional(),
  description: z.string().optional(),
  site_url: z.string().url('URL inválida').optional().or(z.literal('')),
  contact_email: z.string().email('Email inválido').optional().or(z.literal('')),
  contact_phone: z.string().optional(),
  category_id: z.string().optional(),
  active: z.boolean().default(true),
  featured: z.boolean().default(false),
  order_index: z.coerce.number().default(0),
})
type FormData = z.infer<typeof schema>

function SupplierForm({ open, onClose, item }: { open: boolean; onClose: () => void; item: Supplier | null }) {
  const qc = useQueryClient()
  const isEdit = !!item

  const { data: categories = [] } = useQuery({
    queryKey: ['categories-supplier'],
    queryFn: async () => { const { data } = await supabase.from('categories').select('*').eq('type', 'supplier'); return (data ?? []) as Category[] },
  })

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema), defaultValues: { active: true, featured: false, order_index: 0 },
  })

  useEffect(() => {
    if (item) reset({ name: item.name, slug: item.slug, logo_url: item.logo_url, description: item.description ?? '', site_url: item.site_url ?? '', contact_email: item.contact_email ?? '', contact_phone: item.contact_phone ?? '', category_id: item.category_id ?? '', active: item.active, featured: item.featured, order_index: item.order_index })
    else reset({ active: true, featured: false, order_index: 0 })
  }, [item, reset])

  const nameValue = watch('name')
  useEffect(() => { if (!isEdit && nameValue) setValue('slug', slugify(nameValue)) }, [nameValue, isEdit, setValue])

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const payload = { ...data, site_url: data.site_url || null, contact_email: data.contact_email || null, contact_phone: data.contact_phone || null, description: data.description || null, logo_url: data.logo_url || null, category_id: data.category_id || null }
      if (isEdit) { const { error } = await supabase.from('suppliers').update(payload).eq('id', item.id); if (error) throw error }
      else { const { error } = await supabase.from('suppliers').insert(payload); if (error) throw error }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-suppliers'] }); qc.invalidateQueries({ queryKey: ['suppliers-home'] }); toast.success(isEdit ? 'Fornecedor atualizado!' : 'Fornecedor criado!'); onClose() },
    onError: (e: Error) => toast.error('Erro ao salvar', e.message),
  })

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Editar fornecedor' : 'Novo fornecedor'} size="xl"
      footer={<><Button variant="outline" onClick={onClose}>Cancelar</Button><Button loading={mutation.isPending} onClick={handleSubmit(d => mutation.mutate(d))}>{isEdit ? 'Salvar' : 'Criar'}</Button></>}>
      <form className="space-y-4">
        <ImageUpload label="Logo do fornecedor" value={watch('logo_url')} onChange={url => setValue('logo_url', url)} folder="suppliers/logos" />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Nome *" error={errors.name?.message} {...register('name')} placeholder="Nome do fornecedor" />
          <Input label="Slug *" error={errors.slug?.message} {...register('slug')} />
        </div>
        <Textarea label="Descrição" rows={2} {...register('description')} />
        <Select label="Categoria" placeholder="Selecionar..." options={categories.map(c => ({ value: c.id, label: c.name }))} {...register('category_id')} />
        <div className="grid grid-cols-3 gap-4">
          <Input label="Site" error={errors.site_url?.message} {...register('site_url')} placeholder="https://exemplo.com" />
          <Input label="Email" error={errors.contact_email?.message} {...register('contact_email')} placeholder="contato@exemplo.com" />
          <Input label="Telefone" {...register('contact_phone')} placeholder="(11) 9999-9999" />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <label className="flex items-center gap-2 cursor-pointer mt-4"><input type="checkbox" {...register('active')} className="w-4 h-4 accent-primary-600 rounded" /><span className="text-sm text-gray-700">Ativo</span></label>
          <label className="flex items-center gap-2 cursor-pointer mt-4"><input type="checkbox" {...register('featured')} className="w-4 h-4 accent-primary-600 rounded" /><span className="text-sm text-gray-700">Destaque</span></label>
          <Input label="Ordem" type="number" {...register('order_index')} />
        </div>
      </form>
    </Modal>
  )
}

export default function AdminFornecedores() {
  const qc = useQueryClient()
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Supplier | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const { data = [], isLoading } = useQuery({ queryKey: ['admin-suppliers'], queryFn: fetchSuppliers })

  const toggleActive = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => { const { error } = await supabase.from('suppliers').update({ active }).eq('id', id); if (error) throw error },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-suppliers'] }); toast.success('Status atualizado.') },
    onError: () => toast.error('Erro ao atualizar status.'),
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from('suppliers').delete().eq('id', id); if (error) throw error },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-suppliers'] }); toast.success('Fornecedor excluído.'); setDeletingId(null) },
    onError: () => toast.error('Erro ao excluir.'),
  })

  const columns: ColumnDef<Supplier>[] = [
    { accessorKey: 'name', header: 'Fornecedor', cell: ({ row }) => {
      const s = row.original
      return <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-gray-50 border border-gray-100 overflow-hidden flex-shrink-0 flex items-center justify-center">{s.logo_url ? <img src={s.logo_url} alt={s.name} className="w-full h-full object-contain p-1" /> : <span className="text-gray-400 font-bold">{s.name[0]}</span>}</div><div><p className="font-medium text-gray-900 text-sm">{s.name}</p><p className="text-xs text-gray-400">{s.category?.name ?? ''}</p></div></div>
    }},
    { accessorKey: 'featured', header: 'Destaque', cell: ({ row }) => row.original.featured ? <Badge variant="primary">Destaque</Badge> : <span className="text-gray-300">—</span> },
    { accessorKey: 'active', header: 'Status', cell: ({ row }) => <Badge variant={row.original.active ? 'success' : 'default'}>{row.original.active ? 'Ativo' : 'Inativo'}</Badge> },
    { id: 'actions', header: '', cell: ({ row }) => {
      const s = row.original
      return <div className="flex items-center gap-1 justify-end"><Button variant="ghost" size="icon-sm" title={s.active ? 'Desativar' : 'Ativar'} onClick={() => toggleActive.mutate({ id: s.id, active: !s.active })}>{s.active ? <EyeOff size={14} /> : <Eye size={14} />}</Button><Button variant="ghost" size="icon-sm" onClick={() => { setEditing(s); setFormOpen(true) }}><Pencil size={14} /></Button><Button variant="danger-ghost" size="icon-sm" onClick={() => setDeletingId(s.id)}><Trash2 size={14} /></Button></div>
    }},
  ]

  return (
    <div className="space-y-6">
      <PageHeader title="Fornecedores" description={`${data.length} fornecedor${data.length !== 1 ? 'es' : ''}`} actions={<Button leftIcon={<Plus size={15} />} onClick={() => { setEditing(null); setFormOpen(true) }}>Novo fornecedor</Button>} />
      <DataTable data={data} columns={columns} isLoading={isLoading} searchPlaceholder="Buscar fornecedor..." />
      <SupplierForm open={formOpen} onClose={() => { setFormOpen(false); setEditing(null) }} item={editing} />
      <ConfirmDialog open={!!deletingId} onClose={() => setDeletingId(null)} onConfirm={() => deletingId && deleteMutation.mutate(deletingId)} title="Excluir fornecedor" description="Esta ação não pode ser desfeita." confirmLabel="Excluir" loading={deleteMutation.isPending} />
    </div>
  )
}
