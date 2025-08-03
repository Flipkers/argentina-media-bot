require('dotenv').config();
require('./polyfills');

const { createClient } = require('@supabase/supabase-js');
const TelegramBot = require('./telegram_bot');

console.log('🧪 ТЕСТ ПУБЛИКАЦИИ');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testPublish() {
  try {
    console.log('🔍 Тестируем подключение к Supabase...');
    
    // Простой запрос
    const { data, error } = await supabase
      .from('articles')
      .select('id, title')
      .limit(1);
    
    if (error) {
      console.log('❌ Ошибка Supabase:', error.message);
      return;
    }
    
    console.log('✅ Supabase работает, статей:', data?.length || 0);
    
    // Тестируем Telegram
    console.log('🔍 Тестируем Telegram...');
    const telegramBot = new TelegramBot();
    const isConnected = await telegramBot.testConnection();
    
    if (!isConnected) {
      console.log('❌ Telegram не работает');
      return;
    }
    
    console.log('✅ Telegram работает');
    
    // Пробуем найти статьи для публикации
    console.log('🔍 Ищем статьи для публикации...');
    const { data: articles, error: articlesError } = await supabase
      .from('articles')
      .select('id, title, openai_should_post, openai_score, telegram_published_at')
      .limit(5);
    
    if (articlesError) {
      console.log('❌ Ошибка получения статей:', articlesError.message);
      return;
    }
    
    console.log('📊 Найдено статей:', articles?.length || 0);
    
    if (articles && articles.length > 0) {
      // Показываем первые 3 статьи
      articles.slice(0, 3).forEach((article, index) => {
        console.log(`${index + 1}. ${article.title}`);
        console.log(`   should_post: ${article.openai_should_post}`);
        console.log(`   score: ${article.openai_score}`);
        console.log(`   published: ${article.telegram_published_at ? 'да' : 'нет'}`);
        console.log('');
      });
    }
    
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  }
}

testPublish().catch(console.error); 