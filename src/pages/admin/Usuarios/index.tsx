import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { type ColumnDef } from '@tanstack/react-table'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatDateShort } from '@/lib/utils'
import { PageHeader } from '@/components/admin/PageHeader'
import { DataTable } from '@/components/admin/DataTable'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ConfirmDialog, Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { toast } from '@/components/ui/Toast'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { Profile } from '@/types/models'

async function fetchProfiles(): Promise<Profile[]> {
  const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return data as Profile[]
}

const createSchema = z.object({
  name: z.string().min(2, 'Nome obrigatório'),
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
  role: z.enum(['admin', 'editor']).default('editor'),
})

const editSchema = z.object({
  name: z.string().min(2, 'Nome obrigatório'),
  role: z.enum(['admin', 'editor']).default('editor'),
})

type CreateFormData = z.infer<typeof createSchema>
type EditFormData = z.infer<typeof editSchema>

function CreateUserModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient()
  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateFormData>({
    resolver: zodResolver(createSchema), defaultValues: { role: 'editor' },
  })

  useEffect(() => { if (!open) reset() }, [open, reset])

  const mutation = useMutation({
    mutationFn: async (data: CreateFormData) => {
      const { error } = await supabase.auth.admin.createUser({ email: data.email, password: data.password, user_metadata: { name: data.name }, email_confirm: true })
      if (error) throw error
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-users'] }); toast.success('Usuário criado!'); onClose() },
    onError: (e: Error) => toast.error('Erro ao criar usuário', e.message),
  })

  return (
    <Modal open={open} onClose={onClose} title="Novo usuário" size="lg"
      footer={<><Button variant="outline" onClick={onClose}>Cancelar</Button><Button loading={mutation.isPending} onClick={handleSubmit(d => mutation.mutate(d))}>Criar usuário</Button></>}>
      <form className="space-y-4">
        <Input label="Nome *" error={errors.name?.message} {...register('name')} placeholder="João Silva" />
        <Input label="Email *" type="email" error={errors.email?.message} {...register('email')} placeholder="joao@exemplo.com" />
        <Input label="Senha *" type="password" error={errors.password?.message} {...register('password')} placeholder="Mínimo 8 caracteres" />
        <Select label="Perfil" options={[{ value: 'editor', label: 'Editor — pode gerenciar conteúdo' }, { value: 'admin', label: 'Administrador — acesso total' }]} {...register('role')} />
      </form>
    </Modal>
  )
}

function EditUserModal({ open, onClose, profile }: { open: boolean; onClose: () => void; profile: Profile | null }) {
  const qc = useQueryClient()
  const { register, handleSubmit, reset, formState: { errors } } = useForm<EditFormData>({
    resolver: zodResolver(editSchema), defaultValues: { role: 'editor' },
  })

  useEffect(() => {
    if (profile) reset({ name: profile.name ?? '', role: (profile.role as 'admin' | 'editor') ?? 'editor' })
  }, [profile, reset])

  const mutation = useMutation({
    mutationFn: async (data: EditFormData) => {
      if (!profile) return
      const { error } = await supabase.from('profiles').update({ name: data.name, role: data.role }).eq('id', profile.id)
      if (error) throw error
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-users'] }); toast.success('Usuário atualizado!'); onClose() },
    onError: (e: Error) => toast.error('Erro ao atualizar', e.message),
  })

  return (
    <Modal open={open} onClose={onClose} title="Editar usuário" size="lg"
      footer={<><Button variant="outline" onClick={onClose}>Cancelar</Button><Button loading={mutation.isPending} onClick={handleSubmit(d => mutation.mutate(d))}>Salvar</Button></>}>
      <form className="space-y-4">
        <Input label="Nome *" error={errors.name?.message} {...register('name')} />
        <Select label="Perfil" options={[{ value: 'editor', label: 'Editor' }, { value: 'admin', label: 'Administrador' }]} {...register('role')} />
      </form>
    </Modal>
  )
}

export default function AdminUsuarios() {
  const qc = useQueryClient()
  const [createOpen, setCreateOpen] = useState(false)
  const [editing, setEditing] = useState<Profile | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const { data = [], isLoading } = useQuery({ queryKey: ['admin-users'], queryFn: fetchProfiles })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.auth.admin.deleteUser(id); if (error) throw error },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-users'] }); toast.success('Usuário removido.'); setDeletingId(null) },
    onError: () => toast.error('Erro ao remover usuário.'),
  })

  const columns: ColumnDef<Profile>[] = [
    { accessorKey: 'name', header: 'Usuário', cell: ({ row }) => {
      const p = row.original
      return (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full overflow-hidden bg-primary-100 flex items-center justify-center flex-shrink-0">
            {p.avatar_url ? <img src={p.avatar_url} className="w-full h-full object-cover" alt={p.name ?? ''} /> : <span className="text-primary-600 font-semibold text-xs">{(p.name ?? 'U')[0].toUpperCase()}</span>}
          </div>
          <span className="text-sm font-medium text-gray-900">{p.name ?? 'Sem nome'}</span>
        </div>
      )
    }},
    { accessorKey: 'role', header: 'Perfil', cell: ({ row }) => <Badge variant={row.original.role === 'admin' ? 'danger' : 'primary'}>{row.original.role === 'admin' ? 'Administrador' : 'Editor'}</Badge> },
    { accessorKey: 'created_at', header: 'Criado em', cell: ({ row }) => <span className="text-xs text-gray-500">{formatDateShort(row.original.created_at)}</span> },
    { id: 'actions', header: '', cell: ({ row }) => (
      <div className="flex items-center gap-1 justify-end">
        <Button variant="ghost" size="icon-sm" onClick={() => setEditing(row.original)}><Pencil size={14} /></Button>
        <Button variant="danger-ghost" size="icon-sm" onClick={() => setDeletingId(row.original.id)}><Trash2 size={14} /></Button>
      </div>
    )},
  ]

  return (
    <div className="space-y-6">
      <PageHeader title="Usuários" description={`${data.length} usuário${data.length !== 1 ? 's' : ''} cadastrado${data.length !== 1 ? 's' : ''}`}
        actions={<Button leftIcon={<Plus size={15} />} onClick={() => setCreateOpen(true)}>Novo usuário</Button>} />
      <DataTable data={data} columns={columns} isLoading={isLoading} searchPlaceholder="Buscar usuário..." />
      <CreateUserModal open={createOpen} onClose={() => setCreateOpen(false)} />
      <EditUserModal open={!!editing} onClose={() => setEditing(null)} profile={editing} />
      <ConfirmDialog open={!!deletingId} onClose={() => setDeletingId(null)} onConfirm={() => deletingId && deleteMutation.mutate(deletingId)} title="Remover usuário" description="O usuário perderá o acesso ao painel. Esta ação não pode ser desfeita." confirmLabel="Remover" loading={deleteMutation.isPending} />
    </div>
  )
}
