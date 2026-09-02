import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { Plus, Trash2, Eye, EyeOff, Edit2, ArrowUp, ArrowDown, Link2, Anchor, FileText } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useMenuItems } from '@/hooks/useMenuItems'
import type { MenuItem, MenuItemType } from '@/types/menu'

type MenuForm = {
  label: string
  type: MenuItemType
  url: string
  anchor: string
  path: string
  open_new_tab: boolean
  is_active: boolean
}

const defaultForm: MenuForm = {
  label: '',
  type: 'anchor',
  url: '',
  anchor: '',
  path: '',
  open_new_tab: false,
  is_active: true,
}

const typeOptions: { value: MenuItemType; label: string; hint: string; icon: typeof Link2 }[] = [
  { value: 'anchor', label: 'Âncora', hint: 'Rola até uma seção da Home (ex: grupo, associados, parceiros, contato, eventos)', icon: Anchor },
  { value: 'external_url', label: 'URL Externa', hint: 'Abre um site fora do GCasa (ex: plataforma EAD)', icon: Link2 },
  { value: 'internal_page', label: 'Página Interna', hint: 'Aponta pra uma rota que já existe no site (ex: /blog)', icon: FileText },
]

function destinationLabel(item: MenuItem) {
  if (item.type === 'anchor') return `#${item.anchor}`
  if (item.type === 'external_url') return item.url ?? ''
  return item.path ?? ''
}

export default function AdminMenu() {
  const qc = useQueryClient()
  const [editing, setEditing] = useState<MenuItem | null>(null)
  const [showForm, setShowForm] = useState(false)

  const { data: items = [], isLoading } = useMenuItems({ includeInactive: true })

  const { register, handleSubmit, reset, watch, formState: { isSubmitting } } = useForm<MenuForm>({
    defaultValues: defaultForm,
  })

  const type = watch('type')

  const invalidate = () => qc.invalidateQueries({ queryKey: ['menu-items'] })

  const saveMutation = useMutation({
    mutationFn: async (data: MenuForm) => {
      const payload = {
        label: data.label,
        type: data.type,
        url: data.type === 'external_url' ? data.url : null,
        anchor: data.type === 'anchor' ? data.anchor : null,
        path: data.type === 'internal_page' ? data.path : null,
        open_new_tab: data.type === 'external_url' ? data.open_new_tab : false,
        is_active: data.is_active,
        order_index: editing?.order_index ?? items.length,
      }
      if (editing) {
        await supabase.from('menu_items').update(payload).eq('id', editing.id)
      } else {
        await supabase.from('menu_items').insert(payload)
      }
    },
    onSuccess: () => {
      invalidate()
      setShowForm(false)
      setEditing(null)
      reset(defaultForm)
    },
  })

  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      await supabase.from('menu_items').update({ is_active }).eq('id', id)
    },
    onSuccess: invalidate,
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from('menu_items').delete().eq('id', id)
    },
    onSuccess: invalidate,
  })

  const reorderMutation = useMutation({
    mutationFn: async ({ a, b }: { a: MenuItem; b: MenuItem }) => {
      await Promise.all([
        supabase.from('menu_items').update({ order_index: b.order_index }).eq('id', a.id),
        supabase.from('menu_items').update({ order_index: a.order_index }).eq('id', b.id),
      ])
    },
    onSuccess: invalidate,
  })

  const moveUp = (index: number) => {
    if (index === 0) return
    reorderMutation.mutate({ a: items[index], b: items[index - 1] })
  }
  const moveDown = (index: number) => {
    if (index === items.length - 1) return
    reorderMutation.mutate({ a: items[index], b: items[index + 1] })
  }

  const openCreate = () => {
    setEditing(null)
    reset(defaultForm)
    setShowForm(true)
  }

  const openEdit = (item: MenuItem) => {
    setEditing(item)
    reset({
      label: item.label,
      type: item.type,
      url: item.url ?? '',
      anchor: item.anchor ?? '',
      path: item.path ?? '',
      open_new_tab: item.open_new_tab,
      is_active: item.is_active,
    })
    setShowForm(true)
  }

  const cancelForm = () => { setShowForm(false); setEditing(null); reset(defaultForm) }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Menu Principal</h1>
          <p className="text-sm text-gray-500 mt-0.5">Itens exibidos no menu do topo do site público</p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={16} /> Novo item
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit((d) => saveMutation.mutate(d))}
          className="bg-white border border-gray-200 rounded-xl p-6 space-y-5"
        >
          <h2 className="font-semibold text-gray-900">{editing ? 'Editar item' : 'Novo item'}</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome do menu *</label>
            <input
              {...register('label', { required: true })}
              placeholder="Ex: EAD"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tipo *</label>
            <div className="grid sm:grid-cols-3 gap-3">
              {typeOptions.map((opt) => {
                const Icon = opt.icon
                return (
                  <label
                    key={opt.value}
                    className={`flex flex-col gap-1.5 border rounded-lg p-3 cursor-pointer transition-colors ${
                      type === opt.value ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input type="radio" value={opt.value} {...register('type')} className="accent-primary-600" />
                      <Icon size={15} className="text-gray-500" />
                      <span className="text-sm font-semibold text-gray-800">{opt.label}</span>
                    </div>
                    <p className="text-xs text-gray-400">{opt.hint}</p>
                  </label>
                )
              })}
            </div>
          </div>

          {type === 'external_url' && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL *</label>
                <input
                  {...register('url', { required: type === 'external_url' })}
                  placeholder="https://ead.grupogcasa.com.br/"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" {...register('open_new_tab')} className="w-4 h-4 accent-primary-600" />
                <span className="text-sm text-gray-700">Abrir em nova aba</span>
              </label>
            </div>
          )}

          {type === 'anchor' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ID da âncora (seção na Home) *</label>
              <input
                {...register('anchor', { required: type === 'anchor' })}
                placeholder="Ex: grupo"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <p className="text-xs text-gray-400 mt-1">IDs válidos hoje: hero, grupo, associados, parceiros, eventos, contato</p>
            </div>
          )}

          {type === 'internal_page' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rota interna *</label>
              <input
                {...register('path', { required: type === 'internal_page' })}
                placeholder="/blog"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <p className="text-xs text-gray-400 mt-1">Precisa ser uma rota que já existe no site (ex: /blog, /quero-me-associar, /sou-fornecedor)</p>
            </div>
          )}

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" {...register('is_active')} className="w-4 h-4 accent-primary-600" />
            <span className="text-sm text-gray-700">Item ativo</span>
          </label>

          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors"
            >
              {isSubmitting ? 'Salvando...' : 'Salvar'}
            </button>
            <button type="button" onClick={cancelForm} className="border border-gray-300 text-sm px-5 py-2 rounded-lg hover:bg-gray-50 transition-colors">
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-xl">
          <p className="text-gray-400 text-sm">Nenhum item de menu cadastrado.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item, i) => {
            const typeOpt = typeOptions.find(t => t.value === item.type)
            const Icon = typeOpt?.icon ?? Link2
            return (
              <div key={item.id} className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex items-center gap-3">
                <div className="flex flex-col gap-0.5 flex-shrink-0">
                  <button onClick={() => moveUp(i)} disabled={i === 0} className="p-0.5 text-gray-300 hover:text-gray-700 disabled:opacity-30 disabled:hover:text-gray-300 transition-colors" title="Mover para cima">
                    <ArrowUp size={14} />
                  </button>
                  <button onClick={() => moveDown(i)} disabled={i === items.length - 1} className="p-0.5 text-gray-300 hover:text-gray-700 disabled:opacity-30 disabled:hover:text-gray-300 transition-colors" title="Mover para baixo">
                    <ArrowDown size={14} />
                  </button>
                </div>

                <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
                  <Icon size={15} className="text-gray-500" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{item.label}</p>
                  <p className="text-xs text-gray-400 truncate">{typeOpt?.label} → {destinationLabel(item)}</p>
                </div>

                <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${item.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {item.is_active ? 'Ativo' : 'Inativo'}
                </span>

                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => toggleMutation.mutate({ id: item.id, is_active: !item.is_active })} className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors" title={item.is_active ? 'Desativar' : 'Ativar'}>
                    {item.is_active ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                  <button onClick={() => openEdit(item)} className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors" title="Editar">
                    <Edit2 size={15} />
                  </button>
                  <button onClick={() => { if (confirm(`Remover "${item.label}" do menu?`)) deleteMutation.mutate(item.id) }} className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors" title="Remover">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
