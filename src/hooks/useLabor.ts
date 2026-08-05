import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Conversation, LaborResponse, LaborTask, Profile } from '../types/marketplace'

export function useLaborFeed() {
  return useQuery({
    queryKey: ['labor_tasks', 'feed'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('labor_tasks')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as LaborTask[]
    },
  })
}

export function useMyLaborTasks(customerId: string | undefined) {
  return useQuery({
    queryKey: ['labor_tasks', 'mine', customerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('labor_tasks')
        .select('*')
        .eq('customer_id', customerId as string)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as LaborTask[]
    },
    enabled: !!customerId,
  })
}

export function useLaborTask(id: string | undefined) {
  return useQuery({
    queryKey: ['labor_tasks', 'one', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('labor_tasks').select('*').eq('id', id as string).single()
      if (error) throw error
      return data as LaborTask
    },
    enabled: !!id,
  })
}

export function useCreateLaborTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (task: Omit<LaborTask, 'id' | 'customer_id' | 'created_at' | 'status'>) => {
      const { data: { user } } = await supabase.auth.getUser()
      const { data, error } = await supabase
        .from('labor_tasks')
        .insert({ ...task, customer_id: user!.id, status: 'active' })
        .select()
        .single()
      if (error) throw error
      return data as LaborTask
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['labor_tasks'] }),
  })
}

export function useCloseLaborTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('labor_tasks').update({ status: 'closed' }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['labor_tasks'] }),
  })
}

export function useMyLaborResponse(taskId: string | undefined, laborerId: string | undefined) {
  return useQuery({
    queryKey: ['labor_responses', 'mine', taskId, laborerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('labor_responses')
        .select('*')
        .eq('task_id', taskId as string)
        .eq('laborer_id', laborerId as string)
        .maybeSingle()
      if (error) throw error
      return data as LaborResponse | null
    },
    enabled: !!taskId && !!laborerId,
  })
}

export interface MyLaborResponse {
  response: LaborResponse
  task: LaborTask
}

export function useMyLaborResponses(laborerId: string | undefined) {
  return useQuery({
    queryKey: ['labor_responses', 'mine-list', laborerId],
    queryFn: async () => {
      const { data: responses, error } = await supabase
        .from('labor_responses')
        .select('*')
        .eq('laborer_id', laborerId as string)
        .order('created_at', { ascending: false })
      if (error) throw error
      const rows = responses as LaborResponse[]
      if (rows.length === 0) return []
      const taskIds = rows.map((r) => r.task_id)
      const { data: tasks } = await supabase.from('labor_tasks').select('*').in('id', taskIds)
      const taskMap = new Map(((tasks ?? []) as LaborTask[]).map((t) => [t.id, t]))
      return rows.filter((r) => taskMap.has(r.task_id)).map((r) => ({ response: r, task: taskMap.get(r.task_id)! }))
    },
    enabled: !!laborerId,
  })
}

export interface TaskResponse {
  response: LaborResponse
  profile: Profile
}

export function useTaskResponses(taskId: string | undefined) {
  return useQuery({
    queryKey: ['labor_responses', 'task', taskId],
    queryFn: async () => {
      const { data: responses, error } = await supabase
        .from('labor_responses')
        .select('*')
        .eq('task_id', taskId as string)
        .order('created_at', { ascending: true })
      if (error) throw error
      const rows = responses as LaborResponse[]
      if (rows.length === 0) return []
      const laborerIds = rows.map((r) => r.laborer_id)
      const { data: profiles } = await supabase.from('profiles').select('*').in('id', laborerIds)
      const profileMap = new Map(((profiles ?? []) as Profile[]).map((p) => [p.id, p]))
      return rows.filter((r) => profileMap.has(r.laborer_id)).map((r) => ({ response: r, profile: profileMap.get(r.laborer_id)! }))
    },
    enabled: !!taskId,
  })
}

export function useRespondToLaborTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ taskId, message }: { taskId: string; message: string | null }) => {
      const { data: { user } } = await supabase.auth.getUser()
      const { data, error } = await supabase
        .from('labor_responses')
        .insert({ task_id: taskId, laborer_id: user!.id, message })
        .select()
        .single()
      if (error) throw error
      return data as LaborResponse
    },
    onSuccess: (_r, vars) => qc.invalidateQueries({ queryKey: ['labor_responses', 'mine', vars.taskId] }),
  })
}

export function useAcceptLaborResponse() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ taskId, laborerId }: { taskId: string; laborerId: string }) => {
      const { data: { user } } = await supabase.auth.getUser()
      const { data: conversation, error: convErr } = await supabase
        .from('conversations')
        .insert({ kind: 'labor', labor_task_id: taskId, customer_id: user!.id, worker_id: laborerId })
        .select()
        .single()
      if (convErr) throw convErr

      const { error: taskErr } = await supabase.from('labor_tasks').update({ status: 'closed' }).eq('id', taskId)
      if (taskErr) throw taskErr

      return conversation as Conversation
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['labor_responses', 'task', vars.taskId] })
      qc.invalidateQueries({ queryKey: ['labor_tasks'] })
      qc.invalidateQueries({ queryKey: ['conversations'] })
    },
  })
}
