import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Check, Rocket } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { ImageUpload } from '@/components/admin/ImageUpload'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { toast } from '@/components/ui/Toast'
import { FooterBuilder } from '@/components/tabloide/FooterBuilder'
import { CAMPAIGN_FOOTER_BLOCKS, EMPTY_TABLOID_FOOTER, footerHasContent, type TabloidFooter } from '@/lib/tabloidFooter'

const dadosSchema = z.object({
  name: z.string().min(2, 'Nome obrigatório'),
  submission_deadline: z.string().optional(),
  valid_from: z.string().optional(),
  valid_until: z.string().optional(),
})
type Dados = z.infer<typeof dadosSchema>

function defaultName() {
  return `Tabloide ${new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}`
}

const STEPS = [
  { n: 1, label: 'Dados' },
  { n: 2, label: 'Capa' },
  { n: 3, label: 'Rodapé' },
  { n: 4, label: 'Lançar' },
] as const

function WizardDots({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-1">
      {STEPS.map((s, i) => (
        <div key={s.n} className="flex items-center gap-2">
          <div className="flex flex-col items-center gap-0.5">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
              s.n < current ? 'bg-primary-500 text-graphite-900' :
              s.n === current ? 'bg-primary-500 text-graphite-900 ring-4 ring-primary-100' :
              'bg-gray-100 text-gray-400'
            }`}>
              {s.n < current ? <Check size={12} /> : s.n}
            </div>
            <span className={`text-[10px] ${s.n <= current ? 'text-graphite-700' : 'text-gray-400'}`}>{s.label}</span>
          </div>
          {i < STEPS.length - 1 && <div className={`w-6 h-0.5 mb-4 ${s.n < current ? 'bg-primary-400' : 'bg-gray-200'}`} />}
        </div>
      ))}
    </div>
  )
}

/* Passo a passo do admin: dados → capa (página 1) → rodapé (página 2) → lançar.
   Só então o tabloide fica "Aberto" e aparece no portal do associado. */
export function LaunchWizard({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient()
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)
  const [headerImage, setHeaderImage] = useState<string | null>(null)
  const [footer, setFooter] = useState<TabloidFooter>(EMPTY_TABLOID_FOOTER)
  const { register, handleSubmit, reset, getValues, formState: { errors } } = useForm<Dados>({
    resolver: zodResolver(dadosSchema),
  })

  useEffect(() => {
    if (open) {
      setStep(1)
      setHeaderImage(null)
      setFooter(EMPTY_TABLOID_FOOTER)
      reset({ name: defaultName(), submission_deadline: '', valid_from: '', valid_until: '' })
    }
  }, [open, reset])

  const mutation = useMutation({
    mutationFn: async () => {
      const dados = getValues()
      const payload = {
        name: dados.name.trim(),
        status: 'open' as const,
        submission_deadline: dados.submission_deadline || null,
        valid_from: dados.valid_from || null,
        valid_until: dados.valid_until || null,
        header_image_url: headerImage,
        footer,
      }
      const { error } = await supabase.from('tabloid_editions').insert(payload)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-tabloid-editions'] })
      toast.success('Tabloide lançado!', 'Os associados já veem em /portal/produtos pra preencher os produtos.')
      onClose()
    },
    onError: (e: Error) => toast.error('Erro ao lançar tabloide', e.message),
  })

  const goDados = handleSubmit(() => setStep(2))
  const dados = getValues()

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Lançar tema do tabloide"
      description="Você define o tema e a capa. Cada loja preenche o miolo (produtos) e os dados dela."
      size="2xl"
      footer={
        <>
          {step === 1 && (
            <>
              <Button variant="outline" onClick={onClose}>Cancelar</Button>
              <Button onClick={goDados}>Continuar — capa</Button>
            </>
          )}
          {step === 2 && (
            <>
              <Button variant="outline" onClick={() => setStep(1)}>Voltar</Button>
              <Button onClick={() => setStep(3)}>Continuar — rodapé</Button>
            </>
          )}
          {step === 3 && (
            <>
              <Button variant="outline" onClick={() => setStep(2)}>Voltar</Button>
              <Button onClick={() => setStep(4)}>Continuar — conferir</Button>
            </>
          )}
          {step === 4 && (
            <>
              <Button variant="outline" onClick={() => setStep(3)}>Voltar</Button>
              <Button leftIcon={<Rocket size={15} />} loading={mutation.isPending} onClick={() => mutation.mutate()}>
                Lançar tabloide
              </Button>
            </>
          )}
        </>
      }
    >
      <WizardDots current={step} />

      {step === 1 && (
        <form className="space-y-4 mt-4">
          <Input label="Nome do tabloide *" error={errors.name?.message} {...register('name')} placeholder="Tabloide Agosto 2026" />
          <Input label="Prazo de envio (associados)" type="date" hint="Até quando as lojas podem mandar os produtos." {...register('submission_deadline')} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Válido de" type="date" {...register('valid_from')} />
            <Input label="Válido até" type="date" {...register('valid_until')} />
          </div>
        </form>
      )}

      {step === 2 && (
        <div className="space-y-3 mt-4">
          <p className="text-sm text-graphite-600">
            Capa padrão do tema (frente, 21 × 8 cm). O administrador sempre faz essa arte.
            Se uma loja precisar de uma variação, você sobe a capa dela depois na curadoria.
          </p>
          <ImageUpload
            label="Capa do tema"
            value={headerImage}
            onChange={setHeaderImage}
            folder="tabloide/headers"
            fit="contain"
            hint="Faixa 21 × 8 cm. Pode ser aproximado — o sistema ajusta. Ideal 2480 × 945 px em 300 dpi."
          />
          {!headerImage && (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
              Dá pra lançar sem capa e subir depois em Editar — mas a frente das lojas fica vazia até lá.
            </p>
          )}
        </div>
      )}

      {step === 3 && (
        <div className="space-y-3 mt-4">
          <p className="text-sm text-graphite-600">
            Parte do tema no verso: selo GCasa e letras miúdas. Logo, telefone e WhatsApp cada loja completa no portal.
          </p>
          <FooterBuilder value={footer} onChange={setFooter} visibleBlocks={CAMPAIGN_FOOTER_BLOCKS} />
        </div>
      )}

      {step === 4 && (
        <div className="space-y-3 mt-4 text-sm">
          <div className="bg-gray-50 rounded-xl p-4 space-y-2">
            <p><span className="text-gray-500">Nome:</span> <span className="font-semibold text-graphite-900">{dados.name || '—'}</span></p>
            <p><span className="text-gray-500">Prazo de envio:</span> {dados.submission_deadline || 'sem prazo'}</p>
            <p><span className="text-gray-500">Validade:</span> {dados.valid_from ? `${dados.valid_from} a ${dados.valid_until || '—'}` : 'não informada'}</p>
            <p><span className="text-gray-500">Capa do tema:</span> {headerImage ? 'enviada' : 'sem capa'}</p>
            <p><span className="text-gray-500">Selo / letras miúdas:</span> {footerHasContent(footer) ? 'preenchidos' : 'ainda vazios'}</p>
          </div>
          <p className="text-xs text-gray-400">
            Ao lançar, cada loja vê esse tema no portal e preenche só o miolo (produtos) e os dados dela (logo, telefone, WhatsApp).
          </p>
        </div>
      )}
    </Modal>
  )
}
