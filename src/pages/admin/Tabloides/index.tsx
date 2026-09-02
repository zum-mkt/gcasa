import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { type ColumnDef } from '@tanstack/react-table'
import { Plus, Pencil, Trash2, Download, Eye, Star, Archive, ArchiveRestore, Rocket, PanelBottom, Unlock, AlertTriangle } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import JSZip from 'jszip'
import { supabase } from '@/lib/supabase'
import { PageHeader } from '@/components/admin/PageHeader'
import { DataTable } from '@/components/admin/DataTable'
import { ImageUpload } from '@/components/admin/ImageUpload'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input, Textarea } from '@/components/ui/Input'
import { Modal, ConfirmDialog } from '@/components/ui/Modal'
import { toast } from '@/components/ui/Toast'
import { EditionForm, editionStatusOptions } from '@/components/tabloide/EditionForm'
import { FooterBuilder } from '@/components/tabloide/FooterBuilder'
import { CAMPAIGN_FOOTER_BLOCKS, upsertStoreLayout } from '@/lib/tabloidFooter'
import { LaunchWizard } from '@/components/tabloide/LaunchWizard'
import { tabloidPlacementError, tabloidUnlockError } from '@/lib/tabloidErrors'
import { clearOtherFeatured } from '@/lib/tabloidCapacity'
import { normalizeFooter, type TabloidFooter } from '@/lib/tabloidFooter'
import type { TabloidEdition, TabloidProduct, TabloidSubmission } from '@/types/models'

async function fetchEditions(): Promise<TabloidEdition[]> {
  const { data, error } = await supabase
    .from('tabloid_editions')
    .select('*, created_by_associate:associates(id, name)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data as TabloidEdition[]
}

// Quais associados têm produto em cada edição — é isso que o admin quer ver
// na lista ("de quem é esse tabloide"), não quem clicou em "criar" (uma
// edição pode ser criada pelo admin e usada por uma loja, ou vice-versa).
// Uma query só pra todas as edições de uma vez (evita N+1 na lista).
async function fetchEditionAssociates(): Promise<{ edition_id: string; name: string }[]> {
  const { data, error } = await supabase.from('tabloid_products').select('edition_id, associate:associates(name)')
  if (error) throw error
  return (data as unknown as { edition_id: string; associate: { name: string } | null }[])
    .filter((r) => r.associate)
    .map((r) => ({ edition_id: r.edition_id, name: r.associate!.name }))
}

async function fetchEditionProducts(editionId: string): Promise<TabloidProduct[]> {
  const { data, error } = await supabase
    .from('tabloid_products')
    .select('*, associate:associates(id, name)')
    .eq('edition_id', editionId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data as TabloidProduct[]
}

async function fetchEditionSubmissions(editionId: string): Promise<TabloidSubmission[]> {
  const { data, error } = await supabase
    .from('tabloid_submissions')
    .select('*, associate:associates(id, name)')
    .eq('edition_id', editionId)
  if (error) throw error
  return data as TabloidSubmission[]
}

const statusBadge: Record<TabloidEdition['status'], 'default' | 'primary' | 'warning' | 'success'> = {
  draft: 'default', open: 'primary', closed: 'warning', published: 'success',
}


/* Exportação pro Data Merge do InDesign: um CSV + uma pasta "fotos/" com os
   arquivos de imagem baixados (o Data Merge do InDesign, no formato clássico,
   espera caminho de arquivo local pro campo de imagem, não link da internet).
   Nomes de coluna são um ponto de partida — assim que o Mario mandar o .indd
   com os campos de mesclagem já definidos, ajusto os nomes exatos aqui pra
   bater certinho com o template. A coluna de foto já sai com "@" na frente
   (convenção do InDesign pra reconhecer campo de imagem automaticamente). */
function slugify(s: string): string {
  return (
    s
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // remove acentos (normalizados em marcas combinantes pelo NFD)
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40) || 'produto'
  )
}

function imageExtFromUrl(url: string): string {
  const match = url.split('?')[0].match(/\.([a-zA-Z0-9]+)$/)
  return match ? match[1].toLowerCase() : 'jpg'
}

function buildCsv(products: TabloidProduct[], imageFilenames: Map<string, string>): string {
  // Validade é do tabloide (edição), não do produto — por isso não entra aqui;
  // já aparece na coluna "Validade" da lista de edições.
  const header = ['nome', 'categoria', 'sku', 'unidade', 'preco', 'preco_promo', 'condicao_pagamento', 'pagina', 'destaque', 'descricao', '@foto', 'associado']
  const rows = products.map((p) => {
    const filename = imageFilenames.get(p.id)
    return [
      p.name, p.category ?? '', p.sku ?? '', p.unit ?? '', p.price ?? '', p.promo_price ?? '', (p.payment_condition ?? '').replace(/\n/g, ' '), p.page ?? '', p.is_featured ? 'sim' : 'não',
      (p.description ?? '').replace(/\n/g, ' '), filename ? `fotos/${filename}` : '', p.associate?.name ?? '',
    ]
  })
  const escape = (v: unknown) => `"${String(v).replace(/"/g, '""')}"`
  return [header, ...rows].map((r) => r.map(escape).join(',')).join('\n')
}

interface AssociateSubmissionSummary {
  id: string
  name: string
  submission: TabloidSubmission | null
  total: number
}

/* Uma linha do resumo de envio por associado — nome, quando enviou (ou "ainda
   não enviou"), quantos produtos, + arquivar/reabrir. Sem mais "pendente de
   revisão": desde que não precisa mais aprovar produto um a um, "enviou" já
   é sinônimo de "pronto". */
function AssociateSubmissionRow({ a, headerUrl, onUploadHeader, uploadingHeader, previewHref, onArchive, onReopen, onUnlock, archiving, reopening, unlocking }: {
  a: AssociateSubmissionSummary
  headerUrl?: string | null
  onUploadHeader: (file: File) => void
  uploadingHeader?: boolean
  previewHref: string
  onArchive: (submissionId: string) => void
  onReopen: (submissionId: string) => void
  onUnlock: (submissionId: string) => void
  archiving: boolean
  reopening: boolean
  unlocking: boolean
}) {
  const s = a.submission
  const wantsChange = !!s?.unlock_requested_at
  const inputRef = useRef<HTMLInputElement>(null)
  return (
    <div className={`flex items-center gap-3 px-3 py-2 rounded-lg border bg-white ${wantsChange ? 'border-amber-400 ring-1 ring-amber-300' : 'border-gray-100'}`}>
      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${wantsChange ? 'bg-amber-500' : s ? 'bg-green-500' : 'bg-gray-300'}`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{a.name}</p>
        <p className="text-xs text-gray-400">
          {s ? `Enviado em ${new Date(s.submitted_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}` : 'Ainda não enviou'}
          {a.total > 0 && ` · ${a.total} produto${a.total !== 1 ? 's' : ''}`}
          {headerUrl ? ' · capa desta loja' : ''}
          {wantsChange ? ' · pediu pra alterar' : ''}
        </p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onUploadHeader(f); e.target.value = '' }}
      />
      <Button variant="ghost" size="sm" loading={uploadingHeader} onClick={() => inputRef.current?.click()}>
        {headerUrl ? 'Trocar capa' : 'Capa desta loja'}
      </Button>
      <Button variant="ghost" size="sm" asChild>
        <Link to={previewHref} target="_blank">Ver miolo</Link>
      </Button>
      {wantsChange && s && (
        <Button variant="primary" size="sm" leftIcon={<Unlock size={13} />} loading={unlocking} onClick={() => onUnlock(s.id)}>
          Liberar edição
        </Button>
      )}
      {s?.archived_at ? (
        <Button variant="ghost" size="sm" leftIcon={<ArchiveRestore size={13} />} loading={reopening} onClick={() => onReopen(s.id)}>
          Reabrir
        </Button>
      ) : s && !wantsChange ? (
        <Button variant="ghost" size="sm" leftIcon={<Archive size={13} />} loading={archiving} onClick={() => onArchive(s.id)}>
          Arquivar
        </Button>
      ) : null}
    </div>
  )
}

const productEditSchema = z.object({
  name: z.string().min(2, 'Nome obrigatório'),
  description: z.string().optional(),
  category: z.string().optional(),
  sku: z.string().optional(),
  unit: z.string().optional(),
  price: z.coerce.number().min(0).optional(),
  promo_price: z.coerce.number().min(0).optional(),
  payment_condition: z.string().optional(),
  image_url: z.string().nullable().optional(),
})
type ProductEditData = z.infer<typeof productEditSchema>

/* Sem aprovar/rejeitar produto um a um (pedido do Mario) — se tiver algo
   errado (preço, nome, foto...), o admin corrige direto aqui em vez de
   rejeitar e esperar o associado corrigir e reenviar (o que nem dava mais
   pra fazer sozinho depois que ele já enviou, ver 017_tabloid_associate_workflow.sql). */
function AdminProductForm({ open, onClose, product, onSaved }: {
  open: boolean
  onClose: () => void
  product: TabloidProduct | null
  onSaved: () => void
}) {
  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<ProductEditData>({
    resolver: zodResolver(productEditSchema),
  })

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
      })
    }
  }, [product, reset])

  const mutation = useMutation({
    mutationFn: async (data: ProductEditData) => {
      if (!product) return
      const payload = { ...data, price: data.price ?? null, promo_price: data.promo_price ?? null, payment_condition: data.payment_condition || null }
      const { error } = await supabase.from('tabloid_products').update(payload).eq('id', product.id)
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('Produto atualizado.')
      onSaved()
      onClose()
    },
    onError: (e: Error) => toast.error('Erro ao salvar produto', e.message),
  })

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Editar produto"
      size="2xl"
      footer={<><Button variant="outline" onClick={onClose}>Cancelar</Button><Button loading={mutation.isPending} onClick={handleSubmit((d) => mutation.mutate(d))}>Salvar</Button></>}
    >
      <form className="space-y-4">
        <ImageUpload
          label="Foto do produto"
          value={watch('image_url')}
          onChange={(url) => setValue('image_url', url)}
          folder="tabloide/produtos"
        />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Nome *" error={errors.name?.message} {...register('name')} />
          <Input label="Categoria" {...register('category')} />
        </div>
        <Textarea label="Descrição" rows={2} {...register('description')} />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Preço (R$)" type="number" step="0.01" {...register('price')} />
          <Input label="Preço promocional (R$)" type="number" step="0.01" {...register('promo_price')} />
        </div>
        <Input
          label="Condição de pagamento"
          {...register('payment_condition')}
          placeholder="Ex: 3x de R$ 66,63 sem juros, ou à vista com 5% OFF"
        />
        <div className="grid grid-cols-2 gap-4">
          <Input label="SKU" {...register('sku')} />
          <Input label="Unidade" {...register('unit')} />
        </div>
      </form>
    </Modal>
  )
}

function CurationPanel({ edition }: { edition: TabloidEdition }) {
  const qc = useQueryClient()
  const [exporting, setExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState<string | null>(null)
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['admin-tabloid-products', edition.id],
    queryFn: () => fetchEditionProducts(edition.id),
  })
  const { data: submissions = [] } = useQuery({
    queryKey: ['admin-tabloid-submissions', edition.id],
    queryFn: () => fetchEditionSubmissions(edition.id),
  })
  const { data: layouts = [] } = useQuery({
    queryKey: ['admin-tabloid-layouts', edition.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('tabloid_store_layouts').select('associate_id, header_image_url').eq('edition_id', edition.id)
      if (error) throw error
      return (data ?? []) as { associate_id: string; header_image_url: string | null }[]
    },
  })
  const headerByStore = new Map(layouts.map((l) => [l.associate_id, l.header_image_url]))
  const [uploadingHeaderFor, setUploadingHeaderFor] = useState<string | null>(null)

  const uploadStoreHeader = async (associateId: string, file: File) => {
    setUploadingHeaderFor(associateId)
    try {
      const ext = file.name.split('.').pop()
      const path = `tabloide/headers/${edition.id}/${associateId}-${Date.now()}.${ext}`
      const { error } = await supabase.storage.from('media').upload(path, file)
      if (error) throw error
      const { data } = supabase.storage.from('media').getPublicUrl(path)
      await upsertStoreLayout(edition.id, associateId, { header_image_url: data.publicUrl })
      qc.invalidateQueries({ queryKey: ['admin-tabloid-layouts', edition.id] })
      toast.success('Capa desta loja atualizada.')
    } catch (e) {
      toast.error('Erro ao enviar capa', (e as Error).message)
    } finally {
      setUploadingHeaderFor(null)
    }
  }

  const [editingProduct, setEditingProduct] = useState<TabloidProduct | null>(null)
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null)

  const deleteProduct = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('tabloid_products').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-tabloid-products', edition.id] })
      toast.success('Produto excluído.')
      setDeletingProductId(null)
    },
    onError: (e: Error) => toast.error('Erro ao excluir produto', e.message),
  })

  // Ajuste de página/destaque direto na linha — a palavra final de posicionamento é do admin.
  const updatePlacement = useMutation({
    mutationFn: async ({ id, page, is_featured }: { id: string; page?: 1 | 2 | null; is_featured?: boolean }) => {
      const current = products.find((x) => x.id === id)
      const nextPage = page !== undefined ? page : current?.page ?? null
      const willFeature = is_featured !== undefined ? is_featured : !!current?.is_featured
      if (willFeature && current) {
        await clearOtherFeatured({
          editionId: edition.id,
          associateId: current.associate_id,
          page: nextPage,
          keepId: id,
        })
      }
      const patch: Record<string, unknown> = {}
      if (page !== undefined) patch.page = page
      if (is_featured !== undefined) patch.is_featured = is_featured
      const { error } = await supabase.from('tabloid_products').update(patch).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-tabloid-products', edition.id] }),
    onError: (e: Error) => {
      const friendly = tabloidPlacementError(e as { code?: string; message?: string })
      if (friendly) toast.error(friendly.title, friendly.description)
      else toast.error('Erro ao atualizar posicionamento.')
    },
  })

  const archiveSubmission = useMutation({
    mutationFn: async (submissionId: string) => {
      const { error } = await supabase.from('tabloid_submissions').update({ archived_at: new Date().toISOString() }).eq('id', submissionId)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-tabloid-submissions', edition.id] })
      toast.success('Envio arquivado.')
    },
    onError: () => toast.error('Erro ao arquivar envio.'),
  })

  const reopenSubmission = useMutation({
    mutationFn: async (submissionId: string) => {
      const { error } = await supabase.from('tabloid_submissions').update({ archived_at: null }).eq('id', submissionId)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-tabloid-submissions', edition.id] })
      toast.success('Envio reaberto.')
    },
    onError: () => toast.error('Erro ao reabrir envio.'),
  })

  const unlockSubmission = useMutation({
    mutationFn: async (submissionId: string) => {
      const { error } = await supabase.rpc('unlock_tabloid_submission', { p_submission_id: submissionId })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-tabloid-submissions', edition.id] })
      qc.invalidateQueries({ queryKey: ['tabloid-unlock-requests'] })
      toast.success('Edição liberada.', 'A loja já pode alterar os produtos e precisa enviar de novo.')
    },
    onError: (e: Error) => {
      const friendly = tabloidUnlockError(e)
      toast.error(friendly?.title ?? 'Erro ao liberar', friendly?.description ?? e.message)
    },
  })

  // 1 destaque por página POR LOJA (cada miolo é um tabloide).
  const featuredByStorePage = new Map<string, TabloidProduct>()
  for (const p of products) {
    if (p.is_featured && p.page != null) featuredByStorePage.set(`${p.associate_id}:${p.page}`, p)
  }

  // Limite de produtos por página POR LOJA.
  const countByStorePage = new Map<string, number>()
  for (const p of products) {
    if (p.page != null) {
      const k = `${p.associate_id}:${p.page}`
      countByStorePage.set(k, (countByStorePage.get(k) ?? 0) + 1)
    }
  }
  const maxProductsPerPage = edition.max_products_per_page

  // Resumo por associado — nome, quando enviou (se enviou) e quantos
  // produtos. Junta `products` (só tem quem já mandou pelo menos 1 produto)
  // com `submissions` (só tem quem clicou "enviar pra produção") porque um
  // associado pode estar em qualquer um dos dois sem estar no outro (ex: só
  // criou produto e ainda não enviou; ou reenviou sem ter produto novo).
  const submittedIds = new Set(submissions.map((s) => s.associate_id))
  const summaryByAssociate = new Map<string, AssociateSubmissionSummary>()
  for (const p of products) {
    if (!p.associate) continue
    const entry = summaryByAssociate.get(p.associate_id) ?? { id: p.associate_id, name: p.associate.name, submission: null, total: 0 }
    entry.total += 1
    summaryByAssociate.set(p.associate_id, entry)
  }
  for (const s of submissions) {
    const entry = summaryByAssociate.get(s.associate_id)
    if (entry) entry.submission = s
    else if (s.associate) summaryByAssociate.set(s.associate_id, { id: s.associate_id, name: s.associate.name, submission: s, total: 0 })
  }
  const allAssociateSummaries = Array.from(summaryByAssociate.values()).sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
  // "Precisa de ação" agora é só "ainda não enviou" (falta cobrar) — sem
  // aprovação, não existe mais "enviou mas falta revisar".
  const needsAction = allAssociateSummaries.filter((a) => !a.submission)
  const unlockRequested = allAssociateSummaries.filter((a) => a.submission?.unlock_requested_at)
  const readyToArchive = allAssociateSummaries.filter((a) => a.submission && !a.submission.archived_at && !a.submission.unlock_requested_at)
  const archivedSummaries = allAssociateSummaries.filter((a) => a.submission?.archived_at)

  // Pronto pra exportar = a loja já enviou pra produção (sem aprovar produto
  // um a um — "recebeu do associado" já é o sinal de pronto, pedido do Mario).
  const readyProducts = products.filter((p) => submittedIds.has(p.associate_id))

  const exportForIndesign = async () => {
    if (readyProducts.length === 0) {
      toast.error('Nenhum produto pronto ainda', 'Só entram produtos de lojas que já enviaram o tabloide pra produção.')
      return
    }
    setExporting(true)
    try {
      const zip = new JSZip()
      const fotosFolder = zip.folder('fotos')!
      const imageFilenames = new Map<string, string>()

      const withImages = readyProducts.filter((p) => p.image_url)
      for (let i = 0; i < withImages.length; i++) {
        const p = withImages[i]
        setExportProgress(`Baixando fotos... (${i + 1}/${withImages.length})`)
        try {
          const res = await fetch(p.image_url!)
          if (!res.ok) throw new Error('download falhou')
          const blob = await res.blob()
          const filename = `${slugify(p.name)}-${p.id.slice(0, 8)}.${imageExtFromUrl(p.image_url!)}`
          fotosFolder.file(filename, blob)
          imageFilenames.set(p.id, filename)
        } catch {
          // Segue sem essa foto específica — uma imagem com falha não pode travar a exportação inteira.
        }
      }

      setExportProgress('Montando arquivo...')
      const csv = buildCsv(readyProducts, imageFilenames)
      zip.file('produtos.csv', csv)

      const blob = await zip.generateAsync({ type: 'blob' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `tabloide-${edition.name.toLowerCase().replace(/\s+/g, '-')}.zip`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)

      toast.success('Exportado!', 'produtos.csv + pasta fotos/ prontos pra o Data Merge do InDesign.')
    } catch (e) {
      toast.error('Erro ao exportar', (e as Error).message)
    } finally {
      setExporting(false)
      setExportProgress(null)
    }
  }

  if (isLoading) return <div className="h-32 bg-gray-100 animate-pulse rounded-xl" />

  if (products.length === 0) {
    return <p className="text-sm text-gray-400 py-8 text-center">Nenhum produto enviado pra essa edição ainda.</p>
  }

  return (
    <div className="space-y-3">
      {allAssociateSummaries.length > 0 && (
        <div className="space-y-3 bg-gray-50 border border-gray-100 rounded-xl p-3">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Precisa de ação{needsAction.length > 0 && ` (${needsAction.length})`}
            </p>
            {needsAction.length === 0 ? (
              <p className="text-xs text-gray-400">Tudo em dia — ninguém pendente.</p>
            ) : (
              <div className="space-y-1.5">
                {needsAction.map((a) => (
                  <AssociateSubmissionRow
                    key={a.id} a={a}
                    headerUrl={headerByStore.get(a.id)}
                    onUploadHeader={(file) => uploadStoreHeader(a.id, file)}
                    uploadingHeader={uploadingHeaderFor === a.id}
                    previewHref={`/admin/tabloides/${edition.id}/preview?loja=${a.id}`}
                    onArchive={(id) => archiveSubmission.mutate(id)}
                    onReopen={(id) => reopenSubmission.mutate(id)}
                    onUnlock={(id) => unlockSubmission.mutate(id)}
                    archiving={archiveSubmission.isPending}
                    reopening={reopenSubmission.isPending}
                    unlocking={unlockSubmission.isPending}
                  />
                ))}
              </div>
            )}
          </div>

          {unlockRequested.length > 0 && (
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-3">
              <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                <AlertTriangle size={13} /> Pediu pra alterar — veja se ainda dá tempo ({unlockRequested.length})
              </p>
              <div className="space-y-1.5">
                {unlockRequested.map((a) => (
                  <AssociateSubmissionRow
                    key={a.id} a={a}
                    headerUrl={headerByStore.get(a.id)}
                    onUploadHeader={(file) => uploadStoreHeader(a.id, file)}
                    uploadingHeader={uploadingHeaderFor === a.id}
                    previewHref={`/admin/tabloides/${edition.id}/preview?loja=${a.id}`}
                    onArchive={(id) => archiveSubmission.mutate(id)}
                    onReopen={(id) => reopenSubmission.mutate(id)}
                    onUnlock={(id) => unlockSubmission.mutate(id)}
                    archiving={archiveSubmission.isPending}
                    reopening={reopenSubmission.isPending}
                    unlocking={unlockSubmission.isPending}
                  />
                ))}
              </div>
            </div>
          )}

          {readyToArchive.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Enviado — pode arquivar ({readyToArchive.length})</p>
              <div className="space-y-1.5">
                {readyToArchive.map((a) => (
                  <AssociateSubmissionRow
                    key={a.id} a={a}
                    headerUrl={headerByStore.get(a.id)}
                    onUploadHeader={(file) => uploadStoreHeader(a.id, file)}
                    uploadingHeader={uploadingHeaderFor === a.id}
                    previewHref={`/admin/tabloides/${edition.id}/preview?loja=${a.id}`}
                    onArchive={(id) => archiveSubmission.mutate(id)}
                    onReopen={(id) => reopenSubmission.mutate(id)}
                    onUnlock={(id) => unlockSubmission.mutate(id)}
                    archiving={archiveSubmission.isPending}
                    reopening={reopenSubmission.isPending}
                    unlocking={unlockSubmission.isPending}
                  />
                ))}
              </div>
            </div>
          )}

          {archivedSummaries.length > 0 && (
            <details>
              <summary className="text-xs text-gray-400 cursor-pointer select-none">Arquivados ({archivedSummaries.length})</summary>
              <div className="space-y-1.5 mt-1.5">
                {archivedSummaries.map((a) => (
                  <AssociateSubmissionRow
                    key={a.id} a={a}
                    headerUrl={headerByStore.get(a.id)}
                    onUploadHeader={(file) => uploadStoreHeader(a.id, file)}
                    uploadingHeader={uploadingHeaderFor === a.id}
                    previewHref={`/admin/tabloides/${edition.id}/preview?loja=${a.id}`}
                    onArchive={(id) => archiveSubmission.mutate(id)}
                    onReopen={(id) => reopenSubmission.mutate(id)}
                    onUnlock={(id) => unlockSubmission.mutate(id)}
                    archiving={archiveSubmission.isPending}
                    reopening={reopenSubmission.isPending}
                    unlocking={unlockSubmission.isPending}
                  />
                ))}
              </div>
            </details>
          )}
        </div>
      )}
      <div className="flex justify-end">
        <Button variant="outline" size="sm" leftIcon={<Download size={13} />} loading={exporting} onClick={exportForIndesign}>
          {exportProgress ?? `Exportar pro InDesign (${readyProducts.length} pronto${readyProducts.length !== 1 ? 's' : ''})`}
        </Button>
      </div>
      <div className="divide-y divide-gray-100 border border-gray-100 rounded-xl overflow-hidden">
        {products.map((p) => {
          const ready = submittedIds.has(p.associate_id)
          const featuredHolder = p.page != null ? featuredByStorePage.get(`${p.associate_id}:${p.page}`) : undefined
          const featuredTakenByOther = !!featuredHolder && featuredHolder.id !== p.id
          return (
            <div key={p.id} className="flex items-center gap-3 p-3 bg-white">
              <div className="w-11 h-11 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden">
                {p.image_url && <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                <p className="text-xs text-gray-400">{p.associate?.name}{p.category ? ` · ${p.category}` : ''}</p>
                {p.payment_condition && <p className="text-[11px] text-gray-400 truncate">{p.payment_condition}</p>}
              </div>
              <select
                value={p.page ?? ''}
                onChange={(e) => updatePlacement.mutate({ id: p.id, page: e.target.value ? (Number(e.target.value) as 1 | 2) : null })}
                className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-600 outline-none cursor-pointer"
                title="Página"
              >
                <option value="">Pág. —</option>
                {([1, 2] as const).map((pg) => {
                  const count = countByStorePage.get(`${p.associate_id}:${pg}`) ?? 0
                  const full = count >= maxProductsPerPage && p.page !== pg
                  return (
                    <option key={pg} value={pg} disabled={full}>
                      Pág. {pg} ({count}/{maxProductsPerPage}){full ? ' — cheia' : ''}
                    </option>
                  )
                })}
              </select>
              <button
                type="button"
                title={
                  p.is_featured
                    ? 'Destaque — clique para remover'
                    : p.page == null
                      ? 'Defina a página antes de marcar destaque'
                      : featuredTakenByOther
                        ? `Só 1 destaque por página — substitui “${featuredHolder!.name}”`
                        : 'Marcar como destaque'
                }
                onClick={() => {
                  if (!p.is_featured && p.page == null) {
                    toast.error('Defina a página antes de marcar destaque')
                    return
                  }
                  updatePlacement.mutate({ id: p.id, is_featured: !p.is_featured })
                }}
                className={`p-1.5 rounded-lg transition-colors ${p.is_featured ? 'text-amber-500 bg-amber-50' : 'text-gray-300 hover:text-gray-400'}`}
              >
                <Star size={15} fill={p.is_featured ? 'currentColor' : 'none'} />
              </button>
              <Badge variant={ready ? 'success' : 'default'}>{ready ? 'Pronto' : 'Aguardando envio'}</Badge>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon-sm" title="Editar produto" onClick={() => setEditingProduct(p)}>
                  <Pencil size={14} />
                </Button>
                <Button variant="danger-ghost" size="icon-sm" title="Excluir produto" onClick={() => setDeletingProductId(p.id)}>
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>
          )
        })}
      </div>

      <AdminProductForm
        open={!!editingProduct}
        onClose={() => setEditingProduct(null)}
        product={editingProduct}
        onSaved={() => qc.invalidateQueries({ queryKey: ['admin-tabloid-products', edition.id] })}
      />
      <ConfirmDialog
        open={!!deletingProductId}
        onClose={() => setDeletingProductId(null)}
        onConfirm={() => deletingProductId && deleteProduct.mutate(deletingProductId)}
        title="Excluir produto"
        description="Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        loading={deleteProduct.isPending}
      />
    </div>
  )
}

export default function AdminTabloides() {
  const qc = useQueryClient()
  const [searchParams] = useSearchParams()
  const [launchOpen, setLaunchOpen] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<TabloidEdition | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [curatingId, setCuratingId] = useState<string | null>(searchParams.get('edicao'))
  const [footerEdition, setFooterEdition] = useState<TabloidEdition | null>(null)
  const [footerDraft, setFooterDraft] = useState<TabloidFooter | null>(null)

  const saveFooter = useMutation({
    mutationFn: async ({ id, footer }: { id: string; footer: TabloidFooter }) => {
      const { error } = await supabase.from('tabloid_editions').update({ footer }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-tabloid-editions'] })
      toast.success('Rodapé salvo.')
    },
    onError: (e: Error) => toast.error('Erro ao salvar rodapé', e.message),
  })

  useEffect(() => {
    const id = searchParams.get('edicao')
    if (id) setCuratingId(id)
  }, [searchParams])

  const { data: editions = [], isLoading } = useQuery({ queryKey: ['admin-tabloid-editions'], queryFn: fetchEditions })

  const { data: editionAssociates = [] } = useQuery({ queryKey: ['admin-tabloid-edition-associates'], queryFn: fetchEditionAssociates })
  const associateNamesByEdition = new Map<string, Set<string>>()
  for (const { edition_id, name } of editionAssociates) {
    const set = associateNamesByEdition.get(edition_id) ?? new Set<string>()
    set.add(name)
    associateNamesByEdition.set(edition_id, set)
  }

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('tabloid_editions').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-tabloid-editions'] })
      toast.success('Edição excluída.')
      setDeletingId(null)
    },
    onError: () => toast.error('Erro ao excluir edição.'),
  })

  const columns: ColumnDef<TabloidEdition>[] = [
    { accessorKey: 'name', header: 'Edição', cell: ({ row }) => <span className="font-medium text-gray-900">{row.original.name}</span> },
    {
      id: 'associado',
      header: 'Associado',
      // O que importa pro admin é de quem é o tabloide — ou seja, qual(is)
      // loja(s) tem produto ali dentro (uma edição pode ter mais de uma,
      // já que é compartilhada). Quem CRIOU a edição (`created_by_associate`,
      // 018_tabloid_edition_creator.sql) é outra coisa — só aparece como
      // fallback quando ainda não tem produto nenhum.
      cell: ({ row }) => {
        const names = Array.from(associateNamesByEdition.get(row.original.id) ?? [])
        if (names.length > 0) {
          return <span className="text-gray-700">{names.join(', ')}</span>
        }
        const creator = row.original.created_by_associate?.name
        return creator
          ? <span className="text-gray-400">{creator} (sem produto ainda)</span>
          : <span className="text-gray-400">—</span>
      },
    },
    { accessorKey: 'status', header: 'Status', cell: ({ row }) => {
      const st = row.original.status
      return <Badge variant={statusBadge[st]}>{editionStatusOptions.find(o => o.value === st)?.label.split(' — ')[0]}</Badge>
    } },
    { accessorKey: 'submission_deadline', header: 'Prazo de envio', cell: ({ row }) => row.original.submission_deadline ?? '—' },
    { accessorKey: 'valid_from', header: 'Validade', cell: ({ row }) => row.original.valid_from ? `${row.original.valid_from} a ${row.original.valid_until ?? '—'}` : '—' },
    { id: 'actions', header: '', cell: ({ row }) => {
      const e = row.original
      return (
        <div className="flex items-center gap-1 justify-end">
          <Button variant="outline" size="sm" onClick={() => setCuratingId(curatingId === e.id ? null : e.id)}>
            {curatingId === e.id ? 'Fechar' : 'Ver produtos'}
          </Button>
          <Button variant="ghost" size="icon-sm" title="Pré-visualizar" asChild>
            <Link to={`/admin/tabloides/${e.id}/preview`} target="_blank"><Eye size={14} /></Link>
          </Button>
          <Button variant="ghost" size="icon-sm" title="Rodapé (página 2)" onClick={() => setFooterEdition(e)}><PanelBottom size={14} /></Button>
          <Button variant="ghost" size="icon-sm" title="Editar" onClick={() => { setEditing(e); setFormOpen(true) }}><Pencil size={14} /></Button>
          <Button variant="danger-ghost" size="icon-sm" title="Excluir" onClick={() => setDeletingId(e.id)}><Trash2 size={14} /></Button>
        </div>
      )
    } },
  ]

  const curatingEdition = editions.find((e) => e.id === curatingId) ?? null

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tabloides de Vendas"
        description="Edições do tabloide, produtos enviados pelos associados e curadoria."
        actions={
          <>
            <Button variant="outline" leftIcon={<Plus size={15} />} onClick={() => { setEditing(null); setFormOpen(true) }}>Nova edição</Button>
            <Button leftIcon={<Rocket size={15} />} onClick={() => setLaunchOpen(true)}>Lançar tabloide pros associados</Button>
          </>
        }
      />
      <LaunchWizard open={launchOpen} onClose={() => setLaunchOpen(false)} />
      <DataTable data={editions} columns={columns} isLoading={isLoading} searchPlaceholder="Buscar edição..." />

      {curatingEdition && (
        <div className="bg-white rounded-2xl p-6 shadow-card space-y-4">
          <h3 className="text-sm font-semibold text-gray-900 border-b border-gray-100 pb-3">
            Produtos — {curatingEdition.name}
          </h3>
          <CurationPanel edition={curatingEdition} />
        </div>
      )}

      <EditionForm open={formOpen} onClose={() => { setFormOpen(false); setEditing(null) }} edition={editing} queryKeyToInvalidate={['admin-tabloid-editions']} />
      <Modal
        open={!!footerEdition}
        onClose={() => { setFooterEdition(null); setFooterDraft(null) }}
        title={`Rodapé — ${footerEdition?.name ?? ''}`}
        description="Só aparece no verso (página 2). Toque em cada bloco pra preencher."
        size="2xl"
        footer={<Button onClick={() => { setFooterEdition(null); setFooterDraft(null) }}>Fechar</Button>}
      >
        {footerEdition && (
          <FooterBuilder
            value={footerDraft ?? normalizeFooter(footerEdition.footer, footerEdition.footer_text)}
            visibleBlocks={CAMPAIGN_FOOTER_BLOCKS}
            onChange={(next) => {
              setFooterDraft(next)
              saveFooter.mutate({ id: footerEdition.id, footer: next })
            }}
          />
        )}
      </Modal>
      <ConfirmDialog
        open={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={() => deletingId && deleteMutation.mutate(deletingId)}
        title="Excluir edição"
        description="Todos os produtos enviados pra essa edição também serão excluídos. Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        loading={deleteMutation.isPending}
      />
    </div>
  )
}
