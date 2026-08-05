import { useRef } from 'react'
import { Camera, X } from 'lucide-react'
import { toast } from 'sonner'
import { useUploadMarketplacePhoto } from '../../hooks/useMarketplacePhotos'

interface Props {
  photos: string[]
  onChange: (photos: string[]) => void
  folder: string
  max?: number
  label?: string
}

export function PhotoPicker({ photos, onChange, folder, max = 6, label = 'Фото (необязательно)' }: Props) {
  const upload = useUploadMarketplacePhoto()
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    const remaining = max - photos.length
    const toUpload = Array.from(files).slice(0, Math.max(remaining, 0))
    let current = photos
    for (const file of toUpload) {
      try {
        const url = await upload.mutateAsync({ file, folder })
        current = [...current, url]
        onChange(current)
      } catch {
        toast.error('Не удалось загрузить фото')
      }
    }
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-gray-400">{label}</label>
      <div className="flex flex-wrap gap-2">
        {photos.map((url, idx) => (
          <div key={url} className="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-700 shrink-0">
            <img src={url} alt="" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => onChange(photos.filter((_, i) => i !== idx))}
              className="absolute top-1 right-1 w-5 h-5 bg-black/70 rounded-full flex items-center justify-center"
            >
              <X className="w-3 h-3 text-white" />
            </button>
          </div>
        ))}
        {photos.length < max && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={upload.isPending}
            className="w-20 h-20 rounded-xl border border-dashed border-gray-700 flex items-center justify-center text-gray-600 hover:border-gray-600 hover:text-gray-500 transition-colors shrink-0 disabled:opacity-50"
          >
            {upload.isPending ? (
              <span className="w-4 h-4 border-2 border-gray-600 border-t-orange-500 rounded-full animate-spin" />
            ) : (
              <Camera className="w-5 h-5" />
            )}
          </button>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
    </div>
  )
}
