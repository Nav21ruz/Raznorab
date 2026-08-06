import { useMutation } from '@tanstack/react-query'
import { api } from '../lib/api'

export function useUploadMarketplacePhoto() {
  return useMutation({
    mutationFn: ({ file, folder }: { file: File; folder: 'orders' | 'builder-portfolio' }) =>
      api.uploads.upload(folder, file),
  })
}
