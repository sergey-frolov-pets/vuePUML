export const APP_META = {
  name: "vuePlantUML",
  developer: "FSVibe",
  version: "1.0.0",
  copyright: "© 2026 FSVibe",
} as const;

export const APP_LINKS = {
  site: "https://puml.sergey-frolov.ru/",
  installPage: "./install.html",
  github: "https://github.com/sergey-frolov-pets/vuePUML",
  githubReleases:
    "https://github.com/sergey-frolov-pets/vuePUML/releases/latest",
  plantumlGuide: "https://plantuml.com/guide",
  plantuml: "https://plantuml.com/",
  plantumlCore: "https://www.npmjs.com/package/@plantuml/core",
  smetana: "https://plantuml.com/smetana02",
  vue: "https://vuejs.org/",
  vite: "https://vite.dev/",
  mitLicense: "https://opensource.org/licenses/MIT",
} as const;

export const STORAGE_KEY_SOURCE = "plantuml-smetana-source";
/** @deprecated Используйте STORAGE_KEY_UI_DARK и STORAGE_KEY_DIAGRAM_DARK */
export const STORAGE_KEY_DARK = "plantuml-smetana-dark";
export const STORAGE_KEY_UI_DARK = "plantuml-smetana-ui-dark";
export const STORAGE_KEY_DIAGRAM_DARK = "plantuml-smetana-diagram-dark";
export const STORAGE_KEY_LAYOUT = "plantuml-smetana-layout";

export const RENDER_DEBOUNCE_MS = 400;

export const LAYOUT_ENGINES = {
  smetana: "smetana",
  elk: "elk",
  dot: "dot",
} as const;

export type LayoutEngine = (typeof LAYOUT_ENGINES)[keyof typeof LAYOUT_ENGINES];

export const DEFAULT_SOURCE = `@startuml
!pragma layout smetana

title Пример диаграммы классов

class User {
  +name: string
  +login()
}

class Order {
  +total: number
}

User "1" --> "*" Order : создаёт
@enduml`;

export const SAMPLE_DIAGRAMS: Record<string, string> = {
  "Классы (Smetana)": `@startuml
!pragma layout smetana

class Animal
class Dog
class Cat

Animal <|-- Dog
Animal <|-- Cat
@enduml`,
  "Последовательность": `@startuml
!pragma layout smetana

actor User
participant App
database DB

User -> App : запрос
App -> DB : SELECT
DB --> App : данные
App --> User : ответ
@enduml`,
  "Компоненты": `@startuml
!pragma layout smetana

package "Frontend" {
  [Vue App]
}

package "Engine" {
  [@plantuml/core]
}

[Vue App] --> [@plantuml/core] : render
@enduml`,
  "Состояния": `@startuml
!pragma layout smetana

[*] --> Idle
Idle --> Rendering : render()
Rendering --> Done : success
Rendering --> Error : failure
Done --> Idle
Error --> Idle
@enduml`,
  "Activity (swimlane)": `@startuml
!pragma layout smetana

|#E3F2FD|Клиент|
|#E8F5E9|Система|

|Клиент|
start
:Отправить запрос;
|Система|
:Обработать запрос;
:Сформировать ответ;
|Клиент|
:Получить результат;
stop
@enduml`,
  "C4 (контейнеры)": `@startuml
!pragma layout smetana

title C4 — веб-приложение (контейнеры)

skinparam componentStyle rectangle
skinparam wrapWidth 220

actor "Пользователь" as user
actor "Администратор" as admin

rectangle "Клиент" as client {
  rectangle "Web UI" as web_ui {
    [Vue SPA]
    [PWA Shell]
  }
}

rectangle "Сервер" as server {
  rectangle "Backend API" as backend {
    [Auth Service]
    [Diagram Service]
  }
}

database "PostgreSQL" as db

cloud "CDN" as cdn

user --> web_ui : HTTPS
admin --> web_ui : Управление
web_ui --> backend : REST / JSON
backend --> db : SQL / TCP
web_ui ..> cdn : Статика
@enduml`,
};

export function isSampleDiagramSource(source: string): boolean {
  return Object.values(SAMPLE_DIAGRAMS).includes(source);
}
