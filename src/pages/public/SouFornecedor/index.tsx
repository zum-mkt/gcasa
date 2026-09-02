import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import { CheckCircle2, TrendingUp } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from '@/components/ui/Toast'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { useState } from 'react'
import { PAGE_ICON_MAP } from '@/lib/pageIconMap'

const schema = z.object({
  company_name: z.string().min(2, 'Nome da empresa obrigatório'),
  name: z.string().min(2, 'Seu nome é obrigatório'),
  email: z.string().email('Email inválido'),
  phone: z.string().min(8, 'Telefone obrigatório'),
  website: z.string().optional(),
  product_category: z.string().optional(),
  message: z.string().optional(),
})
type FormData = z.infer<typeof schema>

type PageBenefit = { icon: string; title: string; desc: string }
type FornecedorContent = { tag?: string; title?: string; title_highlight?: string; description?: string; benefits?: PageBenefit[] }

const defaultBenefits: PageBenefit[] = [
  { icon: 'Globe', title: 'Alcance Regional', desc: 'Acesso direto a mais de 18 lojas no interior paulista.' },
  { icon: 'Package', title: 'Volume de Compras', desc: 'Negociações em volume com um grupo consolidado.' },
  { icon: 'TrendingUp', title: 'Parceria de Longo Prazo', desc: 'Relacionamentos comerciais estáveis e duradouros.' },
]

async function fetchFornecedorContent(): Promise<FornecedorContent> {
  const { data } = await supabase.from('home_content').select('content').eq('section', 'fornecedor_page').single()
  if (!data) return {}
  return data.content as FornecedorContent
}

export default function SouFornecedorPage() {
  const [sent, setSent] = useState(false)
  const { data: content } = useQuery({ queryKey: ['fornecedor-page-content'], queryFn: fetchFornecedorContent })
  const tag = content?.tag ?? 'Sou Fornecedor'
  const title = content?.title ?? 'Venda para todo o'
  const titleHighlight = content?.title_highlight ?? 'Grupo GCasa'
  const description = content?.description ?? 'Conecte sua marca a uma rede sólida de empresas do setor de construção e materiais.'
  const benefits = content?.benefits && content.benefits.length > 0 ? content.benefits : defaultBenefits

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) })

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const { error } = await supabase.from('form_submissions').insert({ form_type: 'supplier', data })
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
          <p className="text-graphite-300 mt-4 max-w-md mx-auto">{description}</p>
        </div>
      </div>

      <div className="container-site py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          <div>
            {sent ? (
              <div className="bg-white border border-graphite-100 shadow-card p-10 text-center">
                <CheckCircle2 size={48} className="text-green-500 mx-auto mb-4" />
                <h3 className="text-2xl heading-editorial text-graphite-900 mb-3">Cadastro recebido!</h3>
                <p className="text-graphite-600">Nossa equipe de compras entrará em contato em breve para dar andamento à parceria.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="bg-white border border-graphite-100 shadow-card p-6 space-y-4">
                <h2 className="text-lg font-bold text-graphite-900 mb-2">Dados da sua empresa</h2>
                <Input label="Nome da empresa *" error={errors.company_name?.message} {...register('company_name')} />
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Seu nome *" error={errors.name?.message} {...register('name')} />
                  <Input label="Email *" type="email" error={errors.email?.message} {...register('email')} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Telefone *" error={errors.phone?.message} {...register('phone')} />
                  <Input label="Site" {...register('website')} placeholder="https://suaempresa.com" />
                </div>
                <Input label="Categoria de produto/serviço" {...register('product_category')} placeholder="Ex: Tintas, Ferragens, Pisos..." />
                <Textarea label="Mensagem" rows={3} {...register('message')} placeholder="Conte sobre o que você fornece e como pode ajudar o grupo..." />
                <Button type="submit" loading={mutation.isPending} className="w-full">Enviar cadastro</Button>
              </form>
            )}
          </div>

          <div>
            <h2 className="text-2xl heading-editorial text-graphite-900 mb-6">Por que ser parceiro GCasa?</h2>
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
