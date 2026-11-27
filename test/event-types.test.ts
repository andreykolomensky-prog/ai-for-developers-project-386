import { afterEach, describe, expect, test } from 'vitest'
import type { EventType } from '../server/generated/types.gen.ts'
import { meeting15, meeting30, startServer, type TestServer } from './support/server.ts'

let server: TestServer

afterEach(async () => {
  await server.close()
})

describe('типы встреч', () => {
  test('пока типов встреч нет, список пуст', async () => {
    server = await startServer()

    const response = await server.api<EventType[]>('GET', '/api/event-types')

    expect(response.status).toBe(200)
    expect(response.body).toEqual([])
  })

  test('список отдаёт типы встреч с названием, описанием и длительностью', async () => {
    server = await startServer({ eventTypes: [meeting30, meeting15] })

    const response = await server.api<EventType[]>('GET', '/api/event-types')

    expect(response.status).toBe(200)
    expect(response.body).toEqual([meeting30, meeting15])
  })
})
