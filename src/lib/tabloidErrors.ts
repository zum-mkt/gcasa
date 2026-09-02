/** Mapeia os erros do Postgres do limite "1 produto em destaque por página"
 *  (`013_tabloid_featured_limit.sql`) pra mensagem amigável em vez do erro cru
 *  do banco. Usado tanto no formulário do associado (`portal/Produtos`,
 *  batido pela RLS de cada loja) quanto na curadoria do admin
 *  (`admin/Tabloides`) — a trava é a mesma (índice único + check), só o texto
 *  muda pouco entre as duas telas.
 *
 *  Retorna `null` quando o erro não é um desses dois — quem chamar cai no
 *  toast de erro genérico de sempre. */
export function tabloidFeaturedLimitError(e: { code?: string; message?: string } | null | undefined): { title: string; description?: string } | null {
  if (!e) return null
  // 23505 = unique_violation, 23514 = check_violation (códigos padrão do Postgres)
  if (e.code === '23505' && (e.message?.includes('tabloid_products_one_featured_per_page') || e.message?.includes('tabloid_products_one_featured_per_store_page'))) {
    return {
      title: 'Destaque já foi usado nessa página',
      description: 'Na sua loja só vale 1 destaque por página — desmarque o outro e tente de novo.',
    }
  }
  if (e.code === '23514' && e.message?.includes('tabloid_products_featured_requires_page')) {
    return { title: 'Escolha a página antes de marcar destaque' }
  }
  return null
}

/** Mapeia o erro da trigger `enforce_tabloid_page_capacity`
 *  (`019_tabloid_page_capacity.sql`) — limite de produtos por página do
 *  tabloide impresso. O front já desabilita a página cheia no dropdown antes
 *  de enviar; isso aqui cobre a corrida entre duas lojas enviando quase ao
 *  mesmo tempo (só validação de front não segura). */
export function tabloidPageCapacityError(e: { code?: string; message?: string } | null | undefined): { title: string; description?: string } | null {
  if (!e) return null
  if (e.message?.includes('tabloid_page_capacity_exceeded')) {
    return {
      title: 'Essa página já está cheia',
      description: 'Essa página da sua loja já chegou no limite de produtos.',
    }
  }
  return null
}

export function tabloidMinProductsError(e: { code?: string; message?: string } | null | undefined): { title: string; description?: string } | null {
  if (!e) return null
  if (e.message?.includes('tabloid_min_products_not_met')) {
    return {
      title: 'Ainda faltam produtos',
      description: 'O tabloide precisa de no mínimo 24 produtos (máximo 40) pra enviar pra produção.',
    }
  }
  return null
}

/** Roda os checks de posicionamento (destaque + capacidade de página + mínimo)
 *  em sequência — usado nos lugares que podem disparar qualquer um
 *  (formulário do associado e curadoria do admin). */
export function tabloidUnlockError(e: { code?: string; message?: string } | null | undefined): { title: string; description?: string } | null {
  if (!e?.message) return null
  if (e.message.includes('tabloid_unlock_no_submission')) {
    return { title: 'Tabloide ainda não foi enviado', description: 'Só dá pra pedir alteração depois do envio pra produção.' }
  }
  if (e.message.includes('tabloid_unlock_not_associate')) {
    return { title: 'Só a loja pode pedir essa alteração' }
  }
  if (e.message.includes('tabloid_unlock_not_staff')) {
    return { title: 'Só o administrador pode liberar a edição' }
  }
  if (e.message.includes('tabloid_unlock_missing')) {
    return { title: 'Esse envio já foi liberado' }
  }
  return null
}

export function tabloidPlacementError(e: { code?: string; message?: string } | null | undefined): { title: string; description?: string } | null {
  return tabloidFeaturedLimitError(e) ?? tabloidPageCapacityError(e) ?? tabloidMinProductsError(e) ?? tabloidUnlockError(e)
}
