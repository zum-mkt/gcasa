import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { CheckCircle2, Package, TrendingUp, Globe } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from '@/components/ui/Toast'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { useState } from 'react'

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

const benefits = [
  { icon: Globe, title: 'Alcance Regional', desc: 'Acesso direto a mais de 18 lojas no interior paulista.' },
  { icon: Package, title: 'Volume de Compras', desc: 'Negociações em volume com um grupo consolidado.' },
  { icon: TrendingUp, title: 'Parceria de Longo Prazo', desc: 'Relacionamentos comerciais estáveis e duradouros.' },
]

export default function SouFornecedorPage() {
  const [sent, setSent] = useState(false)
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
    <div className="pt-16 min-h-screen bg-gray-50">
      <div className="bg-dark-900 py-20">
        <div className="container-site text-center">
          <span className="section-label text-red-400">Sou Fornecedor</span>
          <h1 className="text-4xl md:text-5xl font-display font-light text-white mt-4">Venda para todo o<br /><span className="text-primary-600">Grupo GCasa</span></h1>
          <p className="text-gray-400 mt-4 max-w-md mx-auto">Conecte sua marca a uma rede sólida de empresas do setor de construção e materiais.</p>
        </div>
      </div>

      <div className="container-site py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          <div>
            {sent ? (
              <div className="bg-white rounded-2xl p-10 shadow-card text-center">
                <CheckCircle2 size={48} className="text-green-500 mx-auto mb-4" />
                <h3 className="text-2xl font-semibold text-gray-900 mb-3">Cadastro recebido!</h3>
                <p className="text-gray-500">Nossa equipe de compras entrará em contato em breve para dar andamento à parceria.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="bg-white rounded-2xl p-6 shadow-card space-y-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Dados da sua empresa</h2>
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
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Por que ser parceiro GCasa?</h2>
            <div className="space-y-4">
              {benefits.map((b, i) => (
                <div key={i} className="flex items-start gap-4 bg-white rounded-2xl p-4 shadow-card">
                  <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0"><b.icon size={18} className="text-primary-600" /></div>
                  <div><p className="font-medium text-gray-900">{b.title}</p><p className="text-sm text-gray-500 mt-0.5">{b.desc}</p></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
