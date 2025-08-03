const axios = require('axios');
require('dotenv').config();

const apiKey = process.env.NEWSDATA_API_KEY;

async function testNewsDataParams() {
  console.log('🔍 Тестируем различные параметры newsdata.io API\n');
  
  const baseUrl = 'https://newsdata.io/api/1/latest';
  
  // Тест 1: Базовый запрос
  console.log('📊 Тест 1: Базовый запрос (latest)');
  try {
    const response1 = await axios.get(baseUrl, {
      params: {
        apikey: apiKey,
        country: 'ar',
        size: 3
      }
    });
    console.log(`✅ Получено ${response1.data.results?.length || 0} статей`);
    console.log(`📅 Первая статья: ${response1.data.results?.[0]?.pubDate}`);
    console.log(`🆔 ID первой статьи: ${response1.data.results?.[0]?.article_id}`);
    console.log(`📄 nextPage: ${response1.data.nextPage || 'нет'}\n`);
  } catch (error) {
    console.error('❌ Ошибка:', error.response?.data || error.message);
  }
  
  // Тест 2: С параметром page
  console.log('📊 Тест 2: С параметром page');
  try {
    const response2 = await axios.get(baseUrl, {
      params: {
        apikey: apiKey,
        country: 'ar',
        size: 3,
        page: '1754045948462779121'
      }
    });
    console.log(`✅ Получено ${response2.data.results?.length || 0} статей`);
    console.log(`📅 Первая статья: ${response2.data.results?.[0]?.pubDate}`);
    console.log(`🆔 ID первой статьи: ${response2.data.results?.[0]?.article_id}`);
    console.log(`📄 nextPage: ${response2.data.nextPage || 'нет'}\n`);
  } catch (error) {
    console.error('❌ Ошибка:', error.response?.data || error.message);
  }
  
  // Тест 3: С параметром from_date (сегодня)
  console.log('📊 Тест 3: С параметром from_date (сегодня)');
  try {
    const today = new Date().toISOString().split('T')[0];
    const response3 = await axios.get(baseUrl, {
      params: {
        apikey: apiKey,
        country: 'ar',
        size: 3,
        from_date: today
      }
    });
    console.log(`✅ Получено ${response3.data.results?.length || 0} статей`);
    console.log(`📅 Первая статья: ${response3.data.results?.[0]?.pubDate}`);
    console.log(`🆔 ID первой статьи: ${response3.data.results?.[0]?.article_id}\n`);
  } catch (error) {
    console.error('❌ Ошибка:', error.response?.data || error.message);
  }
  
  // Тест 4: С параметром to_date (вчера)
  console.log('📊 Тест 4: С параметром to_date (вчера)');
  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    const response4 = await axios.get(baseUrl, {
      params: {
        apikey: apiKey,
        country: 'ar',
        size: 3,
        to_date: yesterdayStr
      }
    });
    console.log(`✅ Получено ${response4.data.results?.length || 0} статей`);
    console.log(`📅 Первая статья: ${response4.data.results?.[0]?.pubDate}`);
    console.log(`🆔 ID первой статьи: ${response4.data.results?.[0]?.article_id}\n`);
  } catch (error) {
    console.error('❌ Ошибка:', error.response?.data || error.message);
  }
  
  // Тест 5: С параметром q (поиск)
  console.log('📊 Тест 5: С параметром q (поиск)');
  try {
    const response5 = await axios.get(baseUrl, {
      params: {
        apikey: apiKey,
        country: 'ar',
        size: 3,
        q: 'Milei'
      }
    });
    console.log(`✅ Получено ${response5.data.results?.length || 0} статей`);
    console.log(`📅 Первая статья: ${response5.data.results?.[0]?.pubDate}`);
    console.log(`🆔 ID первой статьи: ${response5.data.results?.[0]?.article_id}\n`);
  } catch (error) {
    console.error('❌ Ошибка:', error.response?.data || error.message);
  }
}

testNewsDataParams(); 