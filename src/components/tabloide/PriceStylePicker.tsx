import type { ReactNode } from 'react'
import { AlignLeft, AlignCenter, AlignRight, PanelBottom, Image } from 'lucide-react'
import {
  DEFAULT_TABLOID_PRICE_STYLE,
  TABLOID_PRICE_COLORS,
  type TabloidPriceStyle,
} from '@/lib/tabloidTheme'

const SIZES: { id: TabloidPriceStyle['size']; label: string }[] = [
  { id: 'md', label: 'M' },
  { id: 'lg', label: 'G' },
  { id: 'xl', label: 'GG' },
]

function Chip({ active, onClick, children, title }: {
  active: boolean
  onClick: () => void
  children: ReactNode
  title?: string
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`h-7 px-2 rounded-md text-[11px] font-bold border transition-colors ${
        active
          ? 'bg-graphite-900 text-white border-graphite-900'
          : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
      }`}
    >
      {children}
    </button>
  )
}

export function TabloidPriceStylePicker({
  value,
  onChange,
  compact = false,
}: {
  value: TabloidPriceStyle
  onChange: (next: TabloidPriceStyle) => void
  compact?: boolean
}) {
  const current = { ...DEFAULT_TABLOID_PRICE_STYLE, ...value }
  const patch = (partial: Partial<TabloidPriceStyle>) => onChange({ ...current, ...partial })

  return (
    <div className={compact ? 'flex flex-wrap items-center gap-2' : 'space-y-3'}>
      {!compact && <p className="text-sm font-medium text-gray-700">Estilo dos preços</p>}

      <div className="flex items-center gap-1.5">
        {compact && <span className="text-xs text-gray-500 mr-0.5">Preço</span>}
        {TABLOID_PRICE_COLORS.map((c) => {
          const active = c.hex.toUpperCase() === current.color.toUpperCase()
          return (
            <button
              key={c.id}
              type="button"
              title={c.label}
              aria-label={c.label}
              aria-pressed={active}
              onClick={() => patch({ color: c.hex })}
              className={`w-7 h-7 rounded-full border-2 transition-shadow ${
                active ? 'border-graphite-900 ring-2 ring-primary-400 ring-offset-1' : 'border-gray-200 hover:border-gray-400'
              }`}
              style={{ backgroundColor: c.hex }}
            />
          )
        })}
        <label
          className="w-7 h-7 rounded-full border-2 border-dashed border-gray-300 overflow-hidden cursor-pointer relative"
          title="Cor personalizada"
        >
          <input
            type="color"
            value={current.color}
            onChange={(e) => patch({ color: e.target.value.toUpperCase() })}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
          <span className="block w-full h-full" style={{ background: 'conic-gradient(red, yellow, lime, aqua, blue, magenta, red)' }} />
        </label>
      </div>

      <div className="flex items-center gap-1">
        {SIZES.map((s) => (
          <Chip key={s.id} active={current.size === s.id} onClick={() => patch({ size: s.id })} title={`Tamanho ${s.label}`}>
            {s.label}
          </Chip>
        ))}
      </div>

      <div className="flex items-center gap-1">
        {compact && <span className="text-xs text-gray-500 mr-0.5">Posição</span>}
        <Chip active={current.place === 'below'} onClick={() => patch({ place: 'below' })} title="Preço embaixo da foto">
          <span className="inline-flex items-center gap-1"><PanelBottom size={12} /> Embaixo</span>
        </Chip>
        <Chip active={current.place === 'on-photo'} onClick={() => patch({ place: 'on-photo' })} title="Preço sobre a foto">
          <span className="inline-flex items-center gap-1"><Image size={12} /> Na foto</span>
        </Chip>
      </div>

      <div className="flex items-center gap-0.5">
        <Chip active={current.align === 'left'} onClick={() => patch({ align: 'left' })} title="Alinhar à esquerda">
          <AlignLeft size={13} />
        </Chip>
        <Chip active={current.align === 'center'} onClick={() => patch({ align: 'center' })} title="Centralizar">
          <AlignCenter size={13} />
        </Chip>
        <Chip active={current.align === 'right'} onClick={() => patch({ align: 'right' })} title="Alinhar à direita">
          <AlignRight size={13} />
        </Chip>
      </div>

      <div className="flex items-center gap-1">
        <Chip active={current.fromTo} onClick={() => patch({ fromTo: !current.fromTo })} title="Mostrar DE tanto POR tanto">
          DE/POR
        </Chip>
      </div>

      {!compact && (
        <p className="text-[11px] text-gray-400">
          Cor, tamanho, posição (embaixo ou sobre a foto, esquerda/centro/direita) e “de tanto por tanto”. Vale pra frente e verso.
        </p>
      )}
    </div>
  )
}
