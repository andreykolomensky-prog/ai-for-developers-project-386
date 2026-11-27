import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createEventType, type EventType, listEventTypes } from './generated/index.ts'

const queryKeys = {
  eventTypes: ['event-types'] as const,
}

/** Ошибка API в виде, удобном интерфейсу: код из контракта и сообщение для человека. */
export type ApiFailure = {
  code: string
  message: string
  issues?: { field: string; message: string }[]
}

const networkFailure: ApiFailure = {
  code: 'network_error',
  message: 'Не удалось связаться с сервером. Проверьте соединение и попробуйте ещё раз.',
}

/** Приводит тело ошибки из SDK к `ApiFailure`. Всё непонятное считаем сбоем связи. */
function toFailure(error: unknown): ApiFailure {
  if (typeof error === 'object' && error !== null && 'code' in error && 'message' in error) {
    const { code, message } = error
    if (typeof code === 'string' && typeof message === 'string') {
      const issues = 'issues' in error && Array.isArray(error.issues) ? error.issues : undefined
      return { code, message, ...(issues ? { issues } : {}) }
    }
  }
  return networkFailure
}

export function useEventTypes() {
  return useQuery({
    queryKey: queryKeys.eventTypes,
    queryFn: async () => (await listEventTypes({ throwOnError: true })).data,
  })
}

export function useCreateEventType() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: EventType) => {
      const { data, error } = await createEventType({ body })
      return data
        ? { ok: true as const, eventType: data }
        : { ok: false as const, failure: toFailure(error) }
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.eventTypes }),
  })
}
