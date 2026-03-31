# EduSphere

Полноценный школьный портал с ролями `student` / `parent` / `teacher` / `admin`, интеграцией Supabase, AI-чатом и PWA-режимом.

## Цель проекта

Сделать одно приложение для учебной экосистемы:
- ученик видит оценки, расписание, ленту, чат, AI-помощника;
- родитель наблюдает прогресс ребенка и получает уведомления;
- учитель выставляет оценки и может использовать AI для отчётов;
- админ управляет пользователями/классами/лентой школы.

## Что реализовано

- Ролевая авторизация через Supabase Auth.
- Профили пользователей, классы, школы, предметы.
- Оценки и расписание из БД.
- Лента с лайками и комментариями (реальные записи в БД).
- Чаты между пользователями.
- AI-чат с историей диалогов в БД.
- Привязка родителя к ребенку по `ID` (полный UUID или короткий префикс).
- Система уведомлений (в БД + live toast в интерфейсе + browser notification при разрешении).
- PWA: `manifest.json` + service worker (`public/sw.js`).
- Анализ ИИ оценок и расписаний , так же контроль состояния ребенка.

## Страницы и блоки

- `Onboarding` — приветственные экраны и выбор роли.
- `Login/Register` — вход и регистрация (в т.ч. parent -> child ID).
- `PostRegOnboarding` — пост-регистрационный сценарий.
- `StudentDashboard`:
  - `Home` — прогресс, расписание, оценки, достижения.
  - `Feed` — посты, лайки, комментарии.
  - `AI` — персональный AI-чат.
  - `Chat` — прямые диалоги.
  - `Profile` — профиль, друзья, поиск по ID/username.
- `ParentDashboard`:
  - `Home/Grades/Profile` + `AI/Chat` вкладки.
  - Кнопка похвалы ребенка через защищённый RPC.
- `TeacherDashboard`:
  - `Home/Students/Grades/Profile` + `AI`.
- `AdminDashboard`:
  - пользователи, классы, лента школы.
  - Для регистраций введите ID школы созданный специально под Aqbobek : 11111111-1111-1111-1111-111111111111

## Стек

- Frontend: React 18 + TypeScript + Vite + Tailwind.
- Data/Auth/Realtime: Supabase (PostgreSQL, RLS, Realtime).
- UI анимации: Framer Motion.
- AI: внешний LLM endpoint (через `callAlemAI`).
- Аватары: DiceBear API (`https://api.dicebear.com`).
- PWA: Web App Manifest + Service Worker.

## База данных (Supabase)

Основной SQL-файл: `sql/setup.sql`.

Он создаёт:
- core-таблицы: `profiles`, `schools`, `classes`, `subjects`, `grades`, `lessons`, `followers`, `posts`, `post_likes`, `post_comments`, `messages`, `conversations`, `ai_conversations`, `ai_messages` и др.;
- дополнительные таблицы:
  - `notifications` — уведомления пользователей;
  - `school_applications` — заявки школ;
- функции:
  - `award_xp_to_child` — безопасная выдача XP ребенку родителем;
  - `resolve_user_id_by_code` — поиск по полному/короткому ID;
  - `search_profiles` — поиск пользователей по ID/username/full_name;
  - `notify_user` — запись уведомления;
- триггеры для уведомлений и счётчиков.

## Быстрый старт

### 1) Установить зависимости

```bash
npm install
```

### 2) Запустить проект

```bash
npm run dev
```

Открыть в браузере: `http://localhost:5173`


## Команды

- `npm run dev` — локальная разработка
- `npm run build` — продакшн сборка
- `npm run preview` — локальный preview сборки
- `npm run lint` — ESLint
- `npm run test` — unit-тесты

## Особенности и ограничения

- В проекте есть mock-fallback для некоторых экранов (оценки/расписание/лента) при пустой БД.
- Для production рекомендуется:
  - вынести AI-вызовы в server-side edge function;
  - усилить политики RLS под конкретную модель доступа школы.
