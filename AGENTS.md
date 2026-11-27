# AGENTS.md

Сервис записи на звонок: владелец публикует время, гость бронирует свободный слот. Сценарий и ограничения описаны в [README.md](README.md).

## Команды

Версии инструментов записаны в `mise.toml`, все команды запускаются через mise.

- `mise install` ставит Node.js и hk, подключает git-хуки.
- `mise run dev` запускает бекенд на `:3000` и фронтенд (Vite) на `:5173`.
- `mise run check` запускает все проверки: линтер, типы, тесты. Эту же команду вызывает CI.
- `mise run lint`, `mise run typecheck`, `mise run test` запускают проверки по отдельности.
- `mise run format` исправляет форматирование и автоисправимые замечания линтера.
- `mise run start` собирает фронтенд и запускает приложение на `PORT` (по умолчанию 3000).
- Один тест: `mise exec -- vitest run test/smoke.test.ts`.

## Устройство проекта

- `server/` бекенд на Fastify: `app.ts` собирает приложение, `main.ts` запускает его на `PORT`.
- `web/` фронтенд на React, Vite и Mantine. Собирается в `dist/web`, в продакшене его раздаёт сервер.
- `test/` тесты сервера на Vitest. Тесты интерфейса лежат рядом с компонентами в `web/src/**/*.test.tsx` и работают в jsdom.
- API находится под префиксом `/api`, остальные пути отдают фронтенд.
- Словарь проекта в `GLOSSARY.md`, принятые решения в `docs/adr/`.

## Правила

- Сервер запускается без сборки: Node.js исполняет TypeScript напрямую. Поэтому импорты пишутся с расширением `.ts`, а `enum`, `namespace` и свойства-параметры конструктора не используются.
- Перед коммитом `mise run check` должен быть зелёным.
- Коммиты идут по [Conventional Commits](https://www.conventionalcommits.org): `feat: ...`, `fix: ...`, `docs: ...`, `test: ...`, `refactor: ...`, `chore: ...`, `ci: ...`. Формат проверяет хук `commit-msg`.
- Файл `.github/workflows/hexlet-check.yml` принадлежит Хекслету: его нельзя менять, переименовывать и удалять.

## Agent skills

Проект ведётся набором скиллов [mattpocock/skills](https://github.com/mattpocock/skills): `/grill-with-docs`, `/wayfinder`, `/to-spec`, `/to-tickets`, `/implement`, `/implement-spec`. Установка: `npx skills@latest add mattpocock/skills`.

### Issue tracker

Задачи, карта решений, спецификация и тикеты живут в GitHub Issues этого репозитория, работа идёт через `gh`. See `docs/agents/issue-tracker.md`.

### Triage labels

Используются пять меток по умолчанию: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: один `GLOSSARY.md` и `docs/adr/` в корне репозитория. See `docs/agents/domain.md`.
