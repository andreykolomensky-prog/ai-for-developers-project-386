import type { RouteHandlers } from './generated/fastify.gen.ts'
import type { Store } from './store.ts'

/** Обработчики операций контракта. Имена совпадают с `operationId` из OpenAPI. */
export function createHandlers(store: Store): RouteHandlers {
  return {
    getHealth: async (_request, reply) => reply.code(200).send({ status: 'ok' }),

    listEventTypes: async (_request, reply) => reply.code(200).send(store.listEventTypes()),
  }
}
