import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { EntryPhoto } from '../types'

export function usePhotos(entryId: string) {
  return useQuery({
    queryKey: ['photos', entryId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('entry_photos')
        .select('*')
        .eq('entry_id', entryId)
        .order('id')
      if (error) throw error
      return data as EntryPhoto[]
    },
    enabled: !!entryId,
  })
}

export function usePhotoUrl(storagePath: string) {
  if (!storagePath) return ''
  const { data } = supabase.storage.from('entry-photos').getPublicUrl(storagePath)
  return data.publicUrl
}

export function getPhotoUrl(storagePath: string): string {
  const { data } = supabase.storage.from('entry-photos').getPublicUrl(storagePath)
  return data.publicUrl
}

export function useUploadPhotos(entryId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (files: File[]) => {
      const results: EntryPhoto[] = []
      for (const file of files) {
        const ext = file.name.split('.').pop()
        const path = `${entryId}/${crypto.randomUUID()}.${ext}`

        const { error: uploadErr } = await supabase.storage
          .from('entry-photos')
          .upload(path, file)
        if (uploadErr) throw uploadErr

        const { data, error } = await supabase
          .from('entry_photos')
          .insert({ entry_id: entryId, storage_path: path })
          .select()
          .single()
        if (error) throw error
        results.push(data as EntryPhoto)
      }
      return results
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['photos', entryId] }),
  })
}

export function useDeletePhoto() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ photo }: { photo: EntryPhoto }) => {
      await supabase.storage.from('entry-photos').remove([photo.storage_path])
      const { error } = await supabase
        .from('entry_photos')
        .delete()
        .eq('id', photo.id)
      if (error) throw error
      return photo.entry_id
    },
    onSuccess: (entryId) => qc.invalidateQueries({ queryKey: ['photos', entryId] }),
  })
}
