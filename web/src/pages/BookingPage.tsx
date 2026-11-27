import {
  Badge,
  Button,
  Card,
  Container,
  Group,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from '@mantine/core'
import { useState } from 'react'
import { Link, useParams } from 'react-router'
import type { BookingWindow, EventType, Slot } from '../api/generated/index.ts'
import { useBookingWindow, useEventType } from '../api/queries.ts'
import { ErrorState, LoadingState } from '../components/QueryState.tsx'
import {
  formatDate,
  formatDayAndMonth,
  formatDuration,
  formatTimeRange,
  formatWeekday,
  pluralizeSlots,
  timeZoneLabel,
} from '../lib/time.ts'
import classes from './BookingPage.module.css'
import { NotFoundPage } from './NotFoundPage.tsx'

/** Страница записи на выбранный тип встречи: календарь окна записи и слоты дня. */
export function BookingPage() {
  const { eventTypeId = '' } = useParams()
  const eventType = useEventType(eventTypeId)
  const bookingWindow = useBookingWindow(eventTypeId, Boolean(eventType.data))

  if (eventType.data === null) {
    return <NotFoundPage />
  }

  return (
    <Container size="lg" py={48}>
      {(eventType.isPending || bookingWindow.isLoading) && (
        <LoadingState label="Загружаем календарь" />
      )}
      {(eventType.isError || bookingWindow.isError) && (
        <ErrorState
          onRetry={() => {
            void eventType.refetch()
            void bookingWindow.refetch()
          }}
        />
      )}
      {eventType.data && bookingWindow.data && (
        <BookingFlow eventType={eventType.data} bookingWindow={bookingWindow.data} />
      )}
    </Container>
  )
}

type FlowProps = {
  eventType: EventType
  bookingWindow: BookingWindow
}

function BookingFlow({ eventType, bookingWindow }: FlowProps) {
  const { timeZone, days } = bookingWindow
  const firstOpenDay = days.find((day) => day.slots.some((slot) => slot.available)) ?? days[0]

  const [selectedDate, setSelectedDate] = useState(firstOpenDay?.date ?? '')
  const [selectedStart, setSelectedStart] = useState<string | null>(null)

  const selectedDay = days.find((day) => day.date === selectedDate)
  const selectedSlot = selectedDay?.slots.find((slot) => slot.startTime === selectedStart)

  const selectDay = (date: string) => {
    setSelectedDate(date)
    setSelectedStart(null)
  }

  return (
    <>
      <Title order={1}>{eventType.title}</Title>
      <Text c="dimmed" mt="xs">
        Время указано в часовом поясе владельца: {timeZoneLabel(timeZone)}.
      </Text>

      <SimpleGrid cols={{ base: 1, md: 3 }} spacing="lg" mt="lg" className={classes.columns}>
        <Card withBorder padding="lg" component="section" aria-label="Выбранная встреча">
          <Group justify="space-between" wrap="nowrap" align="flex-start">
            <Text fw={600}>{eventType.title}</Text>
            <Badge variant="light" color="gray" style={{ flexShrink: 0 }}>
              {formatDuration(eventType.durationMinutes)}
            </Badge>
          </Group>
          {eventType.description && (
            <Text c="dimmed" size="sm" mt="xs">
              {eventType.description}
            </Text>
          )}
          <Stack gap="xs" mt="md">
            <Summary label="Выбранная дата" value={selectedDate ? formatDate(selectedDate) : '—'} />
            <Summary
              label="Выбранное время"
              value={
                selectedSlot
                  ? formatTimeRange(selectedSlot.startTime, selectedSlot.endTime, timeZone)
                  : 'Время не выбрано'
              }
            />
          </Stack>
        </Card>

        <Card withBorder padding="lg" component="section" aria-labelledby="calendar-title">
          <Text fw={600} id="calendar-title">
            Календарь
          </Text>
          <Text c="dimmed" size="xs" mt={4}>
            Запись открыта на 14 дней вперёд
          </Text>
          <div className={classes.days} role="group" aria-labelledby="calendar-title">
            {days.map((day) => {
              const free = day.slots.filter((slot) => slot.available).length
              return (
                <button
                  key={day.date}
                  type="button"
                  className={classes.day}
                  aria-pressed={day.date === selectedDate}
                  aria-label={`${formatDate(day.date)}, свободно: ${pluralizeSlots(free)}`}
                  data-empty={free === 0 || undefined}
                  onClick={() => selectDay(day.date)}
                >
                  <span className={classes.weekday}>{formatWeekday(day.date)}</span>
                  <span className={classes.dayNumber}>{formatDayAndMonth(day.date)}</span>
                  <span className={classes.free}>{free} св.</span>
                </button>
              )
            })}
          </div>
        </Card>

        <Card withBorder padding="lg" component="section" aria-labelledby="slots-title">
          <Text fw={600} id="slots-title">
            Слоты
          </Text>
          <Text c="dimmed" size="xs" mt={4}>
            {selectedDate ? formatDate(selectedDate) : 'Выберите день'}
          </Text>
          <SlotList
            slots={selectedDay?.slots ?? []}
            timeZone={timeZone}
            selectedStart={selectedStart}
            onSelect={(slot) => setSelectedStart(slot.startTime)}
          />
          <Group mt="md" grow>
            <Button component={Link} to="/book" variant="default">
              Назад
            </Button>
          </Group>
        </Card>
      </SimpleGrid>
    </>
  )
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className={classes.summary}>
      <Text size="xs" c="dimmed">
        {label}
      </Text>
      <Text size="sm" fw={500}>
        {value}
      </Text>
    </div>
  )
}

type SlotListProps = {
  slots: Slot[]
  timeZone: string
  selectedStart: string | null
  onSelect: (slot: Slot) => void
}

function SlotList({ slots, timeZone, selectedStart, onSelect }: SlotListProps) {
  if (slots.length === 0) {
    return (
      <Text size="sm" c="dimmed" mt="md">
        В этот день слотов нет.
      </Text>
    )
  }

  return (
    <ul className={classes.slots} aria-labelledby="slots-title">
      {slots.map((slot) => (
        <li key={slot.startTime}>
          <button
            type="button"
            className={classes.slot}
            disabled={!slot.available}
            aria-pressed={slot.startTime === selectedStart}
            onClick={() => onSelect(slot)}
          >
            <span>{formatTimeRange(slot.startTime, slot.endTime, timeZone)}</span>
            <span className={classes.slotStatus}>{slot.available ? 'Свободно' : 'Занято'}</span>
          </button>
        </li>
      ))}
    </ul>
  )
}
