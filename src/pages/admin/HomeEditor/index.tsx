import { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Save, Eye, Plus, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { PageHeader } from '@/components/admin/PageHeader'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { ImageUpload } from '@/components/admin/ImageUpload'
import { toast } from '@/components/ui/Toast'
import * as TabsPrimitive from '@radix-ui/react-tabs'
import { cn } from '@/lib/utils'

type HeroContent = {
  tag: string; title: string; title_highlight: string; description: string
  cta_primary_label: string; cta_primary_href: string
  cta_secondary_label: string; cta_secondary_href: string
  image_url?: string | null
}

type StatsContent = { items: Array<{ value: string; label: string; suffix?: string }> }
type AboutContent = { tag: string; title: string; title_highlight: string; description: string; image_url?: string; highlights?: string[] }
type BenefitsContent = { tag?: string; title?: string; items: Array<{ icon: string; title: string; description: string }> }
type CtaContent = { title: string; description: string; cta_primary_label: string; cta_primary_href: string; cta_secondary_label: string; cta_secondary_href: string }

const AVAILABLE_ICONS = ['BarChart2','Users','Handshake','GraduationCap','Lightbulb','TrendingUp','Star','Shield','Target','Award','Zap','Heart','Globe','Building2','Truck','Package']

async function fetchHomeContent() {
  const { data, error } = await supabase.from('home_content').select('*')
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

function LogoEditor() {
  const qc = useQueryClient()
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    supabase.from('settings').select('value').eq('key', 'site').single().then(({ data }) => {
      if (data?.value) setLogoUrl((data.value as Record<string, string>).logo_url ?? null)
    })
  }, [])

  const save = async () => {
    setSaving(true)
    try {
      const { data: existing } = await supabase.from('settings').select('value').eq('key', 'site').single()
      const current = (existing?.value ?? {}) as Record<string, unknown>
      await supabase.from('settings').upsert({ key: 'site', value: { ...current, logo_url: logoUrl } }, { onConflict: 'key' })
      qc.invalidateQueries({ queryKey: ['header-site-settings'] })
      qc.invalidateQueries({ queryKey: ['footer-settings'] })
      toast.success('Logo salvo!')
    } catch {
      toast.error('Erro ao salvar logo')
    } finally {
      setSaving(false)
    }
  }

  return (
    <SectionCard title="Logo do site (header e rodapé)">
      <p className="text-xs text-gray-500 -mt-2">Faça upload do arquivo SVG, PNG ou WebP. Recomendado: fundo transparente.</p>
      <ImageUpload
        value={logoUrl}
        onChange={setLogoUrl}
        bucket="site-assets"
        folder="logo"
        label="Logo"
        hint="PNG ou SVG com fundo transparente. Altura exibida: 32px."
      />
      <Button leftIcon={<Save size={14} />} loading={saving} onClick={save}>Salvar logo</Button>
    </SectionCard>
  )
}

function HeroEditor({ initial, onSave, saving }: { initial: HeroContent; onSave: (d: HeroContent) => void; saving: boolean }) {
  const [form, setForm] = useState(initial)
  useEffect(() => setForm(initial), [initial])
  const set = (key: keyof HeroContent) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm(f => ({ ...f, [key]: e.target.value }))
  return (
    <div className="space-y-4">
      <LogoEditor />
      <SectionCard title="Hero — Textos e botões">
        <Input label="Tag (texto pequeno acima do título)" value={form.tag} onChange={set('tag')} />
        <Input label="Título principal" value={form.title} onChange={set('title')} />
        <Input label="Parte em destaque (laranja)" value={form.title_highlight} onChange={set('title_highlight')} />
        <Textarea label="Descrição" rows={2} value={form.description} onChange={set('description')} />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Botão primário — texto" value={form.cta_primary_label} onChange={set('cta_primary_label')} />
          <Input label="Botão primário — link" value={form.cta_primary_href} onChange={set('cta_primary_href')} />
          <Input label="Botão secundário — texto" value={form.cta_secondary_label} onChange={set('cta_secondary_label')} />
          <Input label="Botão secundário — link" value={form.cta_secondary_href} onChange={set('cta_secondary_href')} />
        </div>
        <ImageUpload
          label="Imagem de fundo do hero"
          hint="Foto de alta resolução (1920×1080px ou maior). JPG ou WebP."
          value={form.image_url ?? null}
          onChange={v => setForm(f => ({ ...f, image_url: v }))}
          bucket="gcasa-public"
          folder="hero"
        />
        <Button leftIcon={<Save size={14} />} loading={saving} onClick={() => onSave(form)}>Salvar Hero</Button>
      </SectionCard>
    </div>
  )
}

function StatsEditor({ initial, onSave, saving }: { initial: StatsContent; onSave: (d: StatsContent) => void; saving: boolean }) {
  const [items, setItems] = useState(initial.items ?? [])
  useEffect(() => setItems(initial.items ?? []), [initial])
  const setItem = (i: number, key: string, val: string) => setItems(prev => prev.map((it, idx) => idx === i ? { ...it, [key]: val } : it))
  return (
    <SectionCard title="Seção de Estatísticas">
      <div className="space-y-3">
        {items.map((item, i) => (
          <div key={i} className="grid grid-cols-3 gap-2">
            <Input label={i === 0 ? 'Valor' : undefined} value={item.value} onChange={e => setItem(i, 'value', e.target.value)} placeholder="Ex: 18" />
            <Input label={i === 0 ? 'Legenda' : undefined} value={item.label} onChange={e => setItem(i, 'label', e.target.value)} placeholder="Lojas" />
            <Input label={i === 0 ? 'Sufixo' : undefined} value={item.suffix ?? ''} onChange={e => setItem(i, 'suffix', e.target.value)} placeholder="+ (opcional)" />
          </div>
        ))}
      </div>
      <Button leftIcon={<Save size={14} />} loading={saving} onClick={() => onSave({ items })}>Salvar Estatísticas</Button>
    </SectionCard>
  )
}

function AboutEditor({ initial, onSave, saving }: { initial: AboutContent; onSave: (d: AboutContent) => void; saving: boolean }) {
  const [form, setForm] = useState(initial)
  useEffect(() => setForm(initial), [initial])
  const set = (key: keyof AboutContent) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm(f => ({ ...f, [key]: e.target.value }))
  const highlights = form.highlights ?? []
  const setHighlight = (i: number, val: string) => setForm(f => { const h = [...(f.highlights ?? [])]; h[i] = val; return { ...f, highlights: h } })
  const addHighlight = () => setForm(f => ({ ...f, highlights: [...(f.highlights ?? []), ''] }))
  const removeHighlight = (i: number) => setForm(f => ({ ...f, highlights: (f.highlights ?? []).filter((_, idx) => idx !== i) }))
  return (
    <SectionCard title="Seção Sobre / Propósito">
      <Input label="Tag" value={form.tag} onChange={set('tag')} />
      <Input label="Título" value={form.title} onChange={set('title')} />
      <Input label="Parte em destaque (vermelho)" value={form.title_highlight} onChange={set('title_highlight')} />
      <Textarea label="Descrição" rows={3} value={form.description} onChange={set('description')} />
      <ImageUpload label="Foto / imagem da seção" value={form.image_url ?? ''} onChange={url => setForm(f => ({ ...f, image_url: url }))} bucket="site-assets" folder="about" />
      <div>
        <p className="text-xs font-medium text-gray-700 mb-2">Destaques (checklist lateral)</p>
        <div className="space-y-2">
          {highlights.map((h, i) => (
            <div key={i} className="flex gap-2">
              <Input value={h} onChange={e => setHighlight(i, e.target.value)} placeholder={`Item ${i + 1}`} />
              <button onClick={() => removeHighlight(i)} className="p-2 text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={13} /></button>
            </div>
          ))}
        </div>
        <Button variant="outline" size="sm" leftIcon={<Plus size={13} />} onClick={addHighlight} className="mt-2">Adicionar item</Button>
      </div>
      <Button leftIcon={<Save size={14} />} loading={saving} onClick={() => onSave(form)}>Salvar Sobre</Button>
    </SectionCard>
  )
}

type BenefitItem = { icon: string; title: string; description: string }
const EMPTY_BENEFIT: BenefitItem = { icon: 'TrendingUp', title: '', description: '' }

function BenefitsEditor({ initial, onSave, saving }: { initial: BenefitsContent; onSave: (d: BenefitsContent) => void; saving: boolean }) {
  const [form, setForm] = useState(initial)
  useEffect(() => setForm(initial), [initial])
  const items = form.items ?? []
  const setItem = (i: number, key: keyof BenefitItem, val: string) =>
    setForm(f => { const arr = [...(f.items ?? [])]; arr[i] = { ...arr[i], [key]: val }; return { ...f, items: arr } })
  const addItem = () => setForm(f => ({ ...f, items: [...(f.items ?? []), { ...EMPTY_BENEFIT }] }))
  const removeItem = (i: number) => setForm(f => ({ ...f, items: (f.items ?? []).filter((_, idx) => idx !== i) }))
  return (
    <SectionCard title="Seção Benefícios">
      <div className="grid grid-cols-2 gap-4">
        <Input label="Tag" value={form.tag ?? ''} onChange={e => setForm(f => ({ ...f, tag: e.target.value }))} />
        <Input label="Título" value={form.title ?? ''} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
      </div>
      <div className="space-y-4 mt-2">
        {items.map((item, i) => (
          <div key={i} className="border border-gray-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-gray-500">Item {i + 1}</p>
              <button onClick={() => removeItem(i)} className="text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <p className="text-xs font-medium text-gray-700 mb-1">Ícone</p>
                <select value={item.icon} onChange={e => setItem(i, 'icon', e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-white">
                  {AVAILABLE_ICONS.map(ic => <option key={ic} value={ic}>{ic}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <Input label="Título" value={item.title} onChange={e => setItem(i, 'title', e.target.value)} />
              </div>
            </div>
            <Textarea label="Descrição" rows={2} value={item.description} onChange={e => setItem(i, 'description', e.target.value)} />
          </div>
        ))}
      </div>
      <div className="flex gap-3">
        <Button variant="outline" size="sm" leftIcon={<Plus size={13} />} onClick={addItem}>Adicionar benefício</Button>
        <Button leftIcon={<Save size={14} />} loading={saving} onClick={() => onSave(form)}>Salvar Benefícios</Button>
      </div>
    </SectionCard>
  )
}

function CtaEditor({ initial, onSave, saving }: { initial: CtaContent; onSave: (d: CtaContent) => void; saving: boolean }) {
  const [form, setForm] = useState(initial)
  useEffect(() => setForm(initial), [initial])
  const set = (key: keyof CtaContent) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm(f => ({ ...f, [key]: e.target.value }))
  return (
    <SectionCard title="Seção CTA — Chamada para ação">
      <Input label="Título" value={form.title} onChange={set('title')} />
      <Textarea label="Descrição" rows={2} value={form.description} onChange={set('description')} />
      <div className="grid grid-cols-2 gap-4">
        <Input label="Botão primário — texto" value={form.cta_primary_label} onChange={set('cta_primary_label')} />
        <Input label="Botão primário — link" value={form.cta_primary_href} onChange={set('cta_primary_href')} />
        <Input label="Botão secundário — texto" value={form.cta_secondary_label} onChange={set('cta_secondary_label')} />
        <Input label="Botão secundário — link" value={form.cta_secondary_href} onChange={set('cta_secondary_href')} />
      </div>
      <Button leftIcon={<Save size={14} />} loading={saving} onClick={() => onSave(form)}>Salvar CTA</Button>
    </SectionCard>
  )
}

const EMPTY_HERO: HeroContent = { tag: '', title: '', title_highlight: '', description: '', cta_primary_label: '', cta_primary_href: '', cta_secondary_label: '', cta_secondary_href: '' }
const EMPTY_STATS: StatsContent = { items: [] }
const EMPTY_ABOUT: AboutContent = { tag: '', title: '', title_highlight: '', description: '', highlights: [] }
const EMPTY_BENEFITS: BenefitsContent = { tag: '', title: '', items: [] }
const EMPTY_CTA: CtaContent = { title: '', description: '', cta_primary_label: '', cta_primary_href: '', cta_secondary_label: '', cta_secondary_href: '' }

export default function AdminHomeEditor() {
  const qc = useQueryClient()
  const { data: sections = {}, isLoading } = useQuery({ queryKey: ['admin-home-content'], queryFn: fetchHomeContent })
  const [savingSection, setSavingSection] = useState<string | null>(null)

  const save = async (section: string, content: Record<string, unknown>) => {
    setSavingSection(section)
    try {
      await saveSection(section, content)
      qc.invalidateQueries({ queryKey: ['admin-home-content'] })
      qc.invalidateQueries({ queryKey: ['home-content'] })
      qc.invalidateQueries({ queryKey: ['benefits-home'] })
      qc.invalidateQueries({ queryKey: ['about-home'] })
      qc.invalidateQueries({ queryKey: ['cta-home'] })
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
      {[1,2,3,4].map(i => <div key={i} className="h-48 bg-gray-100 animate-pulse rounded-2xl" />)}
    </div>
  )

  const tabs = [
    { value: 'hero', label: 'Hero' },
    { value: 'stats', label: 'Estatísticas' },
    { value: 'about', label: 'Sobre' },
    { value: 'benefits', label: 'Benefícios' },
    { value: 'cta', label: 'CTA' },
  ]

  return (
    <div className="space-y-6">
      <PageHeader title="Editor da Home" description="Edite o conteúdo de cada seção da página inicial."
        actions={
          <Button variant="outline" leftIcon={<Eye size={15} />} onClick={() => window.open('/', '_blank')}>
            Ver site
          </Button>
        }
      />
      <TabsPrimitive.Root defaultValue="hero">
        <TabsPrimitive.List className="flex bg-gray-100 rounded-xl p-1 gap-1 w-fit">
          {tabs.map(tab => (
            <TabsPrimitive.Trigger key={tab.value} value={tab.value}
              className={cn('px-4 py-1.5 text-sm font-medium rounded-lg transition-all', 'data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-gray-900', 'data-[state=inactive]:text-gray-500 hover:text-gray-700')}>
              {tab.label}
            </TabsPrimitive.Trigger>
          ))}
        </TabsPrimitive.List>
        <TabsPrimitive.Content value="hero" className="mt-4">
          <HeroEditor initial={(sections.hero as HeroContent) ?? EMPTY_HERO} onSave={d => save('hero', d as unknown as Record<string, unknown>)} saving={savingSection === 'hero'} />
        </TabsPrimitive.Content>
        <TabsPrimitive.Content value="stats" className="mt-4">
          <StatsEditor initial={(sections.stats as StatsContent) ?? EMPTY_STATS} onSave={d => save('stats', d as unknown as Record<string, unknown>)} saving={savingSection === 'stats'} />
        </TabsPrimitive.Content>
        <TabsPrimitive.Content value="about" className="mt-4">
          <AboutEditor initial={(sections.about as AboutContent) ?? EMPTY_ABOUT} onSave={d => save('about', d as unknown as Record<string, unknown>)} saving={savingSection === 'about'} />
        </TabsPrimitive.Content>
        <TabsPrimitive.Content value="benefits" className="mt-4">
          <BenefitsEditor initial={(sections.benefits as BenefitsContent) ?? EMPTY_BENEFITS} onSave={d => save('benefits', d as unknown as Record<string, unknown>)} saving={savingSection === 'benefits'} />
        </TabsPrimitive.Content>
        <TabsPrimitive.Content value="cta" className="mt-4">
          <CtaEditor initial={(sections.cta as CtaContent) ?? EMPTY_CTA} onSave={d => save('cta', d as unknown as Record<string, unknown>)} saving={savingSection === 'cta'} />
        </TabsPrimitive.Content>
      </TabsPrimitive.Root>
    </div>
  )
}
