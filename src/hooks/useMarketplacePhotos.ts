import { useMutation } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

const BUCKET = 'marketplace-photos'

export function useUploadMarketplacePhoto() {
  return useMutation({
    mutationFn: async ({ file, folder }: { file: File; folder: string }) => {
      const ext = file.name.split('.').pop()
      const path = `${folder}/${crypto.randomUUID()}.${ext}`
      const { error } = await supabase.storage.from(BUCKET).upload(path, file)
      if (error) throw error
      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
      return data.publicUrl
    },
  })
}
