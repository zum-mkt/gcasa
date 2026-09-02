/** A4, padding da grade e gap — usados só pra escolher colunas/linhas.
 *  Alturas do rodapé copiadas de tabloidFooter (módulo puro, sem Supabase). */
const PAGE_W_MM = 210
const PAGE_H_MM = 297
const HEADER_H_MM = 80
const FRONT_FOOTER_H_MM = 8
const BACK_HEADER_H_MM = 8
const BACK_FOOTER_H_MM = 32
const PAD_X_MM = 6
const PAD_Y_MM = 4
const GAP_MM = 2

export type TabloidLayoutItem = {
  id: string
  is_featured: boolean
}

export type TabloidPlacement<T extends TabloidLayoutItem = TabloidLayoutItem> = {
  item: T
  col: number
  row: number
  colSpan: number
  rowSpan: number
}

export type TabloidPageLayout<T extends TabloidLayoutItem = TabloidLayoutItem> = {
  cols: number
  rows: number
  placements: TabloidPlacement<T>[]
}

type Span = { col: number; row: number; colSpan: number; rowSpan: number }

export function pageBodySizeMm(page: 1 | 2): { w: number; h: number } {
  return {
    w: PAGE_W_MM - PAD_X_MM,
    h: page === 1
      ? PAGE_H_MM - HEADER_H_MM - FRONT_FOOTER_H_MM - PAD_Y_MM
      : PAGE_H_MM - BACK_HEADER_H_MM - BACK_FOOTER_H_MM - PAD_Y_MM,
  }
}

/**
 * Monta a grade da página: escolhe 1–4 colunas, estica as linhas até o rodapé
 * e cresce alguns cards (span) pra não sobrar célula vazia. Sem quantidade
 * mínima de layout — 1 produto ocupa a folha. O cadastro pede 24–40 no portal.
 */
export function planTabloidPage<T extends TabloidLayoutItem>(
  products: T[],
  page: 1 | 2,
): TabloidPageLayout<T> {
  const n = products.length
  if (n === 0) return { cols: 1, rows: 1, placements: [] }

  const featured = products.find((p) => p.is_featured) ?? null
  const rest = featured ? products.filter((p) => p.id !== featured.id) : products
  const { cols, rows } = pickGrid(n, Boolean(featured), page)

  let spans: Span[]
  let items: T[]

  if (featured && cols >= 2 && rows >= 2) {
    const packed = packWithFeatured(rest.length, cols, rows)
    spans = [packed.featured, ...packed.side, ...packed.below]
    items = [featured, ...rest.slice(0, packed.side.length), ...rest.slice(packed.side.length)]
  } else {
    spans = packRect(n, cols, rows)
    items = products
  }

  spans = expandToFill(spans, cols, rows)

  const placements: TabloidPlacement<T>[] = items.map((item, i) => ({
    item,
    ...spans[i]!,
  }))

  return { cols, rows, placements }
}

function pickGrid(n: number, featured: boolean, page: 1 | 2): { cols: number; rows: number } {
  if (n === 1) return { cols: 1, rows: 1 }

  const { w, h } = pageBodySizeMm(page)
  const candidates = featured ? [2, 3, 4] : [2, 3, 4]
  let bestCols = featured ? 2 : 4
  let bestRows = 1
  let bestScore = Infinity

  for (const cols of candidates) {
    const cells = featured && cols >= 2 ? 4 + (n - 1) : n
    const rows = Math.max(featured && cols >= 2 ? 2 : 1, Math.ceil(cells / cols))
    const cellW = (w - (cols - 1) * GAP_MM) / cols
    const cellH = (h - (rows - 1) * GAP_MM) / rows
    const aspect = cellH / Math.max(cellW, 1)
    const rem = cols * rows - cells

    const aspectPenalty = Math.abs(Math.log(aspect / 1.15))
    const remPenalty = rem * 0.28
    const tinyPenalty =
      (cellW < 38 ? (38 - cellW) * 0.04 : 0) + (cellH < 32 ? (32 - cellH) * 0.04 : 0)
    const hugeTallPenalty = aspect > 2.5 ? (aspect - 2.5) * 0.25 : 0
    const hugeWidePenalty = aspect < 0.5 ? (0.5 - aspect) * 0.25 : 0
    const score = aspectPenalty + remPenalty + tinyPenalty + hugeTallPenalty + hugeWidePenalty

    if (score < bestScore) {
      bestScore = score
      bestCols = cols
      bestRows = rows
    }
  }

  return { cols: bestCols, rows: bestRows }
}

function evenCounts(n: number, rows: number, caps: number[]): number[] {
  const counts = Array.from({ length: rows }, () => 0)
  for (let i = 0; i < n; i++) {
    let best = -1
    let bestScore = Infinity
    for (let r = 0; r < rows; r++) {
      if (counts[r] >= (caps[r] ?? 0)) continue
      // Poucos itens na linha; empate vai pra linha de baixo pra não
      // deixar a última com 1 produto sozinho.
      const score = counts[r] * 100 - r
      if (score < bestScore) {
        bestScore = score
        best = r
      }
    }
    if (best < 0) counts[rows - 1] = (counts[rows - 1] ?? 0) + 1
    else counts[best] += 1
  }
  return counts
}

function colSpans(count: number, cols: number): number[] {
  if (count <= 0) return []
  if (count >= cols) return Array.from({ length: count }, () => 1)
  const base = Math.max(1, Math.floor(cols / count))
  let rem = cols - base * count
  const spans = Array.from({ length: count }, () => base)
  for (let i = count - 1; rem > 0; i--, rem--) spans[i] += 1
  return spans
}

function packRect(n: number, cols: number, rows: number): Span[] {
  if (n <= 0 || rows <= 0 || cols <= 0) return []

  // Poucos produtos pra o número de colunas: cada um vira uma "coluna alta"
  // que atravessa todas as linhas — preenche sem faixa vazia embaixo.
  if (n <= cols && rows >= 1) {
    const spans = colSpans(n, cols)
    let c = 1
    return spans.map((cs) => {
      const span = { col: c, row: 1, colSpan: cs, rowSpan: rows }
      c += cs
      return span
    })
  }

  const counts = evenCounts(n, rows, Array.from({ length: rows }, () => cols))
  const result: Span[] = []
  for (let r = 0; r < rows; r++) {
    const spans = colSpans(counts[r] ?? 0, cols)
    let c = 1
    for (const cs of spans) {
      result.push({ col: c, row: r + 1, colSpan: cs, rowSpan: 1 })
      c += cs
    }
  }
  return result
}

function scoreFilled(n: number, cols: number, rows: number): number {
  if (rows <= 0) return n > 0 ? 50 : 0
  if (n === 0) return rows > 0 ? 1.2 : 0
  if (n === 1 && cols >= 3 && rows === 1) return 2.4
  if (n <= cols) return n === 1 ? 0.15 : 0
  const counts = evenCounts(n, rows, Array.from({ length: rows }, () => cols))
  let s = 0
  for (const c of counts) {
    if (c === 0) s += 1.2
    else if (c === 1 && cols >= 3) s += 2.2
    else if (c === 1) s += 0.4
  }
  return s
}

function chooseSideCount(regular: number, cols: number, rows: number): number {
  const sideWidth = cols - 2
  const belowRows = rows - 2
  if (sideWidth <= 0) return 0
  const sideSlots = 2 * sideWidth
  const belowSlots = belowRows * cols
  const minK = Math.max(regular > 0 ? 1 : 0, regular - belowSlots)
  const maxK = Math.min(regular, sideSlots)
  let bestK = minK
  let best = Infinity
  for (let k = minK; k <= maxK; k++) {
    const score = scoreFilled(k, sideWidth, 2) + scoreFilled(regular - k, cols, belowRows)
    if (score < best) {
      best = score
      bestK = k
    }
  }
  return bestK
}

function packWithFeatured(
  regular: number,
  cols: number,
  rows: number,
): { featured: Span; side: Span[]; below: Span[] } {
  const sideWidth = Math.max(0, cols - 2)
  const k = chooseSideCount(regular, cols, rows)
  const featured: Span = { col: 1, row: 1, colSpan: 2, rowSpan: 2 }
  const side = packRect(k, sideWidth, 2).map((s) => ({ ...s, col: s.col + 2 }))
  const below = packRect(regular - k, cols, Math.max(0, rows - 2)).map((s) => ({
    ...s,
    row: s.row + 2,
  }))
  return { featured, side, below }
}

function occupancy(spans: Span[], cols: number, rows: number): number[][] {
  const grid = Array.from({ length: rows }, () => Array.from({ length: cols }, () => -1))
  spans.forEach((s, i) => {
    for (let r = 0; r < s.rowSpan; r++) {
      for (let c = 0; c < s.colSpan; c++) {
        const rr = s.row - 1 + r
        const cc = s.col - 1 + c
        if (rr >= 0 && rr < rows && cc >= 0 && cc < cols) grid[rr]![cc] = i
      }
    }
  })
  return grid
}

function canGrowRight(item: Span, grid: number[][], cols: number, rows: number, ec: number): boolean {
  if (item.col - 1 + item.colSpan !== ec) return false
  if (ec >= cols) return false
  for (let r = item.row - 1; r < item.row - 1 + item.rowSpan; r++) {
    if (r < 0 || r >= rows) return false
    if ((grid[r]?.[ec] ?? 0) >= 0) return false
  }
  return true
}

function canGrowDown(item: Span, grid: number[][], cols: number, rows: number, er: number): boolean {
  if (item.row - 1 + item.rowSpan !== er) return false
  if (er >= rows) return false
  for (let c = item.col - 1; c < item.col - 1 + item.colSpan; c++) {
    if (c < 0 || c >= cols) return false
    if ((grid[er]?.[c] ?? 0) >= 0) return false
  }
  return true
}

/** Se ainda sobrar célula vazia (caso raro), estica o vizinho pra dentro. */
function expandToFill(spans: Span[], cols: number, rows: number): Span[] {
  const out = spans.map((s) => ({ ...s }))
  let guard = cols * rows + 4
  while (guard-- > 0) {
    const grid = occupancy(out, cols, rows)
    let empty: [number, number] | null = null
    outer: for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if ((grid[r]?.[c] ?? -1) < 0) {
          empty = [r, c]
          break outer
        }
      }
    }
    if (!empty) break
    const [er, ec] = empty
    let grown = false
    if (ec > 0) {
      const idx = grid[er]?.[ec - 1] ?? -1
      if (idx >= 0 && canGrowRight(out[idx]!, grid, cols, rows, ec)) {
        out[idx]!.colSpan += 1
        grown = true
      }
    }
    if (!grown && er > 0) {
      const idx = grid[er - 1]?.[ec] ?? -1
      if (idx >= 0 && canGrowDown(out[idx]!, grid, cols, rows, er)) {
        out[idx]!.rowSpan += 1
        grown = true
      }
    }
    if (!grown) break
  }
  return out
}
