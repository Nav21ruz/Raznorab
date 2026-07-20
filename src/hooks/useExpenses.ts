import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Expense } from '../types'

export function useExpenses(objectId: string) {
  return useQuery({
    queryKey: ['expenses', objectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('object_id', objectId)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as Expense[]
    },
    enabled: !!objectId,
  })
}

export function useCreateExpense() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (expense: Omit<Expense, 'id' | 'created_at' | 'source'>) => {
      const { data, error } = await supabase
        .from('expenses')
        .insert({ ...expense, source: 'web' })
        .select()
        .single()
      if (error) throw error
      return data as Expense
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['expenses', data.object_id] })
    },
  })
}

export function useDeleteExpense() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, objectId }: { id: string; objectId: string }) => {
      const { error } = await supabase.from('expenses').delete().eq('id', id)
      if (error) throw error
      return objectId
    },
    onSuccess: (objectId) => {
      qc.invalidateQueries({ queryKey: ['expenses', objectId] })
    },
  })
}
