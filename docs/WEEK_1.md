# Неделя 1 — аналитика и проектирование

## Цель недели

Зафиксировать предметную область и подготовить договорённости, по которым будут создаваться backend и frontend.

## Результаты

- сформулирована цель ToyStore;
- определены роли и границы MVP;
- составлены функциональные и нефункциональные требования;
- определены основные сущности базы данных;
- согласован REST-подход и стек;
- подготовлен план следующих недель.

## План проекта

| Неделя | Результат |
|---|---|
| 1 | ТЗ, сценарии, ER-модель, архитектура и API-контракт |
| 2 | Backend: модели, миграции, авторизация, каталог и корзина |
| 3 | Frontend: каталог, карточка товара, корзина и авторизация |
| 4 | Заказы, личный кабинет и административная часть |
| 5 | Интеграция, тестирование, адаптивность и исправление замечаний |
| 6 | Docker, Swagger, демонстрационный стенд и финальная документация |

## Архитектура

```mermaid
flowchart LR
    Browser[React SPA] -->|HTTPS JSON| API[FastAPI REST API]
    API --> Services[Сервисный слой]
    Services --> ORM[SQLAlchemy ORM]
    ORM --> DB[(PostgreSQL)]
    API --> Media[Хранилище изображений]
```

Frontend не обращается к базе напрямую. Все запросы идут через слой `frontend/src/api`. Backend отвечает за авторизацию, проверку прав, бизнес-правила корзины и заказов.

## ER-модель

```mermaid
erDiagram
    users ||--o{ orders : creates
    users ||--o{ cart_items : owns
    categories ||--o{ products : contains
    products ||--o{ cart_items : added_to
    orders ||--|{ order_items : includes
    products ||--o{ order_items : sold_as

    users {
        bigint id PK
        varchar email UK
        varchar password_hash
        varchar name
        varchar role
    }
    categories {
        bigint id PK
        varchar name UK
        text description
    }
    products {
        bigint id PK
        bigint category_id FK
        varchar name
        text description
        decimal price
        int stock
        int age_from
        varchar image_url
        boolean is_active
    }
    cart_items {
        bigint id PK
        bigint user_id FK
        bigint product_id FK
        int quantity
    }
    orders {
        bigint id PK
        bigint user_id FK
        decimal total_amount
        varchar status
        varchar customer_name
        varchar phone
        text address
        timestamptz created_at
    }
    order_items {
        bigint id PK
        bigint order_id FK
        bigint product_id FK
        varchar product_name
        decimal unit_price
        int quantity
    }
```

`order_items` хранит название и цену на момент покупки, чтобы старые заказы не менялись при редактировании товара.

## Черновой API-контракт

| Метод | Endpoint | Назначение |
|---|---|---|
| POST | `/api/auth/register` | регистрация |
| POST | `/api/auth/login` | вход и получение JWT |
| POST | `/api/auth/logout` | выход |
| GET | `/api/categories` | список категорий |
| GET | `/api/products` | каталог с поиском и фильтрами |
| POST/PUT/DELETE | `/api/products` | управление товарами администратора |
| GET/POST/PATCH/DELETE | `/api/cart` | работа с корзиной |
| POST | `/api/orders` | оформление заказа |
| GET | `/api/orders` | заказы текущего пользователя |
| PATCH | `/api/admin/orders/{id}` | изменение статуса администратором |

Параметры каталога:

```text
GET /api/products?search=конструктор&category=2&min_price=500&max_price=3000&age=6&ordering=-price&page=1
```

## Критерии готовности недели

- любой разработчик понимает назначение системы и роли;
- MVP можно проверить по таблице требований в `REPORT.md`;
- сущности и связи базы данных согласованы до начала реализации;
- frontend и backend используют единый список endpoint'ов;
- после недели 1 можно начинать разработку API без изменения предметной области.

