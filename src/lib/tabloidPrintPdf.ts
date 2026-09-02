import { toJpeg } from 'html-to-image'
import { jsPDF } from 'jspdf'
import { supabase } from '@/lib/supabase'

/** 300 dpi — padrão de gráfica para folheto A4. */
const PRINT_DPI = 300
const CSS_DPI = 96
const PIXEL_RATIO = PRINT_DPI / CSS_DPI

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(String(r.result))
    r.onerror = () => reject(r.error)
    r.readAsDataURL(blob)
  })
}

function parseSupabaseStorageUrl(src: string): { bucket: string; path: string } | null {
  try {
    const u = new URL(src, window.location.href)
    const m =
      u.pathname.match(/\/storage\/v1\/object\/(?:public|sign|authenticated)\/([^/]+)\/(.+)$/) ||
      u.pathname.match(/\/storage\/v1\/render\/image\/(?:public|sign)\/([^/]+)\/(.+)$/)
    if (!m) return null
    return {
      bucket: decodeURIComponent(m[1]),
      path: decodeURIComponent(m[2]).replace(/\?.*$/, ''),
    }
  } catch {
    return null
  }
}

async function fetchSrcAsDataUrl(src: string): Promise<string | null> {
  if (!src || src.startsWith('data:')) return src || null
  const clean = src.split('#')[0]

  const parsed = parseSupabaseStorageUrl(clean)
  if (parsed) {
    const { data, error } = await supabase.storage.from(parsed.bucket).download(parsed.path)
    if (!error && data && data.size > 0) return blobToDataUrl(data)
  }

  try {
    const { data: sessionData } = await supabase.auth.getSession()
    const token = sessionData.session?.access_token
    const res = await fetch(clean, {
      mode: 'cors',
      credentials: 'omit',
      cache: 'reload',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    })
    if (res.ok) {
      const blob = await res.blob()
      if (blob.size > 0) return blobToDataUrl(blob)
    }
  } catch {
    /* CORS no fetch público — o download autenticado acima é o caminho certo. */
  }
  return null
}

function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const im = new Image()
    im.onload = () => resolve(im)
    im.onerror = () => reject(new Error('Falha ao decodificar imagem'))
    im.src = dataUrl
  })
}

function boxSize(el: HTMLElement | undefined, fallback: HTMLElement): { w: number; h: number } {
  const rect = el?.getBoundingClientRect()
  const w = Math.max(1, Math.round(rect && rect.width > 2 ? rect.width : el?.offsetWidth || fallback.offsetWidth || 80))
  const h = Math.max(1, Math.round(rect && rect.height > 2 ? rect.height : el?.offsetHeight || fallback.offsetHeight || 80))
  return { w, h }
}

/** html-to-image ignora object-fit. Gera um JPEG já recortado no tamanho do box. */
function fittedJpeg(source: HTMLImageElement, w: number, h: number, fit: string, padColor: string): string {
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(w * PIXEL_RATIO))
  canvas.height = Math.max(1, Math.round(h * PIXEL_RATIO))
  const ctx = canvas.getContext('2d')!
  ctx.scale(PIXEL_RATIO, PIXEL_RATIO)
  ctx.fillStyle = padColor || '#ffffff'
  ctx.fillRect(0, 0, w, h)

  const iw = source.naturalWidth || source.width
  const ih = source.naturalHeight || source.height
  if (iw < 1 || ih < 1) return canvas.toDataURL('image/jpeg', 0.92)

  if (fit === 'cover') {
    const scale = Math.max(w / iw, h / ih)
    const dw = iw * scale
    const dh = ih * scale
    ctx.drawImage(source, (w - dw) / 2, (h - dh) / 2, dw, dh)
  } else if (fit === 'contain') {
    const scale = Math.min(w / iw, h / ih)
    const dw = iw * scale
    const dh = ih * scale
    ctx.drawImage(source, (w - dw) / 2, (h - dh) / 2, dw, dh)
  } else {
    ctx.drawImage(source, 0, 0, w, h)
  }
  return canvas.toDataURL('image/jpeg', 0.92)
}

async function prepareClone(el: HTMLElement): Promise<HTMLElement> {
  const host = document.createElement('div')
  host.setAttribute('data-tabloid-print-clone', '1')
  host.style.cssText =
    'position:fixed;left:0;top:0;width:210mm;height:297mm;z-index:-1;pointer-events:none;opacity:0;overflow:hidden;'
  const clone = el.cloneNode(true) as HTMLElement
  clone.style.boxShadow = 'none'
  clone.style.margin = '0'
  clone.style.transform = 'none'
  clone.querySelectorAll('.no-print').forEach((n) => n.remove())
  host.appendChild(clone)
  document.body.appendChild(host)
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))

  const origImgs = Array.from(el.querySelectorAll('img'))
  const imgs = Array.from(clone.querySelectorAll('img'))

  await Promise.all(imgs.map(async (img, i) => {
    const orig = origImgs[i]
    const src = orig?.currentSrc || orig?.getAttribute('src') || img.getAttribute('src') || img.src
    const dataUrl = await fetchSrcAsDataUrl(src)
    if (!dataUrl) return
    try {
      const decoded = await loadImage(dataUrl)
      const { w, h } = boxSize(orig, img)
      const fit = (orig ? getComputedStyle(orig).objectFit : getComputedStyle(img).objectFit) || 'contain'
      const pad = getComputedStyle(orig?.parentElement || img.parentElement || img).backgroundColor || '#ffffff'
      const jpeg = fittedJpeg(decoded, w, h, fit, pad)
      img.removeAttribute('crossorigin')
      img.removeAttribute('srcset')
      img.loading = 'eager'
      img.style.objectFit = 'fill'
      img.src = jpeg
      if (img.decode) await img.decode().catch(() => undefined)
    } catch {
      img.removeAttribute('crossorigin')
      img.src = dataUrl
    }
  }))

  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
  return host
}

export async function downloadTabloidPrintPdf(opts: {
  pageEls: HTMLElement[]
  filename: string
  onProgress?: (message: string) => void
}): Promise<void> {
  const { pageEls, filename, onProgress } = opts
  if (pageEls.length === 0) throw new Error('Nenhuma página pra exportar.')

  await document.fonts.ready

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  })

  try {
    for (let i = 0; i < pageEls.length; i++) {
      onProgress?.(`Renderizando página ${i + 1} de ${pageEls.length} (300 dpi)...`)
      const host = await prepareClone(pageEls[i])
      const clone = host.firstElementChild as HTMLElement
      try {
        const bg = clone.style.backgroundColor || getComputedStyle(pageEls[i]).backgroundColor || '#ffffff'
        const dataUrl = await toJpeg(clone, {
          quality: 0.92,
          pixelRatio: PIXEL_RATIO,
          backgroundColor: bg,
          cacheBust: false,
          skipAutoScale: true,
          imagePlaceholder: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==',
          onImageErrorHandler: () => undefined,
        })
        if (i > 0) pdf.addPage('a4', 'portrait')
        pdf.addImage(dataUrl, 'JPEG', 0, 0, 210, 297, undefined, 'MEDIUM')
      } finally {
        host.remove()
      }
    }
  } catch (e) {
    document.querySelectorAll('[data-tabloid-print-clone]').forEach((n) => n.remove())
    throw e
  }

  onProgress?.('Montando o PDF...')
  pdf.save(filename)
}
