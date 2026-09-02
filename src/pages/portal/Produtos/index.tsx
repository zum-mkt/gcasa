import { Fragment, useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Plus, Pencil, Trash2, Sparkles, AlertTriangle, X, Globe, Send, Paperclip, Settings,
  ArrowLeft, FileCheck2, Columns2, Clock, RotateCcw, Star, Check, ImagePlus, PartyPopper, Rocket, ListChecks,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { ImageUpload } from '@/components/admin/ImageUpload'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { ConfirmDialog } from '@/components/ui/Modal'
import { toast } from '@/components/ui/Toast'
import { parseTabloidText, type ParsedProductDraft } from '@/lib/tabloidTextParser'
import { extractTextFromFile, isSupportedProductListFile } from '@/lib/fileToProductText'
import { tabloidPlacementError } from '@/lib/tabloidErrors'
import { tabloidMaxPerPage, tabloidMaxTotal, tabloidMinTotal, clearOtherFeatured } from '@/lib/tabloidCapacity'
import { FooterBuilder } from '@/components/tabloide/FooterBuilder'
import {
  STORE_FOOTER_BLOCKS,
  fetchStoreLayout,
  mergeFooters,
  normalizeFooter,
  upsertStoreLayout,
  type TabloidFooter,
} from '@/lib/tabloidFooter'
import type { TabloidEdition, TabloidProduct, TabloidSubmission } from '@/types/models'

// ==============================================================
// Tipos, schema e helpers
// ==============================================================

interface ParsedDraft extends ParsedProductDraft {
  _id: string
}

/** Página automática no miolo DA LOJA (cada loja imprime o próprio tabloide).
 *  Divide os produtos dela 50/50 entre as duas páginas, respeitando o limite. */
function assignAutoPage(counts: { page1: number; page2: number }, max: number): 1 | 2 | null {
  const p1Open = counts.page1 < max
  const p2Open = counts.page2 < max
  if (p1Open && p2Open) return counts.page1 <= counts.page2 ? 1 : 2
  if (p1Open) return 1
  if (p2Open) return 2
  return null
}

/** Dedupe defensivo pro lote vindo da IA/parser local: se por acaso vier mais
 *  de um produto com `is_featured` na mesma página, mantém só o primeiro —
 *  o índice único do banco (`013_tabloid_featured_limit.sql`) não deixaria
 *  os dois entrarem mesmo, então é melhor já corrigir na revisão. */
function dedupeFeaturedPerPage<T extends { page: 1 | 2 | null; is_featured: boolean }>(items: T[]): T[] {
  const claimed = new Set<number>()
  return items.map((item) => {
    if (!item.is_featured || item.page == null) return item
    if (claimed.has(item.page)) return { ...item, is_featured: false }
    claimed.add(item.page)
    return item
  })
}

async function fetchOpenEditions(): Promise<TabloidEdition[]> {
  const { data, error } = await supabase
    .from('tabloid_editions')
    .select('*')
    .eq('status', 'open')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data as TabloidEdition[]
}

// Todos os PRÓPRIOS envios (de qualquer edição aberta) numa query só — usado
// tanto pra saber quem já está travado (tela de escolha) quanto pra achar o
// envio da edição atualmente aberta, sem precisar de uma query por edição.
async function fetchOwnSubmissions(associateId: string): Promise<TabloidSubmission[]> {
  const { data, error } = await supabase.from('tabloid_submissions').select('*').eq('associate_id', associateId)
  if (error) throw error
  return data as TabloidSubmission[]
}

async function fetchOwnProducts(associateId: string, editionId: string): Promise<TabloidProduct[]> {
  const { data, error } = await supabase
    .from('tabloid_products')
    .select('*')
    .eq('associate_id', associateId)
    .eq('edition_id', editionId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data as TabloidProduct[]
}

const schema = z.object({
  name: z.string().min(2, 'Nome obrigatório'),
  description: z.string().optional(),
  category: z.string().optional(),
  sku: z.string().optional(),
  unit: z.string().optional(),
  price: z.coerce.number().min(0).optional(),
  promo_price: z.coerce.number().min(0).optional(),
  payment_condition: z.string().optional(),
  image_url: z.string().nullable().optional(),
  is_featured: z.boolean().optional(),
})

type FormData = z.infer<typeof schema>

// Unidades comuns de material de construção — sugestão via datalist, mas o
// campo continua livre (associado pode digitar qualquer coisa que não esteja na lista).
const UNIT_OPTIONS = ['kg', 'g', 'm²', 'm', 'm³', 'un', 'peça', 'milheiro', 'saco', 'caixa', 'litro', 'dúzia', 'par', 'rolo', 'galão', 'fardo', 'kit']

/* Atalho manual pro Google Imagens — sem IA, sem custo, sem backend. O
   associado pesquisa, baixa a foto que quiser (ou tira print) e sobe pela
   caixa de upload normal logo acima. Fica a critério dele conferir se pode
   usar aquela imagem no encarte. */
function GoogleImagesSearchLink({ productName }: { productName: string }) {
  if (!productName.trim()) return null
  const url = `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(productName)}`
  return (
    <div className="space-y-1">
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-primary-600 hover:text-primary-700"
      >
        <Globe size={13} /> Buscar "{productName}" no Google Imagens
      </a>
      <p className="text-[11px] text-gray-400">
        Abre numa aba nova. Ache uma foto, baixe (ou tire print) e envie pela caixa acima — confira se pode usar antes de publicar no encarte.
      </p>
    </div>
  )
}

// ==============================================================
// Stepper — barra de progresso colorida no topo de cada passo
// ==============================================================

type StepperStage = 1 | 2 | 3 | 4 | 5

const STAGE_LABELS: { n: StepperStage; label: string }[] = [
  { n: 1, label: 'Criar' },
  { n: 2, label: 'Rodapé' },
  { n: 3, label: 'Produtos' },
  { n: 4, label: 'Revisar' },
  { n: 5, label: 'Enviado' },
]

function Stepper({ current }: { current: StepperStage }) {
  return (
    <div className="flex items-center justify-center gap-1.5 sm:gap-3 py-2">
      {STAGE_LABELS.map((s, i) => (
        <Fragment key={s.n}>
          <div className="flex flex-col items-center gap-1">
            <div
              className={`w-8 h-8 sm:w-11 sm:h-11 rounded-full flex items-center justify-center font-bold text-xs sm:text-base transition-colors flex-shrink-0 ${
                s.n < current
                  ? 'bg-primary-500 text-graphite-900'
                  : s.n === current
                    ? 'bg-primary-500 text-graphite-900 ring-4 ring-primary-100'
                    : 'bg-gray-100 text-gray-400'
              }`}
            >
              {s.n < current ? <Check size={16} /> : s.n}
            </div>
            <span className={`hidden sm:block text-[11px] font-medium ${s.n <= current ? 'text-graphite-700' : 'text-gray-400'}`}>{s.label}</span>
          </div>
          {i < STAGE_LABELS.length - 1 && (
            <div className={`w-5 sm:w-10 h-1 rounded-full flex-shrink-0 ${s.n < current ? 'bg-primary-400' : 'bg-gray-200'}`} />
          )}
        </Fragment>
      ))}
    </div>
  )
}

// ==============================================================
// Cartão de produto — lista da tela "Meus produtos"
// ==============================================================

function ProductCard({ p, onEdit, onDelete }: { p: TabloidProduct; onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="flex items-center gap-3 bg-white rounded-2xl shadow-card p-3">
      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-gray-100 flex-shrink-0 overflow-hidden flex items-center justify-center">
        {p.image_url ? (
          <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
        ) : (
          <ImagePlus size={20} className="text-gray-300" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-graphite-900 truncate">{p.name}</p>
        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
          {p.promo_price ? (
            <>
              <span className="line-through text-gray-400 text-xs">R$ {p.price?.toFixed(2)}</span>
              <span className="font-bold text-primary-600 text-sm">R$ {p.promo_price.toFixed(2)}</span>
            </>
          ) : (
            <span className="font-bold text-graphite-700 text-sm">{p.price ? `R$ ${p.price.toFixed(2)}` : 'Sem preço'}</span>
          )}
          {p.page && (
            <span className="inline-flex items-center rounded-full bg-gray-100 text-gray-600 text-[11px] font-semibold px-2 py-0.5">
              Pág. {p.page}
            </span>
          )}
          {p.is_featured && (
            <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-100 text-amber-700 text-[11px] font-semibold px-2 py-0.5">
              <Star size={10} fill="currentColor" /> Destaque
            </span>
          )}
        </div>
        {p.payment_condition && (
          <p className="text-[11px] text-gray-400 mt-0.5 truncate">{p.payment_condition}</p>
        )}
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        <Button variant="ghost" size="icon-sm" title="Editar" onClick={onEdit}>
          <Pencil size={16} />
        </Button>
        <Button variant="danger-ghost" size="icon-sm" title="Excluir" onClick={onDelete}>
          <Trash2 size={16} />
        </Button>
      </div>
    </div>
  )
}

// ==============================================================
// Passo: escolher — criar tabloide novo ou continuar um aberto
// ==============================================================

function ChooseStep({ editions, editionsLoading, ownSubmissions, onCreateNew, onSelectEdition }: {
  editions: TabloidEdition[]
  editionsLoading: boolean
  ownSubmissions: TabloidSubmission[]
  onCreateNew: () => void
  onSelectEdition: (id: string) => void
}) {
  const hasLaunched = !editionsLoading && editions.length > 0
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-graphite-900">
          {hasLaunched ? 'Qual tabloide você vai preencher?' : 'Vamos montar seu tabloide?'}
        </h1>
        <p className="text-sm text-graphite-500 mt-1">
          {hasLaunched
            ? 'O administrador já lançou — escolha um pra colocar os produtos da sua loja.'
            : 'Ainda não tem tabloide aberto. Você pode criar o seu pra começar.'}
        </p>
      </div>

      {editionsLoading ? (
        <div className="h-20 bg-gray-100 animate-pulse rounded-2xl" />
      ) : editions.length > 0 ? (
        <div className="space-y-2">
          {editions.map((e) => {
            const s = ownSubmissions.find((x) => x.edition_id === e.id)
            return (
              <button
                key={e.id}
                type="button"
                onClick={() => onSelectEdition(e.id)}
                className="w-full flex items-center gap-3 bg-white border border-gray-100 rounded-2xl p-4 text-left hover:border-primary-300 hover:shadow-card active:scale-[0.99] transition-all"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${s ? 'bg-green-50 text-green-600' : 'bg-primary-50 text-primary-700'}`}>
                  {s ? <FileCheck2 size={18} /> : <Clock size={18} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{e.name}</p>
                  <p className="text-xs text-gray-400">
                    {s
                      ? `Enviado em ${new Date(s.submitted_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })} — só visualização`
                      : e.submission_deadline
                        ? `Prazo de envio: ${new Date(`${e.submission_deadline}T00:00`).toLocaleDateString('pt-BR')}`
                        : 'Aberto pra receber produtos'}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      ) : (
        <button
          type="button"
          onClick={onCreateNew}
          className="w-full flex items-center gap-4 bg-primary-50 border-2 border-dashed border-primary-300 rounded-3xl p-6 text-left hover:bg-primary-100 active:scale-[0.99] transition-all"
        >
          <div className="w-14 h-14 rounded-full bg-primary-500 text-graphite-900 flex items-center justify-center flex-shrink-0">
            <Plus size={26} />
          </div>
          <div>
            <p className="font-bold text-graphite-900 text-lg">Criar novo tabloide</p>
            <p className="text-sm text-graphite-500">É rápido — só o nome pra começar.</p>
          </div>
        </button>
      )}

      {hasLaunched && (
        <button
          type="button"
          onClick={onCreateNew}
          className="w-full text-center text-sm text-gray-400 hover:text-graphite-700 py-2"
        >
          Ou criar um tabloide só da sua loja
        </button>
      )}
    </div>
  )
}

// ==============================================================
// Passo: informações do tabloide — nome, prazo, validade, rodapé...
// Serve tanto pra CRIAR (edition = null, antes de mexer em produto) quanto
// pra EDITAR depois (botão "Editar informações" na tela de produtos) — os
// dois casos ficam na própria página, sem janela.
// ==============================================================

const editionInfoSchema = z.object({
  name: z.string().min(2, 'Nome obrigatório'),
  submission_deadline: z.string().optional(),
  valid_from: z.string().optional(),
  valid_until: z.string().optional(),
  notes: z.string().optional(),
})
type EditionInfoData = z.infer<typeof editionInfoSchema>

function EditionInfoStep({ edition, onDone, onBack }: {
  edition: TabloidEdition | null
  onDone: (edition: TabloidEdition) => void
  onBack: () => void
}) {
  const qc = useQueryClient()
  const isEdit = !!edition
  const { register, handleSubmit, reset, formState: { errors } } = useForm<EditionInfoData>({
    resolver: zodResolver(editionInfoSchema),
  })

  useEffect(() => {
    if (edition) {
      reset({
        name: edition.name,
        submission_deadline: edition.submission_deadline ?? '',
        valid_from: edition.valid_from ?? '',
        valid_until: edition.valid_until ?? '',
        notes: edition.notes ?? '',
      })
    } else {
      reset({
        name: `Tabloide ${new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}`,
        submission_deadline: '', valid_from: '', valid_until: '', notes: '',
      })
    }
  }, [edition, reset])

  const mutation = useMutation({
    mutationFn: async (data: EditionInfoData): Promise<TabloidEdition> => {
      const payload = {
        name: data.name.trim(),
        submission_deadline: data.submission_deadline || null,
        valid_from: data.valid_from || null,
        valid_until: data.valid_until || null,
        notes: data.notes || null,
      }
      if (isEdit) {
        const { data: saved, error } = await supabase.from('tabloid_editions').update(payload).eq('id', edition.id).select().single()
        if (error) throw error
        return saved as TabloidEdition
      }
      const { data: created, error } = await supabase.from('tabloid_editions').insert({ ...payload, status: 'open' }).select().single()
      if (error) throw error
      return created as TabloidEdition
    },
    onSuccess: (saved) => {
      qc.invalidateQueries({ queryKey: ['portal-editions'] })
      toast.success(isEdit ? 'Informações salvas!' : 'Tabloide criado!', isEdit ? undefined : 'Agora monte o rodapé da página 2.')
      onDone(saved)
    },
    onError: (e: Error) => toast.error(isEdit ? 'Erro ao salvar' : 'Erro ao criar tabloide', e.message),
  })

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" leftIcon={<ArrowLeft size={14} />} onClick={onBack}>Voltar</Button>
      {!isEdit && <Stepper current={1} />}

      <div className="bg-white rounded-3xl shadow-card p-5 sm:p-8 max-w-lg mx-auto space-y-5">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center mx-auto mb-3">
            <Sparkles size={28} />
          </div>
          <h1 className="text-xl font-bold text-graphite-900">{isEdit ? 'Informações do tabloide' : 'Vamos começar seu tabloide!'}</h1>
          <p className="text-sm text-graphite-500 mt-1">
            {isEdit ? 'Ajuste o que precisar.' : 'Preencha essas informações antes de adicionar os produtos — dá pra ajustar depois também.'}
          </p>
        </div>

        <form className="space-y-4">
          <Input
            label="Nome do tabloide *"
            error={errors.name?.message}
            {...register('name')}
            placeholder="Ex: Tabloide de Agosto"
            className="text-base h-12"
          />
          <Input
            label="Prazo de envio dos produtos"
            type="date"
            hint="Até quando as lojas podem enviar produtos pra esse tabloide."
            {...register('submission_deadline')}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Válido de" type="date" {...register('valid_from')} />
            <Input label="Válido até" type="date" {...register('valid_until')} />
          </div>
          <Textarea
            label="Observações internas"
            rows={2}
            {...register('notes')}
            placeholder="Anotações pra equipe — não entra no material impresso"
            hint="Visível só pra quem tem acesso a essa tela."
          />
        </form>

        <Button
          size="lg"
          className="w-full text-base"
          leftIcon={isEdit ? <Check size={18} /> : <Plus size={18} />}
          loading={mutation.isPending}
          onClick={handleSubmit((d) => mutation.mutate(d))}
        >
          {isEdit ? 'Salvar alterações' : 'Criar e montar o rodapé'}
        </Button>
      </div>
    </div>
  )
}

function FooterStep({ editionId, associateId, campaignFooter, onBack, onDone }: {
  editionId: string
  associateId: string
  campaignFooter: TabloidFooter
  onBack: () => void
  onDone: () => void
}) {
  const qc = useQueryClient()
  const { data: layout } = useQuery({
    queryKey: ['portal-store-layout', editionId, associateId],
    queryFn: () => fetchStoreLayout(editionId, associateId),
  })
  const [footer, setFooter] = useState<TabloidFooter>(normalizeFooter(null))
  useEffect(() => {
    if (layout) setFooter(layout.footer)
  }, [layout])

  const save = useMutation({
    mutationFn: async (next: TabloidFooter) => {
      await upsertStoreLayout(editionId, associateId, { footer: next })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['portal-store-layout'] }),
    onError: (e: Error) => toast.error('Erro ao salvar rodapé', e.message),
  })

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" leftIcon={<ArrowLeft size={14} />} onClick={onBack}>Voltar</Button>
      <Stepper current={2} />
      <div className="text-center">
        <h1 className="text-2xl font-bold text-graphite-900">Dados da sua loja no verso</h1>
        <p className="text-sm text-graphite-500 mt-1">
          Logo, telefone e WhatsApp da sua loja. Selo GCasa e letras miúdas já vêm do tema.
        </p>
      </div>
      <FooterBuilder
        value={footer}
        previewFooter={mergeFooters(campaignFooter, footer)}
        visibleBlocks={STORE_FOOTER_BLOCKS}
        onChange={(next) => {
          setFooter(next)
          save.mutate(next)
        }}
      />
      <Button size="lg" className="w-full text-base" onClick={onDone}>
        Continuar para os produtos
      </Button>
    </div>
  )
}

// ==============================================================
// Passo: adicionar/editar produto — página inteira, sem modal
// ==============================================================

function AddProductStep({ product, editionId, associateId, takenFeaturedPages, pageCounts, maxProductsPerPage, onDone, onCancel }: {
  product: TabloidProduct | null
  editionId: string
  associateId: string
  takenFeaturedPages: number[]
  pageCounts: { page1: number; page2: number }
  maxProductsPerPage: number
  onDone: () => void
  onCancel: () => void
}) {
  const qc = useQueryClient()
  const isEdit = !!product
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  // Página é automática: produto existente mantém a página que já tinha;
  // produto novo entra na página com menos produtos na edição inteira (fica
  // sempre o mais equilibrado possível, 50/50 — ou o mais perto disso dentro
  // do limite por página). O associado não escolhe mais isso.
  const effectivePage = product ? (product.page ?? assignAutoPage(pageCounts, maxProductsPerPage)) : assignAutoPage(pageCounts, maxProductsPerPage)
  // Se o próprio produto já é o destaque dessa página, a página não conta
  // como "ocupada" pra ele — senão ele nunca mais conseguiria desmarcar/editar.
  useEffect(() => {
    if (product) {
      reset({
        name: product.name,
        description: product.description ?? '',
        category: product.category ?? '',
        sku: product.sku ?? '',
        unit: product.unit ?? '',
        price: product.price ?? undefined,
        promo_price: product.promo_price ?? undefined,
        payment_condition: product.payment_condition ?? '',
        image_url: product.image_url,
        is_featured: product.is_featured ?? false,
      })
    } else {
      reset({ name: '', description: '', category: '', sku: '', unit: '', payment_condition: '', image_url: null, is_featured: false })
    }
  }, [product, reset])

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (!isEdit && effectivePage == null) {
        throw new Error('tabloid_page_capacity_exceeded')
      }
      const featured = data.is_featured ?? false
      if (featured) {
        await clearOtherFeatured({
          editionId,
          associateId,
          page: effectivePage,
          keepId: product?.id,
        })
      }
      const payload = {
        ...data,
        price: data.price ?? null,
        promo_price: data.promo_price ?? null,
        page: effectivePage,
        is_featured: featured,
        edition_id: editionId,
        associate_id: associateId,
      }
      if (isEdit) {
        const { error } = await supabase.from('tabloid_products').update(payload).eq('id', product.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('tabloid_products').insert({ ...payload, status: 'pending' })
        if (error) throw error
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['portal-products'] })
      qc.invalidateQueries({ queryKey: ['tabloid-taken-featured-pages', editionId] })
      qc.invalidateQueries({ queryKey: ['tabloid-page-counts', editionId] })
      toast.success(isEdit ? 'Produto atualizado!' : 'Produto adicionado!')
      onDone()
    },
    onError: (e: Error) => {
      const friendly = tabloidPlacementError(e as { code?: string; message?: string })
      if (friendly) toast.error(friendly.title, friendly.description)
      else toast.error('Erro ao salvar produto', e.message)
    },
  })

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" leftIcon={<ArrowLeft size={14} />} onClick={onCancel}>Voltar pros meus produtos</Button>
      <Stepper current={3} />

      <div className="bg-white rounded-3xl shadow-card p-5 sm:p-8 max-w-2xl mx-auto space-y-5">
        <div className="text-center">
          <h1 className="text-xl font-bold text-graphite-900">{isEdit ? 'Editar produto' : 'Novo produto'}</h1>
          <p className="text-sm text-graphite-500 mt-1">{isEdit ? 'Ajuste o que precisar.' : 'Preencha os dados — foto e preço ajudam a vender mais!'}</p>
        </div>

        <form className="space-y-5">
          <div className="space-y-2 bg-gray-50 rounded-2xl p-4">
            <ImageUpload
              label="📷 Foto do produto"
              value={watch('image_url')}
              onChange={(url) => setValue('image_url', url)}
              folder="tabloide/produtos"
            />
            <GoogleImagesSearchLink productName={watch('name') ?? ''} />
          </div>

          <Input label="Nome do produto *" error={errors.name?.message} {...register('name')} placeholder="Ex: Tinta acrílica 18L" className="text-base h-12" />

          <div className="grid grid-cols-2 gap-4">
            <Input label="Preço (R$)" type="number" step="0.01" {...register('price')} placeholder="199,90" className="text-base h-12" />
            <Input label="Preço promocional (R$)" type="number" step="0.01" {...register('promo_price')} placeholder="149,90" className="text-base h-12" />
          </div>
          <Input
            label="Condição de pagamento"
            {...register('payment_condition')}
            placeholder="Ex: 3x de R$ 66,63 sem juros, ou à vista com 5% OFF"
            hint="Opcional — como o cliente pode pagar (à vista, parcelado, com desconto...)."
          />

          <Input label="Categoria" {...register('category')} placeholder="Ex: Tintas" />
          <Textarea label="Descrição" rows={2} {...register('description')} placeholder="Detalhes do produto..." />

          <div className="grid grid-cols-2 gap-4">
            <Input label="SKU" {...register('sku')} placeholder="Opcional" />
            <div>
              <Input label="Unidade" list="unit-options" {...register('unit')} placeholder="Ex: kg, m², un" />
              <datalist id="unit-options">
                {UNIT_OPTIONS.map((u) => <option key={u} value={u} />)}
              </datalist>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 items-start">
            <div>
              <p className="text-sm font-medium text-gray-700 mb-1.5">Página</p>
              <div className="h-11 px-3 flex items-center gap-1.5 border border-primary-200 bg-primary-50 rounded-lg text-sm font-semibold text-primary-700">
                <Columns2 size={14} />
                {effectivePage ? `Página ${effectivePage}` : 'Sem espaço — edição cheia'}
              </div>
              <p className="text-[11px] text-gray-400 mt-1">Escolhida automaticamente pra equilibrar as duas páginas.</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 mb-1.5">Destaque?</p>
              <label className="h-11 px-3 flex items-center gap-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-amber-50 transition-colors">
                <input
                  type="checkbox"
                  {...register('is_featured')}
                  className="rounded border-gray-300"
                />
                <Star size={14} className="text-amber-500" />
                <span className="text-sm">Sim, é destaque</span>
              </label>
              <p className="text-[11px] text-gray-400 mt-1">
                Só 1 destaque por página. Se já tiver outro, ele deixa de ser destaque.
              </p>
            </div>
          </div>
        </form>

        <div className="flex flex-col sm:flex-row gap-2 pt-2">
          <Button variant="outline" size="lg" className="sm:order-1 order-2" onClick={onCancel}>Cancelar</Button>
          <Button
            size="lg"
            className="flex-1 text-base sm:order-2 order-1"
            loading={mutation.isPending}
            disabled={!isEdit && effectivePage == null}
            onClick={handleSubmit((d) => mutation.mutate(d))}
          >
            {isEdit ? 'Salvar alterações' : 'Adicionar produto'}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ==============================================================
// Passo: colar lista (IA) — página inteira, sem modal
// ==============================================================

function PasteListStep({ editionId, associateId, takenFeaturedPages, pageCounts, maxProductsPerPage, onDone, onCancel }: {
  editionId: string
  associateId: string
  takenFeaturedPages: number[]
  pageCounts: { page1: number; page2: number }
  maxProductsPerPage: number
  onDone: () => void
  onCancel: () => void
}) {
  const qc = useQueryClient()
  const [text, setText] = useState('')
  const [drafts, setDrafts] = useState<ParsedDraft[] | null>(null)
  const [extracting, setExtracting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    if (!isSupportedProductListFile(file)) {
      toast.error('Formato não suportado', 'Use planilha (.xlsx, .xls, .csv), Word (.docx) ou texto (.txt).')
      return
    }
    setExtracting(true)
    try {
      const extracted = await extractTextFromFile(file)
      if (!extracted.trim()) {
        toast.error('Não achei texto nesse arquivo', 'Confira se a planilha/documento tem conteúdo na primeira aba/página.')
        return
      }
      setText((prev) => (prev.trim() ? `${prev}\n${extracted}` : extracted))
      toast.success('Arquivo lido!', 'Confira o texto abaixo e toque em "Analisar com IA".')
    } catch (e) {
      toast.error('Erro ao ler o arquivo', (e as Error).message)
    } finally {
      setExtracting(false)
    }
  }

  const analyzeMutation = useMutation({
    mutationFn: async (): Promise<{ products: Omit<ParsedDraft, '_id'>[]; usedFallback: boolean; reason?: string }> => {
      try {
        const { data: result, error } = await supabase.functions.invoke('parse-tabloid-products', { body: { text } })
        if (error) throw error
        if (result?.error) throw new Error(result.error)
        // A IA não tem como saber a foto — cada produto sai sem imagem, o
        // associado anexa (ou não) na revisão logo abaixo.
        const products = (result.products as Omit<ParsedDraft, '_id' | 'image_url'>[]).map((p) => ({ ...p, image_url: null }))
        return { products, usedFallback: false }
      } catch (e) {
        // IA indisponível — não trava o associado, cai pro parser local. Mas
        // guarda o motivo real: sem isso, todo erro da IA (modelo aposentado,
        // chave sem cota) vira "não entendeu minha lista" e ninguém percebe o
        // que de fato quebrou.
        const reason = e instanceof Error ? e.message : String(e)
        console.warn('[parse-tabloid-products] IA falhou, caindo no parser local:', reason)
        return { products: parseTabloidText(text), usedFallback: true, reason }
      }
    },
    onSuccess: ({ products, usedFallback, reason }) => {
      if (usedFallback) {
        toast.error(
          'IA indisponível no momento',
          [
            products.length > 0
              ? 'Usei uma leitura mais simples da lista — confira os produtos com atenção.'
              : 'E a leitura simples também não achou produtos. Confira se cada preço tem "R$" na frente, ou tente de novo em instantes.',
            reason ? `(detalhe técnico: ${reason})` : null,
          ].filter(Boolean).join(' '),
        )
      } else if (products.length === 0) {
        toast.error('Nenhum produto identificado', 'Tente colar em linhas mais separadas, uma por produto.')
      }
      if (products.length > 0) {
        // Página é automática (ignora qualquer sugestão da IA/parser local):
        // distribui o lote inteiro em ordem, sempre pra página com menos
        // produtos no momento — 50/50 dentro do limite por página. Só fica
        // sem página se as duas já estiverem cheias; nesse caso o extra
        // nem entra no rascunho (máximo 40 no tabloide).
        const remaining = Math.max(0, tabloidMaxTotal(maxProductsPerPage) - pageCounts.page1 - pageCounts.page2)
        const incoming = remaining < products.length ? products.slice(0, remaining) : products
        if (incoming.length < products.length) {
          toast.error(
            `Só cabem mais ${remaining} produto${remaining === 1 ? '' : 's'}`,
            `O tabloide tem no máximo ${tabloidMaxTotal(maxProductsPerPage)} produtos (${maxProductsPerPage} por página). Os demais ficaram de fora.`,
          )
        }
        if (incoming.length === 0) {
          toast.error('Tabloide já está no máximo', `São ${tabloidMaxTotal(maxProductsPerPage)} produtos no total.`)
          return
        }
        let count1 = pageCounts.page1
        let count2 = pageCounts.page2
        const withAutoPages = incoming.map((p) => {
          const page = assignAutoPage({ page1: count1, page2: count2 }, maxProductsPerPage)
          if (page === 1) count1++
          else if (page === 2) count2++
          return { ...p, page }
        })
        // Corrige de saída qualquer destaque duplicado na mesma página (raro,
        // mas a IA/parser local não sabe da regra "1 por página") e limpa
        // destaque em página que outro associado já ocupou nessa edição.
        const adjusted = dedupeFeaturedPerPage(withAutoPages).map((p) =>
          p.is_featured && p.page != null && takenFeaturedPages.includes(p.page) ? { ...p, is_featured: false } : p
        )
        setDrafts(adjusted.map((p) => ({ ...p, _id: crypto.randomUUID() })))
      }
    },
  })

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!drafts || drafts.length === 0) return
      const featuredPages = new Set(
        drafts.filter((d) => d.is_featured && (d.page === 1 || d.page === 2)).map((d) => d.page as 1 | 2),
      )
      for (const page of featuredPages) {
        await clearOtherFeatured({ editionId, associateId, page })
      }
      const payload = drafts.map((d) => ({
        edition_id: editionId,
        associate_id: associateId,
        name: d.name,
        description: d.description || null,
        category: d.category || null,
        unit: d.unit || null,
        price: d.price ?? null,
        promo_price: d.promo_price ?? null,
        payment_condition: d.payment_condition || null,
        image_url: d.image_url ?? null,
        page: d.page ?? null,
        is_featured: d.is_featured,
        status: 'pending' as const,
      }))
      const { error } = await supabase.from('tabloid_products').insert(payload)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['portal-products'] })
      qc.invalidateQueries({ queryKey: ['tabloid-taken-featured-pages', editionId] })
      qc.invalidateQueries({ queryKey: ['tabloid-page-counts', editionId] })
      toast.success(`${drafts?.length ?? 0} produto(s) adicionado(s)!`)
      onDone()
    },
    onError: (e: Error) => {
      const friendly = tabloidPlacementError(e as { code?: string; message?: string })
      if (friendly) toast.error(friendly.title, friendly.description)
      else toast.error('Erro ao enviar produtos', e.message)
    },
  })

  /** Destaque bloqueado pra esse rascunho: sem página, página já ocupada por
   *  outro associado (RPC), ou outro rascunho do MESMO lote já marcado
   *  destaque na mesma página — só 1 por página, mesma regra do banco. */
  const isDraftFeaturedBlocked = (d: ParsedDraft) =>
    d.page == null ||
    takenFeaturedPages.includes(d.page) ||
    (drafts ?? []).some((o) => o._id !== d._id && o.page === d.page && o.is_featured)

  const updateDraft = (id: string, patch: Partial<ParsedDraft>) => {
    setDrafts((prev) => prev?.map((d) => (d._id === id ? { ...d, ...patch } : d)) ?? null)
  }

  const removeDraft = (id: string) => {
    setDrafts((prev) => prev?.filter((d) => d._id !== id) ?? null)
  }

  // Só fica sem página se as duas já bateram no limite (`assignAutoPage`) —
  // não tem mais "esqueceu de escolher", é automático.
  const missingPage = (drafts ?? []).some((d) => d.page == null)

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" leftIcon={<ArrowLeft size={14} />} onClick={onCancel}>Voltar pros meus produtos</Button>
      <Stepper current={3} />

      <div className="bg-white rounded-3xl shadow-card p-5 sm:p-8 max-w-2xl mx-auto space-y-5">
        <div className="text-center">
          <h1 className="text-xl font-bold text-graphite-900">Colar lista de produtos</h1>
          <p className="text-sm text-graphite-500 mt-1">Cole o texto de uma vez — a gente identifica os produtos pra você.</p>
        </div>

        {!drafts ? (
          <div className="space-y-3">
            <Textarea
              label="Cole a lista de produtos"
              rows={10}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={'Ex:\nCimento 50kg 60 reais\nTinta Suvinil 18L de R$ 259,90 por R$ 199,90\nPiso Eucatex 60 reais o metro'}
            />
            <p className="text-xs text-graphite-400">
              Pode escrever livre — "R$", "reais", "de X por Y", "% de desconto", tudo bem. Uma linha por produto. Depois de analisar, você confere cada um antes de enviar.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <div className="h-px flex-1 bg-gray-100" />
              <span className="text-xs text-graphite-400">ou</span>
              <div className="h-px flex-1 bg-gray-100" />
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv,.docx,.txt"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = '' }}
            />
            <Button
              type="button"
              variant="outline"
              leftIcon={<Paperclip size={15} />}
              loading={extracting}
              onClick={() => fileInputRef.current?.click()}
            >
              Anexar planilha ou documento
            </Button>
            <p className="text-[11px] text-graphite-400">
              Aceita Excel (.xlsx, .xls), CSV, Word (.docx) ou texto (.txt).
            </p>

            <div className="flex flex-col sm:flex-row gap-2 pt-3">
              <Button variant="outline" size="lg" className="sm:order-1 order-2" onClick={onCancel}>Cancelar</Button>
              <Button
                size="lg"
                className="flex-1 text-base sm:order-2 order-1"
                leftIcon={<Sparkles size={18} />}
                loading={analyzeMutation.isPending}
                disabled={!text.trim()}
                onClick={() => analyzeMutation.mutate()}
              >
                Analisar com IA
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <datalist id="unit-options">
              {UNIT_OPTIONS.map((u) => <option key={u} value={u} />)}
            </datalist>
            {missingPage && (
              <p className="flex items-center gap-1.5 text-xs text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                <AlertTriangle size={13} className="flex-shrink-0" /> Tabloide já está no máximo ({tabloidMaxTotal(maxProductsPerPage)} produtos). Remova alguns itens antes de enviar.
              </p>
            )}
            <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
              {drafts.map((d) => (
                <div key={d._id} className="border border-gray-100 rounded-xl p-3 space-y-3 bg-white">
                  <div className="flex items-start gap-3">
                    <div className="w-24 flex-shrink-0">
                      <ImageUpload
                        value={d.image_url}
                        onChange={(url) => updateDraft(d._id, { image_url: url })}
                        folder="tabloide/produtos"
                      />
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-start gap-2">
                        <Input
                          value={d.name}
                          onChange={(e) => updateDraft(d._id, { name: e.target.value })}
                          className="font-medium"
                        />
                        <Button variant="ghost" size="icon-sm" title="Remover" onClick={() => removeDraft(d._id)}>
                          <X size={14} />
                        </Button>
                      </div>
                      <p className="text-xs text-graphite-400 truncate" title={d.source_line}>« {d.source_line} »</p>
                      {d.note && (
                        <p className="flex items-center gap-1 text-xs text-amber-600">
                          <AlertTriangle size={12} /> {d.note}
                        </p>
                      )}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                        <Input
                          label="Categoria"
                          value={d.category ?? ''}
                          onChange={(e) => updateDraft(d._id, { category: e.target.value || null })}
                          placeholder="Ex: Tintas"
                        />
                        <Input
                          label="Preço"
                          type="number" step="0.01"
                          value={d.price ?? ''}
                          onChange={(e) => updateDraft(d._id, { price: e.target.value ? Number(e.target.value) : null })}
                        />
                        <Input
                          label="Preço promo"
                          type="number" step="0.01"
                          value={d.promo_price ?? ''}
                          onChange={(e) => updateDraft(d._id, { promo_price: e.target.value ? Number(e.target.value) : null })}
                        />
                        <Input
                          label="Unidade"
                          list="unit-options"
                          value={d.unit ?? ''}
                          onChange={(e) => updateDraft(d._id, { unit: e.target.value || null })}
                          placeholder="kg, m², un..."
                        />
                        <div>
                          <p className="block text-sm font-medium text-gray-700 mb-1.5">Página</p>
                          <div className={`h-[42px] px-3 flex items-center border rounded-lg text-sm ${
                            d.page == null ? 'border-red-200 bg-red-50 text-red-600' : 'border-primary-200 bg-primary-50 text-primary-700 font-semibold'
                          }`}>
                            {d.page ? `Página ${d.page}` : 'Sem espaço'}
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">Destaque</label>
                          <label className={`flex items-center gap-1.5 h-[42px] px-3 border rounded-lg transition-colors ${
                            isDraftFeaturedBlocked(d) && !d.is_featured
                              ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
                              : 'border-gray-300 cursor-pointer hover:bg-amber-50'
                          }`}>
                            <input
                              type="checkbox"
                              checked={d.is_featured}
                              disabled={isDraftFeaturedBlocked(d) && !d.is_featured}
                              onChange={(e) => updateDraft(d._id, { is_featured: e.target.checked })}
                              className="rounded border-gray-300"
                            />
                            <Star size={13} className="text-amber-500" />
                            <span className="text-sm text-gray-700">Sim</span>
                          </label>
                        </div>
                        <div className="col-span-2 sm:col-span-3">
                          <Input
                            label="Condição de pagamento"
                            value={d.payment_condition ?? ''}
                            onChange={(e) => updateDraft(d._id, { payment_condition: e.target.value || null })}
                            placeholder="Ex: 3x sem juros, à vista com 5% OFF"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {drafts.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-6">Todos os produtos foram removidos. Volte e cole a lista de novo.</p>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <Button variant="outline" size="lg" className="sm:order-1 order-2" onClick={() => setDrafts(null)}>Voltar</Button>
              <Button
                size="lg"
                className="flex-1 text-base sm:order-2 order-1"
                loading={submitMutation.isPending}
                disabled={drafts.length === 0 || missingPage}
                title={missingPage ? 'As duas páginas já atingiram o limite — remova alguns produtos antes de enviar' : undefined}
                onClick={() => submitMutation.mutate()}
              >
                Adicionar {drafts.length} produto{drafts.length !== 1 ? 's' : ''}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ==============================================================
// Passo: meus produtos — hub central do tabloide em andamento
// ==============================================================

function ProductsHomeStep({
  currentEdition, products, isLoading, pageCounts, maxProductsPerPage, canDeleteEdition, footerIncomplete,
  onAddProduct, onEditProduct, onDeleteProduct, onPasteList, onReviewSubmit, onEditSettings, onEditFooter, onDeleteEdition, onBack, onBulkDelete,
}: {
  currentEdition: TabloidEdition | null
  products: TabloidProduct[]
  isLoading: boolean
  pageCounts: { page1: number; page2: number }
  maxProductsPerPage: number
  canDeleteEdition: boolean
  onAddProduct: () => void
  onEditProduct: (p: TabloidProduct) => void
  onDeleteProduct: (id: string) => void
  onPasteList: () => void
  onReviewSubmit: () => void
  onEditSettings: () => void
  onEditFooter: () => void
  onDeleteEdition: () => void
  onBack: () => void
  onBulkDelete: () => void
  footerIncomplete: boolean
}) {
  const bothPagesFull = pageCounts.page1 >= maxProductsPerPage && pageCounts.page2 >= maxProductsPerPage
  const minTotal = tabloidMinTotal(maxProductsPerPage)
  const maxTotal = tabloidMaxTotal(maxProductsPerPage)
  const missingMin = Math.max(0, minTotal - products.length)
  const canSubmit = products.length >= minTotal

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" leftIcon={<ArrowLeft size={14} />} onClick={onBack}>Voltar</Button>
      <Stepper current={3} />

      <div className="text-center">
        <h1 className="text-2xl font-bold text-graphite-900">{currentEdition?.name ?? 'Meus produtos'}</h1>
        <p className="text-sm text-graphite-500 mt-1">
          {products.length === 0
            ? `Toque no botão abaixo pra adicionar o primeiro produto! Precisa de ${minTotal} no mínimo (${maxTotal} no máximo).`
            : missingMin > 0
              ? `${products.length} de ${minTotal} no mínimo — faltam ${missingMin}.`
              : products.length >= maxTotal
                ? `Tabloide cheio (${products.length}/${maxTotal}).`
                : `${products.length} produtos — já pode enviar (máximo ${maxTotal}).`}
        </p>
      </div>

      {footerIncomplete && (
        <button
          type="button"
          onClick={onEditFooter}
          className="w-full flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4 text-left hover:bg-amber-100"
        >
          <AlertTriangle size={18} className="text-amber-600 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-amber-900 text-sm">Rodapé da página 2 ainda está incompleto</p>
            <p className="text-xs text-amber-700">Logo, telefone, WhatsApp e letras miúdas — toque pra montar agora.</p>
          </div>
        </button>
      )}

      <button
        type="button"
        onClick={onAddProduct}
        disabled={bothPagesFull}
        className="w-full flex items-center gap-4 bg-primary-50 border-2 border-dashed border-primary-300 rounded-3xl p-5 sm:p-6 text-left hover:bg-primary-100 active:scale-[0.99] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-primary-500 text-graphite-900 flex items-center justify-center flex-shrink-0">
          <Plus size={24} />
        </div>
        <div>
          <p className="font-bold text-graphite-900 text-base sm:text-lg">Adicionar produto</p>
          <p className="text-xs sm:text-sm text-graphite-500">Foto, nome e preço — um de cada vez.</p>
        </div>
      </button>

      <div className="flex items-center justify-center">
        <button
          type="button"
          onClick={onPasteList}
          disabled={bothPagesFull}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:text-primary-700 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Sparkles size={14} /> Ou cole uma lista de produtos de uma vez (IA)
        </button>
      </div>

      {currentEdition && (
        <div className="flex items-center gap-2 bg-white border border-gray-100 rounded-2xl px-4 py-3 text-sm flex-wrap justify-center">
          <Columns2 size={15} className="text-gray-400 flex-shrink-0" />
          <span className="font-medium text-gray-700">Página 1: {pageCounts.page1}/{maxProductsPerPage}</span>
          <span className="text-gray-300">·</span>
          <span className="font-medium text-gray-700">Página 2: {pageCounts.page2}/{maxProductsPerPage}</span>
          <span className="text-gray-400 text-xs">({products.length}/{maxTotal} · mín. {minTotal})</span>
        </div>
      )}
      {bothPagesFull && (
        <p className="flex items-center justify-center gap-1.5 text-red-600 text-xs">
          <AlertTriangle size={13} /> Tabloide cheio ({maxTotal} produtos) — pra incluir outro, apague algum.
        </p>
      )}
      {missingMin > 0 && products.length > 0 && (
        <p className="flex items-center justify-center gap-1.5 text-amber-700 text-xs">
          <AlertTriangle size={13} /> Mínimo {minTotal} produtos no tabloide pra enviar pra produção.
        </p>
      )}

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <div key={i} className="h-20 bg-gray-100 animate-pulse rounded-2xl" />)}
        </div>
      ) : products.length > 0 && (
        <div className="space-y-2">
          {products.map((p) => (
            <ProductCard key={p.id} p={p} onEdit={() => onEditProduct(p)} onDelete={() => onDeleteProduct(p.id)} />
          ))}
        </div>
      )}

      {products.length > 0 && (
        <Button
          size="lg"
          className="w-full text-base"
          leftIcon={<ListChecks size={18} />}
          disabled={!canSubmit}
          onClick={onReviewSubmit}
        >
          {canSubmit ? 'Terminei! Revisar e enviar' : `Faltam ${missingMin} produto${missingMin === 1 ? '' : 's'} (mínimo ${minTotal})`}
        </Button>
      )}

      <div className="flex items-center justify-center gap-4 flex-wrap pt-2">
        <button type="button" onClick={onEditSettings} className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600">
          <Settings size={13} /> Editar informações do tabloide
        </button>
        <button type="button" onClick={onEditFooter} className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600">
          <Settings size={13} /> Montar rodapé (página 2)
        </button>
        {products.length > 0 && (
          <button type="button" onClick={onBulkDelete} className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-600">
            <Trash2 size={13} /> Apagar todos os produtos
          </button>
        )}
        {canDeleteEdition && (
          <button type="button" onClick={onDeleteEdition} className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-600">
            <Trash2 size={13} /> Excluir tabloide
          </button>
        )}
      </div>
    </div>
  )
}

// ==============================================================
// Passo: revisar e enviar
// ==============================================================

function ReviewSubmitStep({ currentEdition, products, onBack, onSubmit, submitting }: {
  currentEdition: TabloidEdition | null
  products: TabloidProduct[]
  onBack: () => void
  onSubmit: () => void
  submitting: boolean
}) {
  const maxPerPage = tabloidMaxPerPage(currentEdition?.max_products_per_page)
  const minTotal = tabloidMinTotal(maxPerPage)
  const maxTotal = tabloidMaxTotal(maxPerPage)
  const missingMin = Math.max(0, minTotal - products.length)
  const canSubmit = products.length >= minTotal

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" leftIcon={<ArrowLeft size={14} />} onClick={onBack}>Voltar e editar</Button>
      <Stepper current={4} />

      <div className="text-center">
        <h1 className="text-2xl font-bold text-graphite-900">Confira antes de enviar</h1>
        <p className="text-sm text-graphite-500 mt-1">
          {currentEdition?.name} — {products.length} produto{products.length !== 1 ? 's' : ''}
          {` (${minTotal}–${maxTotal})`}
        </p>
      </div>

      <div className="space-y-2">
        {products.map((p) => (
          <div key={p.id} className="flex items-center gap-3 bg-white rounded-2xl shadow-card p-3">
            <div className="w-12 h-12 rounded-xl bg-gray-100 flex-shrink-0 overflow-hidden flex items-center justify-center">
              {p.image_url ? <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" /> : <ImagePlus size={16} className="text-gray-300" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-graphite-900 text-sm truncate">{p.name}</p>
              <p className="text-xs text-gray-400">{p.category || 'Sem categoria'} · Página {p.page ?? '—'}</p>
            </div>
            <span className="font-bold text-sm text-graphite-700 flex-shrink-0">
              {(p.promo_price ?? p.price) ? `R$ ${(p.promo_price ?? p.price)!.toFixed(2)}` : '—'}
            </span>
          </div>
        ))}
      </div>

      <div className="bg-primary-50 border-2 border-primary-200 rounded-3xl p-6 text-center space-y-3 max-w-lg mx-auto">
        <div className="w-14 h-14 rounded-full bg-primary-500 text-graphite-900 flex items-center justify-center mx-auto">
          <Rocket size={26} />
        </div>
        <p className="text-sm text-graphite-700">
          Depois de enviado, o tabloide fica travado e vai pra produção. Se precisar mudar alguma coisa, você pede ao administrador — ele vê se ainda dá tempo e, se der, libera de novo.
        </p>
        {missingMin > 0 && (
          <p className="text-xs text-amber-700">Faltam {missingMin} produto{missingMin === 1 ? '' : 's'} — mínimo {minTotal} no tabloide.</p>
        )}
        <Button size="lg" className="w-full text-base" leftIcon={<Send size={18} />} loading={submitting} disabled={!canSubmit} onClick={onSubmit}>
          Enviar tabloide pra produção
        </Button>
      </div>
    </div>
  )
}

// ==============================================================
// Passo: tabloide enviado — vira um "arquivo"
// ==============================================================

function LockedStep({ currentEdition, submission, onCreateNew, onRequestUnlock, onBack }: {
  currentEdition: TabloidEdition | null
  submission: TabloidSubmission | null
  onCreateNew: () => void
  onRequestUnlock: () => void
  onBack: () => void
}) {
  const waiting = !!submission?.unlock_requested_at
  return (
    <div className="space-y-4 max-w-lg mx-auto">
      <Button variant="ghost" size="sm" leftIcon={<ArrowLeft size={14} />} onClick={onBack}>Voltar</Button>
      <Stepper current={5} />

      <div className="bg-white rounded-3xl shadow-card p-6 sm:p-8 text-center space-y-3">
        <div className="w-16 h-16 rounded-full bg-green-50 text-green-600 flex items-center justify-center mx-auto">
          <PartyPopper size={30} />
        </div>
        <div>
          <p className="font-bold text-graphite-900 text-xl">Prontinho!</p>
          <p className="font-medium text-graphite-700 mt-0.5">{currentEdition?.name ?? 'Tabloide'}</p>
          <p className="text-sm text-gray-500 mt-1">
            Enviado em {submission ? new Date(submission.submitted_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '—'}
          </p>
        </div>
        <p className="text-xs text-gray-400">Já foi pra produção — os produtos estão travados pra não sair errado na gráfica.</p>
        {waiting && (
          <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
            Pedido de alteração enviado em {new Date(submission!.unlock_requested_at!).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}. Aguarde o administrador liberar.
          </p>
        )}
        <div className="flex flex-col gap-2 pt-2">
          <Button size="lg" className="text-base" leftIcon={<Plus size={18} />} onClick={onCreateNew}>
            Criar outro tabloide
          </Button>
          <Button variant="outline" leftIcon={<RotateCcw size={15} />} onClick={onRequestUnlock} disabled={waiting}>
            {waiting ? 'Aguardando liberação' : 'Preciso alterar — avisar o administrador'}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ==============================================================
// Orquestrador — estado, dados, mutações e navegação entre passos
// ==============================================================

type PortalStep = 'choose' | 'create' | 'footer' | 'edit-info' | 'products-home' | 'add-product' | 'paste-list' | 'review-submit' | 'locked'

export default function PortalProdutos() {
  const qc = useQueryClient()
  const { associateId } = useAuth()
  const [step, setStep] = useState<PortalStep>('choose')
  const [editionId, setEditionId] = useState<string>('')
  const [editingProduct, setEditingProduct] = useState<TabloidProduct | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const { data: editions = [], isLoading: editionsLoading } = useQuery({ queryKey: ['portal-editions'], queryFn: fetchOpenEditions })
  const currentEdition = editions.find((e) => e.id === editionId) ?? null

  // Todos os PRÓPRIOS envios (qualquer edição) numa query só — dá pra saber,
  // pra cada tabloide aberto, se esse associado já está travado (enviou) ou
  // ainda pode editar, sem precisar de uma query por edição.
  const { data: ownSubmissions = [] } = useQuery({
    queryKey: ['portal-own-submissions', associateId],
    queryFn: () => fetchOwnSubmissions(associateId!),
    enabled: !!associateId,
    refetchInterval: 15_000,
  })
  const submission = ownSubmissions.find((s) => s.edition_id === editionId) ?? null
  const seenLockedId = useRef<string | null>(null)
  useEffect(() => {
    if (step === 'locked' && submission?.id) seenLockedId.current = submission.id
    if (step !== 'locked') seenLockedId.current = null
  }, [step, submission?.id])
  useEffect(() => {
    if (step !== 'locked' || !seenLockedId.current) return
    const stillLocked = ownSubmissions.some((s) => s.id === seenLockedId.current)
    if (!stillLocked) {
      seenLockedId.current = null
      toast.success('O administrador liberou a edição.', 'Pode alterar os produtos e enviar de novo.')
      setStep('products-home')
    }
  }, [ownSubmissions, step])

  const openEdition = (id: string) => {
    setEditionId(id)
    setStep(ownSubmissions.some((s) => s.edition_id === id) ? 'locked' : 'products-home')
  }

  const inWorkingArea = step === 'products-home' || step === 'add-product' || step === 'paste-list' || step === 'review-submit'

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['portal-products', associateId, editionId],
    queryFn: () => fetchOwnProducts(associateId!, editionId),
    enabled: !!associateId && !!editionId && inWorkingArea,
  })

  const { data: storeLayout } = useQuery({
    queryKey: ['portal-store-layout', editionId, associateId],
    queryFn: () => fetchStoreLayout(editionId, associateId!),
    enabled: !!editionId && !!associateId,
  })

  // Contagem e destaque só da PRÓPRIA loja — cada miolo é um tabloide impresso.
  const takenFeaturedPages = products.filter((p) => p.is_featured && p.page != null).map((p) => p.page as number)
  const pageCounts = {
    page1: products.filter((p) => (p.page ?? 1) === 1).length,
    page2: products.filter((p) => p.page === 2).length,
  }
  const maxProductsPerPage = tabloidMaxPerPage(currentEdition?.max_products_per_page)

  // A confirmação de envio agora é a própria tela de revisão (ReviewSubmitStep),
  // não um modal — por isso não tem mais um `confirmSubmitOpen` aqui.
  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!associateId || !editionId) return
      const minTotal = tabloidMinTotal(maxProductsPerPage)
      if (products.length < minTotal) {
        throw Object.assign(new Error(`tabloid_min_products_not_met (tem ${products.length}, mínimo ${minTotal})`), { code: 'P0001' })
      }
      const { error } = await supabase
        .from('tabloid_submissions')
        .insert({ associate_id: associateId, edition_id: editionId, submitted_at: new Date().toISOString() })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['portal-own-submissions'] })
      toast.success('Tabloide enviado pra produção!', 'O administrador vai revisar seus produtos.')
      setStep('locked')
    },
    onError: (e: Error) => {
      const friendly = tabloidPlacementError(e as { code?: string; message?: string })
      if (friendly) toast.error(friendly.title, friendly.description)
      else toast.error('Erro ao enviar', e.message)
    },
  })

  const [confirmUnlockOpen, setConfirmUnlockOpen] = useState(false)
  const requestUnlockMutation = useMutation({
    mutationFn: async () => {
      if (!editionId) return
      const { data, error } = await supabase.rpc('request_tabloid_unlock', { p_edition_id: editionId })
      if (error) throw error
      return data as boolean
    },
    onSuccess: (created) => {
      qc.invalidateQueries({ queryKey: ['portal-own-submissions'] })
      setConfirmUnlockOpen(false)
      if (created === false) {
        toast.success('Pedido já estava enviado.', 'O administrador ainda está analisando.')
      } else {
        toast.success('Pedido enviado.', 'O administrador vai ver se ainda dá tempo de alterar antes da gráfica.')
      }
    },
    onError: (e: Error) => {
      const friendly = tabloidPlacementError(e as { code?: string; message?: string })
      if (friendly) toast.error(friendly.title, friendly.description)
      else toast.error('Erro ao pedir alteração', e.message)
    },
  })

  // Excluir o TABLOIDE inteiro (não só o envio) — só quem criou pode (RLS,
  // `021_tabloid_associate_delete_own_edition.sql`), pra não apagar edição
  // que outra loja também usa. Cascade no banco já cuida de produtos/envio.
  const [confirmDeleteEditionOpen, setConfirmDeleteEditionOpen] = useState(false)
  const canDeleteEdition = !!currentEdition && !!associateId && currentEdition.created_by_associate_id === associateId
  const deleteEditionMutation = useMutation({
    mutationFn: async () => {
      if (!editionId) return
      const { error } = await supabase.from('tabloid_editions').delete().eq('id', editionId)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['portal-editions'] })
      qc.invalidateQueries({ queryKey: ['portal-own-submissions'] })
      toast.success('Tabloide excluído.', 'O administrador foi avisado.')
      setConfirmDeleteEditionOpen(false)
      setEditionId('')
      setStep('choose')
    },
    onError: (e: Error) => toast.error('Erro ao excluir tabloide', e.message),
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('tabloid_products').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['portal-products'] })
      qc.invalidateQueries({ queryKey: ['tabloid-page-counts', editionId] })
      toast.success('Produto removido.')
      setDeletingId(null)
    },
    onError: () => toast.error('Erro ao remover produto.'),
  })

  const [confirmBulkDeleteOpen, setConfirmBulkDeleteOpen] = useState(false)
  const bulkDeleteMutation = useMutation({
    mutationFn: async () => {
      if (!associateId || !editionId) return
      const { error } = await supabase
        .from('tabloid_products')
        .delete()
        .eq('associate_id', associateId)
        .eq('edition_id', editionId)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['portal-products'] })
      qc.invalidateQueries({ queryKey: ['tabloid-page-counts', editionId] })
      toast.success('Produtos apagados.')
      setConfirmBulkDeleteOpen(false)
    },
    onError: (e: Error) => toast.error('Erro ao apagar produtos', e.message),
  })

  // ---- Passo 1: escolher ----
  if (step === 'choose') {
    return (
      <ChooseStep
        editions={editions}
        editionsLoading={editionsLoading}
        ownSubmissions={ownSubmissions}
        onCreateNew={() => setStep('create')}
        onSelectEdition={openEdition}
      />
    )
  }

  // ---- Passo 1b: criar (nome, prazo, validade, rodapé...) ----
  if (step === 'create') {
    return (
      <EditionInfoStep
        edition={null}
        onBack={() => setStep('choose')}
        onDone={(created) => { setEditionId(created.id); setStep('footer') }}
      />
    )
  }

  // ---- Passo 2: rodapé (só verso) — criação e edição depois ----
  if (step === 'footer' && editionId && associateId) {
    return (
      <FooterStep
        editionId={editionId}
        associateId={associateId}
        campaignFooter={normalizeFooter(currentEdition?.footer, currentEdition?.footer_text)}
        onBack={() => setStep(currentEdition ? 'products-home' : 'choose')}
        onDone={() => setStep('products-home')}
      />
    )
  }

  // ---- Editar informações do tabloide já criado (fora do fluxo principal) ----
  if (step === 'edit-info') {
    return (
      <EditionInfoStep
        edition={currentEdition}
        onBack={() => setStep('products-home')}
        onDone={() => setStep('products-home')}
      />
    )
  }

  // ---- Passo 4: tabloide já enviado ----
  if (step === 'locked') {
    return (
      <>
        <LockedStep
          currentEdition={currentEdition}
          submission={submission}
          onBack={() => setStep('choose')}
          onCreateNew={() => setStep('create')}
          onRequestUnlock={() => setConfirmUnlockOpen(true)}
        />
        <ConfirmDialog
          open={confirmUnlockOpen}
          onClose={() => setConfirmUnlockOpen(false)}
          onConfirm={() => requestUnlockMutation.mutate()}
          title="Pedir alteração ao administrador"
          description="O tabloide já foi pra produção e você não consegue editar sozinho. Vamos avisar os administradores — eles olham se ainda dá tempo de mudar antes da gráfica. Se der, eles liberam de novo pra você editar."
          confirmLabel="Enviar pedido"
          loading={requestUnlockMutation.isPending}
        />
        <ConfirmDialog
          open={confirmDeleteEditionOpen}
          onClose={() => setConfirmDeleteEditionOpen(false)}
          onConfirm={() => deleteEditionMutation.mutate()}
          title="Excluir tabloide"
          description="Isso apaga o tabloide inteiro — nome, produtos e envio — e não pode ser desfeito. O administrador é avisado. Confirma?"
          confirmLabel="Excluir tabloide"
          loading={deleteEditionMutation.isPending}
        />
      </>
    )
  }

  // ---- Passo 2b: adicionar/editar produto ----
  if (step === 'add-product' && editionId && associateId) {
    return (
      <AddProductStep
        product={editingProduct}
        editionId={editionId}
        associateId={associateId}
        takenFeaturedPages={takenFeaturedPages}
        pageCounts={pageCounts}
        maxProductsPerPage={maxProductsPerPage}
        onDone={() => { setEditingProduct(null); setStep('products-home') }}
        onCancel={() => { setEditingProduct(null); setStep('products-home') }}
      />
    )
  }

  // ---- Passo 2c: colar lista ----
  if (step === 'paste-list' && editionId && associateId) {
    return (
      <PasteListStep
        editionId={editionId}
        associateId={associateId}
        takenFeaturedPages={takenFeaturedPages}
        pageCounts={pageCounts}
        maxProductsPerPage={maxProductsPerPage}
        onDone={() => setStep('products-home')}
        onCancel={() => setStep('products-home')}
      />
    )
  }

  // ---- Passo 3: revisar e enviar ----
  if (step === 'review-submit') {
    return (
      <ReviewSubmitStep
        currentEdition={currentEdition}
        products={products}
        onBack={() => setStep('products-home')}
        onSubmit={() => submitMutation.mutate()}
        submitting={submitMutation.isPending}
      />
    )
  }

  // ---- Passo 2: meus produtos (hub) ----
  return (
    <>
      <ProductsHomeStep
        currentEdition={currentEdition}
        products={products}
        isLoading={isLoading}
        pageCounts={pageCounts}
        maxProductsPerPage={maxProductsPerPage}
        canDeleteEdition={canDeleteEdition}
        footerIncomplete={(() => {
          const d = storeLayout?.footer
          if (!d) return true
          return !(d.logo_url || d.phone || d.cta_whatsapp)
        })()}
        onBack={() => setStep('choose')}
        onAddProduct={() => { setEditingProduct(null); setStep('add-product') }}
        onEditProduct={(p) => { setEditingProduct(p); setStep('add-product') }}
        onDeleteProduct={(id) => setDeletingId(id)}
        onPasteList={() => setStep('paste-list')}
        onReviewSubmit={() => {
          if (products.length < tabloidMinTotal(maxProductsPerPage)) return
          setStep('review-submit')
        }}
        onEditSettings={() => setStep('edit-info')}
        onEditFooter={() => setStep('footer')}
        onDeleteEdition={() => setConfirmDeleteEditionOpen(true)}
        onBulkDelete={() => setConfirmBulkDeleteOpen(true)}
      />

      <ConfirmDialog
        open={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={() => deletingId && deleteMutation.mutate(deletingId)}
        title="Excluir produto"
        description="Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        loading={deleteMutation.isPending}
      />
      <ConfirmDialog
        open={confirmBulkDeleteOpen}
        onClose={() => setConfirmBulkDeleteOpen(false)}
        onConfirm={() => bulkDeleteMutation.mutate()}
        title="Apagar todos os produtos"
        description={`Isso vai apagar de uma vez os ${products.length} produto${products.length !== 1 ? 's' : ''} desta edição${currentEdition ? ` (${currentEdition.name})` : ''}. Esta ação não pode ser desfeita.`}
        confirmLabel="Apagar todos"
        loading={bulkDeleteMutation.isPending}
      />
      <ConfirmDialog
        open={confirmDeleteEditionOpen}
        onClose={() => setConfirmDeleteEditionOpen(false)}
        onConfirm={() => deleteEditionMutation.mutate()}
        title="Excluir tabloide"
        description="Isso apaga o tabloide inteiro — nome, produtos e envio — e não pode ser desfeito. O administrador é avisado. Confirma?"
        confirmLabel="Excluir tabloide"
        loading={deleteEditionMutation.isPending}
      />
    </>
  )
}
