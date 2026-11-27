import type { EventType } from '../api/generated/index.ts'

/**
 * Данные, которые видит SDK в компонентных тестах. Тест кладёт сюда нужное
 * состояние, после каждого теста оно сбрасывается.
 */
export const fakeApi: { eventTypes: EventType[] } = {
  eventTypes: [],
}

export function resetFakeApi() {
  fakeApi.eventTypes = []
}

/** Замена `fetch` для SDK: отвечает на запросы контракта из `fakeApi`. */
export async function fakeFetch(input: RequestInfo | URL): Promise<Response> {
  const { pathname } = new URL(input instanceof Request ? input.url : String(input))
  if (pathname === '/api/event-types') {
    return Response.json(fakeApi.eventTypes)
  }
  return Response.json({ code: 'not_found', message: 'Не найдено' }, { status: 404 })
}
