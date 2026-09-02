import { useEffect, useRef, useState } from 'react'
import { useParams, Link, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Download, Printer } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { TabloidBackgroundPicker } from '@/components/tabloide/BackgroundPicker'
import { TabloidPriceStylePicker } from '@/components/tabloide/PriceStylePicker'
import { PriceBlock } from '@/components/tabloide/PriceBlock'
import {
  DEFAULT_TABLOID_BACKGROUND,
  DEFAULT_TABLOID_PRICE_STYLE,
  normalizePriceStyle,
  type TabloidPriceStyle,
} from '@/lib/tabloidTheme'
import { TabloidBackHeader, TabloidFooterBar, TabloidFrontFooter } from '@/components/tabloide/TabloidFooterBar'
import { mergeFooters, normalizeFooter, type TabloidFooter } from '@/lib/tabloidFooter'
import { planTabloidPage } from '@/lib/tabloidLayout'
import { downloadTabloidPrintPdf } from '@/lib/tabloidPrintPdf'
import { slugify } from '@/lib/utils'
import { toast } from '@/components/ui/Toast'
import type { TabloidEdition, TabloidProduct } from '@/types/models'

async function fetchEdition(id: string): Promise<TabloidEdition | null> {
  const { data, error } = await supabase.from('tabloid_editions').select('*').eq('id', id).single()
  if (error) return null
  return data as TabloidEdition
}

// Sem aprovação por produto (removida — ver 020_tabloid_remove_approval_gate.sql):
// "pronto" agora é só "a loja já enviou pra produção", mesmo critério do
// export pro InDesign em admin/Tabloides/index.tsx.
async function fetchReadyProducts(editionId: string): Promise<TabloidProduct[]> {
  const [{ data: submissions }, { data: products, error }] = await Promise.all([
    supabase.from('tabloid_submissions').select('associate_id').eq('edition_id', editionId),
    supabase.from('tabloid_products').select('*, associate:associates(id, name)').eq('edition_id', editionId).order('order_index', { ascending: true }),
  ])
  if (error) return []
  const submittedIds = new Set((submissions ?? []).map((s: { associate_id: string }) => s.associate_id))
  return ((products ?? []) as TabloidProduct[]).filter((p) => submittedIds.has(p.associate_id))
}

async function fetchStoreLayouts(editionId: string): Promise<{ associate_id: string; header_image_url: string | null; footer: unknown }[]> {
  const { data, error } = await supabase.from('tabloid_store_layouts').select('associate_id, header_image_url, footer').eq('edition_id', editionId)
  if (error) return []
  return (data ?? []) as { associate_id: string; header_image_url: string | null; footer: unknown }[]
}

function ProductCard({
  p,
  priceStyle,
  col,
  row,
  colSpan,
  rowSpan,
  productCount,
}: {
  p: TabloidProduct
  priceStyle: TabloidPriceStyle
  col: number
  row: number
  colSpan: number
  rowSpan: number
  productCount: number
}) {
  const featured = p.is_featured
  const area = colSpan * rowSpan
  const large = featured || area >= 4 || productCount <= 4
  const medium = large || area >= 2 || productCount <= 9
  const onPhoto = priceStyle.place === 'on-photo'
  const overlayClass =
    priceStyle.align === 'center' ? 'left-1/2 -translate-x-1/2 bottom-1.5' :
    priceStyle.align === 'right' ? 'right-1.5 bottom-1.5' :
    'left-1.5 bottom-1.5'
  const metaAlign =
    priceStyle.align === 'center' ? 'items-center text-center' :
    priceStyle.align === 'right' ? 'items-end text-right' :
    'items-start text-left'
  const price = (
    <PriceBlock
      price={p.price}
      promoPrice={p.promo_price}
      featured={featured}
      style={priceStyle}
    />
  )
  return (
    <div
      className={`rounded-lg border overflow-hidden bg-white flex flex-col min-h-0 min-w-0 ${
        featured ? 'border-primary-400 ring-2 ring-primary-400' : 'border-black/10'
      }`}
      style={{
        gridColumn: `${col} / span ${colSpan}`,
        gridRow: `${row} / span ${rowSpan}`,
      }}
    >
      {/* object-contain (não cover): a foto inteira cabe no box, sem corte.
          O espaço sobrando fica branco ao redor — cada produto tem proporção
          diferente (saco em pé, telha deitada, tubo de lado) e cover comia
          marca/produto. */}
      <div className="flex-1 min-h-0 relative bg-white">
        {p.image_url ? (
          <img
            src={p.image_url}
            alt={p.name}
            className="absolute inset-0 w-full h-full object-contain p-1.5"
          />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center text-[9px] text-gray-300">sem foto</span>
        )}
        {onPhoto && (
          <div className={`absolute z-10 ${overlayClass}`}>
            {price}
          </div>
        )}
      </div>
      <div className={`flex-shrink-0 flex flex-col ${metaAlign} ${large ? 'px-3 pt-2 pb-2.5' : 'px-2 pt-1 pb-1.5'}`}>
        <p className={`font-semibold text-graphite-900 leading-tight ${large ? 'text-sm' : medium ? 'text-xs' : 'text-[10px]'}`}>
          {p.name}
        </p>
        {!onPhoto && price}
        {p.payment_condition && (
          <p className="text-[8px] text-gray-500 leading-tight mt-0.5 truncate w-full">{p.payment_condition}</p>
        )}
      </div>
    </div>
  )
}

/* Grade por página: colunas 1–4 conforme a quantidade, linhas em 1fr até o
   rodapé, cards com span extra na última linha. Sempre preenche a folha —
   não importa se a conta "fecha" em 4 colunas. Destaque (no máx. 1) fica 2×2
   quando cabe. Sem agrupamento por categoria (isso gerava 3ª folha). */
function TabloidBody({ products, page, priceStyle }: { products: TabloidProduct[]; page: 1 | 2; priceStyle: TabloidPriceStyle }) {
  const ordered = [...products].sort((a, b) => Number(b.is_featured) - Number(a.is_featured))
  if (ordered.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center no-print min-h-0">
        <p className="text-xs text-gray-400">Nenhum produto pronto ainda pra essa página.</p>
      </div>
    )
  }
  const { cols, rows, placements } = planTabloidPage(ordered, page)
  const heroId = ordered.find((p) => p.is_featured)?.id
  return (
    <div
      className="flex-1 min-h-0 grid"
      style={{
        padding: '2mm 3mm',
        gap: '2mm',
        gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
        gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
        alignContent: 'stretch',
        justifyContent: 'stretch',
      }}
    >
      {placements.map((pl) => (
        <ProductCard
          key={pl.item.id}
          p={{ ...pl.item, is_featured: pl.item.id === heroId }}
          priceStyle={priceStyle}
          col={pl.col}
          row={pl.row}
          colSpan={pl.colSpan}
          rowSpan={pl.rowSpan}
          productCount={ordered.length}
        />
      ))}
    </div>
  )
}

const HEADER_ASPECT = 210 / 80
/** Até ~12% de diferença na proporção: preenche a faixa 21×8. Além disso, mostra a arte inteira. */
const HEADER_FIT_SLACK = 0.12

function TabloidHeaderArt({ src, background }: { src: string; background: string }) {
  const [fit, setFit] = useState<'contain' | 'cover'>('contain')

  useEffect(() => {
    const im = new Image()
    im.onload = () => {
      const ratio = im.naturalWidth / Math.max(1, im.naturalHeight)
      const drift = Math.abs(ratio - HEADER_ASPECT) / HEADER_ASPECT
      setFit(drift <= HEADER_FIT_SLACK ? 'cover' : 'contain')
    }
    im.src = src
  }, [src])

  return (
    <div className="w-full overflow-hidden flex-shrink-0" style={{ height: '80mm', backgroundColor: background }}>
      <img
        src={src}
        alt="Cabeçalho"
        className={`w-full h-full ${fit === 'cover' ? 'object-cover' : 'object-contain'}`}
      />
    </div>
  )
}

function TabloidPage({
  products,
  page,
  background,
  priceStyle,
  headerImageUrl,
  footer,
}: {
  products: TabloidProduct[]
  page: 1 | 2
  background: string
  priceStyle: TabloidPriceStyle
  headerImageUrl: string | null
  footer: TabloidFooter
}) {
  return (
    <div
      className="tabloide-page relative flex flex-col overflow-hidden shadow-lg"
      style={{
        width: '210mm',
        height: '297mm',
        backgroundColor: background,
        boxSizing: 'border-box',
      }}
    >
      {page === 1 && (
        headerImageUrl ? (
          <TabloidHeaderArt src={headerImageUrl} background={background} />
        ) : (
          <div className="w-full overflow-hidden flex-shrink-0" style={{ height: '80mm', backgroundColor: background }}>
            <p className="text-xs text-gray-400 h-full flex items-center justify-center no-print">
              Cabeçalho (21 × 8 cm) — capa do tema ou da loja
            </p>
          </div>
        )
      )}
      {page === 2 && (
        <TabloidBackHeader accent={priceStyle.color} />
      )}
      <TabloidBody products={products} page={page} priceStyle={priceStyle} />
      {page === 1 && (
        <TabloidFrontFooter accent={priceStyle.color} pageBackground={background} />
      )}
      {page === 2 && (
        <TabloidFooterBar footer={footer} accent={priceStyle.color} pageBackground={background} />
      )}
    </div>
  )
}

/* Tabloide pra impressão: SEMPRE frente e verso A4 (nunca 3 páginas).
   Cabeçalho 21×8cm só na frente. Destaque ganha box 2×2. Fundo escolhível.
   Impressão via Cmd/Ctrl+P — "Salvar como PDF" no diálogo do navegador. */
export default function TabloidePreview() {
  const { id } = useParams<{ id: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const qc = useQueryClient()
  const { data: edition, isLoading } = useQuery({
    queryKey: ['tabloid-preview', id],
    queryFn: () => fetchEdition(id!),
    enabled: !!id,
  })
  const { data: products = [] } = useQuery({
    queryKey: ['tabloid-preview-products', id],
    queryFn: () => fetchReadyProducts(id!),
    enabled: !!id,
  })
  const { data: layouts = [] } = useQuery({
    queryKey: ['tabloid-preview-layouts', id],
    queryFn: () => fetchStoreLayouts(id!),
    enabled: !!id,
  })

  const [background, setBackground] = useState(DEFAULT_TABLOID_BACKGROUND)
  const [priceStyle, setPriceStyle] = useState<TabloidPriceStyle>(DEFAULT_TABLOID_PRICE_STYLE)
  useEffect(() => {
    if (edition?.background_color) setBackground(edition.background_color)
    if (edition) setPriceStyle(normalizePriceStyle(edition.price_style))
  }, [edition?.background_color, edition])

  const saveStyle = useMutation({
    mutationFn: async (patch: { background_color?: string; price_style?: TabloidPriceStyle }) => {
      if (!edition) return
      const { error } = await supabase.from('tabloid_editions').update(patch).eq('id', edition.id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tabloid-preview', id] })
      qc.invalidateQueries({ queryKey: ['admin-tabloid-editions'] })
    },
    onError: (e: Error) => toast.error('Não deu pra salvar o estilo', e.message),
  })

  const handleBackground = (hex: string) => {
    setBackground(hex)
    saveStyle.mutate({ background_color: hex })
  }

  const handlePriceStyle = (next: TabloidPriceStyle) => {
    setPriceStyle(next)
    saveStyle.mutate({ price_style: next })
  }

  const pagesWrapRef = useRef<HTMLDivElement>(null)
  const [pdfProgress, setPdfProgress] = useState<string | null>(null)

  const handleDownloadPrintPdf = async (editionName: string, storeName: string) => {
    const pages = Array.from(pagesWrapRef.current?.querySelectorAll<HTMLElement>('.tabloide-page') ?? [])
    if (pages.length === 0) {
      toast.error('Não achei as páginas pra exportar.')
      return
    }
    const filename = `tabloide-${slugify(editionName)}${storeName ? `-${slugify(storeName)}` : ''}-grafica-300dpi.pdf`
    try {
      await downloadTabloidPrintPdf({
        pageEls: pages,
        filename,
        onProgress: setPdfProgress,
      })
      toast.success('PDF da gráfica pronto!', 'A4 frente e verso, 300 dpi — pode enviar pra gráfica ou abrir pra ajustar.')
    } catch (e) {
      toast.error('Erro ao gerar o PDF', (e as Error).message)
    } finally {
      setPdfProgress(null)
    }
  }

  if (isLoading) return <div className="min-h-screen flex items-center justify-center text-gray-400">Carregando...</div>
  if (!edition) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-500 mb-3">Edição não encontrada.</p>
        <Link to="/admin/tabloides" className="text-primary-600 hover:underline text-sm">Voltar</Link>
      </div>
    </div>
  )

  const stores = Array.from(
    new Map(products.filter((p) => p.associate).map((p) => [p.associate_id, p.associate!.name])).entries()
  ).map(([id, name]) => ({ id, name }))
  const selectedStoreId = searchParams.get('loja') || stores[0]?.id || ''
  const storeProducts = selectedStoreId ? products.filter((p) => p.associate_id === selectedStoreId) : products
  const storeLayout = layouts.find((l) => l.associate_id === selectedStoreId)
  const headerImageUrl = storeLayout?.header_image_url || edition.header_image_url
  const footer = mergeFooters(
    normalizeFooter(edition.footer, edition.footer_text),
    normalizeFooter(storeLayout?.footer),
  )

  const page1Products = storeProducts.filter((p) => (p.page ?? 1) === 1)
  const page2Products = storeProducts.filter((p) => p.page === 2)

  return (
    <div className="preview-shell bg-gray-300 min-h-screen">
      <style>{`
        @page { size: A4 portrait; margin: 0; }
        @media print {
          .no-print { display: none !important; }
          html, body { margin: 0 !important; padding: 0 !important; background: white !important; height: auto !important; }
          .preview-shell { background: white !important; min-height: 0 !important; }
          .preview-pages { display: block !important; padding: 0 !important; gap: 0 !important; }
          .tabloide-page {
            box-shadow: none !important;
            margin: 0 !important;
            width: 210mm !important;
            height: 297mm !important;
            max-height: 297mm !important;
            overflow: hidden !important;
            page-break-after: always;
            break-after: page;
            page-break-inside: avoid;
            break-inside: avoid;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .tabloide-page:last-child {
            page-break-after: auto;
            break-after: auto;
          }
        }
      `}</style>

      <div className="no-print sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-2.5 flex items-center gap-4 flex-wrap">
        <Link to="/admin/tabloides" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
          <ArrowLeft size={15} /> Voltar
        </Link>
        <p className="text-sm font-medium text-gray-700 min-w-0 truncate">{edition.name} — frente e verso A4</p>
        {stores.length > 0 && (
          <select
            value={selectedStoreId}
            onChange={(e) => setSearchParams(e.target.value ? { loja: e.target.value } : {})}
            className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 bg-white"
            title="Loja do miolo"
          >
            {stores.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        )}
        <div className="flex-1 flex items-center gap-3 flex-wrap justify-end">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 hidden sm:inline">Fundo</span>
            <TabloidBackgroundPicker value={background} onChange={handleBackground} compact />
          </div>
          <TabloidPriceStylePicker value={priceStyle} onChange={handlePriceStyle} compact />
        </div>
        <button
          type="button"
          disabled={!!pdfProgress}
          onClick={() => handleDownloadPrintPdf(edition.name, stores.find((s) => s.id === selectedStoreId)?.name ?? '')}
          className="inline-flex items-center gap-2 text-sm font-medium bg-primary-500 text-graphite-900 px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-60"
        >
          <Download size={15} /> {pdfProgress ?? 'Baixar PDF gráfica (300 dpi)'}
        </button>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 px-3 py-2 rounded-lg hover:bg-gray-100"
          title="Impressão rápida do navegador — qualidade menor"
        >
          <Printer size={15} /> Imprimir
        </button>
      </div>

      <div ref={pagesWrapRef} className="preview-pages py-8 flex flex-col items-center gap-8">
        <TabloidPage products={page1Products} page={1} background={background} priceStyle={priceStyle} headerImageUrl={headerImageUrl} footer={footer} />
        <TabloidPage products={page2Products} page={2} background={background} priceStyle={priceStyle} headerImageUrl={headerImageUrl} footer={footer} />
      </div>
    </div>
  )
}
