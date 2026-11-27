import { Container, Text, Title } from '@mantine/core'

export function App() {
  return (
    <Container size="sm" py="xl">
      <Title order={1}>Запись на звонок</Title>
      <Text c="dimmed" mt="sm">
        Каркас приложения готов. Функциональность появится на следующих шагах.
      </Text>
    </Container>
  )
}
