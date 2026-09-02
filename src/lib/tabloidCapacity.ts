/** Regras do miolo impresso (Mario): mínimo 24 no tabloide, máximo 40
 *  (20 por página). O layout estica os cards; isso aqui é só o teto/piso
 *  de cadastro e envio. */
import { supabase } from '@/lib/supabase'

export const TABLOID_MIN_PRODUCTS = 24
export const TABLOID_MAX_PRODUCTS_PER_PAGE = 20
export const TABLOID_MAX_PRODUCTS = TABLOID_MAX_PRODUCTS_PER_PAGE * 2

export function tabloidMaxPerPage(editionMax?: number | null): number {
  return editionMax && editionMax > 0 ? editionMax : TABLOID_MAX_PRODUCTS_PER_PAGE
}

export function tabloidMaxTotal(maxPerPage: number): number {
  return maxPerPage * 2
}

export function tabloidMinTotal(maxPerPage: number): number {
  return Math.min(TABLOID_MIN_PRODUCTS, tabloidMaxTotal(maxPerPage))
}

/** Só 1 destaque por página da loja. Desmarca os outros antes de marcar o novo. */
export async function clearOtherFeatured(opts: {
  editionId: string
  associateId: string
  page: 1 | 2 | null
  keepId?: string
}) {
  if (opts.page == null) return
  let q = supabase
    .from('tabloid_products')
    .update({ is_featured: false })
    .eq('edition_id', opts.editionId)
    .eq('associate_id', opts.associateId)
    .eq('page', opts.page)
    .eq('is_featured', true)
  if (opts.keepId) q = q.neq('id', opts.keepId)
  const { error } = await q
  if (error) throw error
}
