require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');
const TelegramBot = require('./telegram_bot');

console.log('🧪 ТЕСТИРУЕМ TELEGRAM ПОСТИНГ');

// Инициализация клиентов
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Переменные Supabase не настроены');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testTelegramConnection() {
  console.log('\n📱 ТЕСТ ПОДКЛЮЧЕНИЯ TELEGRAM:');
  
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  const channelId = process.env.TELEGRAM_CHANNEL_ID;
  
  console.log('🔑 TELEGRAM_BOT_TOKEN:', botToken ? '✅ Найден' : '❌ Не найден');
  console.log('💬 TELEGRAM_CHAT_ID:', chatId ? '✅ Найден' : '❌ Не найден');
  console.log('📢 TELEGRAM_CHANNEL_ID:', channelId ? '✅ Найден' : '❌ Не найден');
  
  if (!botToken) {
    console.log('❌ TELEGRAM_BOT_TOKEN не настроен');
    return false;
  }
  
  if (!chatId && !channelId) {
    console.log('❌ TELEGRAM_CHAT_ID или TELEGRAM_CHANNEL_ID не настроены');
    return false;
  }
  
  try {
    const telegramBot = new TelegramBot();
    const isConnected = await telegramBot.testConnection();
    
    if (isConnected) {
      console.log('✅ Подключение к Telegram успешно');
      return true;
    } else {
      console.log('❌ Не удалось подключиться к Telegram');
      return false;
    }
  } catch (error) {
    console.log('❌ Ошибка подключения к Telegram:', error.message);
    return false;
  }
}

async function testTelegramPosting() {
  console.log('\n📤 ТЕСТ ПОСТИНГА В TELEGRAM:');
  
  try {
    // Получаем статьи, готовые для публикации
    console.log('📊 Получаем статьи для публикации...');
    const { data: articles, error } = await supabase
      .from('articles')
      .select('*')
      .eq('openai_should_post', true)
      .gte('openai_score', 6)
      .is('telegram_published_at', null)
      .limit(3);
    
    if (error) {
      console.log('❌ Ошибка получения статей:', error.message);
      return;
    }
    
    console.log(`📰 Найдено ${articles.length} статей для публикации`);
    
    if (articles.length === 0) {
      console.log('✅ Нет статей для публикации');
      return;
    }
    
    // Тестируем публикацию первой статьи
    const article = articles[0];
    console.log(`\n📝 Публикуем статью: "${article.title}"`);
    console.log('📊 Оценка:', article.openai_score);
    console.log('📄 Заголовок поста:', article.openai_post_title);
    
    const telegramBot = new TelegramBot();
    
    // Отправляем пост
    console.log('📤 Отправляем пост в Telegram...');
    const success = await telegramBot.sendPost(article);
    
    if (success) {
      console.log('✅ Пост успешно отправлен в Telegram');
      
      // Обновляем статус в базе
      console.log('💾 Обновляем статус публикации...');
      const { error: updateError } = await supabase
        .from('articles')
        .update({ telegram_published_at: new Date().toISOString() })
        .eq('id', article.id);
      
      if (updateError) {
        console.log('❌ Ошибка обновления статуса:', updateError.message);
      } else {
        console.log('✅ Статус публикации обновлен');
      }
    } else {
      console.log('❌ Не удалось отправить пост в Telegram');
    }
    
  } catch (error) {
    console.log('❌ Ошибка тестирования постинга:', error.message);
  }
}

async function checkPublishingStatus() {
  console.log('\n📊 СТАТУС ПУБЛИКАЦИИ:');
  
  try {
    // Статистика по публикациям
    const { count: totalArticles } = await supabase
      .from('articles')
      .select('*', { count: 'exact', head: true });
    
    const { count: readyToPublish } = await supabase
      .from('articles')
      .select('*', { count: 'exact', head: true })
      .eq('openai_should_post', true)
      .gte('openai_score', 6);
    
    const { count: publishedArticles } = await supabase
      .from('articles')
      .select('*', { count: 'exact', head: true })
      .not('telegram_published_at', 'is', null);
    
    const { count: pendingPublish } = await supabase
      .from('articles')
      .select('*', { count: 'exact', head: true })
      .eq('openai_should_post', true)
      .gte('openai_score', 6)
      .is('telegram_published_at', null);
    
    console.log(`📰 Всего статей: ${totalArticles}`);
    console.log(`⭐ Готово к публикации: ${readyToPublish}`);
    console.log(`📤 Опубликовано: ${publishedArticles}`);
    console.log(`⏳ Ожидает публикации: ${pendingPublish}`);
    
  } catch (error) {
    console.log('❌ Ошибка получения статистики:', error.message);
  }
}

async function runTests() {
  console.log('🚀 Запускаем тесты Telegram постинга...\n');
  
  await checkPublishingStatus();
  
  const isConnected = await testTelegramConnection();
  if (isConnected) {
    await testTelegramPosting();
  }
  
  console.log('\n✅ Тесты завершены');
}

runTests().catch(console.error); 