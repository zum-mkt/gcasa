import { useRef, useState } from 'react'
import { Upload, X, Video as VideoIcon, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { toast } from '@/components/ui/Toast'

interface VideoUploadProps {
  value?: string | null
  onChange: (url: string | null) => void
  bucket?: string
  folder?: string
  label?: string
  hint?: string
  maxSizeMb?: number
}

export function VideoUpload({
  value,
  onChange,
  bucket = 'media',
  folder = 'uploads',
  label,
  hint,
  maxSizeMb = 25,
}: VideoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  const upload = async (file: File) => {
    if (!file.type.startsWith('video/')) {
      toast.error('Arquivo inválido', 'Selecione um vídeo (MP4, WebM, etc.)')
      return
    }
    if (file.size > maxSizeMb * 1024 * 1024) {
      toast.error('Arquivo muito grande', `O tamanho máximo é ${maxSizeMb}MB.`)
      return
    }

    setUploading(true)
    try {
      const ext = file.name.split('.').pop()
      const name = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error } = await supabase.storage.from(bucket).upload(name, file, { upsert: false })
      if (error) throw error

      const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(name)
      onChange(publicUrl)
      toast.success('Vídeo enviado com sucesso!')
    } catch (err) {
      const msg = (err as { message?: string })?.message ?? 'Tente novamente.'
      toast.error('Erro ao enviar vídeo', msg)
    } finally {
      setUploading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) upload(file)
    e.target.value = ''
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) upload(file)
  }

  return (
    <div className="w-full">
      {label && <p className="text-sm font-medium text-gray-700 mb-1.5">{label}</p>}
      <input ref={inputRef} type="file" accept="video/*" onChange={handleFileChange} className="hidden" />

      {value ? (
        <div className="relative rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
          <video src={value} className="w-full h-40 object-cover" muted controls />
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute top-2 right-2 w-7 h-7 bg-white/90 hover:bg-white rounded-lg flex items-center justify-center shadow text-gray-600 hover:text-red-600 transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          disabled={uploading}
          className={cn(
            'w-full h-36 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-2 transition-colors',
            dragOver ? 'border-primary-400 bg-primary-50' : 'border-gray-300 hover:border-gray-400 bg-gray-50 hover:bg-gray-100',
            uploading && 'pointer-events-none opacity-70'
          )}
        >
          {uploading ? (
            <>
              <Loader2 size={20} className="text-primary-600 animate-spin" />
              <span className="text-xs text-gray-500">Enviando...</span>
            </>
          ) : (
            <>
              <div className="w-9 h-9 bg-gray-200 rounded-xl flex items-center justify-center">
                {dragOver ? <Upload size={16} className="text-primary-600" /> : <VideoIcon size={16} className="text-gray-400" />}
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-700">Clique ou arraste um vídeo</p>
                <p className="text-xs text-gray-400 mt-0.5">MP4 ou WebM — máx. {maxSizeMb}MB</p>
              </div>
            </>
          )}
        </button>
      )}

      {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
    </div>
  )
}
