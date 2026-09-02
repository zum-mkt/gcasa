import { AtSign, MapPin, Phone, Globe, MessageCircle } from 'lucide-react'
import { type TabloidFooter } from '@/lib/tabloidFooter'

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const h = hex.replace('#', '').trim()
  if (h.length !== 6) return null
  const n = parseInt(h, 16)
  if (Number.isNaN(n)) return null
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
}

function rgbToHex(r: number, g: number, b: number) {
  const c = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0')
  return `#${c(r)}${c(g)}${c(b)}`
}

function mix(a: string, b: string, t: number) {
  const A = hexToRgb(a)
  const B = hexToRgb(b)
  if (!A || !B) return a
  return rgbToHex(A.r + (B.r - A.r) * t, A.g + (B.g - A.g) * t, A.b + (B.b - A.b) * t)
}

function luminance(hex: string) {
  const c = hexToRgb(hex)
  if (!c) return 0.5
  const lin = (v: number) => {
    const s = v / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * lin(c.r) + 0.7152 * lin(c.g) + 0.0722 * lin(c.b)
}

/** Cor de faixa/título: se o destaque for claro demais, escurece pra ter o ouro/laranja do encarte. */
function punch(hex: string) {
  return luminance(hex) > 0.5 ? mix(hex, '#7A4E00', 0.45) : hex
}

type Line = { icon: 'phone' | 'pin' | 'web' | 'ig'; text: string }

function ContactLine({ icon, text, color }: { icon: Line['icon']; text: string; color: string }) {
  const Icon = icon === 'phone' ? Phone : icon === 'pin' ? MapPin : icon === 'web' ? Globe : AtSign
  return (
    <p className="flex items-start gap-[5px] min-w-0">
      <Icon size={11} className="mt-[0.5px] flex-shrink-0" strokeWidth={2.6} style={{ color }} />
      <span className="min-w-0 leading-snug">{text}</span>
    </p>
  )
}

/** Frente: só duas faixas chapadas, tom sobre tom da cor do rodapé do verso. */
export function TabloidFrontFooter({
  accent = '#C0821A',
}: {
  accent?: string
  pageBackground?: string
}) {
  const deep = punch(accent)
  const soft = mix('#FFFFFF', deep, 0.42)

  return (
    <div className="w-full flex-shrink-0 flex flex-col overflow-hidden" style={{ height: '8mm' }}>
      <div className="flex-shrink-0" style={{ height: '2.5mm', background: soft }} />
      <div className="flex-1" style={{ background: deep }} />
    </div>
  )
}

/** Verso: topo sempre presente — faixa forte na borda da folha, faixa clara embaixo. */
export function TabloidBackHeader({
  accent = '#C0821A',
}: {
  accent?: string
}) {
  const deep = punch(accent)
  const soft = mix('#FFFFFF', deep, 0.42)

  return (
    <div className="w-full flex-shrink-0 flex flex-col overflow-hidden" style={{ height: '8mm' }}>
      <div className="flex-1" style={{ background: deep }} />
      <div className="flex-shrink-0" style={{ height: '2.5mm', background: soft }} />
    </div>
  )
}

/** Rodapé do verso — apelo de encarte: faixa forte, logo, selo, WhatsApp grande, barra escura. */
export function TabloidFooterBar({
  footer,
  accent = '#C0821A',
  showPlaceholders = false,
}: {
  footer: TabloidFooter
  accent?: string
  pageBackground?: string
  showPlaceholders?: boolean
}) {
  const gold = punch(accent)
  const instagram = footer.instagram?.replace(/^@/, '') ?? null
  const lines: Line[] = []
  if (footer.phone) lines.push({ icon: 'phone', text: footer.phone })
  for (const addr of footer.addresses) lines.push({ icon: 'pin', text: addr })
  if (footer.website) lines.push({ icon: 'web', text: footer.website })
  if (instagram) lines.push({ icon: 'ig', text: `@${instagram}` })
  if (footer.facebook) lines.push({ icon: 'web', text: footer.facebook })

  const showLogo = !!footer.logo_url || showPlaceholders
  const showContact = lines.length > 0 || !!footer.phone_label || showPlaceholders
  const showSeal = true
  const showCta = !!footer.cta_phrase || !!footer.cta_whatsapp || showPlaceholders
  const showFine = !!footer.fine_print || showPlaceholders

  const darkBar = mix('#0E0E0E', gold, 0.1)
  const fineColor = mix('#F5E6B8', gold, 0.35)
  const contactWash = mix('#FFFFFF', gold, 0.16)

  return (
    <div className="w-full flex-shrink-0 flex flex-col overflow-hidden">
      <div className="flex-shrink-0" style={{ height: '2px', background: gold }} />

      <div className="flex items-stretch bg-white min-h-[14mm]">
        {showLogo && (
          <div
            className="w-[48mm] flex-shrink-0 flex items-center justify-center self-stretch px-[1.5mm] py-[0.8mm]"
            style={{ background: '#FFFFFF' }}
          >
            {footer.logo_url ? (
              <img
                src={footer.logo_url}
                alt=""
                className="w-full h-full object-contain"
                style={{
                  // PNG sem fundo claro some no branco; o contorno fino
                  // segura branco/dourado sem virar “caixa” em volta do logo.
                  filter: 'drop-shadow(0 0 0.7px rgba(0,0,0,0.45)) drop-shadow(0 0 0.7px rgba(255,255,255,0.85))',
                }}
              />
            ) : (
              <span className="text-[8px] text-gray-300 font-bold">LOGO</span>
            )}
          </div>
        )}

        {showContact && (
          <div
            className="flex-1 min-w-0 flex flex-col justify-center text-[#2A2A2A]"
            style={{ fontSize: '8.2px', lineHeight: 1.28, background: contactWash, padding: '1mm 5mm' }}
          >
            <div className="w-full max-w-[92%] mx-auto">
              {footer.phone_label && (
                <p className="font-bold mb-[2px]" style={{ fontSize: '6.8px', color: gold }}>
                  {footer.phone_label}
                </p>
              )}
              {lines.length > 0 ? (
                <div className={lines.length >= 5 ? 'grid grid-cols-2 gap-x-[6mm] gap-y-[2px]' : 'space-y-[2px]'}>
                  {lines.map((l, i) => (
                    <ContactLine key={`${l.icon}-${i}`} icon={l.icon} text={l.text} color={gold} />
                  ))}
                </div>
              ) : showPlaceholders ? (
                <p className="text-gray-300">Telefone, endereço, redes</p>
              ) : null}
            </div>
          </div>
        )}

        {showSeal && (
          <div className="w-[13mm] h-[13mm] flex-shrink-0 flex items-center justify-center self-center mx-[2mm]">
            {footer.seal_url ? (
              <img src={footer.seal_url} alt="" className="w-full h-full object-contain" />
            ) : (
              <div
                className="w-full h-full rounded-full flex items-center justify-center"
                style={{
                  background: `radial-gradient(circle at 35% 30%, #FFE9A8, ${gold} 55%, ${mix(gold, '#5A3A00', 0.4)} 100%)`,
                  boxShadow: `0 0 0 2px ${gold}, 0 0 0 3px #fff, 0 0 0 4px ${gold}`,
                }}
              >
                <span className="text-[5.5px] font-black text-center leading-[1.05] text-white drop-shadow-sm">
                  G<br />CASA
                </span>
              </div>
            )}
          </div>
        )}

        {showCta && (
          <div className="flex-shrink-0 text-right pr-[3mm] min-w-[42mm] self-center">
            {(footer.cta_phrase || showPlaceholders) && (
              <p className="font-black leading-[1.05]" style={{ fontSize: '11px', color: gold }}>
                {footer.cta_phrase || 'Compre pelo WhatsApp!'}
              </p>
            )}
            {footer.cta_whatsapp && (
              <p
                className="font-black leading-none mt-[3px] inline-flex items-center justify-end gap-[4px] w-full"
                style={{ fontSize: '13.5px', color: '#111111' }}
              >
                <span
                  className="inline-flex items-center justify-center rounded-full flex-shrink-0"
                  style={{ width: 13, height: 13, background: '#25D366' }}
                >
                  <MessageCircle size={9} color="#fff" fill="#fff" />
                </span>
                {footer.cta_whatsapp}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="flex-shrink-0" style={{ height: '2px', background: gold }} />

      {showFine && (
        <div className="flex items-center px-3 py-[3px]" style={{ background: darkBar, minHeight: '6mm' }}>
          <p className="w-full text-center leading-snug font-medium" style={{ fontSize: '5.5px', color: fineColor }}>
            {footer.fine_print || (showPlaceholders ? 'Letras miúdas da oferta' : '')}
          </p>
        </div>
      )}
    </div>
  )
}
