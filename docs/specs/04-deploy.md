# 04 — Деплой (Vercel + Neon)

## Цель

Приложение доступно по HTTPS на Vercel Hobby; данные — в Neon Postgres; два аккаунта созданы seed-ом; оба пользователя могут войти без локального сервера.

## Шаг 0 — проверка доступности (сделать до разработки UI/API)

`*.vercel.app` должен открываться у **обоих** целевых пользователей **без VPN**.

1. Задеплоить минимальную статическую/hello-страницу на Vercel **или** открыть любой публичный demo на `vercel.app`.
2. Оба пользователя подтверждают: страница грузится из их сети.
3. Если блокируется — зафиксировать в README альтернативу (другой регион/домен/хостинг) **до** полной реализации. Не продолжать деплой «вслепую».

## Инфраструктура

| Компонент | Действие |
|-----------|----------|
| Vercel project | Связать репозиторий, framework Next.js |
| Neon | `vercel integration add neon` (Marketplace) — env vars подтянутся автоматически |
| ORM | Drizzle; миграции в CI или ручной `drizzle-kit push` / migrate перед первым использованием |

Не использовать устаревшие `@vercel/postgres` / `@vercel/kv`. Драйвер: `@neondatabase/serverless` + drizzle `neon-http` (lazy `getDb()`, чтобы `next build` не падал без env).

## Переменные окружения

Обязательные (Production + Preview по необходимости):

| Имя | Назначение |
|-----|------------|
| `DATABASE_URL` | Neon connection string (из Marketplace) |
| `SESSION_SECRET` | Длинная случайная строка для подписи cookie |
| `SEED_USER1_LOGIN` | Логин первого пользователя |
| `SEED_USER1_PASSWORD` | Пароль первого |
| `SEED_USER1_NAME` | Отображаемое имя |
| `SEED_USER2_LOGIN` | Логин второго |
| `SEED_USER2_PASSWORD` | Пароль второго |
| `SEED_USER2_NAME` | Отображаемое имя |

Локально: `vercel env pull .env.local` после линка проекта. Пароли seed **не коммитить**.

Опционально: `APP_TIMEZONE` только если решите вынести из `config/game.ts` (по умолчанию timezone в коде/конфиге: `Asia/Yekaterinburg`).

## Порядок первого деплоя

1. Проверка доступности (шаг 0).
2. `vercel` link / push в Git → автодеплой.
3. Подключить Neon через Marketplace.
4. Выставить `SESSION_SECRET` и seed-переменные в Vercel Dashboard.
5. Прогнать миграции против Production DB.
6. Запустить seed (локально с Production URL **осторожно**, или one-off script / `vercel env pull` + `npx dotenv -e .env.local -- npx tsx scripts/seed.ts`).
7. Открыть production URL → login обоими аккаунтами → создать тестовую запись → проверить графики.

## Локальная разработка

```bash
npm install
vercel env pull .env.local
npx dotenv -e .env.local -- npx drizzle-kit push
npx dotenv -e .env.local -- npx tsx scripts/seed.ts
npm run dev
```

## README (минимум для агента)

В корневом README описать:

- что это за проект (ссылка на `docs/specs/00-overview.md`);
- стек;
- как поднять локально;
- как задеплоить;
- что seed создаёт двух пользователей из env.

## Критерии приёмки

- [ ] Production URL открывается у обоих пользователей без VPN (или задокументирован workaround).
- [ ] Neon подключён; записи переживают редеплой.
- [ ] Вход двумя seed-аккаунтами на production успешен.
- [ ] Нет закоммиченных паролей и `.env.local`.
- [ ] После redeploy данные пользователей на месте.
