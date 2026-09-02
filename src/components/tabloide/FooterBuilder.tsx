import { useEffect, useState } from 'react'
import { Check, Image, MapPin, Award, MessageCircle, AlignLeft, Pencil, Plus, Trash2 } from 'lucide-react'
import { ImageUpload } from '@/components/admin/ImageUpload'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { TabloidFooterBar } from '@/components/tabloide/TabloidFooterBar'
import {
  DEFAULT_CTA_PHRASE,
  DEFAULT_FINE_PRINT,
  DEFAULT_PHONE_LABEL,
  EMPTY_TABLOID_FOOTER,
  footerBlockDone,
  normalizeFooter,
  type TabloidFooter,
} from '@/lib/tabloidFooter'

export type FooterBlockId = 'logo' | 'contact' | 'seal' | 'cta' | 'fine'

const BLOCKS: { id: FooterBlockId; n: number; title: string; hint: string; icon: typeof Image }[] = [
  { id: 'logo', n: 1, title: 'Logo da loja', hint: 'Grande, à esquerda — 800 × 360 px', icon: Image },
  { id: 'contact', n: 2, title: 'Telefone, endereço e redes', hint: 'Ao lado do logo', icon: MapPin },
  { id: 'seal', n: 3, title: 'Selo do centro', hint: 'Logo GCasa — dá pra trocar', icon: Award },
  { id: 'cta', n: 4, title: 'Chamada WhatsApp', hint: 'Frase + número à direita', icon: MessageCircle },
  { id: 'fine', n: 5, title: 'Letras miúdas', hint: 'Faixa de baixo, condições da oferta', icon: AlignLeft },
]

function BlockCard({ n, title, hint, done, onEdit }: {
  n: number
  title: string
  hint: string
  done: boolean
  onEdit: () => void
}) {
  return (
    <button
      type="button"
      onClick={onEdit}
      className="w-full flex items-center gap-3 bg-white border border-gray-100 rounded-2xl p-4 text-left hover:border-primary-300 hover:shadow-card active:scale-[0.99] transition-all"
    >
      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm ${
        done ? 'bg-green-100 text-green-700' : 'bg-primary-50 text-primary-700'
      }`}>
        {done ? <Check size={18} /> : n}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-graphite-900">{title}</p>
        <p className="text-xs text-gray-400">{done ? 'Preenchido — toque pra editar' : hint}</p>
      </div>
      <Pencil size={14} className="text-gray-300 flex-shrink-0" />
    </button>
  )
}

export function FooterBuilder({
  value,
  onChange,
  visibleBlocks,
  previewFooter,
}: {
  value: TabloidFooter
  onChange: (next: TabloidFooter) => void
  visibleBlocks?: readonly FooterBlockId[]
  /** Prévia pode juntar tema + loja (selo/letras do admin + dados da loja). */
  previewFooter?: TabloidFooter
}) {
  const footer = normalizeFooter(value)
  const done = footerBlockDone(footer)
  const [open, setOpen] = useState<FooterBlockId | null>(null)
  const [draft, setDraft] = useState<TabloidFooter>(footer)
  const blocks = visibleBlocks ? BLOCKS.filter((b) => visibleBlocks.includes(b.id)) : BLOCKS

  useEffect(() => {
    if (open) setDraft(normalizeFooter(value))
  }, [open, value])

  const saveBlock = () => {
    onChange(normalizeFooter(draft))
    setOpen(null)
  }

  return (
    <div className="space-y-4">
      <div className="bg-gray-100 rounded-2xl p-3 overflow-hidden">
        <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-2 px-1">Prévia — só na página 2</p>
        <div className="bg-white rounded-lg overflow-hidden shadow-sm">
          <TabloidFooterBar footer={previewFooter ?? footer} showPlaceholders />
        </div>
      </div>

      <div className="space-y-2">
        {blocks.map((b, i) => (
          <BlockCard
            key={b.id}
            n={i + 1}
            title={b.title}
            hint={b.hint}
            done={done[b.id]}
            onEdit={() => setOpen(b.id)}
          />
        ))}
      </div>

      <Modal
        nested
        open={open === 'logo'}
        onClose={() => setOpen(null)}
        title="1. Logo da loja"
        description="Aparece grande à esquerda do rodapé, no verso do tabloide."
        size="lg"
        footer={<><Button variant="outline" onClick={() => setOpen(null)}>Cancelar</Button><Button onClick={saveBlock}>Salvar bloco</Button></>}
      >
        <ImageUpload
          label="Logo da empresa"
          value={draft.logo_url}
          onChange={(url) => setDraft({ ...draft, logo_url: url })}
          folder="tabloide/footer"
          fit="contain"
          previewBg="checker"
        />
        <div className="mt-3 rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5 text-xs text-gray-600 space-y-1.5">
          <p className="font-semibold text-graphite-800">Tamanho ideal pro designer</p>
          <p><span className="font-medium text-graphite-800">800 × 360 px</span> (PNG, horizontal) — cabe em ~54 × 26 mm no A4 a 300 dpi, com folga.</p>
          <p>O rodapé é <span className="font-medium">branco</span>. Se o logo tiver branco, dourado ou partes claras, exporte <span className="font-medium">com fundo branco sólido</span> — PNG transparente some na impressão.</p>
          <p>PNG transparente só funciona se o logo for escuro ou bem colorido (contrasta no branco).</p>
        </div>
      </Modal>

      <Modal
        nested
        open={open === 'contact'}
        onClose={() => setOpen(null)}
        title="2. Telefone, endereço e redes"
        description="Texto ao lado do logo — um dado por linha, como no encarte."
        size="lg"
        footer={<><Button variant="outline" onClick={() => setOpen(null)}>Cancelar</Button><Button onClick={saveBlock}>Salvar bloco</Button></>}
      >
        <div className="space-y-3">
          <Input
            label="Título acima do telefone"
            value={draft.phone_label ?? ''}
            onChange={(e) => setDraft({ ...draft, phone_label: e.target.value })}
            placeholder={DEFAULT_PHONE_LABEL}
          />
          <Input
            label="Telefone"
            value={draft.phone ?? ''}
            onChange={(e) => setDraft({ ...draft, phone_label: draft.phone_label ?? DEFAULT_PHONE_LABEL, phone: e.target.value })}
            placeholder="14 3376-9404"
          />
          <div>
            <p className="text-sm font-medium text-gray-700 mb-1.5">Endereços</p>
            <div className="space-y-2">
              {(draft.addresses.length ? draft.addresses : ['']).map((addr, i) => (
                <div key={i} className="flex gap-2">
                  <Input
                    value={addr}
                    onChange={(e) => {
                      const next = [...(draft.addresses.length ? draft.addresses : [''])]
                      next[i] = e.target.value
                      setDraft({ ...draft, addresses: next })
                    }}
                    placeholder="Av. das Flores, 200 — Centro"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    title="Remover"
                    onClick={() => setDraft({ ...draft, addresses: draft.addresses.filter((_, j) => j !== i) })}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              ))}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="mt-2"
              leftIcon={<Plus size={13} />}
              onClick={() => setDraft({ ...draft, addresses: [...(draft.addresses.length ? draft.addresses : ['']), ''] })}
            >
              Adicionar endereço
            </Button>
          </div>
          <Input
            label="Site"
            value={draft.website ?? ''}
            onChange={(e) => setDraft({ ...draft, website: e.target.value })}
            placeholder="www.sualoja.com.br"
          />
          <Input
            label="Instagram"
            value={draft.instagram ?? ''}
            onChange={(e) => setDraft({ ...draft, instagram: e.target.value })}
            placeholder="@sualoja"
          />
          <Input
            label="Facebook / outra rede"
            value={draft.facebook ?? ''}
            onChange={(e) => setDraft({ ...draft, facebook: e.target.value })}
            placeholder="facebook.com/sualoja"
          />
        </div>
      </Modal>

      <Modal
        nested
        open={open === 'seal'}
        onClose={() => setOpen(null)}
        title="3. Selo do centro"
        description="Por padrão entra o selo GCasa. Pode trocar por outro."
        size="lg"
        footer={<><Button variant="outline" onClick={() => setOpen(null)}>Cancelar</Button><Button onClick={saveBlock}>Salvar bloco</Button></>}
      >
        <ImageUpload
          label="Selo / logo do centro"
          value={draft.seal_url}
          onChange={(url) => setDraft({ ...draft, seal_url: url })}
          folder="tabloide/footer"
          fit="contain"
          hint="Se ficar vazio, o preview mostra o selo GCasa padrão."
        />
      </Modal>

      <Modal
        nested
        open={open === 'cta'}
        onClose={() => setOpen(null)}
        title="4. Chamada WhatsApp"
        description="Frase grande à direita + número. Pode ser outra frase."
        size="lg"
        footer={<><Button variant="outline" onClick={() => setOpen(null)}>Cancelar</Button><Button onClick={saveBlock}>Salvar bloco</Button></>}
      >
        <div className="space-y-3">
          <Input
            label="Frase"
            value={draft.cta_phrase ?? ''}
            onChange={(e) => setDraft({ ...draft, cta_phrase: e.target.value })}
            placeholder={DEFAULT_CTA_PHRASE}
          />
          <Input
            label="Número do WhatsApp"
            value={draft.cta_whatsapp ?? ''}
            onChange={(e) => setDraft({
              ...draft,
              cta_phrase: draft.cta_phrase || DEFAULT_CTA_PHRASE,
              cta_whatsapp: e.target.value,
            })}
            placeholder="14 99626-4041"
          />
        </div>
      </Modal>

      <Modal
        nested
        open={open === 'fine'}
        onClose={() => setOpen(null)}
        title="5. Letras miúdas"
        description="Faixa escura embaixo do rodapé — condições da oferta."
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setOpen(null)}>Cancelar</Button>
            <Button
              variant="ghost"
              onClick={() => setDraft({ ...draft, fine_print: DEFAULT_FINE_PRINT })}
            >
              Usar texto padrão
            </Button>
            <Button onClick={saveBlock}>Salvar bloco</Button>
          </>
        }
      >
        <Textarea
          label="Texto legal"
          rows={6}
          value={draft.fine_print ?? ''}
          onChange={(e) => setDraft({ ...draft, fine_print: e.target.value })}
          placeholder={DEFAULT_FINE_PRINT}
        />
      </Modal>
    </div>
  )
}

export function emptyFooter(): TabloidFooter {
  return { ...EMPTY_TABLOID_FOOTER }
}
