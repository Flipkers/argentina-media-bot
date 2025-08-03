require('dotenv').config();
require('./polyfills');

const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai');
const { getOpenAIPrompt } = require('./openai_prompt');
const TelegramBot = require('./telegram_bot');
const axios = require('axios');

console.log('🚀 УПРОЩЕННЫЙ ПОЛНЫЙ ЦИКЛ');

// Инициализация клиентов
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Переменные Supabase не настроены');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function getNewsData(size = 3) {
  console.log('\n📡 ЭТАП 1: Получение новостей из API...');
  
  try {
    const apiKey = process.env.NEWSDATA_API_KEY;
    if (!apiKey) {
      throw new Error('NEWSDATA_API_KEY не найден');
    }

    // Запрос с приоритетных доменов
    console.log('🔍 Запрашиваем новости с приоритетных доменов...');
    console.log('📡 URL:', `https://newsdata.io/api/1/news?apikey=${apiKey.substring(0, 10)}...&country=ar&language=es&size=${size}`);
    
    const priorityResponse = await axios.get(`https://newsdata.io/api/1/news?apikey=${apiKey}&country=ar&language=es&size=${size}`, {
      timeout: 30000 // 30 секунд таймаут
    });
    const priorityData = priorityResponse.data;
    
    console.log(`📊 Приоритетные домены: ${priorityData.results?.length || 0} статей`);

    // Запрос со всех источников
    console.log('🔍 Запрашиваем новости со всех аргентинских источников...');
    console.log('📡 URL:', `https://newsdata.io/api/1/news?apikey=${apiKey.substring(0, 10)}...&country=ar&language=es&size=${size}`);
    
    const allResponse = await axios.get(`https://newsdata.io/api/1/news?apikey=${apiKey}&country=ar&language=es&size=${size}`, {
      timeout: 30000 // 30 секунд таймаут
    });
    const allData = allResponse.data;
    
    console.log(`📊 Все источники: ${allData.results?.length || 0} статей`);

    // Объединяем и убираем дубликаты
    const allArticles = [...(priorityData.results || []), ...(allData.results || [])];
    const uniqueArticles = allArticles.filter((article, index, self) => 
      index === self.findIndex(a => a.link === article.link)
    );

    console.log(`📊 Всего уникальных статей: ${uniqueArticles.length}`);
    console.log(`📊 Источники: ${[...new Set(uniqueArticles.map(a => a.source_id))].join(', ')}`);
    
    return uniqueArticles;
  } catch (error) {
    console.error('❌ Ошибка получения новостей:', error.message);
    return [];
  }
}

async function processWithMercury(articles) {
  console.log('\n🔍 ЭТАП 2: Обработка через Mercury Parser...');
  
  const processedArticles = [];
  
  for (let i = 0; i < articles.length; i++) {
    const article = articles[i];
    console.log(`📰 Обрабатываем статью ${i + 1}/${articles.length}: ${article.title}`);
    
    try {
      const response = await axios.get(article.link, { timeout: 15000 });
      const html = response.data;
      
      // Простой парсинг заголовка и контента
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      const contentMatch = html.match(/<p[^>]*>([^<]+)<\/p>/gi);
      
      const title = titleMatch ? titleMatch[1] : article.title;
      const content = contentMatch ? contentMatch.slice(0, 5).join(' ').replace(/<[^>]*>/g, '') : article.description;
      
      const processedArticle = {
        ...article,
        mercury_content: content,
        mercury_title: title,
        mercury_word_count: content ? content.split(' ').length : 0
      };
      
      processedArticles.push(processedArticle);
      console.log(`✅ Статья обработана: ${processedArticle.mercury_word_count} слов`);
      
    } catch (error) {
      console.log(`❌ Ошибка обработки статьи: ${error.message}`);
      // Добавляем статью без обработки
      processedArticles.push({
        ...article,
        mercury_content: article.description,
        mercury_title: article.title,
        mercury_word_count: article.description ? article.description.split(' ').length : 0
      });
    }
  }
  
  return processedArticles;
}

async function analyzeWithOpenAI(articles) {
  console.log('\n🤖 ЭТАП 3: Анализ через OpenAI...');
  
  const analyzedArticles = [];
  
  for (let i = 0; i < Math.min(3, articles.length); i++) {
    const article = articles[i];
    console.log(`📝 Анализируем статью ${i + 1}/${Math.min(3, articles.length)}: "${article.title}"`);
    
    try {
      const content = article.mercury_content || article.description || 'Контент недоступен';
      const prompt = getOpenAIPrompt(article.title, content, article.link);
      
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 2000,
        temperature: 0.7
      });
      
      const result = response.choices[0].message.content;
      const analysis = JSON.parse(result);
      
      const analyzedArticle = {
        ...article,
        openai_category: { category: analysis.category },
        openai_score: analysis.score,
        openai_should_post: analysis.should_post,
        openai_post_title: { title: analysis.post_title },
        openai_post_content: { content: analysis.post_content },
        openai_translation: { translation: analysis.translation }
      };
      
      analyzedArticles.push(analyzedArticle);
      console.log(`✅ Статья проанализирована: оценка ${analysis.score}/10, категория: ${analysis.category}`);
      
      // Пауза между запросами
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error) {
      console.log(`❌ Ошибка анализа статьи: ${error.message}`);
      analyzedArticles.push(article);
    }
  }
  
  return analyzedArticles;
}

async function saveToSupabase(articles) {
  console.log('\n💾 ЭТАП 4: Сохранение в базу данных...');
  console.log(`📊 Статей для сохранения: ${articles.length}`);
  
  let savedCount = 0;
  
  for (let i = 0; i < articles.length; i++) {
    const article = articles[i];
    console.log(`💾 Сохраняем статью ${i + 1}/${articles.length}: ${article.title}`);
    try {
      const { error } = await supabase
        .from('articles')
        .upsert({
          article_id: article.article_id,
          title: article.title,
          link: article.link,
          description: article.description,
          content: article.content,
          pub_date: article.pub_date,
          source_id: article.source_id,
          source_name: article.source_name,
          language: article.language,
          mercury_content: article.mercury_content,
          openai_category: article.openai_category,
          openai_score: article.openai_score,
          openai_should_post: article.openai_should_post,
          openai_post_title: article.openai_post_title,
          openai_post_content: article.openai_post_content,
          openai_translation: article.openai_translation
        }, { onConflict: 'article_id' });
      
      if (error) {
        console.log(`❌ Ошибка сохранения статьи: ${error.message}`);
      } else {
        savedCount++;
        console.log(`✅ Статья сохранена: ${article.title}`);
      }
    } catch (error) {
      console.log(`❌ Ошибка сохранения: ${error.message}`);
    }
  }
  
  console.log(`✅ Сохранено ${savedCount} статей`);
  return savedCount;
}

async function publishToTelegram(articles) {
  console.log('\n📤 ЭТАП 5: Публикация в Telegram...');
  
  const telegramBot = new TelegramBot();
  let publishedCount = 0;
  
  for (const article of articles) {
    const shouldPost = typeof article.openai_should_post === 'boolean' ? article.openai_should_post : 
                      (typeof article.openai_should_post === 'object' && article.openai_should_post?.should_post);
    const score = typeof article.openai_score === 'number' ? article.openai_score : 
                 (typeof article.openai_score === 'object' && article.openai_score?.score);
    
    if (shouldPost && score >= 6) {
      try {
        const success = await telegramBot.sendPost(article);
        if (success) {
          publishedCount++;
          console.log(`✅ Опубликована статья: ${article.title}`);
          
          // Обновляем статус в базе
          await supabase
            .from('articles')
            .update({ telegram_published_at: new Date().toISOString() })
            .eq('article_id', article.article_id);
        }
      } catch (error) {
        console.log(`❌ Ошибка публикации: ${error.message}`);
      }
      
      // Пауза между публикациями
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }
  
  console.log(`✅ Опубликовано ${publishedCount} статей в Telegram`);
  return publishedCount;
}

async function runSimpleCycle() {
  console.log('🚀 Запускаем упрощенный полный цикл...\n');
  
  try {
    // Этап 1: Получение новостей
    const articles = await getNewsData(3);
    if (articles.length === 0) {
      console.log('❌ Не удалось получить новости');
      return;
    }
    
    // Этап 2: Обработка через Mercury
    const processedArticles = await processWithMercury(articles);
    
    // Этап 3: Анализ через OpenAI
    const analyzedArticles = await analyzeWithOpenAI(processedArticles);
    
    // Этап 4: Сохранение в базу
    const savedCount = await saveToSupabase(analyzedArticles);
    
    // Этап 5: Публикация в Telegram
    const publishedCount = await publishToTelegram(analyzedArticles);
    
    console.log('\n🎉 ЦИКЛ ЗАВЕРШЕН!');
    console.log(`📊 Получено статей: ${articles.length}`);
    console.log(`💾 Сохранено в базу: ${savedCount}`);
    console.log(`📤 Опубликовано в Telegram: ${publishedCount}`);
    
  } catch (error) {
    console.error('❌ Ошибка в цикле:', error.message);
  }
}

runSimpleCycle().catch(console.error); 