import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as TabsPrimitive from '@radix-ui/react-tabs'
import { supabase } from '@/lib/supabase'
import { slugify, cn } from '@/lib/utils'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { ImageUpload } from '@/components/admin/ImageUpload'
import { GalleryUpload } from '@/components/admin/GalleryUpload'
import { toast } from '@/components/ui/Toast'
import { AssociadoBranches } from './AssociadoBranches'
import type { Associate, Category } from '@/types/models'

const schema = z.object({
  name: z.string().min(2, 'Nome obrigatório'),
  slug: z.string().min(2, 'Slug obrigatório'),
  city: z.string().optional(),
  state: z.string().default('SP'),
  description: z.string().optional(),
  site_url: z.string().url('URL inválida').optional().or(z.literal('')),
  instagram: z.string().optional(),
  facebook: z.string().optional(),
  whatsapp: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  address: z.string().optional(),
  business_hours: z.string().optional(),
  category_id: z.string().optional(),
  active: z.boolean().default(true),
  order_index: z.coerce.number().default(0),
  logo_url: z.string().nullable().optional(),
  store_image_url: z.string().nullable().optional(),
})

type FormData = z.infer<typeof schema>

interface AssociadoFormProps {
  open: boolean
  onClose: () => void
  associate: Associate | null
}

const TABS = [
  { value: 'geral', label: 'Geral' },
  { value: 'contato', label: 'Contato' },
  { value: 'endereco', label: 'Endereço' },
  { value: 'fotos', label: 'Fotos' },
  { value: 'unidades', label: 'Unidades' },
]

export function AssociadoForm({ open, onClose, associate }: AssociadoFormProps) {
  const qc = useQueryClient()
  const isEdit = !!associate
  const [gallery, setGallery] = useState<string[]>([])

  const { data: categories = [] } = useQuery({
    queryKey: ['categories-associate'],
    queryFn: async () => {
      const { data } = await supabase.from('categories').select('*').eq('type', 'associate')
      return (data ?? []) as Category[]
    },
  })

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { active: true, state: 'SP', order_index: 0 },
  })

  const nameValue = watch('name')

  useEffect(() => {
    if (associate) {
      reset({
        name: associate.name,
        slug: associate.slug,
        city: associate.city ?? '',
        state: associate.state ?? 'SP',
        description: associate.description ?? '',
        site_url: associate.site_url ?? '',
        instagram: associate.instagram ?? '',
        facebook: associate.facebook ?? '',
        whatsapp: associate.whatsapp ?? '',
        phone: associate.phone ?? '',
        email: associate.email ?? '',
        address: associate.address ?? '',
        business_hours: associate.business_hours ?? '',
        category_id: associate.category_id ?? '',
        active: associate.active,
        order_index: associate.order_index,
        logo_url: associate.logo_url,
        store_image_url: associate.store_image_url,
      })
      setGallery(associate.gallery ?? [])
    } else {
      reset({ active: true, state: 'SP', order_index: 0 })
      setGallery([])
    }
  }, [associate, reset])

  useEffect(() => {
    if (!isEdit && nameValue) {
      setValue('slug', slugify(nameValue))
    }
  }, [nameValue, isEdit, setValue])

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const payload = {
        ...data,
        site_url: data.site_url || null,
        email: data.email || null,
        category_id: data.category_id || null,
        gallery,
      }
      if (isEdit) {
        const { error } = await supabase.from('associates').update(payload).eq('id', associate.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('associates').insert(payload)
        if (error) throw error
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-associates'] })
      qc.invalidateQueries({ queryKey: ['associates-home'] })
      qc.invalidateQueries({ queryKey: ['associado-detalhe', associate?.slug] })
      toast.success(isEdit ? 'Associado atualizado!' : 'Associado criado!')
      onClose()
    },
    onError: (e: Error) => toast.error('Erro ao salvar', e.message),
  })

  const brazilStates = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO']

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Editar associado' : 'Novo associado'}
      size="2xl"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button loading={mutation.isPending} onClick={handleSubmit((d) => mutation.mutate(d))}>
            {isEdit ? 'Salvar alterações' : 'Criar associado'}
          </Button>
        </>
      }
    >
      <TabsPrimitive.Root defaultValue="geral">
        <TabsPrimitive.List className="flex border-b border-gray-200 mb-5 -mx-6 px-6 gap-1">
          {TABS.map((tab) => (
            <TabsPrimitive.Trigger
              key={tab.value}
              value={tab.value}
              disabled={tab.value === 'unidades' && !isEdit}
              className={cn(
                'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
                'data-[state=active]:border-primary-600 data-[state=active]:text-primary-600',
                'data-[state=inactive]:border-transparent data-[state=inactive]:text-gray-500 hover:text-gray-700',
                'disabled:opacity-40 disabled:pointer-events-none'
              )}
            >
              {tab.label}
            </TabsPrimitive.Trigger>
          ))}
        </TabsPrimitive.List>

        <TabsPrimitive.Content value="geral" className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Nome *" error={errors.name?.message} {...register('name')} placeholder="Santa Helena Home Center" />
            <Input label="Slug *" error={errors.slug?.message} {...register('slug')} placeholder="santa-helena" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Input label="Cidade" {...register('city')} placeholder="São Carlos" />
            <Select label="Estado" options={brazilStates.map((s) => ({ value: s, label: s }))} {...register('state')} />
            <Select label="Categoria" placeholder="Selecionar..." options={categories.map((c) => ({ value: c.id, label: c.name }))} {...register('category_id')} />
          </div>
          <Textarea label="Descrição / Nossa história" rows={4} {...register('description')} placeholder="Descreva a empresa..." />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" {...register('active')} className="w-4 h-4 accent-primary-600 rounded" />
                <span className="text-sm text-gray-700">Associado ativo</span>
              </label>
            </div>
            <Input label="Ordem de exibição" type="number" {...register('order_index')} />
          </div>
        </TabsPrimitive.Content>

        <TabsPrimitive.Content value="contato" className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Telefone" {...register('phone')} placeholder="1633334444" />
            <Input label="WhatsApp" {...register('whatsapp')} placeholder="5516999990000" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Email" {...register('email')} placeholder="contato@loja.com" error={errors.email?.message} />
            <Input label="Site" {...register('site_url')} placeholder="https://exemplo.com" error={errors.site_url?.message} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Instagram" {...register('instagram')} placeholder="@nome_da_loja" />
            <Input label="Facebook" {...register('facebook')} placeholder="facebook.com/loja" />
          </div>
        </TabsPrimitive.Content>

        <TabsPrimitive.Content value="endereco" className="space-y-5">
          <p className="text-xs text-gray-500">
            Usado quando o associado tem uma única loja. Se ele tiver várias unidades, cadastre-as na aba "Unidades" — o endereço de cada uma aparece lá em vez deste.
          </p>
          <Input label="Endereço" {...register('address')} placeholder="Rua, número, bairro" />
          <Textarea label="Horário de funcionamento" rows={2} {...register('business_hours')} placeholder="Seg-Sex 8h-18h, Sáb 8h-12h" />
        </TabsPrimitive.Content>

        <TabsPrimitive.Content value="fotos" className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <ImageUpload label="Logo" value={watch('logo_url')} onChange={(url) => setValue('logo_url', url)} folder="associates/logos" />
            <ImageUpload label="Foto de capa (hero)" value={watch('store_image_url')} onChange={(url) => setValue('store_image_url', url)} folder="associates/stores" />
          </div>
          <GalleryUpload label="Galeria de fotos" value={gallery} onChange={setGallery} folder="associates/gallery" />
        </TabsPrimitive.Content>

        <TabsPrimitive.Content value="unidades" className="space-y-5">
          {isEdit ? (
            <AssociadoBranches associateId={associate.id} />
          ) : (
            <p className="text-sm text-gray-500">Salve o associado primeiro para poder adicionar unidades.</p>
          )}
        </TabsPrimitive.Content>
      </TabsPrimitive.Root>
    </Modal>
  )
}
