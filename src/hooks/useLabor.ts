import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import type { Conversation, LaborTask } from '../types/marketplace'

export function useLaborFeed() {
  return useQuery({
    queryKey: ['labor_tasks', 'feed'],
    queryFn: () => api.laborTasks.feed(),
  })
}

export function useMyLaborTasks(customerId: string | undefined) {
  return useQuery({
    queryKey: ['labor_tasks', 'mine', customerId],
    queryFn: () => api.laborTasks.mine(),
    enabled: !!customerId,
  })
}

export function useLaborTask(id: string | undefined) {
  return useQuery({
    queryKey: ['labor_tasks', 'one', id],
    queryFn: () => api.laborTasks.get(id as string),
    enabled: !!id,
  })
}

export function useCreateLaborTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (task: Omit<LaborTask, 'id' | 'customer_id' | 'created_at' | 'status'>) => api.laborTasks.create(task),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['labor_tasks'] }),
  })
}

export function useCloseLaborTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.laborTasks.close(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['labor_tasks'] }),
  })
}

export function useMyLaborResponse(taskId: string | undefined, laborerId: string | undefined) {
  return useQuery({
    queryKey: ['labor_responses', 'mine', taskId, laborerId],
    queryFn: () => api.laborResponses.forTask(taskId as string),
    enabled: !!taskId && !!laborerId,
  })
}

export function useMyLaborResponses(laborerId: string | undefined) {
  return useQuery({
    queryKey: ['labor_responses', 'mine-list', laborerId],
    queryFn: () => api.laborResponses.mine(),
    enabled: !!laborerId,
  })
}

export function useTaskResponses(taskId: string | undefined) {
  return useQuery({
    queryKey: ['labor_responses', 'task', taskId],
    queryFn: () => api.laborTasks.responses(taskId as string),
    enabled: !!taskId,
  })
}

export function useRespondToLaborTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ taskId, message }: { taskId: string; message: string | null }) => api.laborResponses.create(taskId, message),
    onSuccess: (_r, vars) => qc.invalidateQueries({ queryKey: ['labor_responses', 'mine', vars.taskId] }),
  })
}

export function useAcceptLaborResponse() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ taskId, laborerId }: { taskId: string; laborerId: string }): Promise<Conversation> =>
      api.laborTasks.accept(taskId, laborerId),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['labor_responses', 'task', vars.taskId] })
      qc.invalidateQueries({ queryKey: ['labor_tasks'] })
      qc.invalidateQueries({ queryKey: ['conversations'] })
    },
  })
}
