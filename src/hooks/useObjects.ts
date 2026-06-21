import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { ConstructionObject } from '../types'

export function useObjects() {
  return useQuery({
    queryKey: ['objects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('objects')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as ConstructionObject[]
    },
  })
}

export function useObject(id: string) {
  return useQuery({
    queryKey: ['objects', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('objects')
        .select('*')
        .eq('id', id)
        .single()
      if (error) throw error
      return data as ConstructionObject
    },
    enabled: !!id,
  })
}

export function useCreateObject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (obj: Omit<ConstructionObject, 'id' | 'user_id' | 'created_at'>) => {
      const { data: { user } } = await supabase.auth.getUser()
      const { data, error } = await supabase
        .from('objects')
        .insert({ ...obj, user_id: user!.id })
        .select()
        .single()
      if (error) throw error
      return data as ConstructionObject
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['objects'] }),
  })
}

export function useDeleteObject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('objects').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['objects'] }),
  })
}
