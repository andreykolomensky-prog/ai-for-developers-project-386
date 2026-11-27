import { screen, within } from '@testing-library/react'
import { expect, test } from 'vitest'
import { fakeApi } from '../../test/fake-api.ts'
import { renderApp } from '../../test/render.tsx'

const intro = { id: 'intro', title: 'Знакомство', description: '', durationMinutes: 30 }
const review = { id: 'review', title: 'Разбор задачи', description: '', durationMinutes: 60 }

test('владелец видит встречи всех типов по дням с данными гостя', async () => {
  fakeApi.eventTypes = [intro, review]
  fakeApi.bookings = [
    {
      id: 'b1',
      eventType: intro,
      startTime: '2026-03-03T07:00:00.000Z',
      endTime: '2026-03-03T07:30:00.000Z',
      guestName: 'Анна Гостева',
      guestEmail: 'anna@example.com',
      notes: 'Обсудим запуск',
      createdAt: '2026-03-02T07:30:00.000Z',
    },
    {
      id: 'b2',
      eventType: review,
      startTime: '2026-03-04T11:00:00.000Z',
      endTime: '2026-03-04T12:00:00.000Z',
      guestName: 'Борис',
      guestEmail: 'boris@example.com',
      createdAt: '2026-03-02T07:31:00.000Z',
    },
  ]
  renderApp('/admin')

  expect(screen.getByRole('heading', { level: 1, name: 'Предстоящие встречи' })).toBeVisible()

  const tuesday = within(await screen.findByRole('region', { name: 'вторник, 3 марта' }))
  expect(tuesday.getByText('10:00–10:30')).toBeVisible()
  expect(tuesday.getByText('Анна Гостева, anna@example.com')).toBeVisible()
  expect(tuesday.getByText('Обсудим запуск')).toBeVisible()
  expect(tuesday.getByText('Знакомство')).toBeVisible()

  const wednesday = within(screen.getByRole('region', { name: 'среда, 4 марта' }))
  expect(wednesday.getByText('14:00–15:00')).toBeVisible()
  expect(wednesday.getByText('Разбор задачи')).toBeVisible()
})

test('пока никто не записался, владелец видит подсказку', async () => {
  fakeApi.eventTypes = [intro]
  renderApp('/admin')

  expect(await screen.findByText('Пока никто не записался.')).toBeVisible()
})
