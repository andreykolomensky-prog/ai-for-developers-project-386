import { Button, Container, Text, Title } from '@mantine/core'
import { Link } from 'react-router'

/** Заглушка страницы записи: каталог типов встреч появится вместе с бронированием. */
export function BookingStubPage() {
  return (
    <Container size="sm" py={64}>
      <Title order={1}>Выберите тип встречи</Title>
      <Text c="dimmed" mt="md">
        Запись скоро откроется: здесь появятся типы встреч и календарь свободных слотов.
      </Text>
      <Button component={Link} to="/" variant="default" mt="xl">
        На главную
      </Button>
    </Container>
  )
}
