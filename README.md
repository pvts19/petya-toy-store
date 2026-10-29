# петяtoy — магазин игрушек

Учебный full-stack проект интернет-магазина игрушек. Пользователь может посмотреть каталог, найти игрушку, отфильтровать товары по категории и возрасту, добавить товары в корзину и оформить заказ.

## Возможности

### Для покупателя

- регистрация и вход в аккаунт;
- каталог игрушек с фотографиями и описаниями;
- поиск по названию и описанию;
- фильтр по категории и возрасту;
- корзина и оформление заказа;
- история заказов;
- страницы «Контакты» и «О нас».

### Для администратора

- добавление товаров;
- удаление товаров из каталога;
- просмотр всех заказов;
- изменение статуса заказа;
- переход в админ-панель из шапки сайта.

## Технологии

- Frontend: React, TypeScript, Vite, CSS;
- Backend: Python, FastAPI, Pydantic, SQLAlchemy;
- Database: PostgreSQL;
- Авторизация: JWT и хеширование паролей;
- Запуск: Docker Compose;
- Тесты: pytest.

## Структура проекта

```text
backend/       REST API на FastAPI
frontend/      клиентская часть на React
docs/          документация и отчёты по этапам
docker-compose.yml
README.md
```

## Запуск через Docker

Понадобятся Docker Desktop и Git.

```bash
git clone https://github.com/pvts19/petya-toy-store.git
cd petya-toy-store
docker compose up --build
```

После запуска заполнить базу тестовыми категориями и товарами:

```bash
docker compose exec backend python -m app.seed
```

Открыть сайт: <http://localhost:5173>

API: <http://localhost:8000>

Документация API: <http://localhost:8000/docs>

PostgreSQL с компьютера доступен на порту `5433`.

## Администратор

Для демонстрации используется тестовая учётная запись:

```text
Email: admin@toystore.local
Пароль: admin12345
```

После входа в правом верхнем углу появится кнопка «Админка».

## Запуск без Docker

Backend:

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python -m app.seed
uvicorn app.main:app --reload
```

Frontend в отдельном окне терминала:

```bash
cd frontend
npm install
npm run dev
```

## Документация

Дополнительные материалы находятся в папке [`docs`](docs/):

- [Неделя 1](docs/WEEK_1.md)
- [Неделя 2](docs/WEEK_2.md)
- [Неделя 3](docs/WEEK_3.md)
- [Отчёт по проекту](docs/REPORT.md)
