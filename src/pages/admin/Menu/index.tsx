import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { Plus, Trash2, Eye, EyeOff, Edit2, ArrowUp, ArrowDown, Link2, Anchor, FileText } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useMenuItems } from '@/hooks/useMenuItems'
import { buildMenuTree } from '@/lib/menuTree'
import type { MenuItem, MenuItemType } from '@/types/menu'

type MenuForm = {
  label: string
  type: MenuItemType
  url: string
  anchor: string
  path: string
  open_new_tab: boolean
  is_active: boolean
  parent_id: string
}

const defaultForm: MenuForm = {
  label: '',
  type: 'internal_page',
  url: '',
  anchor: '',
  path: '',
  open_new_tab: false,
  is_active: true,
  parent_id: '',
}

const typeOptions: { value: MenuItemType; label: string; hint: string; icon: typeof Link2 }[] = [
  { value: 'internal_page', label: 'Página Interna', hint: 'Rota do site. Pode incluir âncora: /quem-somos#missao', icon: FileText },
  { value: 'external_url', label: 'URL Externa', hint: 'Abre um site fora do GCasa (ex: plataforma EAD)', icon: Link2 },
  { value: 'anchor', label: 'Âncora na Home', hint: 'Rola até uma seção da Home (ex: grupo, associados, parceiros)', icon: Anchor },
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
  const tree = buildMenuTree(items)
  const topLevel = items.filter((i) => !i.parent_id)

  const { register, handleSubmit, reset, watch, formState: { isSubmitting } } = useForm<MenuForm>({
    defaultValues: defaultForm,
  })

  const type = watch('type')
  const parentId = watch('parent_id')

  const invalidate = () => qc.invalidateQueries({ queryKey: ['menu-items'] })

  const siblingsOf = (parent_id: string | null) =>
    items
      .filter((i) => (i.parent_id ?? null) === parent_id)
      .sort((a, b) => a.order_index - b.order_index)

  const saveMutation = useMutation({
    mutationFn: async (data: MenuForm) => {
      const parent_id = data.parent_id || null
      const siblings = siblingsOf(parent_id).filter((i) => i.id !== editing?.id)
      const payload = {
        label: data.label,
        type: data.type,
        url: data.type === 'external_url' ? data.url : null,
        anchor: data.type === 'anchor' ? data.anchor : null,
        path: data.type === 'internal_page' ? data.path : null,
        open_new_tab: data.type === 'external_url' ? data.open_new_tab : false,
        is_active: data.is_active,
        parent_id,
        order_index: editing?.order_index ?? siblings.length,
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

  const move = (item: MenuItem, dir: -1 | 1) => {
    const siblings = siblingsOf(item.parent_id ?? null)
    const index = siblings.findIndex((s) => s.id === item.id)
    const swap = siblings[index + dir]
    if (!swap) return
    reorderMutation.mutate({ a: item, b: swap })
  }

  const openCreate = (parent_id = '') => {
    setEditing(null)
    reset({ ...defaultForm, parent_id })
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
      parent_id: item.parent_id ?? '',
    })
    setShowForm(true)
  }

  const cancelForm = () => { setShowForm(false); setEditing(null); reset(defaultForm) }

  const editingHasChildren = editing ? items.some((i) => i.parent_id === editing.id) : false
  const parentOptions = topLevel
    .filter((i) => i.id !== editing?.id)
    .map((i) => ({ value: i.id, label: i.label }))

  const childCount = (id: string) => items.filter((i) => i.parent_id === id).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Menu Principal</h1>
          <p className="text-sm text-gray-500 mt-0.5">Itens e submenus do topo do site público, agrupados por contexto</p>
        </div>
        <button
          onClick={() => openCreate()}
          className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={16} /> Novo item
        </button>
      </div>

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
              placeholder="Ex: O Grupo"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Item pai</label>
            <select
              {...register('parent_id')}
              disabled={editingHasChildren}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50 disabled:text-gray-400"
            >
              <option value="">Nenhum — item do menu principal</option>
              {parentOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <p className="text-xs text-gray-400 mt-1">
              {editingHasChildren
                ? 'Este item já tem submenu, então permanece no menu principal.'
                : parentId
                  ? 'Vai aparecer no submenu deste item.'
                  : 'Fica na barra principal. Pode receber subitens depois.'}
            </p>
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
                placeholder="/quem-somos#missao"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <p className="text-xs text-gray-400 mt-1">
                Rotas: /quem-somos, /associados, /eventos, /fornecedores, /blog, /contato, /quero-me-associar, /sou-fornecedor, /estatuto, /codigo-etica, /portal. Âncoras: #missao, #historia, #beneficios.
              </p>
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
          {tree.map((node, i) => (
            <div key={node.item.id} className="space-y-2">
              <MenuRow
                item={node.item}
                isFirst={i === 0}
                isLast={i === tree.length - 1}
                childCount={node.children.length}
                onMove={move}
                onToggle={() => toggleMutation.mutate({ id: node.item.id, is_active: !node.item.is_active })}
                onEdit={() => openEdit(node.item)}
                onAddChild={() => openCreate(node.item.id)}
                onDelete={() => {
                  const extra = childCount(node.item.id)
                  const msg = extra > 0
                    ? `Remover "${node.item.label}" e os ${extra} subitens?`
                    : `Remover "${node.item.label}" do menu?`
                  if (confirm(msg)) deleteMutation.mutate(node.item.id)
                }}
              />
              {node.children.map((child, ci) => (
                <div key={child.id} className="pl-8">
                  <MenuRow
                    item={child}
                    isFirst={ci === 0}
                    isLast={ci === node.children.length - 1}
                    nested
                    onMove={move}
                    onToggle={() => toggleMutation.mutate({ id: child.id, is_active: !child.is_active })}
                    onEdit={() => openEdit(child)}
                    onDelete={() => {
                      if (confirm(`Remover "${child.label}" do submenu?`)) deleteMutation.mutate(child.id)
                    }}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function MenuRow({
  item,
  isFirst,
  isLast,
  nested,
  childCount,
  onMove,
  onToggle,
  onEdit,
  onAddChild,
  onDelete,
}: {
  item: MenuItem
  isFirst: boolean
  isLast: boolean
  nested?: boolean
  childCount?: number
  onMove: (item: MenuItem, dir: -1 | 1) => void
  onToggle: () => void
  onEdit: () => void
  onAddChild?: () => void
  onDelete: () => void
}) {
  const typeOpt = typeOptions.find(t => t.value === item.type)
  const Icon = typeOpt?.icon ?? Link2
  return (
    <div className={`bg-white border border-gray-200 rounded-xl px-4 py-3 flex items-center gap-3 ${nested ? 'bg-gray-50' : ''}`}>
      <div className="flex flex-col gap-0.5 flex-shrink-0">
        <button onClick={() => onMove(item, -1)} disabled={isFirst} className="p-0.5 text-gray-300 hover:text-gray-700 disabled:opacity-30 disabled:hover:text-gray-300 transition-colors" title="Mover para cima">
          <ArrowUp size={14} />
        </button>
        <button onClick={() => onMove(item, 1)} disabled={isLast} className="p-0.5 text-gray-300 hover:text-gray-700 disabled:opacity-30 disabled:hover:text-gray-300 transition-colors" title="Mover para baixo">
          <ArrowDown size={14} />
        </button>
      </div>

      <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
        <Icon size={15} className="text-gray-500" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 truncate">
          {item.label}
          {nested && <span className="ml-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">subitem</span>}
        </p>
        <p className="text-xs text-gray-400 truncate">{typeOpt?.label} → {destinationLabel(item)}</p>
      </div>

      <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${item.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
        {item.is_active ? 'Ativo' : 'Inativo'}
      </span>

      <div className="flex items-center gap-1 flex-shrink-0">
        {onAddChild && (
          <button onClick={onAddChild} className="p-1.5 text-gray-400 hover:text-primary-600 rounded-lg hover:bg-primary-50 transition-colors" title="Adicionar subitem">
            <Plus size={15} />
          </button>
        )}
        <button onClick={onToggle} className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors" title={item.is_active ? 'Desativar' : 'Ativar'}>
          {item.is_active ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
        <button onClick={onEdit} className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors" title="Editar">
          <Edit2 size={15} />
        </button>
        <button onClick={onDelete} className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors" title="Remover">
          <Trash2 size={15} />
        </button>
      </div>
      {typeof childCount === 'number' && childCount > 0 && (
        <span className="sr-only">{childCount} subitens</span>
      )}
    </div>
  )
}
