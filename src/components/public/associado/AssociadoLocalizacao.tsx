import { MapPin, Clock } from 'lucide-react'

interface AssociadoLocalizacaoProps {
  address?: string | null
  city?: string | null
  state?: string | null
  businessHours?: string | null
  title?: string
}

export function AssociadoLocalizacao({ address, city, state, businessHours, title = 'Como Chegar' }: AssociadoLocalizacaoProps) {
  const fullAddress = [address, city, state].filter(Boolean).join(', ')
  if (!fullAddress) return null

  return (
    <div>
      <h2 className="section-label">{title}</h2>
      <div className="h-px bg-primary-400/30 mt-3 mb-5" />

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          {address && (
            <div className="flex items-start gap-3">
              <MapPin size={16} className="text-primary-500 flex-shrink-0 mt-0.5" />
              <p className="text-graphite-700 leading-relaxed">
                {address}
                {(city || state) && <><br />{[city, state].filter(Boolean).join(' — ')}</>}
              </p>
            </div>
          )}
          {businessHours && (
            <div className="flex items-start gap-3">
              <Clock size={16} className="text-primary-500 flex-shrink-0 mt-0.5" />
              <p className="text-graphite-700 leading-relaxed whitespace-pre-line">{businessHours}</p>
            </div>
          )}
        </div>

        <div className="bg-graphite-100 aspect-video md:aspect-auto md:h-full min-h-[220px]">
          <iframe
            title={`Mapa — ${fullAddress}`}
            src={`https://maps.google.com/maps?q=${encodeURIComponent(fullAddress)}&output=embed`}
            width="100%"
            height="100%"
            style={{ border: 0, minHeight: 220 }}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </div>
    </div>
  )
}
