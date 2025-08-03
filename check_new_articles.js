const axios = require('axios');
require('dotenv').config();

const apiKey = process.env.NEWSDATA_API_KEY;

async function checkNewArticles() {
  console.log('🔍 Проверяем действительно новые статьи\n');
  
  const baseUrl = 'https://newsdata.io/api/1/latest';
  
  // Получаем статьи за последние несколько часов
  console.log('📊 Получаем статьи за последние часы...');
  try {
    const response = await axios.get(baseUrl, {
      params: {
        apikey: apiKey,
        country: 'ar',
        size: 10
      }
    });
    
    const articles = response.data.results || [];
    console.log(`✅ Получено ${articles.length} статей\n`);
    
    // Группируем по времени
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000);
    const sixHoursAgo = new Date(now.getTime() - 6 * 60 * 60 * 1000);
    
    const lastHour = [];
    const last3Hours = [];
    const last6Hours = [];
    const older = [];
    
    articles.forEach(article => {
      const pubDate = new Date(article.pubDate);
      if (pubDate > oneHourAgo) {
        lastHour.push(article);
      } else if (pubDate > threeHoursAgo) {
        last3Hours.push(article);
      } else if (pubDate > sixHoursAgo) {
        last6Hours.push(article);
      } else {
        older.push(article);
      }
    });
    
    console.log('📅 Распределение статей по времени:');
    console.log(`🕐 Последний час: ${lastHour.length} статей`);
    console.log(`🕐 Последние 3 часа: ${last3Hours.length} статей`);
    console.log(`🕐 Последние 6 часов: ${last6Hours.length} статей`);
    console.log(`🕐 Старше 6 часов: ${older.length} статей\n`);
    
    if (lastHour.length > 0) {
      console.log('🆕 Статьи за последний час:');
      lastHour.forEach((article, index) => {
        console.log(`${index + 1}. ${article.title}`);
        console.log(`   📅 ${article.pubDate}`);
        console.log(`   🆔 ${article.article_id}`);
        console.log(`   📰 ${article.source_name}\n`);
      });
    }
    
    if (last3Hours.length > 0 && lastHour.length === 0) {
      console.log('🆕 Статьи за последние 3 часа:');
      last3Hours.slice(0, 3).forEach((article, index) => {
        console.log(`${index + 1}. ${article.title}`);
        console.log(`   📅 ${article.pubDate}`);
        console.log(`   🆔 ${article.article_id}`);
        console.log(`   📰 ${article.source_name}\n`);
      });
    }
    
    console.log('💡 Вывод:');
    if (lastHour.length > 0) {
      console.log('✅ Есть новые статьи за последний час!');
    } else if (last3Hours.length > 0) {
      console.log('⚠️ Новых статей за час нет, но есть за последние 3 часа');
    } else {
      console.log('❌ Новых статей нет уже несколько часов');
      console.log('📝 Это нормально - источники не публикуют постоянно');
    }
    
  } catch (error) {
    console.error('❌ Ошибка:', error.response?.data || error.message);
  }
}

checkNewArticles(); 