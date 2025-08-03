-- Создание таблицы articles для хранения новостей из newsdata.io API
CREATE TABLE IF NOT EXISTS articles (
  id BIGSERIAL PRIMARY KEY,
  article_id TEXT UNIQUE NOT NULL,
  title TEXT,
  link TEXT,
  keywords TEXT[],
  creator TEXT[],
  description TEXT,
  content TEXT,
  pub_date TIMESTAMP WITH TIME ZONE,
  pub_date_tz TEXT,
  image_url TEXT,
  video_url TEXT,
  source_id TEXT,
  source_name TEXT,
  source_priority INTEGER,
  source_url TEXT,
  source_icon TEXT,
  language TEXT,
  country TEXT[],
  category TEXT[],
  sentiment TEXT,
  sentiment_stats TEXT,
  ai_tag TEXT,
  ai_region TEXT,
  ai_org TEXT,
  ai_summary TEXT,
  ai_content TEXT,
  duplicate BOOLEAN DEFAULT FALSE,
  -- Mercury Parser поля
  mercury_content TEXT,
  mercury_text TEXT,
  mercury_excerpt TEXT,
  mercury_lead_image_url TEXT,
  mercury_word_count INTEGER,
  mercury_direction TEXT,
  mercury_total_pages INTEGER,
  mercury_rendered_pages INTEGER,
  mercury_parsed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Создание индексов для оптимизации запросов
CREATE INDEX IF NOT EXISTS idx_articles_article_id ON articles(article_id);
CREATE INDEX IF NOT EXISTS idx_articles_source_id ON articles(source_id);
CREATE INDEX IF NOT EXISTS idx_articles_language ON articles(language);
CREATE INDEX IF NOT EXISTS idx_articles_category ON articles USING GIN(category);
CREATE INDEX IF NOT EXISTS idx_articles_pub_date ON articles(pub_date);
CREATE INDEX IF NOT EXISTS idx_articles_created_at ON articles(created_at);

-- Создание триггера для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_articles_updated_at 
    BEFORE UPDATE ON articles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Добавление комментариев к таблице и полям
COMMENT ON TABLE articles IS 'Таблица для хранения новостей из newsdata.io API';
COMMENT ON COLUMN articles.article_id IS 'Уникальный ID статьи из API';
COMMENT ON COLUMN articles.title IS 'Заголовок статьи';
COMMENT ON COLUMN articles.link IS 'Ссылка на статью';
COMMENT ON COLUMN articles.keywords IS 'Ключевые слова';
COMMENT ON COLUMN articles.creator IS 'Авторы статьи';
COMMENT ON COLUMN articles.description IS 'Описание статьи';
COMMENT ON COLUMN articles.content IS 'Содержание статьи (доступно в платных планах)';
COMMENT ON COLUMN articles.pub_date IS 'Дата публикации';
COMMENT ON COLUMN articles.source_id IS 'ID источника';
COMMENT ON COLUMN articles.source_name IS 'Название источника';
COMMENT ON COLUMN articles.language IS 'Язык статьи';
COMMENT ON COLUMN articles.country IS 'Страны';
COMMENT ON COLUMN articles.category IS 'Категории';
COMMENT ON COLUMN articles.mercury_content IS 'HTML содержимое статьи (Mercury Parser)';
COMMENT ON COLUMN articles.mercury_text IS 'Текстовое содержимое статьи (Mercury Parser)';
COMMENT ON COLUMN articles.mercury_excerpt IS 'Краткое описание статьи (Mercury Parser)';
COMMENT ON COLUMN articles.mercury_lead_image_url IS 'Главное изображение статьи (Mercury Parser)';
COMMENT ON COLUMN articles.mercury_word_count IS 'Количество слов в статье (Mercury Parser)';
COMMENT ON COLUMN articles.mercury_direction IS 'Направление текста (Mercury Parser)';
COMMENT ON COLUMN articles.mercury_total_pages IS 'Общее количество страниц (Mercury Parser)';
COMMENT ON COLUMN articles.mercury_rendered_pages IS 'Количество обработанных страниц (Mercury Parser)';
COMMENT ON COLUMN articles.mercury_parsed_at IS 'Дата обработки через Mercury Parser'; 