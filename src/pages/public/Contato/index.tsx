import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import { MapPin, Phone, Mail, MessageCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from '@/components/ui/Toast'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { useState } from 'react'

const schema = z.object({
  name: z.string().min(2, 'Nome obrigatório'),
  email: z.string().email('Email inválido'),
  phone: z.string().optional(),
  message: z.string().min(10, 'Mensagem muito curta'),
})
type FormData = z.infer<typeof schema>

async function fetchSiteSettings() {
  const { data } = await supabase.from('settings').select('*').eq('key', 'site').single()
  return (data?.value ?? {}) as Record<string, string>
}

export default function ContatoPage() {
  const [sent, setSent] = useState(false)
  const { data: settings = {} } = useQuery({ queryKey: ['site-settings-contact'], queryFn: fetchSiteSettings })

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) })

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const { error } = await supabase.from('form_submissions').insert({ form_type: 'contact', data })
      if (error) throw error
    },
    onSuccess: () => { setSent(true); reset(); toast.success('Mensagem enviada! Entraremos em contato em breve.') },
    onError: () => toast.error('Erro ao enviar mensagem. Tente novamente.'),
  })

  return (
    <div className="pt-16 min-h-screen bg-gray-50">
      <div className="bg-dark-900 py-20">
        <div className="container-site text-center">
          <span className="section-label text-red-400">Fale Conosco</span>
          <h1 className="text-4xl md:text-5xl font-display font-light text-white mt-4">Como podemos<br /><span className="text-primary-600">te ajudar?</span></h1>
          <p className="text-gray-400 mt-4 max-w-md mx-auto">Estamos disponíveis para tirar dúvidas, receber sugestões ou iniciar uma conversa sobre como fazer parte do grupo.</p>
        </div>
      </div>

      <div className="container-site py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Envie uma mensagem</h2>
            {sent ? (
              <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail size={20} className="text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Mensagem recebida!</h3>
                <p className="text-gray-500 text-sm">Entraremos em contato em breve.</p>
                <button onClick={() => setSent(false)} className="mt-4 text-sm text-primary-600 hover:underline">Enviar outra mensagem</button>
              </div>
            ) : (
              <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="space-y-4 bg-white rounded-2xl p-6 shadow-card">
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Seu nome *" error={errors.name?.message} {...register('name')} placeholder="João Silva" />
                  <Input label="Email *" type="email" error={errors.email?.message} {...register('email')} placeholder="joao@exemplo.com" />
                </div>
                <Input label="Telefone" {...register('phone')} placeholder="(16) 9 9999-9999" />
                <Textarea label="Mensagem *" rows={5} error={errors.message?.message} {...register('message')} placeholder="Como podemos te ajudar?" />
                <Button type="submit" loading={mutation.isPending} className="w-full">Enviar mensagem</Button>
              </form>
            )}
          </div>

          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-gray-900">Informações de contato</h2>
            <div className="space-y-4">
              {settings.address && (
                <div className="flex items-start gap-4 p-4 bg-white rounded-2xl shadow-card">
                  <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0"><MapPin size={18} className="text-primary-600" /></div>
                  <div><p className="font-medium text-gray-900">Endereço</p><p className="text-sm text-gray-500 mt-0.5">{settings.address}<br />{settings.address_city}, {settings.address_state} — CEP {settings.address_cep}</p></div>
                </div>
              )}
              {settings.phone && (
                <a href={`tel:${settings.phone}`} className="flex items-start gap-4 p-4 bg-white rounded-2xl shadow-card hover:shadow-dropdown transition-shadow">
                  <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0"><Phone size={18} className="text-primary-600" /></div>
                  <div><p className="font-medium text-gray-900">Telefone</p><p className="text-sm text-gray-500 mt-0.5">{settings.phone}</p></div>
                </a>
              )}
              {settings.email && (
                <a href={`mailto:${settings.email}`} className="flex items-start gap-4 p-4 bg-white rounded-2xl shadow-card hover:shadow-dropdown transition-shadow">
                  <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0"><Mail size={18} className="text-primary-600" /></div>
                  <div><p className="font-medium text-gray-900">Email</p><p className="text-sm text-gray-500 mt-0.5">{settings.email}</p></div>
                </a>
              )}
              {settings.whatsapp && (
                <a href={`https://wa.me/${settings.whatsapp}`} target="_blank" rel="noreferrer" className="flex items-start gap-4 p-4 bg-white rounded-2xl shadow-card hover:shadow-dropdown transition-shadow">
                  <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0"><MessageCircle size={18} className="text-green-600" /></div>
                  <div><p className="font-medium text-gray-900">WhatsApp</p><p className="text-sm text-gray-500 mt-0.5">Clique para conversar</p></div>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
