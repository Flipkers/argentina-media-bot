-- Добавление полей для OpenAI анализа статей
-- Выполните эти команды в Supabase SQL Editor

-- Поле для перевода статьи на русский
ALTER TABLE articles ADD COLUMN IF NOT EXISTS openai_translation TEXT;

-- Поле для категории (стыд/необычно/любопытно/редко/забавно/важная/неинтересная)
ALTER TABLE articles ADD COLUMN IF NOT EXISTS openai_category VARCHAR(50);

-- Поле для оценки интересности (1-10)
ALTER TABLE articles ADD COLUMN IF NOT EXISTS openai_score INTEGER CHECK (openai_score >= 1 AND openai_score <= 10);

-- Поле для объяснения оценки
ALTER TABLE articles ADD COLUMN IF NOT EXISTS openai_reason TEXT;

-- Поле для саркастического заголовка
ALTER TABLE articles ADD COLUMN IF NOT EXISTS openai_post_title TEXT;

-- Поле для детального описания поста
ALTER TABLE articles ADD COLUMN IF NOT EXISTS openai_post_content TEXT;

-- Поле для флага публикации
ALTER TABLE articles ADD COLUMN IF NOT EXISTS openai_should_post BOOLEAN DEFAULT FALSE;

-- Поле для времени обработки OpenAI
ALTER TABLE articles ADD COLUMN IF NOT EXISTS openai_processed_at TIMESTAMP WITH TIME ZONE;

-- Индекс для быстрого поиска интересных статей
CREATE INDEX IF NOT EXISTS idx_articles_openai_score ON articles(openai_score DESC);

-- Индекс для поиска по категориям
CREATE INDEX IF NOT EXISTS idx_articles_openai_category ON articles(openai_category);

-- Индекс для поиска статей для публикации
CREATE INDEX IF NOT EXISTS idx_articles_should_post ON articles(openai_should_post) WHERE openai_should_post = true;

-- Комментарии к полям
COMMENT ON COLUMN articles.openai_translation IS 'Перевод статьи на русский язык';
COMMENT ON COLUMN articles.openai_category IS 'Категория: стыд/необычно/любопытно/редко/забавно/важная/неинтересная';
COMMENT ON COLUMN articles.openai_score IS 'Оценка интересности статьи от 1 до 10';
COMMENT ON COLUMN articles.openai_reason IS 'Объяснение оценки интересности';
COMMENT ON COLUMN articles.openai_post_title IS 'Саркастический заголовок для поста';
COMMENT ON COLUMN articles.openai_post_content IS 'Детальное описание поста до 1000 символов';
COMMENT ON COLUMN articles.openai_should_post IS 'Флаг: нужно ли публиковать статью';
COMMENT ON COLUMN articles.openai_processed_at IS 'Время обработки статьи через OpenAI'; 