import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Save } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { PageHeader } from '@/components/admin/PageHeader'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ImageUpload } from '@/components/admin/ImageUpload'
import { toast } from '@/components/ui/Toast'

const schema = z.object({
  company_name: z.string().min(2, 'Nome obrigatório'),
  logo_url: z.string().optional(),
  tagline: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  address: z.string().optional(),
  address_city: z.string().optional(),
  address_state: z.string().optional(),
  address_cep: z.string().optional(),
  whatsapp: z.string().optional(),
  instagram: z.string().optional(),
  facebook: z.string().optional(),
  linkedin: z.string().optional(),
  youtube: z.string().optional(),
  default_title: z.string().optional(),
  default_description: z.string().optional(),
  google_analytics_id: z.string().optional(),
  google_tag_manager_id: z.string().optional(),
  meta_pixel_id: z.string().optional(),
})
type FormData = z.infer<typeof schema>

async function fetchSettings() {
  const { data, error } = await supabase.from('settings').select('*')
  if (error) throw error
  const map: Record<string, Record<string, string>> = {}
  for (const row of data) map[row.key] = row.value as Record<string, string>
  return map
}

export default function AdminConfiguracoes() {
  const qc = useQueryClient()
  const { data: settings, isLoading } = useQuery({ queryKey: ['admin-settings'], queryFn: fetchSettings })

  const { register, handleSubmit, reset, control, formState: { errors, isDirty } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  useEffect(() => {
    if (!settings) return
    const s = settings.site ?? {}
    const so = settings.social ?? {}
    const seo = settings.seo ?? {}
    const sc = settings.scripts ?? {}
    reset({
      company_name: s.company_name ?? '',
      logo_url: s.logo_url ?? '',
      tagline: s.tagline ?? '',
      phone: s.phone ?? '',
      email: s.email ?? '',
      address: s.address ?? '',
      address_city: s.address_city ?? '',
      address_state: s.address_state ?? '',
      address_cep: s.address_cep ?? '',
      whatsapp: s.whatsapp ?? '',
      instagram: so.instagram ?? '',
      facebook: so.facebook ?? '',
      linkedin: so.linkedin ?? '',
      youtube: so.youtube ?? '',
      default_title: seo.default_title ?? '',
      default_description: seo.default_description ?? '',
      google_analytics_id: sc.google_analytics_id ?? '',
      google_tag_manager_id: sc.google_tag_manager_id ?? '',
      meta_pixel_id: sc.meta_pixel_id ?? '',
    })
  }, [settings, reset])

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const updates = [
        { key: 'site', value: { company_name: data.company_name, logo_url: data.logo_url, tagline: data.tagline, phone: data.phone, email: data.email, address: data.address, address_city: data.address_city, address_state: data.address_state, address_cep: data.address_cep, whatsapp: data.whatsapp } },
        { key: 'social', value: { instagram: data.instagram, facebook: data.facebook, linkedin: data.linkedin, youtube: data.youtube } },
        { key: 'seo', value: { default_title: data.default_title, default_description: data.default_description } },
        { key: 'scripts', value: { google_analytics_id: data.google_analytics_id, google_tag_manager_id: data.google_tag_manager_id, meta_pixel_id: data.meta_pixel_id } },
      ]
      for (const u of updates) {
        const { error } = await supabase.from('settings').upsert(u, { onConflict: 'key' })
        if (error) throw error
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-settings'] })
      qc.invalidateQueries({ queryKey: ['site-settings'] })
      qc.invalidateQueries({ queryKey: ['footer-settings'] })
      qc.invalidateQueries({ queryKey: ['header-site-settings'] })
      toast.success('Configurações salvas!')
    },
    onError: (e: Error) => toast.error('Erro ao salvar', e.message),
  })

  if (isLoading) return <div className="animate-pulse space-y-4"><div className="h-8 bg-gray-100 rounded-xl w-64" /><div className="h-64 bg-gray-100 rounded-2xl" /></div>

  return (
    <div className="space-y-6">
      <PageHeader title="Configurações" description="Gerencie as informações globais do site."
        actions={<Button leftIcon={<Save size={15} />} loading={mutation.isPending} onClick={handleSubmit(d => mutation.mutate(d))} disabled={!isDirty}>Salvar alterações</Button>} />

      <form className="space-y-6">
        <section className="bg-white rounded-2xl p-6 shadow-card">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Informações da Empresa</h3>
          <div className="mb-4">
            <Controller name="logo_url" control={control}
              render={({ field }) => (
                <ImageUpload label="Logo do site (exibido no header e rodapé)" value={field.value ?? ''} onChange={field.onChange} bucket="site-assets" folder="logo" />
              )} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Nome da empresa *" error={errors.company_name?.message} {...register('company_name')} />
            <Input label="Slogan / Tagline" {...register('tagline')} />
            <Input label="Telefone" {...register('phone')} placeholder="(16) 3361-0000" />
            <Input label="Email" type="email" error={errors.email?.message} {...register('email')} />
            <Input label="WhatsApp (DDI+DDD+número)" {...register('whatsapp')} placeholder="5516999990000" />
            <Input label="Endereço" {...register('address')} />
            <Input label="Cidade" {...register('address_city')} />
            <Input label="Estado" {...register('address_state')} placeholder="SP" />
            <Input label="CEP" {...register('address_cep')} placeholder="00000-000" />
          </div>
        </section>

        <section className="bg-white rounded-2xl p-6 shadow-card">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Redes Sociais</h3>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Instagram" {...register('instagram')} placeholder="https://instagram.com/..." />
            <Input label="Facebook" {...register('facebook')} placeholder="https://facebook.com/..." />
            <Input label="LinkedIn" {...register('linkedin')} placeholder="https://linkedin.com/..." />
            <Input label="YouTube" {...register('youtube')} placeholder="https://youtube.com/..." />
          </div>
        </section>

        <section className="bg-white rounded-2xl p-6 shadow-card">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">SEO Padrão</h3>
          <div className="space-y-4">
            <Input label="Título padrão" {...register('default_title')} placeholder="Nome do Site — Descrição" />
            <Input label="Descrição padrão" {...register('default_description')} placeholder="Descrição do site para motores de busca" />
          </div>
        </section>

        <section className="bg-white rounded-2xl p-6 shadow-card">
          <h3 className="text-sm font-semibold text-gray-900 mb-1">Scripts & Rastreamento</h3>
          <p className="text-xs text-gray-400 mb-4">Preencha apenas os IDs, não o código completo.</p>
          <div className="grid grid-cols-3 gap-4">
            <Input label="Google Analytics ID" {...register('google_analytics_id')} placeholder="G-XXXXXXXXXX" />
            <Input label="Google Tag Manager ID" {...register('google_tag_manager_id')} placeholder="GTM-XXXXXXX" />
            <Input label="Meta Pixel ID" {...register('meta_pixel_id')} placeholder="000000000000000" />
          </div>
        </section>
      </form>
    </div>
  )
}
