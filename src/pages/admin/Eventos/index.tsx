import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { type ColumnDef } from '@tanstack/react-table'
import { Plus, Pencil, Trash2, Calendar } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatDateShort, slugify } from '@/lib/utils'
import { PageHeader } from '@/components/admin/PageHeader'
import { DataTable } from '@/components/admin/DataTable'
import { Button } from '@/components/ui/Button'
import { StatusBadge } from '@/components/ui/Badge'
import { ConfirmDialog, Modal } from '@/components/ui/Modal'
import { Input, Textarea } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { ImageUpload } from '@/components/admin/ImageUpload'
import { toast } from '@/components/ui/Toast'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { GcasaEvent } from '@/types/models'

async function fetchEvents(): Promise<GcasaEvent[]> {
  const { data, error } = await supabase.from('events').select('*').order('date', { ascending: false })
  if (error) throw error
  return data as GcasaEvent[]
}

const schema = z.object({
  title: z.string().min(3, 'Título obrigatório'),
  slug: z.string().min(2),
  date: z.string().min(1, 'Data obrigatória'),
  location: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(['draft', 'published', 'archived']).default('published'),
  image_url: z.string().nullable().optional(),
})
type FormData = z.infer<typeof schema>

function EventForm({ open, onClose, event }: { open: boolean; onClose: () => void; event: GcasaEvent | null }) {
  const qc = useQueryClient()
  const isEdit = !!event
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: { status: 'published' } })

  useEffect(() => {
    if (event) {
      reset({ title: event.title, slug: event.slug, date: event.date?.slice(0, 16) ?? '', location: event.location ?? '', description: event.description ?? '', status: event.status as FormData['status'], image_url: event.image_url })
    } else { reset({ status: 'published' }) }
  }, [event, reset])

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const payload = { ...data, location: data.location || null, description: data.description || null, image_url: data.image_url || null }
      if (isEdit) { const { error } = await supabase.from('events').update(payload).eq('id', event.id); if (error) throw error }
      else { const { error } = await supabase.from('events').insert(payload); if (error) throw error }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-events'] }); qc.invalidateQueries({ queryKey: ['events-home'] }); toast.success(isEdit ? 'Evento atualizado!' : 'Evento criado!'); onClose() },
    onError: (e: Error) => toast.error('Erro ao salvar', e.message),
  })

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Editar evento' : 'Novo evento'} size="xl"
      footer={<><Button variant="outline" onClick={onClose}>Cancelar</Button><Button loading={mutation.isPending} onClick={handleSubmit(d => mutation.mutate(d))}>{isEdit ? 'Salvar' : 'Criar'}</Button></>}>
      <form className="space-y-4">
        <ImageUpload label="Imagem do evento" value={watch('image_url')} onChange={url => setValue('image_url', url)} folder="events" />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Título *" error={errors.title?.message} {...register('title')} onChange={e => { register('title').onChange(e); if (!isEdit) setValue('slug', slugify(e.target.value)) }} />
          <Input label="Slug *" error={errors.slug?.message} {...register('slug')} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Data e hora *" type="datetime-local" error={errors.date?.message} {...register('date')} />
          <Input label="Local" {...register('location')} placeholder="São Carlos, SP" />
        </div>
        <Textarea label="Descrição" rows={3} {...register('description')} />
        <Select label="Status" options={[{ value: 'published', label: 'Publicado' }, { value: 'draft', label: 'Rascunho' }, { value: 'archived', label: 'Arquivado' }]} {...register('status')} />
      </form>
    </Modal>
  )
}

export default function AdminEventos() {
  const qc = useQueryClient()
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<GcasaEvent | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const { data = [], isLoading } = useQuery({ queryKey: ['admin-events'], queryFn: fetchEvents })
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from('events').delete().eq('id', id); if (error) throw error },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-events'] }); toast.success('Evento excluído.'); setDeletingId(null) },
    onError: () => toast.error('Erro ao excluir.'),
  })
  const columns: ColumnDef<GcasaEvent>[] = [
    { accessorKey: 'title', header: 'Evento', cell: ({ row }) => {
      const e = row.original
      return <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">{e.image_url ? <img src={e.image_url} alt={e.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Calendar size={16} className="text-gray-300" /></div>}</div><div><p className="font-medium text-gray-900 text-sm">{e.title}</p>{e.location && <p className="text-xs text-gray-400">{e.location}</p>}</div></div>
    }},
    { accessorKey: 'date', header: 'Data', cell: ({ row }) => <span className="text-xs text-gray-500">{formatDateShort(row.original.date)}</span> },
    { accessorKey: 'status', header: 'Status', cell: ({ row }) => <StatusBadge status={row.original.status} /> },
    { id: 'actions', header: '', cell: ({ row }) => <div className="flex items-center gap-1 justify-end"><Button variant="ghost" size="icon-sm" onClick={() => { setEditing(row.original); setFormOpen(true) }}><Pencil size={14} /></Button><Button variant="danger-ghost" size="icon-sm" onClick={() => setDeletingId(row.original.id)}><Trash2 size={14} /></Button></div> },
  ]
  return (
    <div className="space-y-6">
      <PageHeader title="Eventos" description={`${data.length} evento${data.length !== 1 ? 's' : ''}`} actions={<Button leftIcon={<Plus size={15} />} onClick={() => { setEditing(null); setFormOpen(true) }}>Novo evento</Button>} />
      <DataTable data={data} columns={columns} isLoading={isLoading} searchPlaceholder="Buscar evento..." />
      <EventForm open={formOpen} onClose={() => { setFormOpen(false); setEditing(null) }} event={editing} />
      <ConfirmDialog open={!!deletingId} onClose={() => setDeletingId(null)} onConfirm={() => deletingId && deleteMutation.mutate(deletingId)} title="Excluir evento" description="Esta ação não pode ser desfeita." confirmLabel="Excluir" loading={deleteMutation.isPending} />
    </div>
  )
}
