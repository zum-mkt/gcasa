import { useRef, useState } from 'react'
import { Upload, X, Image as ImageIcon, Loader2, ChevronUp, ChevronDown } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { toast } from '@/components/ui/Toast'

interface GalleryUploadProps {
  value: string[]
  onChange: (urls: string[]) => void
  bucket?: string
  folder?: string
  label?: string
  hint?: string
}

export function GalleryUpload({
  value,
  onChange,
  bucket = 'media',
  folder = 'uploads',
  label,
  hint,
}: GalleryUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  const uploadOne = async (file: File): Promise<string | null> => {
    if (!file.type.startsWith('image/')) {
      toast.error('Arquivo inválido', `"${file.name}" não é uma imagem.`)
      return null
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Arquivo muito grande', `"${file.name}" excede 5MB.`)
      return null
    }
    const ext = file.name.split('.').pop()
    const name = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const { error } = await supabase.storage.from(bucket).upload(name, file, { upsert: false })
    if (error) {
      toast.error('Erro ao enviar imagem', error.message)
      return null
    }
    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(name)
    return publicUrl
  }

  const uploadFiles = async (files: FileList | File[]) => {
    setUploading(true)
    try {
      const uploaded: string[] = []
      for (const file of Array.from(files)) {
        const url = await uploadOne(file)
        if (url) uploaded.push(url)
      }
      if (uploaded.length > 0) {
        onChange([...value, ...uploaded])
        toast.success(uploaded.length > 1 ? `${uploaded.length} imagens enviadas!` : 'Imagem enviada com sucesso!')
      }
    } finally {
      setUploading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) uploadFiles(e.target.files)
    e.target.value = ''
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    if (e.dataTransfer.files.length) uploadFiles(e.dataTransfer.files)
  }

  const remove = (i: number) => onChange(value.filter((_, idx) => idx !== i))
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir
    if (j < 0 || j >= value.length) return
    const next = [...value]
    ;[next[i], next[j]] = [next[j], next[i]]
    onChange(next)
  }

  return (
    <div className="w-full">
      {label && <p className="text-sm font-medium text-gray-700 mb-1.5">{label}</p>}

      {value.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-3">
          {value.map((url, i) => (
            <div key={url + i} className="relative rounded-xl overflow-hidden border border-gray-200 bg-gray-50 group">
              <img src={url} alt={`Foto ${i + 1}`} className="w-full aspect-square object-cover" />
              <button
                type="button"
                onClick={() => remove(i)}
                className="absolute top-1.5 right-1.5 w-6 h-6 bg-white/90 hover:bg-white rounded-lg flex items-center justify-center shadow text-gray-600 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
              >
                <X size={12} />
              </button>
              <div className="absolute bottom-1.5 left-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  className="w-6 h-6 bg-white/90 hover:bg-white rounded-lg flex items-center justify-center shadow text-gray-600 disabled:opacity-40 disabled:pointer-events-none"
                >
                  <ChevronUp size={12} />
                </button>
                <button
                  type="button"
                  onClick={() => move(i, 1)}
                  disabled={i === value.length - 1}
                  className="w-6 h-6 bg-white/90 hover:bg-white rounded-lg flex items-center justify-center shadow text-gray-600 disabled:opacity-40 disabled:pointer-events-none"
                >
                  <ChevronDown size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <input ref={inputRef} type="file" accept="image/*" multiple onChange={handleFileChange} className="hidden" />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        disabled={uploading}
        className={cn(
          'w-full h-24 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-1.5 transition-colors',
          dragOver ? 'border-primary-400 bg-primary-50' : 'border-gray-300 hover:border-gray-400 bg-gray-50 hover:bg-gray-100',
          uploading && 'pointer-events-none opacity-70'
        )}
      >
        {uploading ? (
          <>
            <Loader2 size={18} className="text-primary-600 animate-spin" />
            <span className="text-xs text-gray-500">Enviando...</span>
          </>
        ) : (
          <>
            <div className="w-8 h-8 bg-gray-200 rounded-xl flex items-center justify-center">
              {dragOver ? <Upload size={14} className="text-primary-600" /> : <ImageIcon size={14} className="text-gray-400" />}
            </div>
            <p className="text-xs font-medium text-gray-700">Clique ou arraste imagens (várias de uma vez)</p>
          </>
        )}
      </button>

      {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
    </div>
  )
}
