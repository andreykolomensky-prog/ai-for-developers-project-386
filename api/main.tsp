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

/** Одно замечание к данным запроса. */
model ValidationIssue {
  /** Поле запроса, к которому относится замечание. */
  field: string;

  message: string;
}

/** Данные запроса не прошли проверку. */
@error
model ValidationError {
  @statusCode _: 422;
  code: "validation_error";
  message: string;
  issues: ValidationIssue[];
}

/** Запрошенный ресурс не найден. */
@error
model NotFoundError {
  @statusCode _: 404;
  code: "not_found";
  message: string;
}

/** Тип встречи с таким идентификатором уже существует. */
@error
model EventTypeExistsError {
  @statusCode _: 409;
  code: "event_type_exists";
  message: string;
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

  /** Владелец создаёт тип встречи. */
  @operationId("createEventType")
  @post
  create(@body body: EventType): {
    @statusCode _: 201;
    @body body: EventType;
  } | ValidationError | EventTypeExistsError;

  /** Один тип встречи. */
  @operationId("getEventType")
  @get
  @route("{eventTypeId}")
  read(@path eventTypeId: string): EventType | NotFoundError;
}
