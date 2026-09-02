import { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Save, Eye, Plus, Trash2, Info } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { PageHeader } from '@/components/admin/PageHeader'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { RichTextEditor } from '@/components/admin/RichTextEditor'
import { toast } from '@/components/ui/Toast'
import * as TabsPrimitive from '@radix-ui/react-tabs'
import { cn } from '@/lib/utils'
import { PAGE_ICON_NAMES } from '@/lib/pageIconMap'

type MissaoCard = { title: string; text: string }
type MissaoContent = { title: string; cards: MissaoCard[] }
type HistoriaContent = { title: string; description: string; description_json?: Record<string, unknown> }

/* Migra texto simples (salvo pelo antigo campo de textarea) pra um doc do Tiptap,
   pra quem já tinha conteúdo salvo não perder nada ao abrir no editor rico —
   cada linha em branco vira um parágrafo separado. */
function textToDoc(text: string): Record<string, unknown> {
  const paragraphs = text.split(/\n{2,}/).map(p => p.trim())
  return {
    type: 'doc',
    content: paragraphs.map(p => p ? { type: 'paragraph', content: [{ type: 'text', text: p }] } : { type: 'paragraph' }),
  }
}
type PageBenefit = { icon: string; title: string; desc: string }
type LandingContent = { tag: string; title: string; title_highlight: string; description: string; benefits: PageBenefit[] }
type ContatoContent = { tag: string; title: string; title_highlight: string; description: string }

async function fetchPagesContent() {
  const { data, error } = await supabase.from('home_content').select('*')
    .in('section', ['quem_somos_missao', 'quem_somos_historia', 'associar_page', 'fornecedor_page', 'contato_page'])
  if (error) throw error
  const map: Record<string, Record<string, unknown>> = {}
  for (const row of data) map[row.section] = row.content
  return map
}

async function saveSection(section: string, content: Record<string, unknown>) {
  const { error } = await supabase.from('home_content').upsert({ section, content }, { onConflict: 'section' })
  if (error) throw error
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-card space-y-4">
      <h3 className="text-sm font-semibold text-gray-900 border-b border-gray-100 pb-3">{title}</h3>
      {children}
    </div>
  )
}

function InfoBanner({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5 bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-800">
      <Info size={16} className="flex-shrink-0 mt-0.5" />
      <p>{children}</p>
    </div>
  )
}

const EMPTY_MISSAO: MissaoContent = {
  title: 'Fortalecer empresas do setor de materiais de construção através da colaboração, conhecimento e inovação.',
  cards: [
    { title: 'Missão', text: '' },
    { title: 'Visão', text: '' },
    { title: 'Valores', text: '' },
  ],
}
const EMPTY_HISTORIA: HistoriaContent = { title: '', description: '' }
const EMPTY_LANDING: LandingContent = { tag: '', title: '', title_highlight: '', description: '', benefits: [] }
const EMPTY_CONTATO: ContatoContent = { tag: '', title: '', title_highlight: '', description: '' }

function MissaoEditor({ initial, onSave, saving }: { initial: MissaoContent; onSave: (d: MissaoContent) => void; saving: boolean }) {
  const [form, setForm] = useState(initial)
  useEffect(() => setForm(initial), [initial])
  const setCard = (i: number, key: keyof MissaoCard, val: string) =>
    setForm(f => { const cards = [...f.cards]; cards[i] = { ...cards[i], [key]: val }; return { ...f, cards } })
  const addCard = () => setForm(f => ({ ...f, cards: [...f.cards, { title: '', text: '' }] }))
  const removeCard = (i: number) => setForm(f => ({ ...f, cards: f.cards.filter((_, idx) => idx !== i) }))

  return (
    <SectionCard title="Nossa Missão — Missão, Visão e Valores">
      <Input label="Título da seção" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
      <div className="space-y-4 mt-2">
        {form.cards.map((card, i) => (
          <div key={i} className="border border-gray-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-gray-500">Cartão {i + 1}</p>
              <button onClick={() => removeCard(i)} className="text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
            </div>
            <Input label="Título" value={card.title} onChange={e => setCard(i, 'title', e.target.value)} placeholder="Ex: Missão" />
            <Textarea label="Texto" rows={2} value={card.text} onChange={e => setCard(i, 'text', e.target.value)} />
          </div>
        ))}
      </div>
      <div className="flex gap-3">
        <Button variant="outline" size="sm" leftIcon={<Plus size={13} />} onClick={addCard}>Adicionar cartão</Button>
        <Button leftIcon={<Save size={14} />} loading={saving} onClick={() => onSave(form)}>Salvar</Button>
      </div>
    </SectionCard>
  )
}

function HistoriaEditor({ initial, onSave, saving }: { initial: HistoriaContent; onSave: (d: HistoriaContent) => void; saving: boolean }) {
  const [form, setForm] = useState(initial)
  useEffect(() => setForm(initial), [initial])
  const [content, setContent] = useState<{ json: Record<string, unknown>; html: string }>(() => ({
    json: initial.description_json ?? (initial.description ? textToDoc(initial.description) : { type: 'doc', content: [{ type: 'paragraph' }] }),
    html: '',
  }))
  return (
    <SectionCard title="Linha do Tempo">
      <Input label="Título" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Nossa história em construção." />
      <RichTextEditor
        label="Texto"
        value={content.json}
        onChange={(json, html) => setContent({ json, html })}
        placeholder="Escreva o texto da linha do tempo..."
      />
      <Button
        leftIcon={<Save size={14} />}
        loading={saving}
        onClick={() => onSave({ ...form, description_json: content.json, description: content.html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() })}
      >
        Salvar
      </Button>
    </SectionCard>
  )
}

function LandingEditor({ title, initial, onSave, saving }: { title: string; initial: LandingContent; onSave: (d: LandingContent) => void; saving: boolean }) {
  const [form, setForm] = useState(initial)
  useEffect(() => setForm(initial), [initial])
  const benefits = form.benefits ?? []
  const setBenefit = (i: number, key: keyof PageBenefit, val: string) =>
    setForm(f => { const arr = [...(f.benefits ?? [])]; arr[i] = { ...arr[i], [key]: val }; return { ...f, benefits: arr } })
  const addBenefit = () => setForm(f => ({ ...f, benefits: [...(f.benefits ?? []), { icon: 'TrendingUp', title: '', desc: '' }] }))
  const removeBenefit = (i: number) => setForm(f => ({ ...f, benefits: (f.benefits ?? []).filter((_, idx) => idx !== i) }))

  return (
    <SectionCard title={title}>
      <div className="grid grid-cols-2 gap-4">
        <Input label="Tag (acima do título)" value={form.tag} onChange={e => setForm(f => ({ ...f, tag: e.target.value }))} />
        <Input label="Título" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
      </div>
      <Input label="Parte em destaque (laranja)" value={form.title_highlight} onChange={e => setForm(f => ({ ...f, title_highlight: e.target.value }))} />
      <Textarea label="Descrição" rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />

      <div className="space-y-4 mt-2">
        <p className="text-xs font-medium text-gray-700">Lista de benefícios</p>
        {benefits.map((b, i) => (
          <div key={i} className="border border-gray-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-gray-500">Item {i + 1}</p>
              <button onClick={() => removeBenefit(i)} className="text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <p className="text-xs font-medium text-gray-700 mb-1">Ícone</p>
                <select value={b.icon} onChange={e => setBenefit(i, 'icon', e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-white">
                  {PAGE_ICON_NAMES.map(ic => <option key={ic} value={ic}>{ic}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <Input label="Título" value={b.title} onChange={e => setBenefit(i, 'title', e.target.value)} />
              </div>
            </div>
            <Textarea label="Descrição" rows={2} value={b.desc} onChange={e => setBenefit(i, 'desc', e.target.value)} />
          </div>
        ))}
      </div>
      <div className="flex gap-3">
        <Button variant="outline" size="sm" leftIcon={<Plus size={13} />} onClick={addBenefit}>Adicionar benefício</Button>
        <Button leftIcon={<Save size={14} />} loading={saving} onClick={() => onSave(form)}>Salvar</Button>
      </div>
    </SectionCard>
  )
}

function ContatoEditor({ initial, onSave, saving }: { initial: ContatoContent; onSave: (d: ContatoContent) => void; saving: boolean }) {
  const [form, setForm] = useState(initial)
  useEffect(() => setForm(initial), [initial])
  return (
    <SectionCard title="Cabeçalho da página Fale Conosco">
      <div className="grid grid-cols-2 gap-4">
        <Input label="Tag (acima do título)" value={form.tag} onChange={e => setForm(f => ({ ...f, tag: e.target.value }))} />
        <Input label="Título" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
      </div>
      <Input label="Parte em destaque (laranja)" value={form.title_highlight} onChange={e => setForm(f => ({ ...f, title_highlight: e.target.value }))} />
      <Textarea label="Descrição" rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
      <p className="text-xs text-gray-400">Endereço, telefone, e-mail e WhatsApp são editados em Configurações, não aqui.</p>
      <Button leftIcon={<Save size={14} />} loading={saving} onClick={() => onSave(form)}>Salvar</Button>
    </SectionCard>
  )
}

export default function AdminPaginas() {
  const qc = useQueryClient()
  const { data: sections = {}, isLoading } = useQuery({ queryKey: ['admin-pages-content'], queryFn: fetchPagesContent })
  const [savingSection, setSavingSection] = useState<string | null>(null)

  const save = async (section: string, content: Record<string, unknown>) => {
    setSavingSection(section)
    try {
      await saveSection(section, content)
      qc.invalidateQueries({ queryKey: ['admin-pages-content'] })
      qc.invalidateQueries({ queryKey: ['quem-somos-content'] })
      qc.invalidateQueries({ queryKey: ['associar-page-content'] })
      qc.invalidateQueries({ queryKey: ['fornecedor-page-content'] })
      qc.invalidateQueries({ queryKey: ['contato-page-content'] })
      toast.success('Seção salva!')
    } catch (e) {
      toast.error('Erro ao salvar seção', (e as Error).message)
    } finally {
      setSavingSection(null)
    }
  }

  if (isLoading) return (
    <div className="space-y-6">
      <div className="h-10 bg-gray-100 animate-pulse rounded-xl w-64" />
      {[1, 2, 3].map(i => <div key={i} className="h-48 bg-gray-100 animate-pulse rounded-2xl" />)}
    </div>
  )

  const tabs = [
    { value: 'quem-somos', label: 'Quem Somos' },
    { value: 'associar', label: 'Quero me Associar' },
    { value: 'fornecedor', label: 'Sou Fornecedor' },
    { value: 'contato', label: 'Contato' },
  ]

  return (
    <div className="space-y-6">
      <PageHeader title="Páginas Internas" description="Conteúdo das páginas institucionais e de formulário do site."
        actions={
          <Button variant="outline" leftIcon={<Eye size={15} />} onClick={() => window.open('/quem-somos', '_blank')}>
            Ver site
          </Button>
        }
      />
      <TabsPrimitive.Root defaultValue="quem-somos">
        <TabsPrimitive.List className="flex bg-gray-100 rounded-xl p-1 gap-1 w-fit">
          {tabs.map(tab => (
            <TabsPrimitive.Trigger key={tab.value} value={tab.value}
              className={cn('px-4 py-1.5 text-sm font-medium rounded-lg transition-all', 'data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-gray-900', 'data-[state=inactive]:text-gray-500 hover:text-gray-700')}>
              {tab.label}
            </TabsPrimitive.Trigger>
          ))}
        </TabsPrimitive.List>

        <TabsPrimitive.Content value="quem-somos" className="mt-4 space-y-4">
          <InfoBanner>
            O título/subtítulo do topo, as estatísticas e a lista de "Benefícios" desta página são
            os mesmos campos usados na Home — edite-os em <strong>Editor da Home → Sobre / Estatísticas / Benefícios</strong>.
            Abaixo estão os campos exclusivos desta página.
          </InfoBanner>
          <MissaoEditor initial={(sections.quem_somos_missao as MissaoContent) ?? EMPTY_MISSAO} onSave={d => save('quem_somos_missao', d as unknown as Record<string, unknown>)} saving={savingSection === 'quem_somos_missao'} />
          <HistoriaEditor initial={(sections.quem_somos_historia as HistoriaContent) ?? EMPTY_HISTORIA} onSave={d => save('quem_somos_historia', d as unknown as Record<string, unknown>)} saving={savingSection === 'quem_somos_historia'} />
          <InfoBanner>
            A faixa final "Faça parte" desta página usa o mesmo conteúdo da seção <strong>CTA</strong> do Editor da Home.
          </InfoBanner>
        </TabsPrimitive.Content>

        <TabsPrimitive.Content value="associar" className="mt-4">
          <LandingEditor title="Página Quero me Associar" initial={(sections.associar_page as LandingContent) ?? EMPTY_LANDING} onSave={d => save('associar_page', d as unknown as Record<string, unknown>)} saving={savingSection === 'associar_page'} />
        </TabsPrimitive.Content>

        <TabsPrimitive.Content value="fornecedor" className="mt-4">
          <LandingEditor title="Página Sou Fornecedor" initial={(sections.fornecedor_page as LandingContent) ?? EMPTY_LANDING} onSave={d => save('fornecedor_page', d as unknown as Record<string, unknown>)} saving={savingSection === 'fornecedor_page'} />
        </TabsPrimitive.Content>

        <TabsPrimitive.Content value="contato" className="mt-4">
          <ContatoEditor initial={(sections.contato_page as ContatoContent) ?? EMPTY_CONTATO} onSave={d => save('contato_page', d as unknown as Record<string, unknown>)} saving={savingSection === 'contato_page'} />
        </TabsPrimitive.Content>
      </TabsPrimitive.Root>
    </div>
  )
}
