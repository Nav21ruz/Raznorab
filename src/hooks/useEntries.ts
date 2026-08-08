import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Entry, EntryPhoto, EntryWorker } from '../types'

export type EntryWithDetails = Entry & { entry_workers: EntryWorker[]; entry_photos: EntryPhoto[] }

export function useEntries(objectId: string) {
  return useQuery({
    queryKey: ['entries', objectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('entries')
        .select('*')
        .eq('object_id', objectId)
        .order('date', { ascending: false })
      if (error) throw error
      return data as Entry[]
    },
    enabled: !!objectId,
  })
}

export function useEntry(id: string) {
  return useQuery({
    queryKey: ['entry', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('entries')
        .select('*, entry_workers(*), entry_photos(*)')
        .eq('id', id)
        .single()
      if (error) throw error
      return data as EntryWithDetails
    },
    enabled: !!id,
  })
}

export function useCreateEntry() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      entry,
      workers,
    }: {
      entry: Omit<Entry, 'id' | 'created_at'>
      workers: Omit<EntryWorker, 'id' | 'entry_id'>[]
    }) => {
      const { data, error } = await supabase
        .from('entries')
        .insert(entry)
        .select()
        .single()
      if (error) throw error

      if (workers.length > 0) {
        const { error: wErr } = await supabase
          .from('entry_workers')
          .insert(workers.map((w) => ({ ...w, entry_id: data.id })))
        if (wErr) throw wErr
      }

      return data as Entry
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['entries', data.object_id] })
    },
  })
}

export function useUpdateEntry() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      entry,
      workers,
    }: {
      id: string
      entry: Partial<Omit<Entry, 'id' | 'created_at'>>
      workers?: Omit<EntryWorker, 'id' | 'entry_id'>[]
    }) => {
      const { data, error } = await supabase
        .from('entries')
        .update(entry)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error

      if (workers !== undefined) {
        await supabase.from('entry_workers').delete().eq('entry_id', id)
        if (workers.length > 0) {
          const { error: wErr } = await supabase
            .from('entry_workers')
            .insert(workers.map((w) => ({ ...w, entry_id: id })))
          if (wErr) throw wErr
        }
      }

      return data as Entry
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['entries', data.object_id] })
      qc.invalidateQueries({ queryKey: ['entry', data.id] })
    },
  })
}

export function useDeleteEntry() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, objectId }: { id: string; objectId: string }) => {
      const { error } = await supabase.from('entries').delete().eq('id', id)
      if (error) throw error
      return objectId
    },
    onSuccess: (objectId) => {
      qc.invalidateQueries({ queryKey: ['entries', objectId] })
    },
  })
}
