import "@typespec/http";
import "@typespec/openapi";

using Http;
using OpenAPI;

/**
 * Контракт сервиса записи на звонок. Владелец заводит типы встреч и смотрит
 * записи, гость выбирает свободный слот в окне записи и создаёт запись.
 */
@service(#{ title: "Запись на звонок" })
@info(#{ version: "1.0.0" })
@route("/api")
namespace CallCalendar;

/** Тип встречи: шаблон, который заводит владелец. */
model EventType {
  /** Идентификатор, который задаёт владелец. Попадает в адрес страницы записи. */
  @minLength(1)
  @maxLength(40)
  @pattern("^[a-z0-9]+(-[a-z0-9]+)*$")
  id: string;

  /** Название, которое видит гость. */
  @minLength(1)
  @maxLength(80)
  title: string;

  /** Описание для гостя. Может быть пустым. */
  @maxLength(500)
  description: string;

  /** Длительность встречи в минутах. Слот этого типа длится столько же. */
  @minValue(5)
  @maxValue(480)
  durationMinutes: int32;
}

model Health {
  status: "ok";
}

@route("/health")
@tag("Служебное")
interface HealthChecks {
  /** Проверка, что приложение запущено. */
  @operationId("getHealth")
  @get
  check(): Health;
}

@route("/event-types")
@tag("Типы встреч")
interface EventTypes {
  /** Список типов встреч в порядке создания. */
  @operationId("listEventTypes")
  @get
  list(): EventType[];
}
