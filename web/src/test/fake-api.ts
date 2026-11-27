import type {
  Booking,
  BookingWindow,
  CreateBookingRequest,
  EventType,
} from '../api/generated/index.ts'

type FakeApi = {
  eventTypes: EventType[]
  /** Окна записи по идентификатору типа встречи. */
  bookingWindows: Record<string, BookingWindow>
  /** Запросы на запись, которые отправил интерфейс. */
  bookingRequests: CreateBookingRequest[]
}

/**
 * Данные, которые видит SDK в компонентных тестах. Тест кладёт сюда нужное
 * состояние, после каждого теста оно сбрасывается.
 */
export const fakeApi: FakeApi = {
  eventTypes: [],
  bookingWindows: {},
  bookingRequests: [],
}

export function resetFakeApi() {
  fakeApi.eventTypes = []
  fakeApi.bookingWindows = {}
  fakeApi.bookingRequests = []
}

const notFound = () => Response.json({ code: 'not_found', message: 'Не найдено' }, { status: 404 })

/** Принимает запись и отвечает так, как ответил бы сервер на свободный слот. */
async function createBooking(request: Request): Promise<Response> {
  const body = (await request.json()) as CreateBookingRequest
  const eventType = fakeApi.eventTypes.find((candidate) => candidate.id === body.eventTypeId)
  if (!eventType) {
    return notFound()
  }
  fakeApi.bookingRequests.push(body)
  const { eventTypeId: _eventTypeId, ...details } = body
  const booking: Booking = {
    ...details,
    id: `booking-${fakeApi.bookingRequests.length}`,
    eventType,
    endTime: new Date(
      Date.parse(body.startTime) + eventType.durationMinutes * 60_000,
    ).toISOString(),
    createdAt: body.startTime,
  }
  return Response.json(booking, { status: 201 })
}

/** Замена `fetch` для SDK: отвечает на запросы контракта из `fakeApi`. */
export async function fakeFetch(input: RequestInfo | URL): Promise<Response> {
  const { pathname } = new URL(input instanceof Request ? input.url : String(input))
  if (pathname === '/api/event-types') {
    return Response.json(fakeApi.eventTypes)
  }
  if (pathname === '/api/bookings' && input instanceof Request && input.method === 'POST') {
    return createBooking(input)
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
