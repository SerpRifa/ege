# Подготовка к ЕГЭ

Веб-приложение для мотивации подготовки к ЕГЭ: занятия по информатике, математике и русскому, очки, уровни, статусы от Ботика до Гигачада, серия и ачивки. Правила и границы проекта — в [docs/specs/00-overview.md](docs/specs/00-overview.md).

## Стек

- Next.js (App Router), TypeScript, Tailwind CSS
- Neon Postgres и Drizzle (`@neondatabase/serverless`, `neon-http`)
- Вход по логину и паролю, хэш bcrypt, подписанная httpOnly-cookie
- Motion и Recharts
- Конфиг игры: `config/game.ts`. Часовой пояс: `Asia/Yekaterinburg`

## Локальный запуск

```bash
npm install
```

Скопируйте `.env.example` в `.env.local` и заполните переменные. Пароли и `DATABASE_URL` в git не коммитятся.

```bash
npx dotenv -e .env.local -- npx drizzle-kit push
npx dotenv -e .env.local -- npx tsx scripts/seed.ts
npm run dev
```

`scripts/seed.ts` создаёт ровно двух пользователей из `SEED_USER1_*` и `SEED_USER2_*`. Если логин уже есть, скрипт его пропускает. Флаг `--update` обновляет хэш пароля и имя. Скрипт не печатает пароли.

SQL-миграция лежит в `drizzle/0000_init.sql`. На пустую базу можно применить её через `npm run db:migrate` вместо `drizzle-kit push`.

## Деплой

Хостинг — Vercel Hobby, база — Neon Postgres из Vercel Marketplace. Устаревшие `@vercel/postgres` и `@vercel/kv` не используются. `getDb()` создаёт клиент лениво, поэтому `next build` проходит без `DATABASE_URL`.

1. Связать репозиторий с проектом Vercel (framework Next.js определяется автоматически).
2. Подключить Neon: `vercel integration add neon`. В проект попадут переменные подключения.
3. В Production (и Preview, если нужно) задать `SESSION_SECRET`, `SEED_USER1_LOGIN`, `SEED_USER1_PASSWORD`, `SEED_USER1_NAME` и такие же `SEED_USER2_*`.
4. Прогнать миграцию по production `DATABASE_URL`.
5. Запустить seed с этими переменными: `npx dotenv -e .env.local -- npx tsx scripts/seed.ts` после `vercel env pull .env.local`.
6. Открыть production URL, войти обоими аккаунтами, записать занятие и открыть графики.

Cookie сессии: `httpOnly`, `SameSite=Lax`, в production ещё `Secure`. Локально на `http://localhost` флаг `Secure` выключен, иначе браузер не сохранит сессию.

## Проверка доступности Vercel

15 ноября 2026 с этой машины без VPN открылись:

- `https://vercel.com` — HTTP 200
- `https://nextjs.org` — HTTP 200
- `https://next-app-router-playground.vercel.app/` — HTTP 200

Блокировки `*.vercel.app` с этой сети нет, отдельный хостинг не требуется. Production-приложение ещё не выложено: нет привязанного проекта Vercel, нет Neon и нет секретов. Оба будущих пользователя должны сами подтвердить production URL после деплоя.
