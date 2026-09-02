import { DEFAULT_TABLOID_BACKGROUND, TABLOID_BACKGROUNDS } from '@/lib/tabloidTheme'

export function TabloidBackgroundPicker({ value, onChange, compact = false }: {
  value: string
  onChange: (hex: string) => void
  compact?: boolean
}) {
  const current = (value || DEFAULT_TABLOID_BACKGROUND).toUpperCase()

  return (
    <div>
      {!compact && (
        <p className="text-sm font-medium text-gray-700 mb-1.5">Cor de fundo do tabloide</p>
      )}
      <div className="flex flex-wrap items-center gap-1.5">
        {TABLOID_BACKGROUNDS.map((c) => {
          const active = c.hex.toUpperCase() === current
          return (
            <button
              key={c.id}
              type="button"
              title={c.label}
              aria-label={c.label}
              aria-pressed={active}
              onClick={() => onChange(c.hex)}
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
            value={current}
            onChange={(e) => onChange(e.target.value.toUpperCase())}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
          <span className="block w-full h-full" style={{ background: `conic-gradient(red, yellow, lime, aqua, blue, magenta, red)` }} />
        </label>
      </div>
      {!compact && (
        <p className="text-[11px] text-gray-400 mt-1.5">
          Fundo da frente e do verso. Os boxes dos produtos continuam brancos por cima.
        </p>
      )}
    </div>
  )
}
