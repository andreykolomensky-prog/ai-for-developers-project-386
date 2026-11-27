import type { BookingWindow, EventType } from './generated/types.gen.ts'
import { daySlots, type Schedule, windowDates } from './schedule.ts'
import type { Store } from './store.ts'

export type BookingRules = {
  store: Store
  schedule: Schedule
  /** Текущее время в миллисекундах эпохи. Подменяется в тестах. */
  now: () => number
}

const toIso = (instant: number) => new Date(instant).toISOString()

/** Окно записи для типа встречи: слоты всех дней окна с отметкой занятости. */
export function buildBookingWindow(eventType: EventType, rules: BookingRules): BookingWindow {
  const { schedule } = rules
  const now = rules.now()

  return {
    timeZone: schedule.timeZone,
    days: windowDates(now, schedule).map((date) => ({
      date: date.toString(),
      slots: daySlots(date, eventType.durationMinutes, schedule).map((slot) => ({
        startTime: toIso(slot.start),
        endTime: toIso(slot.end),
        available: slot.start > now,
      })),
    })),
  }
}
