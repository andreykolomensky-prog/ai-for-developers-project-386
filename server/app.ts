import { existsSync } from 'node:fs'
import path from 'node:path'
import fastifyStatic from '@fastify/static'
import Fastify, { type FastifyInstance } from 'fastify'
import openapiGlue from 'fastify-openapi-glue'
import type { ValidationError } from './generated/types.gen.ts'
import { createHandlers } from './handlers.ts'
import { Store } from './store.ts'

const defaultStaticDir = path.resolve(import.meta.dirname, '../dist/web')
const specification = path.resolve(import.meta.dirname, '../api/generated/openapi.yaml')

export type AppOptions = {
  logger?: boolean
  /** Каталог собранного фронтенда. Если его нет, сервер отдаёт только API. */
  staticDir?: string
  /** Хранилище. По умолчанию пустое. */
  store?: Store
}

export function buildApp(options: AppOptions = {}): FastifyInstance {
  const app = Fastify({
    logger: options.logger ?? false,
    ajv: {
      // Проверяем запрос строго по контракту: без приведения типов и со всеми замечаниями сразу.
      customOptions: { coerceTypes: false, removeAdditional: false, allErrors: true },
    },
  })

  // Ошибки проверки запроса по схеме контракта отдаём в формате ValidationError.
  app.setErrorHandler((error, request, reply) => {
    if (error instanceof Error && 'validation' in error && Array.isArray(error.validation)) {
      const body: ValidationError = {
        code: 'validation_error',
        message: 'Данные запроса не прошли проверку',
        issues: error.validation.map((issue) => ({
          field: fieldOf(issue),
          message: issue.message ?? 'Некорректное значение',
        })),
      }
      return reply.code(422).send(body)
    }
    request.log.error(error)
    return reply.send(error)
  })

  // Маршруты, проверка запросов и схемы ответов берутся из OpenAPI-спецификации.
  app.register(openapiGlue, {
    specification,
    serviceHandlers: createHandlers(options.store ?? new Store()),
  })

  const staticDir = options.staticDir ?? defaultStaticDir
  if (existsSync(staticDir)) {
    app.register(fastifyStatic, { root: staticDir })
    // Маршруты интерфейса обрабатывает клиентское приложение, поэтому отдаём ему index.html.
    app.setNotFoundHandler((request, reply) => {
      if (request.method === 'GET' && !request.url.startsWith('/api/')) {
        return reply.sendFile('index.html')
      }
      return reply.code(404).send({ message: 'Not Found' })
    })
  }

  return app
}

type AjvIssue = { instancePath?: string; params?: Record<string, unknown> }

/** Имя поля из замечания ajv: `/guestEmail` или пропущенное обязательное свойство. */
function fieldOf(issue: AjvIssue): string {
  const missing = issue.params?.missingProperty
  if (typeof missing === 'string') {
    return missing
  }
  return issue.instancePath?.replace(/^\//, '').replaceAll('/', '.') || 'body'
}
