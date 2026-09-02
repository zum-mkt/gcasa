import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { ImageUpload } from '@/components/admin/ImageUpload'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import { toast } from '@/components/ui/Toast'
import { TabloidBackgroundPicker } from '@/components/tabloide/BackgroundPicker'
import { TabloidPriceStylePicker } from '@/components/tabloide/PriceStylePicker'
import { DEFAULT_TABLOID_BACKGROUND, DEFAULT_TABLOID_PRICE_STYLE, normalizePriceStyle } from '@/lib/tabloidTheme'
import { TABLOID_MAX_PRODUCTS_PER_PAGE } from '@/lib/tabloidCapacity'
import type { TabloidEdition } from '@/types/models'

export const editionStatusOptions = [
  { value: 'draft', label: 'Rascunho — ainda não visível pros associados' },
  { value: 'open', label: 'Aberta — associados podem enviar produtos' },
  { value: 'closed', label: 'Fechada — envio encerrado, em curadoria' },
  { value: 'published', label: 'Publicada — tabloide pronto' },
]

const editionSchema = z.object({
  name: z.string().min(2, 'Nome obrigatório'),
  status: z.enum(['draft', 'open', 'closed', 'published']).default('draft'),
  submission_deadline: z.string().optional(),
  valid_from: z.string().optional(),
  valid_until: z.string().optional(),
  header_image_url: z.string().nullable().optional(),
  generated_pdf_url: z.string().optional(),
  notes: z.string().optional(),
  max_products_per_page: z.coerce.number().int().min(12, 'Mínimo 12 por página (24 no tabloide)').max(20, 'Máximo 20 por página (40 no tabloide)').optional(),
  background_color: z.string().optional(),
  price_style: z.object({
    color: z.string(),
    size: z.enum(['md', 'lg', 'xl']),
    place: z.enum(['below', 'on-photo']),
    align: z.enum(['left', 'center', 'right']),
    fromTo: z.boolean(),
    badge: z.boolean(),
  }).optional(),
})

type EditionFormData = z.infer<typeof editionSchema>

/* Formulário da "edição geral" do tabloide — compartilhado entre admin
   (`/admin/tabloides`, pode criar/editar) e portal do associado
   (`/portal/produtos`, cria com informações básicas ou edita a edição já
   selecionada — o RLS de `tabloid_editions` permite insert/update pra
   qualquer autenticado, só delete continua admin-only).
   `variant="associate"` esconde a imagem de cabeçalho ("topo") — isso é
   trabalho de designer feito depois no InDesign, não faz sentido o
   associado subir aqui — e cria a edição nova já como "open" (senão ela some
   da lista de edições abertas e o associado nem consegue continuar). */
export function EditionForm({ open, onClose, edition, queryKeyToInvalidate, variant = 'admin', onCreated }: {
  open: boolean
  onClose: () => void
  edition: TabloidEdition | null
  /** Query key invalidada depois de salvar — cada tela usa uma própria pra listar edições. */
  queryKeyToInvalidate: readonly unknown[]
  variant?: 'admin' | 'associate'
  /** Chamado com a edição recém-criada (só faz sentido quando `edition` era null) — o passo a passo do associado usa isso pra já navegar pra tela de produtos. */
  onCreated?: (edition: TabloidEdition) => void
}) {
  const qc = useQueryClient()
  const isEdit = !!edition
  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<EditionFormData>({
    resolver: zodResolver(editionSchema), defaultValues: { status: 'open' },
  })

  useEffect(() => {
    if (edition) {
      reset({
        name: edition.name,
        status: edition.status,
        submission_deadline: edition.submission_deadline ?? '',
        valid_from: edition.valid_from ?? '',
        valid_until: edition.valid_until ?? '',
        header_image_url: edition.header_image_url,
        generated_pdf_url: edition.generated_pdf_url ?? '',
        notes: edition.notes ?? '',
        max_products_per_page: edition.max_products_per_page ?? TABLOID_MAX_PRODUCTS_PER_PAGE,
        background_color: edition.background_color ?? DEFAULT_TABLOID_BACKGROUND,
        price_style: normalizePriceStyle(edition.price_style),
      })
    } else {
      // Sempre nasce "Aberta" (pro admin também, não só associado) — "Rascunho"
      // é praticamente uma cilada na criação: fica invisível pro portal e
      // Mario já criou um tabloide assim achando que ia aparecer pros
      // associados na hora. Quem quiser mesmo um rascunho troca no Status.
      reset({
        name: '', status: 'open', submission_deadline: '', valid_from: '', valid_until: '',
        header_image_url: null, generated_pdf_url: '', notes: '', max_products_per_page: TABLOID_MAX_PRODUCTS_PER_PAGE,
        background_color: DEFAULT_TABLOID_BACKGROUND,
        price_style: DEFAULT_TABLOID_PRICE_STYLE,
      })
    }
  }, [edition, reset, variant])

  const mutation = useMutation({
    mutationFn: async (data: EditionFormData): Promise<TabloidEdition | null> => {
      const payload = {
        ...data,
        submission_deadline: data.submission_deadline || null,
        valid_from: data.valid_from || null,
        valid_until: data.valid_until || null,
        generated_pdf_url: data.generated_pdf_url || null,
        notes: data.notes || null,
        max_products_per_page: data.max_products_per_page || TABLOID_MAX_PRODUCTS_PER_PAGE,
        background_color: data.background_color || DEFAULT_TABLOID_BACKGROUND,
        price_style: data.price_style || DEFAULT_TABLOID_PRICE_STYLE,
      }
      if (isEdit) {
        const { error } = await supabase.from('tabloid_editions').update(payload).eq('id', edition.id)
        if (error) throw error
        return null
      } else {
        const { data: created, error } = await supabase.from('tabloid_editions').insert(payload).select().single()
        if (error) throw error
        return created as TabloidEdition
      }
    },
    onSuccess: (created) => {
      qc.invalidateQueries({ queryKey: queryKeyToInvalidate })
      toast.success(isEdit ? 'Edição atualizada!' : 'Edição criada!')
      onClose()
      if (created) onCreated?.(created)
    },
    onError: (e: Error) => toast.error('Erro ao salvar edição', e.message),
  })

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Editar edição do tabloide' : 'Nova edição de tabloide'}
      size="lg"
      footer={<><Button variant="outline" onClick={onClose}>Cancelar</Button><Button loading={mutation.isPending} onClick={handleSubmit(d => mutation.mutate(d))}>{isEdit ? 'Salvar' : 'Criar edição'}</Button></>}
    >
      <form className="space-y-4">
        <Input label="Nome *" error={errors.name?.message} {...register('name')} placeholder="Tabloide Agosto 2026" />
        {variant === 'admin' && (
          <Select
            label="Status"
            options={editionStatusOptions}
            hint="Só edições Abertas aparecem pros associados continuarem em /portal/produtos."
            {...register('status')}
          />
        )}
        <Input label="Prazo de envio (associados)" type="date" {...register('submission_deadline')} />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Válido de" type="date" {...register('valid_from')} />
          <Input label="Válido até" type="date" {...register('valid_until')} />
        </div>
        {variant === 'admin' && (
          <>
            <ImageUpload
              label="Imagem de cabeçalho (21 x 8 cm — topo da página 1)"
              value={watch('header_image_url')}
              onChange={(url) => setValue('header_image_url', url)}
              folder="tabloide/headers"
              fit="contain"
              hint="Faixa 21 × 8 cm. Pode ser aproximado — o sistema ajusta. Ideal 2480 × 945 px em 300 dpi."
            />
            <Textarea
              label="URL do PDF gerado"
              rows={2}
              {...register('generated_pdf_url')}
              placeholder="Cole aqui o link depois que o tabloide for gerado"
            />
            <Input
              label="Limite de produtos por página"
              type="number"
              min={12}
              max={20}
              error={errors.max_products_per_page?.message}
              {...register('max_products_per_page')}
              hint="20 por página = 40 no tabloide. O associado precisa de no mínimo 24 produtos pra enviar. O layout estica os cards pra preencher a folha."
            />
          </>
        )}
        {variant === 'admin' && (
          <>
            <TabloidBackgroundPicker
              value={watch('background_color') || DEFAULT_TABLOID_BACKGROUND}
              onChange={(hex) => setValue('background_color', hex)}
            />
            <TabloidPriceStylePicker
              value={watch('price_style') || DEFAULT_TABLOID_PRICE_STYLE}
              onChange={(next) => setValue('price_style', next)}
            />
          </>
        )}
        <p className="text-xs text-gray-500 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">
          O rodapé (logo, contato, WhatsApp e letras miúdas) é montado à parte e só entra no verso — use o botão <span className="font-semibold">Rodapé</span> na lista de edições.
        </p>
        <Textarea
          label="Observações internas"
          rows={2}
          {...register('notes')}
          placeholder="Anotações pra equipe — não entra no material impresso"
          hint="Visível pra quem tiver acesso a essa tela (admin e associados)."
        />
      </form>
    </Modal>
  )
}
