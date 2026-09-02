// Parser 100% local (sem IA, sem chamada externa) pra interpretar uma lista de
// produtos colada em texto livre no portal do associado. Entende três padrões
// de preço em português/formato brasileiro (R$ 1.234,56):
//   - preço simples: "Picanha kg R$ 49,90"
//   - "de X por Y":   "Tinta 18L de R$ 259,90 por R$ 199,90"
//   - "% de desconto" com preço base: "Cimento 50kg R$ 45,00 com 10% de desconto"
// Também reconhece linhas-título como bloco/categoria ("Tintas:" ou "TINTAS"
// sozinha numa linha) e marcadores de página ("Página 2").
//
// É mais rígido que uma IA — depende do texto seguir de perto esses formatos,
// principalmente ter "R$" antes de cada preço — mas roda sem custo nenhum e
// sem depender de nenhuma chave de API.

export interface ParsedProductDraft {
  name: string
  category: string | null
  price: number | null
  promo_price: number | null
  description: string | null
  is_featured: boolean
  page: 1 | 2 | null
  source_line: string
  note: string | null
  /** Sempre null na saída do parser (nem a IA nem o regex inventam foto) — preenchido depois pelo associado, por produto, na revisão. */
  image_url: string | null
  /** Unidade de medida (kg, m², un, milheiro etc) — best-effort, null se não achar pista na linha. */
  unit: string | null
  /** Condição de pagamento (ex.: "3x de R$ 160,00 sem juros", "à vista com 5% OFF") — best-effort, null se a linha não tiver rótulo de condição. */
  payment_condition: string | null
}

const MONEY_RE = /R\$\s*(\d{1,3}(?:\.\d{3})*(?:,\d{2})?|\d+(?:,\d{2})?)/i
const DE_POR_RE = /\bde\s+(R\$\s*[\d.,]+)\s+por\s+(R\$\s*[\d.,]+)/i
const PCT_BEFORE_RE = /(\d{1,2})\s*%\s*(?:de\s*)?descont\w*/i // "10% de desconto"
const PCT_AFTER_RE = /descont\w*\s*(?:de\s*)?(\d{1,2})\s*%/i // "desconto de 10%"
const PAGE2_RE = /^[-–—\s]*p[aá]g(?:ina)?\.?\s*2\b/i
const PAGE1_RE = /^[-–—\s]*p[aá]g(?:ina)?\.?\s*1\b/i
const HEADING_COLON_RE = /^([^\d:]{2,40}):\s*$/
const HEADING_CAPS_RE = /^[A-ZÀ-Ý][A-ZÀ-Ý\s]{1,30}$/
const FEATURED_HINTS = ['oferta', 'destaque', 'imperdível', 'imperdivel', 'descontaço', 'descontao', 'super oferta', 'promoção imperdível']

// Linha de CONDIÇÃO DE PAGAMENTO ("Condição: 3x de R$ 160,00 sem juros",
// "Forma de pagamento: à vista com 5% OFF") — pega o rótulo (com marcador de
// lista opcional na frente, tipo "○ Condição:") e tudo depois dele. Precisa
// vir ANTES da checagem de preço: a linha quase sempre tem um "R$" (o valor
// da parcela ou do à vista), e sem essa checagem primeiro ela seria lida
// como um produto novo em vez de um detalhe do produto anterior.
const PAYMENT_CONDITION_RE = /^[-–—•*○\s]*(?:condi[çc][ãa]o(?:\s+de\s+pagamento)?|forma\s+de\s+pagamento|pagamento)\s*:\s*(.+)$/i

// Termo forte de pagamento — usado pra achar uma cláusula de condição
// GRUDADA na própria linha do produto, sem rótulo nenhum e sem virar linha
// separada (ex.: "Pedra britada nº 1 — Pedreira São João — R$ 89,50 —
// cartão de crédito em 2x"). Não usa "Nx" sozinho como gatilho (só "3x",
// "2x") pra não confundir com medida de produto (ladrilho "30x60", bloco
// "14x19x39") — só entra na lista quando vem colado num termo de pagamento
// de verdade (cartão, parcelado, sem juros...). "descont\w*" é travado em
// desconto/descontos/descontão/descontaço (não "descontinuado" — modelo
// antigo de um produto não é condição de pagamento). Sem "entrada" solta
// (ambíguo com "porta de entrada" nesse ramo de material de construção) —
// esse caso só entra via rótulo explícito ("Condição: entrada de R$...").
const PAYMENT_KEYWORD_RE = /\b(cart[ãa]o(?:\s+de\s+cr[ée]dito)?|boleto|pix|cheque|dinheiro|parcel\w*|sem\s+juros|com\s+juros|[àa]\s?vista|descont(?:o|os|[ãa]o|aço)|off)\b/i

// Separador de "cláusulas" dentro de uma linha de produto — traço com espaço
// dos dois lados (pra não confundir com hífen colado numa palavra/medida) ou
// vírgula SEGUIDA DE ESPAÇO (a vírgula decimal de preço, tipo "R$ 89,50",
// nunca tem espaço depois — `,\s*` sozinho quebraria "89,50" em "89" e "50").
const CLAUSE_SPLIT_RE = /\s+[-–—]\s+|,\s+/

// "Nx" — marcador de parcela ("3x", "12x"). Só serve pra dizer "esse R$ aqui é
// valor de PARCELA, não o preço do produto" — por isso só é checado numa
// cláusula que JÁ bateu palavra de pagamento (nunca sozinho: uma medida como
// "14x19x39" não passa nem perto de PAYMENT_KEYWORD_RE pra chegar aqui).
const INSTALLMENT_MARKER_RE = /\b\d{1,2}\s*x\b/i

/** Tira da linha qualquer cláusula (separada por travessão/vírgula) que fale de
 *  forma/condição de pagamento, mesmo sem rótulo — devolve o resto da linha
 *  (pra seguir o parsing normal de nome/preço) e a condição extraída, se achou. */
function extractInlinePaymentCondition(text: string): { rest: string; condition: string | null } {
  const segments = text.split(CLAUSE_SPLIT_RE).map((s) => s.trim()).filter(Boolean)
  if (segments.length <= 1) return { rest: text, condition: null }
  const paymentSegs: string[] = []
  const restSegs: string[] = []
  for (const seg of segments) {
    // Uma cláusula com "R$" que NÃO é claramente parcela ("3x de R$...") é
    // provavelmente o preço de verdade do produto (ex.: "R$ 45,00 com 10% de
    // desconto") — não pode virar payment_condition sozinha, senão o produto
    // fica sem preço nenhum e o item some do parsing.
    const isAmbiguousPrice = MONEY_RE.test(seg) && !INSTALLMENT_MARKER_RE.test(seg)
    if (PAYMENT_KEYWORD_RE.test(seg) && !isAmbiguousPrice) paymentSegs.push(seg)
    else restSegs.push(seg)
  }
  if (paymentSegs.length === 0) return { rest: text, condition: null }
  return { rest: restSegs.join(' — '), condition: paymentSegs.join('; ') }
}

// Unidade — best-effort: frases tipo "o metro"/"a unidade" primeiro, senão
// procura um token de unidade solto na linha (kg, m², un, milheiro etc).
const UNIT_PHRASE_RE = /\bo\s+(metro|litro|quilo)\b|\ba\s+(unidade|peça|dúzia|duzia)\b/i
const UNIT_PHRASE_MAP: Record<string, string> = { metro: 'm', litro: 'litro', quilo: 'kg', unidade: 'un', peça: 'peça', dúzia: 'dúzia', duzia: 'dúzia' }
const UNIT_TOKEN_RE = /\b(kg|m²|m2|m³|m3|unid\.?|peça|pç|milheiro|saco|cx|caixa|litro|dz|dúzia|duzia|par|rolo|galão|galao|fardo|kit)\b/i

function extractUnit(line: string): string | null {
  const phrase = line.match(UNIT_PHRASE_RE)
  if (phrase) {
    const word = (phrase[1] ?? phrase[2])?.toLowerCase()
    if (word && UNIT_PHRASE_MAP[word]) return UNIT_PHRASE_MAP[word]
  }
  const token = line.match(UNIT_TOKEN_RE)
  return token ? token[1].toLowerCase() : null
}

function toNumber(token: string): number | null {
  const cleaned = token.replace(/^R\$\s*/i, '').trim()
  if (!cleaned) return null
  const s = /,\d{1,2}$/.test(cleaned) ? cleaned.replace(/\./g, '').replace(',', '.') : cleaned.replace(/,/g, '.')
  const n = Number(s)
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : null
}

function cleanName(line: string, removed: string[]): string {
  let name = line
  for (const r of removed) name = name.replace(r, '')
  name = name.replace(/\b(com|de|por)\b\s*$/i, '').trim()
  // Trim antes de tirar o travessão final — o token removido pode ter ficado
  // no MEIO da string (ex.: preço entre dois trechos separados por travessão,
  // depois de extractInlinePaymentCondition tirar uma cláusula do fim), o que
  // deixa o travessão seguido de espaço em vez de colado no fim literal.
  name = name.replace(/^[-–—•*]\s*/, '').replace(/[-–—,:]+\s*$/, '').trim()
  return name || line.trim()
}

export function parseTabloidText(raw: string): ParsedProductDraft[] {
  const lines = raw.split('\n').map((l) => l.trim()).filter(Boolean)
  const drafts: ParsedProductDraft[] = []
  let currentCategory: string | null = null
  let currentPage: 1 | 2 | null = null
  let lastDraft: ParsedProductDraft | null = null

  for (const line of lines) {
    if (line.length < 30 && PAGE2_RE.test(line)) { currentPage = 2; lastDraft = null; continue }
    if (line.length < 30 && PAGE1_RE.test(line)) { currentPage = 1; lastDraft = null; continue }

    const headingColon = line.match(HEADING_COLON_RE)
    if (headingColon) { currentCategory = headingColon[1].trim(); lastDraft = null; continue }
    if (HEADING_CAPS_RE.test(line)) { currentCategory = line.trim(); lastDraft = null; continue }

    const conditionMatch = line.match(PAYMENT_CONDITION_RE)
    if (conditionMatch) {
      // Detalhe do produto anterior, não um produto novo — mesmo que a linha
      // tenha "R$" (valor da parcela/à vista). Sem produto anterior pra
      // anexar, a linha é ignorada (não tem como saber a quem pertence).
      if (lastDraft) {
        lastDraft.payment_condition = lastDraft.payment_condition
          ? `${lastDraft.payment_condition}; ${conditionMatch[1].trim()}`
          : conditionMatch[1].trim()
        lastDraft.source_line = `${lastDraft.source_line}\n${line}`
      }
      continue
    }

    // Tira cláusula de pagamento grudada na linha ANTES de procurar preço —
    // "cartão de crédito em 2x" não tem "R$", mas frases como "à vista" ou
    // "3x sem juros de R$..." podem, e sem tirar isso primeiro o resto do
    // parsing (preço, nome) trabalharia em cima de texto que não é produto.
    const { rest: workLine, condition: inlineCondition } = extractInlinePaymentCondition(line)

    const deporMatch = workLine.match(DE_POR_RE)
    const moneyMatch = workLine.match(MONEY_RE)
    const pctMatch = workLine.match(PCT_BEFORE_RE) ?? workLine.match(PCT_AFTER_RE)

    let price: number | null = null
    let promo_price: number | null = null
    let note: string | null = null
    let name: string

    if (deporMatch) {
      price = toNumber(deporMatch[1])
      promo_price = toNumber(deporMatch[2])
      name = cleanName(workLine, [deporMatch[0]])
    } else if (pctMatch && moneyMatch) {
      price = toNumber(moneyMatch[0])
      const pct = Number(pctMatch[1])
      promo_price = price != null && Number.isFinite(pct) ? Math.round(price * (1 - pct / 100) * 100) / 100 : null
      name = cleanName(workLine, [moneyMatch[0], pctMatch[0]])
    } else if (pctMatch && !moneyMatch) {
      note = 'Desconto em % sem preço base na linha — confira o valor.'
      name = cleanName(workLine, [pctMatch[0]])
    } else if (moneyMatch) {
      price = toNumber(moneyMatch[0])
      name = cleanName(workLine, [moneyMatch[0]])
    } else {
      // Sem preço nessa linha — vira complemento do produto anterior, se houver.
      if (lastDraft) {
        if (inlineCondition) {
          lastDraft.payment_condition = lastDraft.payment_condition
            ? `${lastDraft.payment_condition}; ${inlineCondition}`
            : inlineCondition
        }
        if (workLine.trim()) {
          lastDraft.description = [lastDraft.description, workLine.trim()].filter(Boolean).join(' — ')
        }
        lastDraft.source_line = `${lastDraft.source_line}\n${line}`
      }
      continue
    }

    const lower = line.toLowerCase()
    const pctValue = pctMatch ? Number(pctMatch[1]) : null

    const draft: ParsedProductDraft = {
      name,
      category: currentCategory,
      price,
      promo_price,
      description: null,
      is_featured: FEATURED_HINTS.some((h) => lower.includes(h)) || (pctValue != null && pctValue >= 25),
      page: currentPage,
      source_line: line,
      note,
      image_url: null,
      unit: extractUnit(line),
      payment_condition: inlineCondition,
    }
    drafts.push(draft)
    lastDraft = draft
  }

  return drafts
}
