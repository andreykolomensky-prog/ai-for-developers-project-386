import type { RouteHandlers } from './generated/fastify.gen.ts'
import type { NotFoundError } from './generated/types.gen.ts'
import type { Store } from './store.ts'

const eventTypeNotFound: NotFoundError = {
  code: 'not_found',
  message: 'Тип встречи не найден',
}

/** Обработчики операций контракта. Имена совпадают с `operationId` из OpenAPI. */
export function createHandlers(store: Store): RouteHandlers {
  return {
    getHealth: async (_request, reply) => reply.code(200).send({ status: 'ok' }),

    listEventTypes: async (_request, reply) => reply.code(200).send(store.listEventTypes()),

    createEventType: async (request, reply) => {
      const { id, title, description, durationMinutes } = request.body
      const eventType = {
        id,
        title: title.trim(),
        description: description.trim(),
        durationMinutes,
      }
      if (!store.addEventType(eventType)) {
        return reply.code(409).send({
          code: 'event_type_exists',
          message: `Тип встречи с идентификатором «${id}» уже существует`,
        })
      }
      return reply.code(201).send(eventType)
    },

    getEventType: async (request, reply) => {
      const eventType = store.getEventType(request.params.eventTypeId)
      if (!eventType) {
        return reply.code(404).send(eventTypeNotFound)
      }
      return reply.code(200).send(eventType)
    },
  }
}
