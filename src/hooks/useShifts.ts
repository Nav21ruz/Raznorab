import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Shift } from '../types'

export function useShifts(objectId: string) {
  return useQuery({
    queryKey: ['shifts', objectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shifts')
        .select('*')
        .eq('object_id', objectId)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as Shift[]
    },
    enabled: !!objectId,
  })
}

export function useCreateShift() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (shift: Omit<Shift, 'id' | 'created_at' | 'source'>) => {
      const { data, error } = await supabase
        .from('shifts')
        .insert({ ...shift, source: 'web' })
        .select()
        .single()
      if (error) throw error
      return data as Shift
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['shifts', data.object_id] })
    },
  })
}

export function useTogglePaid() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, objectId, paid }: { id: string; objectId: string; paid: boolean }) => {
      const { error } = await supabase.from('shifts').update({ paid }).eq('id', id)
      if (error) throw error
      return objectId
    },
    onSuccess: (objectId) => {
      qc.invalidateQueries({ queryKey: ['shifts', objectId] })
    },
  })
}

export function useDeleteShift() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, objectId }: { id: string; objectId: string }) => {
      const { error } = await supabase.from('shifts').delete().eq('id', id)
      if (error) throw error
      return objectId
    },
    onSuccess: (objectId) => {
      qc.invalidateQueries({ queryKey: ['shifts', objectId] })
    },
  })
}
