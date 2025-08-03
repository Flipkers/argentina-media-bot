# 🤖 Настройка Telegram Bot

## 📋 Что нужно сделать:

### 1. Создание Telegram Bot

1. **Найдите @BotFather в Telegram**
2. **Отправьте команду:** `/newbot`
3. **Введите имя бота:** `Argentina Media Bot`
4. **Введите username:** `argentina_media_bot` (должен заканчиваться на `bot`)
5. **Получите токен:** `1234567890:ABCdefGHIjklMNOpqrsTUVwxyz`

### 2. Настройка канала или чата

#### Вариант A: Публикация в канал
1. **Создайте канал** в Telegram
2. **Добавьте бота как администратора** канала
3. **Получите ID канала:**
   - Отправьте сообщение в канал
   - Перешлите его боту @userinfobot
   - Скопируйте ID (например: `@argentina_news` или `-1001234567890`)

#### Вариант B: Публикация в личный чат
1. **Начните чат с ботом**
2. **Отправьте любое сообщение**
3. **Получите ID чата:**
   - Отправьте сообщение боту @userinfobot
   - Скопируйте ваш ID (например: `123456789`)

### 3. Добавление переменных окружения

Добавьте в файл `.env`:

```env
# Telegram Bot
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
TELEGRAM_CHANNEL_ID=@argentina_news
# ИЛИ для личного чата:
# TELEGRAM_CHAT_ID=123456789
```

### 4. Добавление поля в базу данных

Выполните SQL в Supabase Dashboard:

```sql
-- Поле для времени публикации в Telegram
ALTER TABLE articles ADD COLUMN IF NOT EXISTS telegram_published_at TIMESTAMP WITH TIME ZONE;

-- Индекс для поиска неопубликованных постов
CREATE INDEX IF NOT EXISTS idx_articles_telegram_published ON articles(telegram_published_at) WHERE telegram_published_at IS NULL;

-- Индекс для поиска готовых к публикации постов
CREATE INDEX IF NOT EXISTS idx_articles_ready_to_publish ON articles(openai_should_post, telegram_published_at) WHERE openai_should_post = true AND telegram_published_at IS NULL;

-- Комментарии к полям
COMMENT ON COLUMN articles.telegram_published_at IS 'Время публикации поста в Telegram';
```

### 5. Тестирование

```bash
node cli.js --test_telegram
```

## 🔧 Команды для управления:

- `--test_telegram` - Проверить подключение к Telegram
- `--publish_posts [N]` - Опубликовать N готовых постов
- `--send_stats` - Отправить статистику

## 📊 Что будет публиковаться:

- **Заголовок:** Саркастический заголовок от OpenAI
- **Контент:** Детальное описание до 1000 символов
- **Ссылка:** На оригинальную статью
- **Источник:** Название издания

## ⚠️ Важные моменты:

1. **Бот должен быть администратором канала** (если публикуете в канал)
2. **Токен должен быть секретным** - не публикуйте его в открытом доступе
3. **Канал должен быть публичным** или бот должен иметь права на публикацию
4. **Ограничения Telegram:** максимум 4096 символов на сообщение

## 🚀 Автоматическая публикация:

После настройки система будет автоматически публиковать интересные статьи (оценка 6+) в Telegram каждые 5 минут. 