import { useEffect, useMemo, useRef, useState } from 'react'
import { Maximize2, Minimize2 } from 'lucide-react'
import { STORE_LOCATIONS, type StoreLocation } from '@/data/storeLocations'
import { cn } from '@/lib/utils'
import 'leaflet/dist/leaflet.css'

type AssociateLink = { name: string; slug: string }

type StoresMapProps = {
  associates?: AssociateLink[]
  className?: string
}

const PIN_SVG = encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="40" viewBox="0 0 28 40">
    <path fill="#EA4335" stroke="#B31412" stroke-width="1" d="M14 1C7.4 1 2 6.4 2 13.1 2 22.2 14 39 14 39s12-16.8 12-25.9C26 6.4 20.6 1 14 1z"/>
    <circle cx="14" cy="13" r="5.2" fill="#fff"/>
  </svg>`,
)

function matchAssociate(store: StoreLocation, associates: AssociateLink[]): AssociateLink | undefined {
  const brand = store.brand.toLowerCase()
  const name = store.name.toLowerCase()
  const scored = associates
    .map((a) => {
      const n = a.name.toLowerCase()
      let score = 0
      if (n === brand || n === name) score = 3
      else if (n.includes(brand) || brand.includes(n)) score = 2
      else if (n.includes(name.split(' ')[0] ?? '')) score = 1
      return { a, score }
    })
    .filter((x) => x.score > 0)
    .sort((x, y) => y.score - x.score || y.a.name.length - x.a.name.length)
  return scored[0]?.a
}

function mapsUrl(store: StoreLocation) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${store.address}, ${store.city} - ${store.state}`)}`
}

export function StoresMap({ associates = [], className }: StoresMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<import('leaflet').Map | null>(null)
  const layersRef = useRef<{ map: import('leaflet').TileLayer; sat: import('leaflet').TileLayer } | null>(null)
  const [mode, setMode] = useState<'map' | 'sat'>('map')
  const [fullscreen, setFullscreen] = useState(false)
  const associatesRef = useRef(associates)
  associatesRef.current = associates
  const associateKey = useMemo(
    () => associates.map((a) => `${a.slug}|${a.name}`).sort().join(';'),
    [associates],
  )

  useEffect(() => {
    let cancelled = false

    const boot = async () => {
      const leafletMod = await import('leaflet')
      const L = leafletMod.default ?? leafletMod
      if (cancelled || !containerRef.current || mapRef.current) return

      const mapLayer = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
        { attribution: 'Tiles &copy; Esri', maxZoom: 19 },
      )
      const satLayer = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        { attribution: 'Tiles &copy; Esri', maxZoom: 19 },
      )

      const map = L.map(containerRef.current, {
        zoomControl: false,
        scrollWheelZoom: true,
        attributionControl: true,
        layers: [mapLayer],
      })

      L.control.zoom({ position: 'bottomright' }).addTo(map)
      L.control.scale({ metric: true, imperial: false, position: 'bottomleft' }).addTo(map)

      const icon = L.icon({
        iconUrl: `data:image/svg+xml;charset=UTF-8,${PIN_SVG}`,
        iconSize: [28, 40],
        iconAnchor: [14, 40],
        popupAnchor: [0, -36],
      })

      const bounds = L.latLngBounds([])
      for (const store of STORE_LOCATIONS) {
        const associate = matchAssociate(store, associatesRef.current)
        const profile = associate
          ? `<a href="/associados/${associate.slug}" style="color:#C07F14;font-weight:800;font-size:15px;text-decoration:none">Ver loja →</a>`
          : `<a href="${mapsUrl(store)}" target="_blank" rel="noreferrer" style="color:#C07F14;font-weight:800;font-size:15px;text-decoration:none">Como chegar →</a>`

        L.marker([store.lat, store.lng], { icon, title: `${store.name} — ${store.city}` })
          .bindPopup(
            `<div style="min-width:200px;font-family:inherit">
              <p style="margin:0 0 2px;font-weight:800;color:#0D2228;font-size:16px">${store.name}</p>
              <p style="margin:0 0 6px;color:#0D2228;font-size:14px;font-weight:700">${store.city} — ${store.state}</p>
              <p style="margin:0 0 10px;color:#575756;font-size:14px;line-height:1.4">${store.address}</p>
              ${profile}
            </div>`,
            { maxWidth: 280 },
          )
          .addTo(map)

        bounds.extend([store.lat, store.lng])
      }

      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [36, 36], maxZoom: 8 })
      } else {
        map.setView([-22.1, -49.5], 7)
      }

      mapRef.current = map
      layersRef.current = { map: mapLayer, sat: satLayer }
      requestAnimationFrame(() => map.invalidateSize())
    }

    void boot()

    return () => {
      cancelled = true
      mapRef.current?.remove()
      mapRef.current = null
      layersRef.current = null
    }
  }, [associateKey])

  useEffect(() => {
    const map = mapRef.current
    const layers = layersRef.current
    if (!map || !layers) return
    if (mode === 'sat') {
      if (map.hasLayer(layers.map)) map.removeLayer(layers.map)
      if (!map.hasLayer(layers.sat)) layers.sat.addTo(map)
    } else {
      if (map.hasLayer(layers.sat)) map.removeLayer(layers.sat)
      if (!map.hasLayer(layers.map)) layers.map.addTo(map)
    }
  }, [mode])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setFullscreen(false)
    }
    window.addEventListener('keydown', onKey)
    const t = window.setTimeout(() => mapRef.current?.invalidateSize(), 80)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.clearTimeout(t)
    }
  }, [fullscreen])

  return (
    <div
      className={cn(
        'stores-map relative w-full bg-graphite-100',
        fullscreen ? 'fixed inset-0 z-[80] h-screen' : 'h-[380px] md:h-[460px] lg:h-[500px]',
        className,
      )}
    >
      <div ref={containerRef} className="absolute inset-0" />

      <div className="absolute top-3 left-3 z-[400] flex overflow-hidden rounded-sm shadow-md">
        <button
          type="button"
          onClick={() => setMode('map')}
          className={cn(
            'px-4 py-2 text-base font-bold transition-colors',
            mode === 'map' ? 'bg-white text-graphite-900' : 'bg-white/90 text-graphite-600 hover:bg-white',
          )}
        >
          Mapa
        </button>
        <button
          type="button"
          onClick={() => setMode('sat')}
          className={cn(
            'px-4 py-2 text-base font-bold border-l border-graphite-200 transition-colors',
            mode === 'sat' ? 'bg-white text-graphite-900' : 'bg-white/90 text-graphite-600 hover:bg-white',
          )}
        >
          Satélite
        </button>
      </div>

      <button
        type="button"
        onClick={() => setFullscreen((v) => !v)}
        aria-label={fullscreen ? 'Sair da tela cheia' : 'Tela cheia'}
        className="absolute top-3 right-3 z-[400] w-9 h-9 bg-white shadow-md flex items-center justify-center text-graphite-700 hover:bg-graphite-50 transition-colors"
      >
        {fullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
      </button>
    </div>
  )
}
