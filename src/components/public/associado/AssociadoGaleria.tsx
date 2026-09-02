import { useState } from 'react'
import Lightbox from 'yet-another-react-lightbox'
import 'yet-another-react-lightbox/styles.css'

export function AssociadoGaleria({ gallery, title = 'Galeria de Imagens' }: { gallery: string[]; title?: string }) {
  const [index, setIndex] = useState(-1)

  if (!gallery || gallery.length === 0) return null

  const featured = gallery[0]
  const rest = gallery.slice(1, 5)

  return (
    <div>
      <h2 className="section-label">{title}</h2>
      <div className="h-px bg-primary-400/30 mt-3 mb-5" />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
        <button
          type="button"
          onClick={() => setIndex(0)}
          className="col-span-2 row-span-2 aspect-square sm:aspect-auto bg-graphite-100 overflow-hidden group"
        >
          <img
            src={featured}
            alt="Foto principal"
            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
            loading="lazy"
          />
        </button>
        {rest.map((url, i) => (
          <button
            key={url + i}
            type="button"
            onClick={() => setIndex(i + 1)}
            className="aspect-square bg-graphite-100 overflow-hidden group"
          >
            <img
              src={url}
              alt={`Foto ${i + 2}`}
              className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
              loading="lazy"
            />
          </button>
        ))}
      </div>

      <Lightbox
        open={index >= 0}
        close={() => setIndex(-1)}
        index={index}
        slides={gallery.map((src) => ({ src }))}
      />
    </div>
  )
}
