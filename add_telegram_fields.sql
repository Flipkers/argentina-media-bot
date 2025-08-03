-- Добавление полей для Telegram публикации
-- Выполните эти команды в Supabase SQL Editor

-- Поле для времени публикации в Telegram
ALTER TABLE articles ADD COLUMN IF NOT EXISTS telegram_published_at TIMESTAMP WITH TIME ZONE;

-- Индекс для поиска неопубликованных постов
CREATE INDEX IF NOT EXISTS idx_articles_telegram_published ON articles(telegram_published_at) WHERE telegram_published_at IS NULL;

-- Индекс для поиска готовых к публикации постов
CREATE INDEX IF NOT EXISTS idx_articles_ready_to_publish ON articles(openai_should_post, telegram_published_at) WHERE openai_should_post = true AND telegram_published_at IS NULL;

-- Комментарии к полям
COMMENT ON COLUMN articles.telegram_published_at IS 'Время публикации поста в Telegram'; 