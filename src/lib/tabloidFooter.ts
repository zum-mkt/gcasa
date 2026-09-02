import { supabase } from '@/lib/supabase'

export interface TabloidFooter {
  logo_url: string | null
  phone_label: string | null
  phone: string | null
  addresses: string[]
  website: string | null
  instagram: string | null
  facebook: string | null
  seal_url: string | null
  cta_phrase: string | null
  cta_whatsapp: string | null
  fine_print: string | null
}

export const EMPTY_TABLOID_FOOTER: TabloidFooter = {
  logo_url: null,
  phone_label: null,
  phone: null,
  addresses: [],
  website: null,
  instagram: null,
  facebook: null,
  seal_url: null,
  cta_phrase: null,
  cta_whatsapp: null,
  fine_print: null,
}

export const DEFAULT_CTA_PHRASE = 'Compre pelo WhatsApp!'
export const DEFAULT_PHONE_LABEL = 'Fale com nossos especialistas'
export const DEFAULT_FINE_PRINT =
  'Imagens meramente ilustrativas. Ofertas válidas enquanto durarem os estoques. Preços válidos para pagamento à vista. Consulte a loja as condições para pagamento a prazo e eventuais descontos.'

/** Reserva no verso A4 pra o rodapé (ele encolhe se tiver pouco conteúdo). */
export const TABLOID_FOOTER_HEIGHT_MM = 32
/** Faixa discreta na frente (página 1) — mesmas cores do verso, sem texto. */
export const TABLOID_FRONT_FOOTER_HEIGHT_MM = 8
/** Topo do verso (página 2) — mesmas duas faixas da frente, pra o produto não colar na borda. */
export const TABLOID_BACK_HEADER_HEIGHT_MM = 8

export function normalizeFooter(raw: unknown, fallbackFinePrint?: string | null): TabloidFooter {
  const o = (raw && typeof raw === 'object' ? raw : {}) as Partial<TabloidFooter>
  const addresses = Array.isArray(o.addresses)
    ? o.addresses.map((a) => String(a).trim()).filter(Boolean)
    : []
  const str = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : null)
  return {
    logo_url: str(o.logo_url),
    phone_label: str(o.phone_label),
    phone: str(o.phone),
    addresses,
    website: str(o.website),
    instagram: str(o.instagram),
    facebook: str(o.facebook),
    seal_url: str(o.seal_url),
    cta_phrase: str(o.cta_phrase),
    cta_whatsapp: str(o.cta_whatsapp),
    fine_print: str(o.fine_print) ?? (fallbackFinePrint?.trim() || null),
  }
}

export function footerBlockDone(footer: TabloidFooter) {
  return {
    logo: !!footer.logo_url,
    contact: !!(footer.phone || footer.addresses.length || footer.website || footer.instagram || footer.facebook),
    seal: !!footer.seal_url,
    cta: !!(footer.cta_phrase || footer.cta_whatsapp),
    fine: !!footer.fine_print,
  }
}

export function footerHasContent(footer: TabloidFooter): boolean {
  const d = footerBlockDone(footer)
  return d.logo || d.contact || d.seal || d.cta || d.fine
}

/** Loja preenche identidade; tema (admin) preenche selo e letras miúdas. Loja ganha se tiver o campo. */
export function mergeFooters(campaign: TabloidFooter, store: TabloidFooter): TabloidFooter {
  const c = normalizeFooter(campaign)
  const s = normalizeFooter(store)
  return {
    logo_url: s.logo_url ?? c.logo_url,
    phone_label: s.phone_label ?? c.phone_label,
    phone: s.phone ?? c.phone,
    addresses: s.addresses.length ? s.addresses : c.addresses,
    website: s.website ?? c.website,
    instagram: s.instagram ?? c.instagram,
    facebook: s.facebook ?? c.facebook,
    seal_url: s.seal_url ?? c.seal_url,
    cta_phrase: s.cta_phrase ?? c.cta_phrase,
    cta_whatsapp: s.cta_whatsapp ?? c.cta_whatsapp,
    fine_print: s.fine_print ?? c.fine_print,
  }
}

export const STORE_FOOTER_BLOCKS = ['logo', 'contact', 'cta'] as const
export const CAMPAIGN_FOOTER_BLOCKS = ['seal', 'fine'] as const

export interface TabloidStoreLayout {
  id: string
  edition_id: string
  associate_id: string
  header_image_url: string | null
  footer: TabloidFooter
}

export async function fetchStoreLayout(editionId: string, associateId: string): Promise<TabloidStoreLayout | null> {
  const { data, error } = await supabase
    .from('tabloid_store_layouts')
    .select('*')
    .eq('edition_id', editionId)
    .eq('associate_id', associateId)
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  const row = data as { id: string; edition_id: string; associate_id: string; header_image_url: string | null; footer: unknown }
  return {
    id: row.id,
    edition_id: row.edition_id,
    associate_id: row.associate_id,
    header_image_url: row.header_image_url,
    footer: normalizeFooter(row.footer),
  }
}

export async function upsertStoreLayout(editionId: string, associateId: string, patch: { header_image_url?: string | null; footer?: TabloidFooter }): Promise<void> {
  const existing = await fetchStoreLayout(editionId, associateId)
  if (existing) {
    const { error } = await supabase.from('tabloid_store_layouts').update(patch).eq('id', existing.id)
    if (error) throw error
    return
  }
  const { error } = await supabase.from('tabloid_store_layouts').insert({
    edition_id: editionId,
    associate_id: associateId,
    header_image_url: patch.header_image_url ?? null,
    footer: patch.footer ?? EMPTY_TABLOID_FOOTER,
  })
  if (error) throw error
}
