import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, Controller } from 'react-hook-form'
import { Plus, Trash2, Eye, EyeOff, Edit2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { ImageUpload } from '@/components/admin/ImageUpload'
import type { Banner } from '@/components/layout/TopBanner'

async function fetchBanners(): Promise<Banner[]> {
  const { data } = await supabase
    .from('banners')
    .select('*')
    .order('order_index')
  return (data ?? []) as Banner[]
}

type BannerForm = {
  text: string
  link_label: string
  link_href: string
  bg_color: string
  text_color: string
  image_url: string | null
  active: boolean
}

const defaultForm: BannerForm = {
  text: '',
  link_label: '',
  link_href: '',
  bg_color: '#E8630A',
  text_color: '#ffffff',
  image_url: null,
  active: true,
}

export default function AdminBanners() {
  const qc = useQueryClient()
  const [editing, setEditing] = useState<Banner | null>(null)
  const [showForm, setShowForm] = useState(false)

  const { data: banners = [], isLoading } = useQuery({
    queryKey: ['banners-admin'],
    queryFn: fetchBanners,
  })

  const { register, handleSubmit, reset, watch, control, formState: { isSubmitting } } = useForm<BannerForm>({
    defaultValues: defaultForm,
  })

  const bgColor = watch('bg_color')
  const textColor = watch('text_color')
  const previewText = watch('text')

  const invalidate = () => qc.invalidateQueries({ queryKey: ['banners-admin'] })
    .then(() => qc.invalidateQueries({ queryKey: ['top-banners'] }))

  const saveMutation = useMutation({
    mutationFn: async (data: BannerForm) => {
      const payload = {
        text: data.text,
        link_label: data.link_label || null,
        link_href: data.link_href || null,
        bg_color: data.bg_color,
        text_color: data.text_color,
        image_url: data.image_url || null,
        active: data.active,
        order_index: editing?.order_index ?? banners.length,
      }
      if (editing) {
        await supabase.from('banners').update(payload).eq('id', editing.id)
      } else {
        await supabase.from('banners').insert(payload)
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
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      await supabase.from('banners').update({ active }).eq('id', id)
    },
    onSuccess: invalidate,
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from('banners').delete().eq('id', id)
    },
    onSuccess: invalidate,
  })

  const openCreate = () => {
    setEditing(null)
    reset(defaultForm)
    setShowForm(true)
  }

  const openEdit = (b: Banner) => {
    setEditing(b)
    reset({
      text: b.text,
      link_label: b.link_label ?? '',
      link_href: b.link_href ?? '',
      bg_color: b.bg_color ?? '#E8630A',
      text_color: b.text_color ?? '#ffffff',
      image_url: b.image_url ?? null,
      active: b.active,
    })
    setShowForm(true)
  }

  const cancelForm = () => { setShowForm(false); setEditing(null); reset(defaultForm) }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Banners Rotativos</h1>
          <p className="text-sm text-gray-500 mt-0.5">Mensagens exibidas no topo do site</p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={16} /> Novo banner
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit((d) => saveMutation.mutate(d))}
          className="bg-white border border-gray-200 rounded-xl p-6 space-y-5"
        >
          <h2 className="font-semibold text-gray-900">{editing ? 'Editar banner' : 'Novo banner'}</h2>

          {/* Live preview */}
          {previewText && (
            <div
              className="flex items-center justify-center h-10 text-sm font-medium overflow-hidden relative"
              style={{ background: bgColor, color: textColor }}
            >
              {previewText}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Texto do banner *</label>
            <input
              {...register('text', { required: true })}
              placeholder="Ex: Evento especial em julho — não perca!"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Texto do link (opcional)</label>
              <input
                {...register('link_label')}
                placeholder="Ex: Saiba mais"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">URL do link (opcional)</label>
              <input
                {...register('link_href')}
                placeholder="Ex: /eventos ou https://..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cor de fundo</label>
              <div className="flex items-center gap-2">
                <input type="color" {...register('bg_color')} className="w-10 h-9 border border-gray-300 rounded cursor-pointer" />
                <input {...register('bg_color')} className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cor do texto</label>
              <div className="flex items-center gap-2">
                <input type="color" {...register('text_color')} className="w-10 h-9 border border-gray-300 rounded cursor-pointer" />
                <input {...register('text_color')} className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
            </div>
          </div>

          {/* Image upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Imagem de fundo (opcional)
            </label>
            <p className="text-xs text-gray-400 mb-2">Quando definida, a imagem é exibida como fundo do banner com a cor sobreposta.</p>
            <Controller
              name="image_url"
              control={control}
              render={({ field }) => (
                <ImageUpload
                  value={field.value}
                  onChange={field.onChange}
                  bucket="gcasa-public"
                  folder="banners"
                  label="Imagem do banner"
                  hint="Recomendado: 1200×40px ou maior. Formatos: JPG, PNG, WebP."
                />
              )}
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" {...register('active')} className="w-4 h-4 accent-primary-600" />
            <span className="text-sm text-gray-700">Banner ativo</span>
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
          {[1, 2].map(i => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : banners.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-xl">
          <p className="text-gray-400 text-sm">Nenhum banner cadastrado.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {banners.map((b) => (
            <div key={b.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              {/* Mini preview */}
              <div
                className="flex items-center justify-center h-9 text-xs font-medium relative overflow-hidden"
                style={{ background: b.image_url ? undefined : (b.bg_color ?? '#E8630A'), color: b.text_color ?? '#fff' }}
              >
                {b.image_url && (
                  <>
                    <img src={b.image_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
                    <div className="absolute inset-0" style={{ background: `${b.bg_color ?? '#E8630A'}99` }} />
                  </>
                )}
                <span className="relative">{b.text}</span>
              </div>

              <div className="px-4 py-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  {b.link_href && (
                    <p className="text-xs text-gray-400 truncate">{b.link_label} → {b.link_href}</p>
                  )}
                </div>

                <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${b.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {b.active ? 'Ativo' : 'Inativo'}
                </span>

                <div className="flex items-center gap-1">
                  <button onClick={() => toggleMutation.mutate({ id: b.id, active: !b.active })} className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors" title={b.active ? 'Desativar' : 'Ativar'}>
                    {b.active ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                  <button onClick={() => openEdit(b)} className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors" title="Editar">
                    <Edit2 size={15} />
                  </button>
                  <button onClick={() => { if (confirm('Remover este banner?')) deleteMutation.mutate(b.id) }} className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors" title="Remover">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
        <strong>Atenção:</strong> Execute também o SQL para adicionar a coluna de imagem:{' '}
        <code className="bg-amber-100 px-1 rounded">ALTER TABLE public.banners ADD COLUMN IF NOT EXISTS image_url text;</code>
      </div>
    </div>
  )
}
