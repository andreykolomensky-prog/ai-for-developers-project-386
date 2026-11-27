import type { BookingWindow, EventType } from '../api/generated/index.ts'

type FakeApi = {
  eventTypes: EventType[]
  /** Окна записи по идентификатору типа встречи. */
  bookingWindows: Record<string, BookingWindow>
}

/**
 * Данные, которые видит SDK в компонентных тестах. Тест кладёт сюда нужное
 * состояние, после каждого теста оно сбрасывается.
 */
export const fakeApi: FakeApi = {
  eventTypes: [],
  bookingWindows: {},
}

export function resetFakeApi() {
  fakeApi.eventTypes = []
  fakeApi.bookingWindows = {}
}

const notFound = () => Response.json({ code: 'not_found', message: 'Не найдено' }, { status: 404 })

/** Замена `fetch` для SDK: отвечает на запросы контракта из `fakeApi`. */
export async function fakeFetch(input: RequestInfo | URL): Promise<Response> {
  const { pathname } = new URL(input instanceof Request ? input.url : String(input))
  if (pathname === '/api/event-types') {
    return Response.json(fakeApi.eventTypes)
  }

  const [, eventTypeId, resource] = /^\/api\/event-types\/([^/]+)(?:\/(.+))?$/.exec(pathname) ?? []
  const eventType = fakeApi.eventTypes.find((candidate) => candidate.id === eventTypeId)
  if (!eventType) {
    return notFound()
  }
  if (!resource) {
    return Response.json(eventType)
  }
  const bookingWindow = fakeApi.bookingWindows[eventType.id]
  return resource === 'booking-window' && bookingWindow ? Response.json(bookingWindow) : notFound()
}
