# 02 — Данные, auth и серверные операции

## Принцип

Таблица `entries` — **единственный источник истины** по прогрессу. Очки, уровни, статусы и streak **не хранятся**, а вычисляются из записей + `config/game.ts`. Смена весов или формулы пересчитывает всё автоматически.

Ачивки после выдачи хранятся в `user_achievements` (факт получения не теряется при правках конфига).

## Схема БД (Drizzle → Neon Postgres)

### `users`

| Колонка | Тип | Ограничения |
|---------|-----|-------------|
| `id` | uuid / text | PK |
| `login` | text | UNIQUE, NOT NULL |
| `password_hash` | text | NOT NULL |
| `display_name` | text | NOT NULL |
| `created_at` | timestamptz | NOT NULL, default now() |

Ровно два пользователя создаются seed-скриптом. Публичной регистрации нет.

### `entries`

| Колонка | Тип | Ограничения |
|---------|-----|-------------|
| `id` | uuid / text | PK |
| `user_id` | uuid / text | FK → users, NOT NULL |
| `subject` | text | NOT NULL, enum-like: `informatics` \| `math` \| `russian` |
| `date` | date | NOT NULL (календарный день в timezone приложения) |
| `count_a` | integer | NOT NULL, ≥ 0 |
| `count_b` | integer | NOT NULL, ≥ 0 |
| `count_c` | integer | NOT NULL, ≥ 0 |
| `created_at` | timestamptz | NOT NULL, default now() |
| `updated_at` | timestamptz | NOT NULL |

Ограничения и индексы:

- UNIQUE `(user_id, subject, date)`
- индекс `(user_id, date)`

Правило уникальности v1: **одна запись на пару (user_id, subject, date)**. Повторный ввод за тот же день и предмет **обновляет** counts (upsert), а не создаёт вторую строку.

Проверка: `count_a + count_b + count_c ≥ 1`.

### `user_achievements`

| Колонка | Тип | Ограничения |
|---------|-----|-------------|
| `id` | uuid / text | PK |
| `user_id` | uuid / text | FK → users, NOT NULL |
| `achievement_id` | text | NOT NULL (id из конфига) |
| `unlocked_at` | timestamptz | NOT NULL, default now() |

UNIQUE `(user_id, achievement_id)`.

## Auth

- Логин + пароль (форма `/login`).
- Пароль хранится как хэш (bcrypt или argon2); никогда в открытом виде.
- После успешного входа — подписанная **httpOnly**, `Secure`, `SameSite=Lax` cookie с `userId` (+ expiry).
- Секрет подписи: `SESSION_SECRET` из env.
- Middleware / helper: незалогиненный пользователь → редирект на `/login`.
- Logout очищает cookie.
- Пользователь A **никогда** не читает и не пишет данные user B: все запросы фильтруют по `session.userId`.

Seed (`scripts/seed.ts`):

- Читает логины/пароли из env (`SEED_USER1_LOGIN`, `SEED_USER1_PASSWORD`, `SEED_USER1_NAME`, аналогично user2) или из локального `.env` (не коммитить пароли).
- Идемпотентен: если login уже есть — обновить hash/name по флагу или пропустить.

## Серверные операции (Server Actions предпочтительнее отдельного REST)

Все операции требуют сессии, кроме `login`.

| Операция | Вход | Поведение |
|----------|------|-----------|
| `login` | login, password | Проверка hash → set cookie → redirect `/` |
| `logout` | — | Clear cookie → `/login` |
| `upsertEntry` | subject, countA, countB, countC | Только **сегодняшняя** дата (timezone конфига). Upsert по (user, subject, date). Пересчёт ачивок. Вернуть snapshot до/после + новые ачивки (для анимаций). |
| `updateTodayEntry` | entryId или subject, новые counts | Только если `entry.date === today` и `entry.user_id === session`. |
| `deleteTodayEntry` | entryId | Только сегодняшняя запись владельца. |
| `getDashboard` | — | Агрегат: overall, 3 предмета, streak, today schedule flag, recent entries. |
| `getSubject` | subject | Прогресс предмета, лестница статусов, история записей. |
| `getAchievements` | — | Все из конфига + флаг unlocked + дата. |
| `getCharts` | — | Данные для графиков (см. спеку 03): XP по неделям, по предметам, по A/B/C, календарь обязательных слотов. |

### Правила даты

- Создавать / править / удалять записи можно **только за «сегодня»**.
- Задним числом и на будущее — запрещено (ошибка валидации).
- Это намеренно: иначе streak теряет смысл.

### Ответ после upsert (для UI)

```ts
{
  entry: Entry;
  before: ProgressSnapshot; // overall + subjects + streak + unlocked achievements
  after: ProgressSnapshot;
  newlyUnlocked: string[]; // achievement ids
}
```

`ProgressSnapshot` считается в `lib/game/` из полного списка entries пользователя.

## Безопасность (минимум)

- Rate limit на login не обязателен в v1, но не логировать пароли.
- Валидация subject и counts на сервере (не только клиент).
- CSRF: для cookie-сессии + SameSite=Lax + Server Actions Next.js — достаточно для v1.
- Не отдавать `password_hash` в клиент.

## Критерии приёмки

- [ ] Миграции Drizzle поднимают `users`, `entries`, `user_achievements`.
- [ ] Seed создаёт ровно двух пользователей; вход обоими работает.
- [ ] Пользователь не видит чужие entries / achievements.
- [ ] Upsert за сегодня работает; за вчера — отвергается.
- [ ] Повторный ввод того же предмета за сегодня обновляет counts.
- [ ] После upsert новые ачивки появляются в `user_achievements` без дублей.
- [ ] XP/уровень/статус/streak нигде не денормализованы в отдельных колонках прогресса.
