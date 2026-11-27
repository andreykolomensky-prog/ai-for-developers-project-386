import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import type {
  Booking,
  BookingWindow,
  NotFoundError,
  SlotTakenError,
  ValidationError,
} from '../server/generated/types.gen.ts'
import { meeting15, meeting30, meeting60, startServer, type TestServer } from './support/server.ts'

let server: TestServer

/** Момент по московскому времени в виде, в котором его передаёт API. */
const msk = (date: string, time: string) => new Date(`${date}T${time}:00+03:00`).toISOString()

const guest = { guestName: 'Анна Гостева', guestEmail: 'anna@example.com' }

function book(eventTypeId: string, startTime: string, patch: Record<string, unknown> = {}) {
  return server.api<Booking>('POST', '/api/bookings', {
    eventTypeId,
    startTime,
    ...guest,
    ...patch,
  })
}

async function slotAvailability(eventTypeId: string, startTime: string) {
  const response = await server.api<BookingWindow>(
    'GET',
    `/api/event-types/${eventTypeId}/booking-window`,
  )
  const slot = response.body.days
    .flatMap((day) => day.slots)
    .find((candidate) => candidate.startTime === startTime)
  return slot?.available
}

beforeEach(async () => {
  // Понедельник, 2 марта 2026 года, 10:30 по Москве.
  server = await startServer({
    now: '2026-03-02T07:30:00.000Z',
    eventTypes: [meeting15, meeting30, meeting60],
  })
})

afterEach(async () => {
  await server.close()
})

describe('создание записи', () => {
  test('гость записывается на свободный слот', async () => {
    const response = await book('meeting-30', msk('2026-03-03', '10:00'), {
      notes: 'Обсудим запуск',
    })

    expect(response.status).toBe(201)
    expect(response.body).toMatchObject({
      eventType: meeting30,
      startTime: '2026-03-03T07:00:00.000Z',
      endTime: '2026-03-03T07:30:00.000Z',
      guestName: 'Анна Гостева',
      guestEmail: 'anna@example.com',
      notes: 'Обсудим запуск',
      createdAt: '2026-03-02T07:30:00.000Z',
    })
    expect(response.body.id).toEqual(expect.any(String))
  })

  test('заметка необязательна', async () => {
    const response = await book('meeting-30', msk('2026-03-03', '10:00'))

    expect(response.status).toBe(201)
    expect(response.body).not.toHaveProperty('notes')
  })

  test('занятый слот больше не предлагается как свободный', async () => {
    const startTime = msk('2026-03-03', '10:00')
    expect(await slotAvailability('meeting-30', startTime)).toBe(true)

    await book('meeting-30', startTime)

    expect(await slotAvailability('meeting-30', startTime)).toBe(false)
  })

  test('повторная запись на тот же слот отклоняется с кодом 409', async () => {
    const startTime = msk('2026-03-03', '10:00')
    await book('meeting-30', startTime)

    const response = await server.api<SlotTakenError>('POST', '/api/bookings', {
      eventTypeId: 'meeting-30',
      startTime,
      guestName: 'Борис Второй',
      guestEmail: 'boris@example.com',
    })

    expect(response.status).toBe(409)
    expect(response.body.code).toBe('slot_taken')
    expect(response.body.message).toMatch(/занято/i)
  })
})

describe('ошибки данных при создании записи', () => {
  test.each([
    ['время не на сетке слотов', msk('2026-03-03', '10:10')],
    ['время до начала рабочего дня', msk('2026-03-03', '08:30')],
    ['слот, который закончится после рабочего дня', msk('2026-03-03', '18:00')],
    ['день за пределами окна записи', msk('2026-03-16', '10:00')],
    ['вчерашний день', msk('2026-03-01', '10:00')],
    ['слот, который сегодня уже начался', msk('2026-03-02', '10:30')],
  ])('%s отклоняется с кодом 422', async (_name, startTime) => {
    const response = await server.api<ValidationError>('POST', '/api/bookings', {
      eventTypeId: 'meeting-30',
      startTime,
      ...guest,
    })

    expect(response.status).toBe(422)
    expect(response.body.code).toBe('validation_error')
    expect(response.body.issues).toEqual([
      { field: 'startTime', message: expect.any(String) as string },
    ])
  })

  test('последний день окна записи доступен', async () => {
    const response = await book('meeting-30', msk('2026-03-15', '17:30'))

    expect(response.status).toBe(201)
  })

  test.each([
    ['пустое имя', { guestName: '' }, 'guestName'],
    ['некорректный email', { guestEmail: 'не-почта' }, 'guestEmail'],
    ['время не в формате даты', { startTime: 'завтра в десять' }, 'startTime'],
    ['слишком длинная заметка', { notes: 'я'.repeat(501) }, 'notes'],
  ])('%s отклоняется с кодом 422', async (_name, patch, field) => {
    const response = await server.api<ValidationError>('POST', '/api/bookings', {
      eventTypeId: 'meeting-30',
      startTime: msk('2026-03-03', '10:00'),
      ...guest,
      ...patch,
    })

    expect(response.status).toBe(422)
    expect(response.body.issues.map((issue) => issue.field)).toContain(field)
    // Отклонённый запрос слот не занимает.
    expect(await slotAvailability('meeting-30', msk('2026-03-03', '10:00'))).toBe(true)
  })

  test('неизвестный тип встречи отвечает 404', async () => {
    const response = await server.api<NotFoundError>('POST', '/api/bookings', {
      eventTypeId: 'unknown',
      startTime: msk('2026-03-03', '10:00'),
      ...guest,
    })

    expect(response.status).toBe(404)
    expect(response.body.code).toBe('not_found')
  })
})
