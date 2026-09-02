import { formatTabloidMoney, type TabloidPriceStyle } from '@/lib/tabloidTheme'

const SIZE = {
  md: { regular: 15, featured: 22, unit: 0.42 },
  lg: { regular: 19, featured: 28, unit: 0.40 },
  xl: { regular: 24, featured: 36, unit: 0.38 },
} as const

function PriceFigure({ value, color, px, unitRatio }: { value: number; color: string; px: number; unitRatio: number }) {
  const { reais, cents } = formatTabloidMoney(value)
  return (
    <span className="inline-flex items-baseline leading-none font-black tracking-tight whitespace-nowrap" style={{ color, fontSize: px }}>
      <span style={{ fontSize: `${unitRatio * 100}%`, fontWeight: 800, marginRight: '0.12em' }}>R$</span>
      <span>{reais}</span>
      <span style={{ fontSize: `${unitRatio * 110}%` }}>,{cents}</span>
    </span>
  )
}

function realPrice(v: number | null | undefined): number | null {
  return v != null && v > 0 ? v : null
}

export function PriceBlock({
  price,
  promoPrice,
  featured,
  style,
}: {
  price: number | null
  promoPrice: number | null
  featured: boolean
  style: TabloidPriceStyle
}) {
  const fromPrice = realPrice(price)
  const toPrice = realPrice(promoPrice)
  const finalPrice = toPrice ?? fromPrice
  if (finalPrice == null) return <span className="text-[10px] text-gray-400">Sem preço</span>

  const hasFromTo = style.fromTo && fromPrice != null && toPrice != null && fromPrice > toPrice
  const showBadge = featured || hasFromTo
  const badgeLabel = featured ? 'SUPER OFERTA' : 'PROMOÇÃO'
  const size = SIZE[style.size]
  const px = featured ? size.featured : size.regular
  const from = hasFromTo && fromPrice != null ? formatTabloidMoney(fromPrice) : null
  const overlay = style.place === 'on-photo'
  const alignClass =
    style.align === 'center' ? 'items-center text-center' :
    style.align === 'right' ? 'items-end text-right' :
    'items-start text-left'

  return (
    <div
      className={`flex flex-col gap-[3px] min-w-0 ${alignClass} ${
        overlay ? 'bg-white/92 rounded-md px-1.5 py-1 shadow-sm w-max max-w-full' : 'mt-1'
      }`}
    >
      {showBadge && (
        <span
          className="inline-block w-fit font-black uppercase tracking-wide text-white px-1.5 leading-tight"
          style={{
            fontSize: featured ? 9 : 7,
            backgroundColor: style.color,
          }}
        >
          {badgeLabel}
        </span>
      )}
      {from && (
        <span
          className="block whitespace-nowrap text-gray-500 font-semibold leading-tight"
          style={{ fontSize: featured ? 9 : 7 }}
        >
          DE <span className="line-through decoration-2">R$ {from.reais},{from.cents}</span>
        </span>
      )}
      {hasFromTo && (
        <span
          className="block font-black uppercase leading-none"
          style={{ fontSize: featured ? 8 : 6.5, color: style.color }}
        >
          POR
        </span>
      )}
      <PriceFigure value={finalPrice} color={style.color} px={px} unitRatio={size.unit} />
    </div>
  )
}
