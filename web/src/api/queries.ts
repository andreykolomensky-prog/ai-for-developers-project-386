import { useQuery } from '@tanstack/react-query'
import { listEventTypes } from './generated/index.ts'

const queryKeys = {
  eventTypes: ['event-types'] as const,
}

export function useEventTypes() {
  return useQuery({
    queryKey: queryKeys.eventTypes,
    queryFn: async () => (await listEventTypes({ throwOnError: true })).data,
  })
}
