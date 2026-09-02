// Extrai texto de um arquivo anexado (Word, Excel, CSV ou TXT) pra alimentar
// o mesmo pipeline de "Colar lista" (parser local ou IA) — não existe um
// caminho de importação separado, o arquivo só vira texto e cai no fluxo que
// já funciona.
//
// `xlsx` e `mammoth` são importados dinamicamente (só quando alguém realmente
// anexa um arquivo) — juntos passam de 600KB, e a maioria dos associados vai
// só colar texto direto, sem nunca precisar baixar esse código.

const SUPPORTED_EXTENSIONS = ['.docx', '.xlsx', '.xls', '.csv', '.txt']

export function isSupportedProductListFile(file: File): boolean {
  const name = file.name.toLowerCase()
  return SUPPORTED_EXTENSIONS.some((ext) => name.endsWith(ext))
}

/* Planilhas (Excel/CSV) viram uma linha de texto por linha da planilha, com
   "coluna: valor" pra cada célula preenchida — mantém a informação legível
   (e editável) na caixa de texto, e dá pra IA pistas melhores que só os
   valores soltos (sabe que "60" é o preço porque veio rotulado "Preço: 60"). */
function rowsToText(rows: Record<string, unknown>[]): string {
  return rows
    .map((row) =>
      Object.entries(row)
        .filter(([, v]) => String(v ?? '').trim() !== '')
        .map(([k, v]) => `${k.trim()}: ${String(v).trim()}`)
        .join(', ')
    )
    .filter(Boolean)
    .join('\n')
}

export async function extractTextFromFile(file: File): Promise<string> {
  const name = file.name.toLowerCase()

  if (name.endsWith('.docx')) {
    const [{ default: mammoth }, buf] = await Promise.all([import('mammoth'), file.arrayBuffer()])
    const result = await mammoth.extractRawText({ arrayBuffer: buf })
    return result.value.trim()
  }

  if (name.endsWith('.xlsx') || name.endsWith('.xls') || name.endsWith('.csv')) {
    const [XLSX, buf] = await Promise.all([import('xlsx'), file.arrayBuffer()])
    const workbook = XLSX.read(buf, { type: 'array' })
    const firstSheetName = workbook.SheetNames[0]
    if (!firstSheetName) return ''
    const sheet = workbook.Sheets[firstSheetName]
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' })
    return rowsToText(rows)
  }

  if (name.endsWith('.txt')) {
    return (await file.text()).trim()
  }

  throw new Error('Formato não suportado. Use .xlsx, .xls, .csv, .docx ou .txt.')
}
