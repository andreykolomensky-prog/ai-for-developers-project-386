import { Badge, Card, Group, Stack, Text, Title } from '@mantine/core'
import type { Booking } from '../../api/generated/index.ts'
import { useBookings, useEventTypes } from '../../api/queries.ts'
import { ErrorState, LoadingState } from '../../components/QueryState.tsx'
import { calendarDateOf, formatDate, formatTimeRange, timeZoneLabel } from '../../lib/time.ts'
import classes from './UpcomingBookingsPage.module.css'

// Владелец один, и его часовой пояс совпадает с тем, в котором API отдаёт окно записи.
const ownerTimeZone = 'Europe/Moscow'

/** Страница владельца: предстоящие записи всех типов встреч в одном списке. */
export function UpcomingBookingsPage() {
  const bookings = useBookings()
  const eventTypes = useEventTypes()

  return (
    <>
      <Title order={1}>Предстоящие встречи</Title>
      <Text c="dimmed" mt="xs">
        Записи гостей по всем типам встреч, {timeZoneLabel(ownerTimeZone)}.
      </Text>

      <Stack gap="lg" mt="xl">
        {bookings.isPending && <LoadingState label="Загружаем встречи" />}
        {bookings.isError && <ErrorState onRetry={() => void bookings.refetch()} />}
        {bookings.data?.length === 0 && (
          <Text>
            Пока никто не записался.
            {eventTypes.data?.length === 0 && ' Сначала создайте тип встречи.'}
          </Text>
        )}
        {groupByDate(bookings.data ?? []).map(([date, dayBookings]) => (
          <section key={date} aria-label={formatDate(date)}>
            <Text fw={600} className={classes.date}>
              {formatDate(date)}
            </Text>
            <Stack gap="xs" mt="xs" component="ul" p={0} style={{ listStyle: 'none' }}>
              {dayBookings.map((booking) => (
                <Card key={booking.id} withBorder padding="md" component="li">
                  <Group justify="space-between" align="flex-start">
                    <div>
                      <Text fw={600}>
                        {formatTimeRange(booking.startTime, booking.endTime, ownerTimeZone)}
                      </Text>
                      <Text size="sm">
                        {booking.guestName}, {booking.guestEmail}
                      </Text>
                      {booking.notes && (
                        <Text size="sm" c="dimmed" mt={4}>
                          {booking.notes}
                        </Text>
                      )}
                    </div>
                    <Badge variant="light">{booking.eventType.title}</Badge>
                  </Group>
                </Card>
              ))}
            </Stack>
          </section>
        ))}
      </Stack>
    </>
  )
}

/** Группирует записи по календарной дате владельца, сохраняя порядок по времени. */
function groupByDate(bookings: Booking[]): [string, Booking[]][] {
  const groups = new Map<string, Booking[]>()
  for (const booking of bookings) {
    const date = calendarDateOf(booking.startTime, ownerTimeZone)
    groups.set(date, [...(groups.get(date) ?? []), booking])
  }
  return [...groups]
}
