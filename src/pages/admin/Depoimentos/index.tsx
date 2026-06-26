import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { type ColumnDef } from '@tanstack/react-table'
import { Plus, Pencil, Trash2, Star } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { PageHeader } from '@/components/admin/PageHeader'
import { DataTable } from '@/components/admin/DataTable'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ConfirmDialog, Modal } from '@/components/ui/Modal'
import { Input, Textarea } from '@/components/ui/Input'
import { ImageUpload } from '@/components/admin/ImageUpload'
import { toast } from '@/components/ui/Toast'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { Testimonial } from '@/types/models'

async function fetchTestimonials(): Promise<Testimonial[]> {
  const { data, error } = await supabase.from('testimonials').select('*').order('order_index')
  if (error) throw error
  return data as Testimonial[]
}

const schema = z.object({
  author_name: z.string().min(2, 'Nome obrigatório'),
  author_role: z.string().optional(),
  company: z.string().optional(),
  avatar_url: z.string().nullable().optional(),
  text: z.string().min(10, 'Depoimento obrigatório'),
  rating: z.coerce.number().min(1).max(5).default(5),
  active: z.boolean().default(true),
  order_index: z.coerce.number().default(0),
})
type FormData = z.infer<typeof schema>

function TestimonialForm({ open, onClose, item }: { open: boolean; onClose: () => void; item: Testimonial | null }) {
  const qc = useQueryClient()
  const isEdit = !!item
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema), defaultValues: { active: true, rating: 5, order_index: 0 },
  })

  useEffect(() => {
    if (item) reset({ author_name: item.author_name, author_role: item.author_role ?? '', company: item.company ?? '', avatar_url: item.avatar_url, text: item.text, rating: item.rating, active: item.active, order_index: item.order_index })
    else reset({ active: true, rating: 5, order_index: 0 })
  }, [item, reset])

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const payload = { ...data, author_role: data.author_role || null, company: data.company || null, avatar_url: data.avatar_url || null }
      if (isEdit) { const { error } = await supabase.from('testimonials').update(payload).eq('id', item.id); if (error) throw error }
      else { const { error } = await supabase.from('testimonials').insert(payload); if (error) throw error }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-testimonials'] }); qc.invalidateQueries({ queryKey: ['testimonials-home'] }); toast.success(isEdit ? 'Depoimento atualizado!' : 'Depoimento criado!'); onClose() },
    onError: (e: Error) => toast.error('Erro ao salvar', e.message),
  })

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Editar depoimento' : 'Novo depoimento'} size="xl"
      footer={<><Button variant="outline" onClick={onClose}>Cancelar</Button><Button loading={mutation.isPending} onClick={handleSubmit(d => mutation.mutate(d))}>{isEdit ? 'Salvar' : 'Criar'}</Button></>}>
      <form className="space-y-4">
        <ImageUpload label="Foto do autor" value={watch('avatar_url')} onChange={url => setValue('avatar_url', url)} folder="testimonials" />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Nome do autor *" error={errors.author_name?.message} {...register('author_name')} placeholder="João Silva" />
          <Input label="Cargo" {...register('author_role')} placeholder="Diretor" />
        </div>
        <Input label="Empresa" {...register('company')} placeholder="Home Center Exemplo" />
        <Textarea label="Depoimento *" rows={4} error={errors.text?.message} {...register('text')} placeholder="Escreva o depoimento..." />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Avaliação (1-5)" type="number" min={1} max={5} {...register('rating')} />
          <Input label="Ordem de exibição" type="number" {...register('order_index')} />
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" {...register('active')} className="w-4 h-4 accent-primary-600 rounded" />
          <span className="text-sm text-gray-700">Depoimento ativo</span>
        </label>
      </form>
    </Modal>
  )
}

export default function AdminDepoimentos() {
  const qc = useQueryClient()
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Testimonial | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const { data = [], isLoading } = useQuery({ queryKey: ['admin-testimonials'], queryFn: fetchTestimonials })
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from('testimonials').delete().eq('id', id); if (error) throw error },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-testimonials'] }); toast.success('Depoimento excluído.'); setDeletingId(null) },
    onError: () => toast.error('Erro ao excluir.'),
  })
  const columns: ColumnDef<Testimonial>[] = [
    { accessorKey: 'author_name', header: 'Autor', cell: ({ row }) => {
      const t = row.original
      return <div className="flex items-center gap-3"><div className="w-9 h-9 rounded-full bg-gray-100 overflow-hidden flex-shrink-0">{t.avatar_url ? <img src={t.avatar_url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold text-sm">{t.author_name[0]}</div>}</div><div><p className="font-medium text-gray-900 text-sm">{t.author_name}</p><p className="text-xs text-gray-400">{[t.author_role, t.company].filter(Boolean).join(' · ')}</p></div></div>
    }},
    { accessorKey: 'rating', header: 'Avaliação', cell: ({ row }) => <div className="flex gap-0.5">{Array.from({ length: row.original.rating }).map((_, i) => <Star key={i} size={12} className="fill-yellow-400 text-yellow-400" />)}</div> },
    { accessorKey: 'active', header: 'Status', cell: ({ row }) => <Badge variant={row.original.active ? 'success' : 'default'}>{row.original.active ? 'Ativo' : 'Inativo'}</Badge> },
    { id: 'actions', header: '', cell: ({ row }) => <div className="flex items-center gap-1 justify-end"><Button variant="ghost" size="icon-sm" onClick={() => { setEditing(row.original); setFormOpen(true) }}><Pencil size={14} /></Button><Button variant="danger-ghost" size="icon-sm" onClick={() => setDeletingId(row.original.id)}><Trash2 size={14} /></Button></div> },
  ]
  return (
    <div className="space-y-6">
      <PageHeader title="Depoimentos" description={`${data.length} depoimento${data.length !== 1 ? 's' : ''}`} actions={<Button leftIcon={<Plus size={15} />} onClick={() => { setEditing(null); setFormOpen(true) }}>Novo depoimento</Button>} />
      <DataTable data={data} columns={columns} isLoading={isLoading} searchPlaceholder="Buscar depoimento..." />
      <TestimonialForm open={formOpen} onClose={() => { setFormOpen(false); setEditing(null) }} item={editing} />
      <ConfirmDialog open={!!deletingId} onClose={() => setDeletingId(null)} onConfirm={() => deletingId && deleteMutation.mutate(deletingId)} title="Excluir depoimento" description="Esta ação não pode ser desfeita." confirmLabel="Excluir" loading={deleteMutation.isPending} />
    </div>
  )
}
