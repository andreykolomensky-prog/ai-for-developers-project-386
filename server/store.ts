import type { EventType } from './generated/types.gen.ts'

/** Хранилище в памяти процесса. Перезапуск приложения сбрасывает все данные. */
export class Store {
  readonly #eventTypes = new Map<string, EventType>()

  constructor(eventTypes: EventType[] = []) {
    for (const eventType of eventTypes) {
      this.#eventTypes.set(eventType.id, eventType)
    }
  }

  listEventTypes(): EventType[] {
    return [...this.#eventTypes.values()]
  }

  getEventType(id: string): EventType | undefined {
    return this.#eventTypes.get(id)
  }

  /** Добавляет тип встречи. Возвращает `false`, если идентификатор уже занят. */
  addEventType(eventType: EventType): boolean {
    if (this.#eventTypes.has(eventType.id)) {
      return false
    }
    this.#eventTypes.set(eventType.id, eventType)
    return true
  }
}
