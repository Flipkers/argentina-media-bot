#!/usr/bin/env node
/* eslint-disable */

require('dotenv').config();
require('./polyfills'); // Загружаем полифиллы
const Mercury = require('./dist/mercury');
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai');
const { getOpenAIPrompt } = require('./openai_prompt');
const TelegramBot = require('./telegram_bot');
const argv = require('yargs-parser')(process.argv.slice(2));

// Инициализация Supabase клиента
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Отсутствуют переменные окружения для Supabase');
  console.error('SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.error('SUPABASE_SERVICE_KEY:', supabaseKey ? '✅' : '❌');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Инициализация OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Функция для проверки подключения к Supabase
async function testSupabaseConnection() {
  try {
    console.log('🔍 Проверяем подключение к Supabase...');
    console.log('📊 URL:', supabaseUrl);
    console.log('📊 Key:', supabaseKey ? '✅' : '❌');
    
    const { data, error } = await supabase
      .from('articles')
      .select('count')
      .limit(1);
    
    if (error) {
      console.log('📋 Таблица articles не существует:', error.message);
      return false;
    }
    
    console.log('✅ Подключение к Supabase успешно');
    return true;
  } catch (error) {
    console.log('📋 Таблица articles не существует:', error.message);
    return false;
  }
}

// Функция для создания таблицы articles
async function createArticlesTable() {
  try {
    console.log('🔨 Создаем таблицу articles...');
    
    // Создаем таблицу через SQL
    const { error } = await supabase.rpc('exec_sql', {
      sql: `
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
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });
    
    if (error) {
      console.log('⚠️ Не удалось создать таблицу через RPC, попробуем другой способ...');
      // Попробуем создать через обычный запрос
      const { error: insertError } = await supabase
        .from('articles')
        .insert({
          article_id: 'test',
          title: 'Test Article'
        });
      
      if (insertError && insertError.code === '42P01') {
        console.log('❌ Таблица articles не существует. Создайте таблицу вручную в Supabase Dashboard');
        console.log('📋 SQL скрипт сохранен в файле create_articles_table.sql');
        return false;
      }
    }
    
    console.log('✅ Таблица articles создана или уже существует');
    return true;
  } catch (error) {
    console.log('❌ Ошибка при создании таблицы:', error.message);
    return false;
  }
}

const {
  _: [url],
  format,
  f,
  news,
  country,
  category,
  language,
  size,
  page,
  create_table,
  update_table,
  process_existing,
  test_domains,
  openai_analyze,
} = argv;

// Функция для обработки статей через Mercury Parser
async function processArticlesWithMercury(articles) {
  console.log('🔍 Обрабатываем статьи через Mercury Parser...');
  
  const processedArticles = [];
  
  for (let i = 0; i < articles.length; i++) {
    const article = articles[i];
    console.log(`📰 Обрабатываем статью ${i + 1}/${articles.length}: ${article.title}`);
    
    try {
      // Обрабатываем статью через Mercury Parser
      const mercuryResult = await Mercury.parse(article.link, {
        contentType: 'text'
      });
      
      // Добавляем результаты Mercury Parser к статье
      const processedArticle = {
        ...article,
        mercury_content: mercuryResult.content,
        mercury_text: mercuryResult.text,
        mercury_excerpt: mercuryResult.excerpt,
        mercury_lead_image_url: mercuryResult.lead_image_url,
        mercury_word_count: mercuryResult.word_count,
        mercury_direction: mercuryResult.direction,
        mercury_total_pages: mercuryResult.total_pages,
        mercury_rendered_pages: mercuryResult.rendered_pages,
        mercury_parsed_at: new Date().toISOString()
      };
      
      processedArticles.push(processedArticle);
      console.log(`✅ Статья обработана: ${mercuryResult.word_count} слов`);
      
      // Небольшая задержка между запросами
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      console.error(`❌ Ошибка при обработке статьи ${article.title}:`, error.message);
      
      // Добавляем статью без Mercury данных
      const processedArticle = {
        ...article,
        mercury_content: null,
        mercury_text: null,
        mercury_excerpt: null,
        mercury_lead_image_url: null,
        mercury_word_count: null,
        mercury_direction: null,
        mercury_total_pages: null,
        mercury_rendered_pages: null,
        mercury_parsed_at: null
      };
      
      processedArticles.push(processedArticle);
    }
  }
  
  console.log(`✅ Обработано ${processedArticles.length} статей через Mercury Parser`);
  return processedArticles;
}

// Функция для анализа статей через OpenAI
async function analyzeArticleWithOpenAI(article) {
  try {
    console.log(`🤖 Анализируем статью: ${article.title}`);
    
    // Подготавливаем контент для анализа
    const content = `Заголовок: ${article.title}\n\nСодержание: ${article.mercury_content || article.description || 'Контент недоступен'}`;
    
    // Получаем промпт из отдельного файла
    const prompt = getOpenAIPrompt(content);

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000
    });

    const result = JSON.parse(response.choices[0].message.content);
    
    // Добавляем результаты анализа к статье
    const analyzedArticle = {
      ...article,
      openai_translation: result.translation,
      openai_category: result.category,
      openai_score: result.score,
      openai_reason: result.reason,
      openai_post_title: result.post_title,
      openai_post_content: result.post_content,
      openai_should_post: result.should_post,
      openai_processed_at: new Date().toISOString()
    };
    
    console.log(`✅ Статья проанализирована: оценка ${result.score}/10, категория: ${result.category}`);
    
    return analyzedArticle;
    
  } catch (error) {
    console.error(`❌ Ошибка при анализе статьи ${article.title}:`, error.message);
    
    // Возвращаем статью с пустыми полями OpenAI в случае ошибки
    return {
      ...article,
      openai_translation: null,
      openai_category: 'неинтересная',
      openai_score: 1,
      openai_reason: `Ошибка анализа: ${error.message}`,
      openai_post_title: null,
      openai_post_content: null,
      openai_should_post: false,
      openai_processed_at: new Date().toISOString()
    };
  }
}

// Функция для обработки всех статей через OpenAI
async function processArticlesWithOpenAI(articles) {
  console.log('🤖 Обрабатываем статьи через OpenAI...');
  
  const processedArticles = [];
  
  for (let i = 0; i < articles.length; i++) {
    const article = articles[i];
    console.log(`📰 Анализируем статью ${i + 1}/${articles.length}: ${article.title}`);
    
    try {
      const analyzedArticle = await analyzeArticleWithOpenAI(article);
      processedArticles.push(analyzedArticle);
      
      // Небольшая задержка между запросами
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error(`❌ Ошибка при обработке статьи ${article.title}:`, error.message);
      
      // Добавляем статью с ошибкой
      const errorArticle = {
        ...article,
        openai_translation: null,
        openai_category: 'неинтересная',
        openai_score: 1,
        openai_reason: `Ошибка обработки: ${error.message}`,
        openai_post_title: null,
        openai_post_content: null,
        openai_should_post: false,
        openai_processed_at: new Date().toISOString()
      };
      
      processedArticles.push(errorArticle);
    }
  }
  
  console.log(`✅ Обработано ${processedArticles.length} статей через OpenAI`);
  return processedArticles;
}

// Функция для сохранения статей в Supabase
async function saveArticlesToSupabase(articles) {
  try {
    const articlesToInsert = articles.map(article => ({
      article_id: article.article_id,
      title: article.title,
      link: article.link,
      keywords: article.keywords,
      creator: article.creator,
      description: article.description,
      content: article.content,
      pub_date: article.pubDate,
      pub_date_tz: article.pubDateTZ,
      image_url: article.image_url,
      video_url: article.video_url,
      source_id: article.source_id,
      source_name: article.source_name,
      source_priority: article.source_priority,
      source_url: article.source_url,
      source_icon: article.source_icon,
      language: article.language,
      country: article.country,
      category: article.category,
      sentiment: article.sentiment,
      sentiment_stats: article.sentiment_stats,
      ai_tag: article.ai_tag,
      ai_region: article.ai_region,
      ai_org: article.ai_org,
      ai_summary: article.ai_summary,
      ai_content: article.ai_content,
      duplicate: article.duplicate,
      // Mercury Parser поля
      mercury_content: article.mercury_content,
      mercury_text: article.mercury_text,
      mercury_excerpt: article.mercury_excerpt,
      mercury_lead_image_url: article.mercury_lead_image_url,
      mercury_word_count: article.mercury_word_count,
      mercury_direction: article.mercury_direction,
      mercury_total_pages: article.mercury_total_pages,
      mercury_rendered_pages: article.mercury_rendered_pages,
      mercury_parsed_at: article.mercury_parsed_at,
      // OpenAI поля
      openai_translation: article.openai_translation,
      openai_category: article.openai_category,
      openai_score: article.openai_score,
      openai_reason: article.openai_reason,
      openai_post_title: article.openai_post_title,
      openai_post_content: article.openai_post_content,
      openai_should_post: article.openai_should_post,
      openai_processed_at: article.openai_processed_at,
      created_at: new Date().toISOString()
    }));

    console.log('📊 Подготовлено статей для сохранения:', articlesToInsert.length);
    
    // Получаем все URL новых статей
    const newUrls = articlesToInsert.map(article => article.link).filter(url => url);
    console.log('🔍 Проверяем существующие статьи по URL...');
    
    // Проверяем, какие статьи уже существуют в БД
    const { data: existingArticles, error: checkError } = await supabase
      .from('articles')
      .select('link')
      .in('link', newUrls);
    
    if (checkError) {
      console.error('❌ Ошибка при проверке существующих статей:', checkError);
      throw checkError;
    }
    
    const existingUrls = existingArticles.map(article => article.link);
    const newArticles = articlesToInsert.filter(article => !existingUrls.includes(article.link));
    
    console.log(`📊 Найдено ${existingUrls.length} существующих статей из ${newUrls.length} новых`);
    console.log(`📊 Будет добавлено ${newArticles.length} новых статей`);
    
    if (newArticles.length === 0) {
      console.log('✅ Все статьи уже существуют в базе данных');
      return [];
    }
    
    // Добавляем только новые статьи
    const { data, error } = await supabase
      .from('articles')
      .insert(newArticles);

    if (error) {
      console.error('❌ Ошибка при сохранении в Supabase:', error);
      console.error('❌ Детали ошибки:', JSON.stringify(error, null, 2));
      throw error;
    }

    console.log(`✅ Сохранено ${newArticles.length} новых статей в Supabase`);
    return data;
  } catch (error) {
    console.error('Ошибка при сохранении статей:', error);
    throw error;
  }
}

// Функция для обновления результатов OpenAI анализа
async function updateOpenAIResults(articles) {
  try {
    console.log('🤖 Обновляем результаты OpenAI анализа...');
    
    const articlesToUpdate = articles.filter(article => 
      article.openai_score && article.openai_category
    );
    
    if (articlesToUpdate.length === 0) {
      console.log('⚠️ Нет статей с результатами OpenAI для обновления');
      return [];
    }
    
    console.log(`📊 Подготовлено ${articlesToUpdate.length} статей для обновления OpenAI результатов`);
    
    let updatedCount = 0;
    
    for (const article of articlesToUpdate) {
      try {
        const { error } = await supabase
          .from('articles')
          .update({
            openai_translation: article.openai_translation,
            openai_category: article.openai_category,
            openai_score: article.openai_score,
            openai_reason: article.openai_reason,
            openai_post_title: article.openai_post_title,
            openai_post_content: article.openai_post_content,
            openai_should_post: article.openai_should_post,
            openai_processed_at: article.openai_processed_at
          })
          .eq('link', article.link);
        
        if (error) {
          console.error(`❌ Ошибка при обновлении статьи ${article.title}:`, error);
        } else {
          updatedCount++;
        }
      } catch (error) {
        console.error(`❌ Ошибка при обновлении статьи ${article.title}:`, error);
      }
    }
    
    console.log(`✅ Обновлено ${updatedCount} статей с результатами OpenAI`);
    return articlesToUpdate;
  } catch (error) {
    console.error('Ошибка при обновлении результатов OpenAI:', error);
    throw error;
  }
}

// Функция для публикации постов в Telegram
async function publishPostsToTelegram(count = 5) {
  try {
    console.log('📤 Публикуем посты в Telegram...');
    
    const telegramBot = new TelegramBot();
    
    // Проверяем подключение
    const isConnected = await telegramBot.testConnection();
    if (!isConnected) {
      console.log('❌ Не удалось подключиться к Telegram Bot');
      return [];
    }
    
    // Получаем готовые посты из базы данных
    const { data: articles, error } = await supabase
      .from('articles')
      .select('*')
      .eq('openai_should_post', true)
      .is('telegram_published_at', null) // Только неопубликованные
      .order('openai_score', { ascending: false })
      .limit(count);
    
    if (error) {
      console.error('❌ Ошибка при получении статей:', error);
      return [];
    }
    
    if (!articles || articles.length === 0) {
      console.log('📋 Нет готовых постов для публикации');
      return [];
    }
    
    console.log(`📊 Найдено ${articles.length} постов для публикации`);
    
    let publishedCount = 0;
    const publishedArticles = [];
    
    for (const article of articles) {
      try {
        // Публикуем пост
        const success = await telegramBot.sendPost(article);
        
        if (success) {
          // Отмечаем как опубликованный
          const { error: updateError } = await supabase
            .from('articles')
            .update({ 
              telegram_published_at: new Date().toISOString() 
            })
            .eq('id', article.id);
          
          if (updateError) {
            console.error(`❌ Ошибка при обновлении статуса публикации:`, updateError);
          } else {
            publishedCount++;
            publishedArticles.push(article);
            console.log(`✅ Пост опубликован: ${article.openai_post_title}`);
          }
          
          // Пауза между публикациями (чтобы не спамить)
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      } catch (error) {
        console.error(`❌ Ошибка при публикации поста "${article.title}":`, error.message);
      }
    }
    
    console.log(`📤 Опубликовано ${publishedCount} постов из ${articles.length}`);
    return publishedArticles;
    
  } catch (error) {
    console.error('❌ Ошибка при публикации постов:', error.message);
    return [];
  }
}

// Функция для публикации конкретных статей в Telegram
async function publishSpecificArticlesToTelegram(articles) {
  try {
    console.log(`📤 Публикуем ${articles.length} конкретных статей в Telegram...`);
    
    const telegramBot = new TelegramBot();
    
    // Проверяем подключение
    const isConnected = await telegramBot.testConnection();
    if (!isConnected) {
      console.log('❌ Не удалось подключиться к Telegram Bot');
      return [];
    }
    
    if (!articles || articles.length === 0) {
      console.log('📋 Нет статей для публикации');
      return [];
    }
    
    let publishedCount = 0;
    const publishedArticles = [];
    
    for (const article of articles) {
      try {
        // Проверяем, что статья еще не опубликована
        const { data: existingArticle, error: checkError } = await supabase
          .from('articles')
          .select('telegram_published_at')
          .eq('link', article.link)
          .single();
        
        if (checkError) {
          console.error(`❌ Ошибка при проверке статуса статьи:`, checkError);
          continue;
        }
        
        if (existingArticle && existingArticle.telegram_published_at) {
          console.log(`⚠️ Статья "${article.title}" уже опубликована, пропускаем`);
          continue;
        }
        
        // Публикуем пост
        const success = await telegramBot.sendPost(article);
        
        if (success) {
          // Отмечаем как опубликованный
          const { error: updateError } = await supabase
            .from('articles')
            .update({ telegram_published_at: new Date().toISOString() })
            .eq('link', article.link);
          
          if (updateError) {
            console.error(`❌ Ошибка при обновлении статуса публикации:`, updateError);
          } else {
            publishedCount++;
            publishedArticles.push(article);
            console.log(`✅ Опубликована: ${article.title} (оценка: ${article.openai_score}/10)`);
          }
        }
        
        // Пауза между публикациями (чтобы не спамить)
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.error(`❌ Ошибка при публикации статьи ${article.title}:`, error);
      }
    }
    
    console.log(`✅ Опубликовано ${publishedCount} статей в Telegram`);
    return publishedArticles;
  } catch (error) {
    console.error('❌ Ошибка при публикации статей:', error);
    return [];
  }
}

// Функция для отправки статистики в Telegram
async function sendStatsToTelegram() {
  try {
    console.log('📊 Отправляем статистику в Telegram...');
    
    const telegramBot = new TelegramBot();
    
    // Получаем статистику за сегодня
    const today = new Date().toISOString().split('T')[0];
    
    const { data: articles, error } = await supabase
      .from('articles')
      .select('*')
      .gte('created_at', today);
    
    if (error) {
      console.error('❌ Ошибка при получении статистики:', error);
      return false;
    }
    
    const stats = {
      totalArticles: articles.length,
      analyzedArticles: articles.filter(a => a.openai_processed_at).length,
      interestingArticles: articles.filter(a => a.openai_score >= 6).length,
      publishedPosts: articles.filter(a => a.telegram_published_at).length
    };
    
    const success = await telegramBot.sendStats(stats);
    
    if (success) {
      console.log('✅ Статистика отправлена в Telegram');
    } else {
      console.log('❌ Не удалось отправить статистику');
    }
    
    return success;
  } catch (error) {
    console.error('❌ Ошибка при отправке статистики:', error.message);
    return false;
  }
}

// Функция для получения новостей через newsdata.io API
async function getNewsData(params = {}) {
  const apiKey = process.env.NEWSDATA_API_KEY;
  if (!apiKey) {
    throw new Error('NEWSDATA_API_KEY не найден в переменных окружения');
  }

  const baseUrl = 'https://newsdata.io/api/1/news';
  const priorityDomains = 'infobae.com,clarin.com,batimes.com.ar,lanacion.com.ar,pagina12.com.ar';
  
  let allResults = [];
  let totalResults = 0;
  let nextPage = null;

  try {
    // Первый запрос: приоритетные домены
    console.log('🔍 Запрашиваем новости с приоритетных доменов...');
    const priorityParams = {
      apikey: apiKey,
      country: 'ar',
      language: 'en,es',
      category: 'business,politics,lifestyle,technology,entertainment',
      q: 'milei OR politica OR futbol OR economia OR sociedad',
      domainurl: priorityDomains,
      size: Math.min(params.size || 10, 10), // Максимум 10 статей
      ...params
    };

    const priorityResponse = await axios.get(baseUrl, { params: priorityParams });
    
    if (priorityResponse.data.results && priorityResponse.data.results.length > 0) {
      allResults = [...allResults, ...priorityResponse.data.results];
      console.log(`📊 Приоритетные домены: ${priorityResponse.data.results.length} статей`);
    }

    // Второй запрос: все аргентинские источники (без ограничения по доменам)
    console.log('🔍 Запрашиваем новости со всех аргентинских источников...');
    const generalParams = {
      apikey: apiKey,
      country: 'ar',
      language: 'en,es',
      category: 'business,politics,lifestyle,technology,entertainment',
      q: 'deportes OR salud OR tecnologia OR cultura OR internacional',
      size: Math.min(params.size || 10, 10), // Максимум 10 статей
      ...params
    };

    // Убираем domainurl для второго запроса
    delete generalParams.domainurl;

    const generalResponse = await axios.get(baseUrl, { params: generalParams });
    
    if (generalResponse.data.results && generalResponse.data.results.length > 0) {
      allResults = [...allResults, ...generalResponse.data.results];
      console.log(`📊 Все источники: ${generalResponse.data.results.length} статей`);
    }

    // Убираем дубликаты по URL
    const uniqueResults = allResults.filter((article, index, self) => 
      index === self.findIndex(a => a.link === article.link)
    );

    console.log(`📊 Всего уникальных статей: ${uniqueResults.length}`);
    console.log(`📊 Источники: ${[...new Set(uniqueResults.map(a => a.source_name))].join(', ')}`);

    return {
      status: 'success',
      totalResults: uniqueResults.length,
      results: uniqueResults,
      nextPage: generalResponse.data.nextPage || priorityResponse.data.nextPage
    };

  } catch (error) {
    console.error('Ошибка при запросе к newsdata.io API:', error.response?.data || error.message);
    if (error.response?.data) {
      console.error('Детали ошибки:', JSON.stringify(error.response.data, null, 2));
    }
    throw error;
  }
}

(async (urlToParse, contentType) => {
  // Извлекаем переменные из argv
  const {
    news,
    full_cycle,
    size,
    page,
    country,
    category,
    language,
    create_table,
    update_table,
    test_domains,
    openai_analyze,
    test_telegram,
    publish_posts,
    send_stats
  } = argv;

  // Обработка команды создания таблицы
  if (create_table) {
    try {
      console.log('🔨 Создание таблицы articles...');
      const tableCreated = await createArticlesTable();
      if (tableCreated) {
        console.log('✅ Таблица articles успешно создана');
      } else {
        console.log('❌ Не удалось создать таблицу');
        console.log('📋 Создайте таблицу вручную в Supabase Dashboard, используя SQL из файла create_articles_table.sql');
      }
      return;
    } catch (error) {
      console.error('Ошибка при создании таблицы:', error.message);
      process.exit(1);
    }
  }

  // Обработка команды обновления таблицы
  if (update_table) {
    try {
      console.log('🔨 Обновление таблицы articles (добавление полей Mercury Parser)...');
      console.log('📋 Выполните SQL команды из файла create_articles_table.sql в Supabase Dashboard');
      console.log('📋 Или используйте команду: ALTER TABLE articles ADD COLUMN IF NOT EXISTS mercury_content TEXT;');
      return;
    } catch (error) {
      console.error('Ошибка при обновлении таблицы:', error.message);
      process.exit(1);
    }
  }

  // Обработка команды тестирования доменов
  if (test_domains) {
    try {
      console.log('🔍 Тестируем каждый домен отдельно...');
      
      const domains = ['infobae.com', 'clarin.com', 'batimes.com.ar', 'lanacion.com.ar', 'pagina12.com.ar'];
      
      for (const domain of domains) {
        console.log(`\n📡 Тестируем домен: ${domain}`);
        
        try {
          const apiKey = process.env.NEWSDATA_API_KEY;
          const baseUrl = 'https://newsdata.io/api/1/news';
          const queryParams = {
            apikey: apiKey,
            country: 'ar',
            language: 'en,es',
            category: 'business,politics,lifestyle,technology,entertainment',
            q: 'noticias OR actualidad OR argentina',
            domainurl: domain,
            size: 5
          };

          const response = await axios.get(baseUrl, { params: queryParams });
          
          if (response.data.results && response.data.results.length > 0) {
            console.log(`✅ ${domain}: найдено ${response.data.results.length} статей`);
            console.log(`📰 Примеры: ${response.data.results.slice(0, 2).map(a => a.title).join(', ')}`);
          } else {
            console.log(`⚠️ ${domain}: статей не найдено`);
          }
          
        } catch (error) {
          console.error(`❌ ${domain}: ошибка - ${error.response?.data?.results?.message || error.message}`);
        }
        
        // Задержка между запросами
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      return;
    } catch (error) {
      console.error('Ошибка при тестировании доменов:', error.message);
      process.exit(1);
    }
  }

  // Обработка команды анализа через OpenAI
  if (openai_analyze) {
    try {
      console.log('🤖 Анализируем статьи через OpenAI...');
      
      // Проверяем подключение к Supabase
      const connected = await testSupabaseConnection();
      if (!connected) {
        console.log('❌ Не удалось подключиться к Supabase');
        return;
      }
      
      // Получаем статьи из базы данных
      const { data: articles, error } = await supabase
        .from('articles')
        .select('*')
        .is('openai_processed_at', null) // Только необработанные статьи
        .limit(openai_analyze === true ? 5 : parseInt(openai_analyze));
      
      if (error) {
        console.error('❌ Ошибка при получении статей:', error);
        return;
      }
      
      if (!articles || articles.length === 0) {
        console.log('📋 Нет необработанных статей для анализа');
        return;
      }
      
      console.log(`📊 Найдено ${articles.length} статей для анализа`);
      
      // Обрабатываем статьи через OpenAI
      const processedArticles = await processArticlesWithOpenAI(articles);
      
      // Обновляем результаты OpenAI в базе данных
      await updateOpenAIResults(processedArticles);
      
      // Выводим статистику
      const interestingArticles = processedArticles.filter(a => a.openai_should_post);
      const avgScore = processedArticles.reduce((sum, a) => sum + a.openai_score, 0) / processedArticles.length;
      
      console.log('\n📊 Статистика анализа:');
      console.log(`📰 Всего обработано: ${processedArticles.length}`);
      console.log(`⭐ Средняя оценка: ${avgScore.toFixed(1)}/10`);
      console.log(`✅ Интересных статей: ${interestingArticles.length}`);
      console.log(`❌ Неинтересных статей: ${processedArticles.length - interestingArticles.length}`);
      
      if (interestingArticles.length > 0) {
        console.log('\n🎯 Самые интересные статьи:');
        interestingArticles
          .sort((a, b) => b.openai_score - a.openai_score)
          .slice(0, 3)
          .forEach((article, index) => {
            console.log(`${index + 1}. ${article.title} (${article.openai_score}/10 - ${article.openai_category})`);
          });
      }
      
      return;
    } catch (error) {
      console.error('Ошибка при анализе через OpenAI:', error.message);
      process.exit(1);
    }
  }

  // Обработка команды тестирования Telegram
  if (test_telegram) {
    try {
      console.log('🤖 Тестируем подключение к Telegram...');
      const telegramBot = new TelegramBot();
      const success = await telegramBot.testConnection();
      
      if (success) {
        console.log('✅ Telegram Bot настроен правильно');
        
        // Тестируем отправку сообщения
        const testMessage = '🤖 Тестовое сообщение от Argentina Media Bot\n\nЕсли вы видите это сообщение, значит бот работает правильно!';
        const messageSent = await telegramBot.sendMessage(testMessage);
        
        if (messageSent) {
          console.log('✅ Тестовое сообщение отправлено');
        } else {
          console.log('❌ Не удалось отправить тестовое сообщение');
        }
      } else {
        console.log('❌ Проблемы с настройкой Telegram Bot');
      }
      return;
    } catch (error) {
      console.error('❌ Ошибка при тестировании Telegram:', error.message);
      process.exit(1);
    }
  }

  // Обработка команды публикации постов
  if (publish_posts) {
    try {
      const count = publish_posts === true ? 5 : parseInt(publish_posts);
      console.log(`📤 Публикуем ${count} постов в Telegram...`);
      
      const publishedArticles = await publishPostsToTelegram(count);
      
      if (publishedArticles.length > 0) {
        console.log('\n📤 Опубликованные посты:');
        publishedArticles.forEach((article, index) => {
          console.log(`${index + 1}. ${article.openai_post_title} (${article.openai_score}/10)`);
        });
      }
      
      return;
    } catch (error) {
      console.error('❌ Ошибка при публикации постов:', error.message);
      process.exit(1);
    }
  }

  // Обработка команды отправки статистики
  if (send_stats) {
    try {
      console.log('📊 Отправляем статистику в Telegram...');
      const success = await sendStatsToTelegram();
      
      if (success) {
        console.log('✅ Статистика отправлена');
      } else {
        console.log('❌ Не удалось отправить статистику');
      }
      return;
    } catch (error) {
      console.error('❌ Ошибка при отправке статистики:', error.message);
      process.exit(1);
    }
  }

  // Обработка команды для полного цикла (новости + парсинг + OpenAI)
  if (full_cycle) {
    try {
      console.log('🚀 Запускаем полный автоматизированный цикл...');
      
      const params = {};
      if (country) params.country = country;
      if (category) params.category = category;
      if (language) params.language = language;
      if (size) params.size = parseInt(size);
      if (page) params.page = page;
      
      // Этап 1: Получение новостей
      console.log('\n📡 ЭТАП 1: Получение новостей из API...');
      const newsData = await getNewsData(params);
      
      if (!newsData.results || newsData.results.length === 0) {
        console.log('❌ Новости не найдены, завершаем цикл');
        return;
      }
      
      console.log(`✅ Получено ${newsData.results.length} статей`);
      
      // Этап 2: Обработка через Mercury Parser
      console.log('\n🔍 ЭТАП 2: Обработка через Mercury Parser...');
      const processedArticles = await processArticlesWithMercury(newsData.results);
      console.log(`✅ Обработано ${processedArticles.length} статей через Mercury Parser`);
      
      // Этап 3: Сохранение в Supabase
      console.log('\n💾 ЭТАП 3: Сохранение в базу данных...');
      const isConnected = await testSupabaseConnection();
      if (!isConnected) {
        const tableCreated = await createArticlesTable();
        if (!tableCreated) {
          console.log('⚠️ Пропускаем сохранение в Supabase');
        } else {
          await saveArticlesToSupabase(processedArticles);
        }
      } else {
        await saveArticlesToSupabase(processedArticles);
      }
      
      // Этап 4: Анализ через OpenAI
      console.log('\n🤖 ЭТАП 4: Анализ через OpenAI...');
      const openaiCount = Math.min(processedArticles.length, 10); // Максимум 10 статей для OpenAI
      console.log(`📊 Анализируем ${openaiCount} статей через OpenAI...`);
      
      const analyzedArticles = await processArticlesWithOpenAI(processedArticles.slice(0, openaiCount));
      
      // Этап 5: Сохранение результатов OpenAI
      console.log('\n💾 ЭТАП 5: Сохранение результатов OpenAI...');
      await updateOpenAIResults(analyzedArticles);
      
      // Этап 6: Публикация в Telegram
      console.log('\n📤 ЭТАП 6: Публикация в Telegram...');
      
      // Публикуем все интересные статьи из текущего цикла
      const interestingArticlesFromCycle = analyzedArticles.filter(a => 
        a.openai_should_post && a.openai_score >= 6
      );
      
      let publishedArticles = [];
      
      if (interestingArticlesFromCycle.length > 0) {
        console.log(`📊 Найдено ${interestingArticlesFromCycle.length} интересных статей для публикации`);
        
        // Публикуем ВСЕ интересные статьи
        publishedArticles = await publishSpecificArticlesToTelegram(interestingArticlesFromCycle);
        console.log(`✅ Опубликовано ${publishedArticles.length} новых статей в Telegram`);
      } else {
        console.log('📋 Нет интересных статей для публикации в текущем цикле');
      }
      
      // Итоговая статистика
      console.log('\n🎉 ПОЛНЫЙ ЦИКЛ ЗАВЕРШЕН!');
      console.log(`📊 Статистика:`);
      console.log(`   • Получено статей: ${newsData.results.length}`);
      console.log(`   • Обработано Mercury Parser: ${processedArticles.length}`);
      console.log(`   • Проанализировано OpenAI: ${analyzedArticles.length}`);
      console.log(`   • Интересных статей (оценка 6+): ${interestingArticlesFromCycle.length}`);
      console.log(`   • Опубликовано в Telegram: ${publishedArticles.length}`);
      console.log(`   • Источники: ${[...new Set(newsData.results.map(a => a.source_name))].join(', ')}`);
      
      // Показываем самые интересные статьи
      const interestingArticles = analyzedArticles.filter(a => a.openai_score >= 6);
      if (interestingArticles.length > 0) {
        console.log(`\n⭐ Самые интересные статьи (оценка 6+):`);
        interestingArticles
          .sort((a, b) => b.openai_score - a.openai_score)
          .slice(0, 3)
          .forEach((article, index) => {
            console.log(`${index + 1}. ${article.title} (${article.openai_score}/10 - ${article.openai_category})`);
          });
      }
      
      return;
    } catch (error) {
      console.error('❌ Ошибка в полном цикле:', error.message);
      process.exit(1);
    }
  }

  // Обработка команды для получения новостей
  if (news) {
    try {
      const params = {};
      if (country) params.country = country;
      if (category) params.category = category;
      if (language) params.language = language;
      if (size) params.size = parseInt(size);
      if (page) params.page = page;
      
      console.log('Получаем новости...');
      const newsData = await getNewsData(params);
      
      // Сохраняем статьи в Supabase
      if (newsData.results && newsData.results.length > 0) {
        console.log(`📰 Найдено ${newsData.results.length} статей`);
        
        // Обрабатываем статьи через Mercury Parser
        const processedArticles = await processArticlesWithMercury(newsData.results);
        
        // Проверяем подключение к Supabase
        const isConnected = await testSupabaseConnection();
        if (!isConnected) {
          const tableCreated = await createArticlesTable();
          if (!tableCreated) {
            console.log('⚠️ Пропускаем сохранение в Supabase');
          } else {
            await saveArticlesToSupabase(processedArticles);
          }
        } else {
          await saveArticlesToSupabase(processedArticles);
        }
      } else {
        console.log('📰 Статьи не найдены');
      }
      
      console.log(JSON.stringify(newsData, null, 2));
      return;
    } catch (error) {
      console.error('Ошибка при получении новостей:', error.message);
      process.exit(1);
    }
  }

  if (!urlToParse) {
    console.log(
      '\n\
mercury-parser\n\n\
    The Mercury Parser extracts semantic content from any url\n\n\
Usage:\n\
\n\
    $ mercury-parser url-to-parse [--format=html|text|markdown]\n\
    $ mercury-parser --news [--size=10]\n\
    $ mercury-parser --full_cycle [--size=10]  🚀 ПОЛНЫЙ АВТОМАТИЗИРОВАННЫЙ ЦИКЛ\n\
    $ mercury-parser --create_table\n\
    $ mercury-parser --update_table\n\
    $ mercury-parser --test_domains\n\
    $ mercury-parser --openai_analyze [N]\n\
    $ mercury-parser --test_telegram\n\
    $ mercury-parser --publish_posts [N]\n\
    $ mercury-parser --send_stats\n\
\n\
News API Parameters:\n\
    --news          Получить новости из Аргентины\n\
    --full_cycle    🚀 ПОЛНЫЙ ЦИКЛ: новости + парсинг + OpenAI анализ\n\
    --size=N        Количество статей (максимум 10 для бесплатного плана)\n\
    --page=TOKEN    Следующая страница (используйте nextPage из предыдущего ответа)\n\
    --create_table  Создать таблицу articles в Supabase\n\
    --update_table  Обновить таблицу articles (добавить поля Mercury Parser)\n\
    --test_domains  Протестировать каждый домен отдельно\n\
    --openai_analyze [N]  Анализировать статьи через OpenAI (N - количество статей, по умолчанию 5)\n\
    --test_telegram        Тестировать подключение к Telegram Bot\n\
    --publish_posts [N]    Публиковать готовые посты в Telegram (N - количество постов, по умолчанию 5)\n\
    --send_stats           Отправить статистику в Telegram\n\
\n\
Фильтрация по доменам: infobae.com, clarin.com, batimes.com.ar, lanacion.com.ar, pagina12.com.ar\n\
Поиск по ключевым словам: noticias, actualidad, argentina\n\
\n\
🚀 ПОЛНЫЙ ЦИКЛ включает:\n\
    1. 📡 Получение новостей из API\n\
    2. 🔍 Обработка через Mercury Parser\n\
    3. 💾 Сохранение в базу данных\n\
    4. 🤖 Анализ через OpenAI\n\
    5. 📤 Публикация в Telegram (если настроено)\n\
    6. 📊 Итоговая статистика\n\
\n\
'
    );
    return;
  }
  try {
    const contentTypeMap = {
      html: 'html',
      markdown: 'markdown',
      md: 'markdown',
      text: 'text',
      txt: 'text',
    };
    const result = await Mercury.parse(urlToParse, {
      contentType: contentTypeMap[contentType],
    });
    console.log(JSON.stringify(result, null, 2));
  } catch (e) {
    if (e.message === 'ETIMEDOUT' && false) {
      console.error(
        '\nMercury Parser encountered a timeout trying to load that resource.'
      );
    } else {
      console.error(
        '\nMercury Parser encountered a problem trying to parse that resource.\n'
      );
      console.error(e);
    }
    const reportBug =
      'If you believe this was an error, please file an issue at:\n\n    https://github.com/postlight/mercury-parser/issues/new';
    console.error(`\n${reportBug}\n`);
    process.exit(1);
  }
})(url, format || f);
