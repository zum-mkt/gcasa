import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import { CheckCircle2, TrendingUp } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from '@/components/ui/Toast'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { useState } from 'react'
import { PAGE_ICON_MAP } from '@/lib/pageIconMap'

const schema = z.object({
  company_name: z.string().min(2, 'Nome da empresa obrigatório'),
  name: z.string().min(2, 'Seu nome é obrigatório'),
  email: z.string().email('Email inválido'),
  phone: z.string().min(8, 'Telefone obrigatório'),
  city: z.string().min(2, 'Cidade obrigatória'),
  state: z.string().min(2),
  segment: z.string().optional(),
  annual_revenue: z.string().optional(),
  employees: z.string().optional(),
  message: z.string().optional(),
})
type FormData = z.infer<typeof schema>

type PageBenefit = { icon: string; title: string; desc: string }
type AssociarContent = { tag?: string; title?: string; title_highlight?: string; description?: string; benefits?: PageBenefit[] }

const defaultBenefits: PageBenefit[] = [
  { icon: 'BarChart2', title: 'Inteligência de Mercado', desc: 'Dados e análises exclusivas do setor.' },
  { icon: 'Users', title: 'Networking Estratégico', desc: 'Conexão com empresários líderes.' },
  { icon: 'Handshake', title: 'Poder de Negociação', desc: 'Melhores condições com fornecedores.' },
  { icon: 'TrendingUp', title: 'Crescimento Acelerado', desc: 'Ferramentas para escalar seus resultados.' },
]

async function fetchAssociarContent(): Promise<AssociarContent> {
  const { data } = await supabase.from('home_content').select('content').eq('section', 'associar_page').single()
  if (!data) return {}
  return data.content as AssociarContent
}

const brazilStates = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO']

export default function QueroMeAssociarPage() {
  const [sent, setSent] = useState(false)
  const { data: content } = useQuery({ queryKey: ['associar-page-content'], queryFn: fetchAssociarContent })
  const tag = content?.tag ?? 'Quero me Associar'
  const title = content?.title ?? 'Faça parte da rede'
  const titleHighlight = content?.title_highlight ?? 'mais forte do setor'
  const description = content?.description ?? 'Preencha o formulário e nossa equipe entrará em contato para apresentar todos os benefícios de ser um associado GCasa.'
  const benefits = content?.benefits && content.benefits.length > 0 ? content.benefits : defaultBenefits

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema), defaultValues: { state: 'SP' },
  })

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const { error } = await supabase.from('form_submissions').insert({ form_type: 'associate', data })
      if (error) throw error
    },
    onSuccess: () => { setSent(true); reset() },
    onError: () => toast.error('Erro ao enviar. Tente novamente.'),
  })

  return (
    <div className="pt-16 min-h-screen bg-offwhite">
      <div className="texture-concrete texture-concrete--dark bg-graphite-900 py-20">
        <div className="container-site text-center">
          <span className="section-label-light">{tag}</span>
          <h1 className="text-4xl md:text-5xl heading-editorial text-white mt-4">{title}<br /><span className="text-primary-500">{titleHighlight}</span></h1>
          <p className="text-graphite-300 mt-4 max-w-lg mx-auto">{description}</p>
        </div>
      </div>

      <div className="container-site py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          <div>
            {sent ? (
              <div className="bg-white border border-graphite-100 shadow-card p-10 text-center">
                <CheckCircle2 size={48} className="text-green-500 mx-auto mb-4" />
                <h3 className="text-2xl heading-editorial text-graphite-900 mb-3">Solicitação recebida!</h3>
                <p className="text-graphite-600">Nossa equipe analisará seu cadastro e entrará em contato em até 2 dias úteis.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="bg-white border border-graphite-100 shadow-card p-6 space-y-4">
                <h2 className="text-lg font-bold text-graphite-900 mb-2">Dados da sua empresa</h2>
                <Input label="Nome da empresa *" error={errors.company_name?.message} {...register('company_name')} placeholder="Ex: Home Center Exemplo" />
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Seu nome *" error={errors.name?.message} {...register('name')} placeholder="João Silva" />
                  <Input label="Email *" type="email" error={errors.email?.message} {...register('email')} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Telefone *" error={errors.phone?.message} {...register('phone')} placeholder="(16) 9 9999-9999" />
                  <Input label="Cidade *" error={errors.city?.message} {...register('city')} placeholder="São Carlos" />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <Select label="Estado" options={brazilStates.map(s => ({ value: s, label: s }))} {...register('state')} />
                  <Select label="Segmento" placeholder="Selecionar..." options={[{ value: 'home-center', label: 'Home Center' }, { value: 'materiais', label: 'Materiais de Construção' }, { value: 'decoracao', label: 'Decoração' }, { value: 'outro', label: 'Outro' }]} {...register('segment')} />
                  <Select label="Nº de funcionários" placeholder="Selecionar..." options={[{ value: '1-10', label: '1–10' }, { value: '11-50', label: '11–50' }, { value: '51-200', label: '51–200' }, { value: '200+', label: '200+' }]} {...register('employees')} />
                </div>
                <Textarea label="Mensagem (opcional)" rows={3} {...register('message')} placeholder="Conte um pouco sobre sua empresa..." />
                <Button type="submit" loading={mutation.isPending} className="w-full">Quero me associar</Button>
                <p className="text-xs text-graphite-500 text-center">Ao enviar, você concorda que nossa equipe entre em contato com você.</p>
              </form>
            )}
          </div>

          <div>
            <h2 className="text-2xl heading-editorial text-graphite-900 mb-6">O que você ganha sendo associado</h2>
            <div className="space-y-4">
              {benefits.map((b, i) => {
                const Icon = PAGE_ICON_MAP[b.icon] ?? TrendingUp
                return (
                  <div key={i} className="flex items-start gap-4 bg-white border border-graphite-100 shadow-card p-4">
                    <div className="w-10 h-10 bg-primary-50 flex items-center justify-center flex-shrink-0"><Icon size={18} className="text-primary-500" /></div>
                    <div><p className="font-bold text-graphite-900">{b.title}</p><p className="text-sm text-graphite-600 mt-0.5">{b.desc}</p></div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
