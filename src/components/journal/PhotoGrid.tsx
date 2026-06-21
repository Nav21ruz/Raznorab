import { useRef, useState } from 'react'
import { Plus, X, ZoomIn } from 'lucide-react'
import type { EntryPhoto } from '../../types'
import { getPhotoUrl, useDeletePhoto, useUploadPhotos } from '../../hooks/usePhotos'

interface Props {
  entryId: string
  photos: EntryPhoto[]
  readonly?: boolean
}

export function PhotoGrid({ entryId, photos, readonly = false }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const { mutate: upload, isPending: uploading } = useUploadPhotos(entryId)
  const { mutate: deletePhoto } = useDeletePhoto()
  const [lightbox, setLightbox] = useState<string | null>(null)

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return
    const remaining = 10 - photos.length
    const toUpload = Array.from(files).slice(0, remaining)
    upload(toUpload)
  }

  return (
    <>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {photos.map((p) => {
          const url = getPhotoUrl(p.storage_path)
          return (
            <div key={p.id} className="relative group aspect-square rounded-lg overflow-hidden bg-gray-100">
              <img src={url} alt={p.caption ?? ''} className="w-full h-full object-cover" loading="lazy" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center gap-1">
                <button
                  onClick={() => setLightbox(url)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 bg-white/90 rounded-lg transition-all"
                >
                  <ZoomIn className="w-4 h-4 text-gray-700" />
                </button>
                {!readonly && (
                  <button
                    onClick={() => deletePhoto({ photo: p })}
                    className="opacity-0 group-hover:opacity-100 p-1.5 bg-white/90 rounded-lg transition-all"
                  >
                    <X className="w-4 h-4 text-red-500" />
                  </button>
                )}
              </div>
            </div>
          )
        })}

        {!readonly && photos.length < 10 && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="aspect-square rounded-lg border-2 border-dashed border-gray-300 hover:border-orange-400 hover:bg-orange-50 flex flex-col items-center justify-center gap-1 transition-colors disabled:opacity-50"
          >
            {uploading ? (
              <span className="w-5 h-5 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Plus className="w-5 h-5 text-gray-400" />
                <span className="text-xs text-gray-400">Фото</span>
              </>
            )}
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {lightbox && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setLightbox(null)}>
          <button className="absolute top-4 right-4 p-2 text-white hover:bg-white/20 rounded-lg" onClick={() => setLightbox(null)}>
            <X className="w-6 h-6" />
          </button>
          <img src={lightbox} alt="" className="max-w-full max-h-full object-contain rounded-lg" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </>
  )
}
