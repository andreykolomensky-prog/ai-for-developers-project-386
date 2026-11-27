import { buildApp } from './app.ts'
import { Store } from './store.ts'

const port = Number(process.env.PORT ?? 3000)
const host = process.env.HOST ?? '0.0.0.0'

// Данные живут в памяти, поэтому после запуска заводим типы встреч, с которых гость может начать.
const store = new Store([
  {
    id: 'meeting-15',
    title: 'Встреча 15 минут',
    description: 'Короткий звонок, чтобы познакомиться или быстро сверить планы.',
    durationMinutes: 15,
  },
  {
    id: 'meeting-30',
    title: 'Встреча 30 минут',
    description: 'Базовая встреча для обсуждения одного вопроса.',
    durationMinutes: 30,
  },
])

const app = buildApp({ logger: true, store })

try {
  await app.listen({ port, host })
} catch (error) {
  app.log.error(error)
  process.exit(1)
}
