/** Paleta de fundo do tabloide impresso — cores da marca GCasa + algumas
 *  de encarte (azul gelo, verde, areia) pra não ficar preso no branco. */
export const TABLOID_BACKGROUNDS = [
  { id: 'white', label: 'Branco', hex: '#FFFFFF' },
  { id: 'offwhite', label: 'Off-white', hex: '#F5F3F0' },
  { id: 'cream', label: 'Creme', hex: '#FFF8E9' },
  { id: 'yellow', label: 'Amarelo', hex: '#FFEFC9' },
  { id: 'gold', label: 'Dourado', hex: '#FDE29B' },
  { id: 'orange', label: 'Laranja', hex: '#FDD87A' },
  { id: 'gray', label: 'Cinza', hex: '#E8E6E3' },
  { id: 'blue', label: 'Azul gelo', hex: '#E3F0FA' },
  { id: 'green', label: 'Verde', hex: '#E7F5EE' },
  { id: 'sand', label: 'Areia', hex: '#F3E6D4' },
] as const

export const DEFAULT_TABLOID_BACKGROUND = '#FFF8E9'

/** Cores de preço típicas de encarte. */
export const TABLOID_PRICE_COLORS = [
  { id: 'red', label: 'Vermelho', hex: '#DC2626' },
  { id: 'orange', label: 'Laranja', hex: '#EA580C' },
  { id: 'gcasa', label: 'GCasa', hex: '#C0821A' },
  { id: 'yellow', label: 'Amarelo', hex: '#CA8A04' },
  { id: 'green', label: 'Verde', hex: '#16A34A' },
  { id: 'blue', label: 'Azul', hex: '#1D4ED8' },
  { id: 'black', label: 'Preto', hex: '#1F2937' },
] as const

export const TABLOID_PRICE_SIZES = [
  { id: 'md', label: 'Médio' },
  { id: 'lg', label: 'Grande' },
  { id: 'xl', label: 'Enorme' },
] as const

export const TABLOID_PRICE_PLACES = [
  { id: 'below', label: 'Embaixo da foto' },
  { id: 'on-photo', label: 'Sobre a foto' },
] as const

export const TABLOID_PRICE_ALIGNS = [
  { id: 'left', label: 'Esquerda' },
  { id: 'center', label: 'Centro' },
  { id: 'right', label: 'Direita' },
] as const

export type TabloidPriceSize = (typeof TABLOID_PRICE_SIZES)[number]['id']
export type TabloidPricePlace = (typeof TABLOID_PRICE_PLACES)[number]['id']
export type TabloidPriceAlign = (typeof TABLOID_PRICE_ALIGNS)[number]['id']

export interface TabloidPriceStyle {
  color: string
  size: TabloidPriceSize
  place: TabloidPricePlace
  align: TabloidPriceAlign
  fromTo: boolean
  badge: boolean
}

export const DEFAULT_TABLOID_PRICE_STYLE: TabloidPriceStyle = {
  color: '#DC2626',
  size: 'lg',
  place: 'below',
  align: 'left',
  fromTo: true,
  badge: true,
}

export function normalizePriceStyle(raw: unknown): TabloidPriceStyle {
  const o = (raw && typeof raw === 'object' ? raw : {}) as Partial<TabloidPriceStyle>
  const size = TABLOID_PRICE_SIZES.some((s) => s.id === o.size) ? (o.size as TabloidPriceSize) : DEFAULT_TABLOID_PRICE_STYLE.size
  const place = TABLOID_PRICE_PLACES.some((s) => s.id === o.place) ? (o.place as TabloidPricePlace) : DEFAULT_TABLOID_PRICE_STYLE.place
  const align = TABLOID_PRICE_ALIGNS.some((s) => s.id === o.align) ? (o.align as TabloidPriceAlign) : DEFAULT_TABLOID_PRICE_STYLE.align
  return {
    color: typeof o.color === 'string' && o.color.startsWith('#') ? o.color : DEFAULT_TABLOID_PRICE_STYLE.color,
    size,
    place,
    align,
    fromTo: o.fromTo !== false,
    badge: o.badge !== false,
  }
}

export function formatTabloidMoney(v: number): { reais: string; cents: string } {
  const [reais, cents] = v.toFixed(2).replace('.', ',').split(',')
  const withDots = reais.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return { reais: withDots, cents: cents ?? '00' }
}
