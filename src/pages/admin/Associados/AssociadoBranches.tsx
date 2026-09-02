import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, Save, X, MapPin } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { ImageUpload } from '@/components/admin/ImageUpload'
import { GalleryUpload } from '@/components/admin/GalleryUpload'
import { ConfirmDialog } from '@/components/ui/Modal'
import { toast } from '@/components/ui/Toast'
import type { AssociateBranch } from '@/types/models'

type BranchDraft = Omit<AssociateBranch, 'id' | 'associate_id' | 'created_at' | 'updated_at'>

const EMPTY_BRANCH: BranchDraft = {
  name: '',
  is_hq: false,
  phone: '',
  whatsapp: '',
  address: '',
  city: '',
  state: 'SP',
  cep: '',
  latitude: null,
  longitude: null,
  business_hours: '',
  cover_image_url: null,
  gallery: [],
  active: true,
  order_index: 0,
}

const brazilStates = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO']

async function fetchBranches(associateId: string): Promise<AssociateBranch[]> {
  const { data, error } = await supabase
    .from('associate_branches')
    .select('*')
    .eq('associate_id', associateId)
    .order('order_index')
  if (error) throw error
  return data as AssociateBranch[]
}

function BranchEditForm({
  draft,
  onChange,
  onSave,
  onCancel,
  saving,
}: {
  draft: BranchDraft
  onChange: (d: BranchDraft) => void
  onSave: () => void
  onCancel: () => void
  saving: boolean
}) {
  const set = <K extends keyof BranchDraft>(key: K, value: BranchDraft[K]) => onChange({ ...draft, [key]: value })

  return (
    <div className="border border-gray-200 rounded-xl p-4 space-y-4 bg-gray-50/50">
      <div className="grid grid-cols-2 gap-4">
        <Input label="Nome da unidade *" value={draft.name} onChange={(e) => set('name', e.target.value)} placeholder="Ex: Loja Centro" />
        <div>
          <label className="flex items-center gap-2 cursor-pointer mt-7">
            <input type="checkbox" checked={draft.is_hq} onChange={(e) => set('is_hq', e.target.checked)} className="w-4 h-4 accent-primary-600 rounded" />
            <span className="text-sm text-gray-700">É a matriz?</span>
          </label>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input label="Telefone" value={draft.phone ?? ''} onChange={(e) => set('phone', e.target.value)} placeholder="1633334444" />
        <Input label="WhatsApp" value={draft.whatsapp ?? ''} onChange={(e) => set('whatsapp', e.target.value)} placeholder="5516999990000" />
      </div>

      <Input label="Endereço" value={draft.address ?? ''} onChange={(e) => set('address', e.target.value)} placeholder="Rua, número, bairro" />

      <div className="grid grid-cols-3 gap-4">
        <Input label="Cidade" value={draft.city ?? ''} onChange={(e) => set('city', e.target.value)} />
        <Select label="Estado" options={brazilStates.map((s) => ({ value: s, label: s }))} value={draft.state} onChange={(e) => set('state', e.target.value)} />
        <Input label="CEP" value={draft.cep ?? ''} onChange={(e) => set('cep', e.target.value)} />
      </div>

      <Textarea
        label="Horário de funcionamento"
        rows={2}
        value={draft.business_hours ?? ''}
        onChange={(e) => set('business_hours', e.target.value)}
        placeholder="Seg-Sex 8h-18h, Sáb 8h-12h"
      />

      <ImageUpload label="Foto de capa da unidade" value={draft.cover_image_url} onChange={(url) => set('cover_image_url', url)} folder="associates/branches" />
      <GalleryUpload label="Galeria da unidade" value={draft.gallery} onChange={(urls) => set('gallery', urls)} folder="associates/branches" />

      <div className="flex gap-2 pt-1">
        <Button variant="outline" size="sm" leftIcon={<X size={13} />} onClick={onCancel}>Cancelar</Button>
        <Button size="sm" leftIcon={<Save size={13} />} loading={saving} onClick={onSave} disabled={!draft.name.trim()}>Salvar unidade</Button>
      </div>
    </div>
  )
}

export function AssociadoBranches({ associateId }: { associateId: string }) {
  const qc = useQueryClient()
  const queryKey = ['admin-associate-branches', associateId]
  const { data: branches = [], isLoading } = useQuery({ queryKey, queryFn: () => fetchBranches(associateId) })

  const [editingId, setEditingId] = useState<string | 'new' | null>(null)
  const [draft, setDraft] = useState<BranchDraft>(EMPTY_BRANCH)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const startNew = () => {
    setDraft({ ...EMPTY_BRANCH, order_index: branches.length })
    setEditingId('new')
  }
  const startEdit = (b: AssociateBranch) => {
    const { id: _id, associate_id: _aid, created_at: _c, updated_at: _u, ...rest } = b
    setDraft(rest)
    setEditingId(b.id)
  }
  const cancelEdit = () => setEditingId(null)

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editingId === 'new') {
        const { error } = await supabase.from('associate_branches').insert({ ...draft, associate_id: associateId })
        if (error) throw error
      } else {
        const { error } = await supabase.from('associate_branches').update(draft).eq('id', editingId)
        if (error) throw error
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey })
      toast.success('Unidade salva!')
      setEditingId(null)
    },
    onError: (e: Error) => toast.error('Erro ao salvar unidade', e.message),
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('associate_branches').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey })
      toast.success('Unidade excluída.')
      setDeletingId(null)
    },
    onError: (e: Error) => toast.error('Erro ao excluir unidade', e.message),
  })

  if (isLoading) return <div className="h-24 bg-gray-100 animate-pulse rounded-xl" />

  return (
    <div className="space-y-4">
      <p className="text-xs text-gray-500">
        Cadastre as unidades/lojas físicas deste associado. Cada uma pode ter seu próprio endereço, horário e galeria de fotos.
      </p>

      {branches.map((b) => (
        <div key={b.id}>
          {editingId === b.id ? (
            <BranchEditForm draft={draft} onChange={setDraft} onSave={() => saveMutation.mutate()} onCancel={cancelEdit} saving={saveMutation.isPending} />
          ) : (
            <div className="flex items-center justify-between border border-gray-200 rounded-xl p-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-gray-900 text-sm">{b.name}</p>
                  {b.is_hq && <span className="text-[0.6rem] font-bold uppercase tracking-widest text-primary-700 bg-primary-100 px-1.5 py-0.5 rounded">Matriz</span>}
                </div>
                {b.address && (
                  <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5 truncate">
                    <MapPin size={10} className="flex-shrink-0" />{b.address}{b.city ? `, ${b.city} — ${b.state}` : ''}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <Button variant="ghost" size="icon-sm" title="Editar" onClick={() => startEdit(b)}><Pencil size={14} /></Button>
                <Button variant="danger-ghost" size="icon-sm" title="Excluir" onClick={() => setDeletingId(b.id)}><Trash2 size={14} /></Button>
              </div>
            </div>
          )}
        </div>
      ))}

      {editingId === 'new' && (
        <BranchEditForm draft={draft} onChange={setDraft} onSave={() => saveMutation.mutate()} onCancel={cancelEdit} saving={saveMutation.isPending} />
      )}

      {editingId === null && (
        <Button variant="outline" size="sm" leftIcon={<Plus size={13} />} onClick={startNew}>Adicionar unidade</Button>
      )}

      <ConfirmDialog
        open={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={() => deletingId && deleteMutation.mutate(deletingId)}
        title="Excluir unidade"
        description="Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        loading={deleteMutation.isPending}
      />
    </div>
  )
}
