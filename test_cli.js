require('dotenv').config();
require('./polyfills');

const SimpleMercury = require('./simple_mercury');
const axios = require('axios');

console.log('🧪 ТЕСТОВАЯ ВЕРСИЯ CLI');
console.log('Node.js версия:', process.version);

async function testNewsAPI() {
  try {
    console.log('\n📡 Тестируем News API...');
    
    const apiKey = process.env.NEWSDATA_API_KEY;
    if (!apiKey) {
      console.log('❌ NEWSDATA_API_KEY не найден');
      return;
    }
    
    const url = `https://newsdata.io/api/1/news?apikey=${apiKey}&country=ar&language=es&size=2`;
    const response = await axios.get(url);
    
    console.log('✅ News API работает');
    console.log('📊 Получено статей:', response.data.results?.length || 0);
    
    if (response.data.results && response.data.results.length > 0) {
      const article = response.data.results[0];
      console.log('📰 Первая статья:', article.title);
      
      // Тестируем парсинг
      console.log('\n🔍 Тестируем парсинг...');
      const parsed = await SimpleMercury.parse(article.link);
      console.log('✅ Парсинг работает');
      console.log('📝 Заголовок:', parsed.title);
      console.log('📄 Контент (первые 100 символов):', parsed.content.substring(0, 100));
    }
    
  } catch (error) {
    console.log('❌ Ошибка тестирования:', error.message);
  }
}

async function testSupabase() {
  try {
    console.log('\n💾 Тестируем Supabase...');
    
    const { createClient } = require('@supabase/supabase-js');
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.log('❌ Переменные Supabase не найдены');
      return;
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data, error } = await supabase.from('articles').select('count').limit(1);
    
    if (error) {
      console.log('❌ Ошибка Supabase:', error.message);
    } else {
      console.log('✅ Supabase работает');
    }
    
  } catch (error) {
    console.log('❌ Ошибка тестирования Supabase:', error.message);
  }
}

async function testOpenAI() {
  try {
    console.log('\n🤖 Тестируем OpenAI...');
    
    const OpenAI = require('openai');
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      console.log('❌ OPENAI_API_KEY не найден');
      return;
    }
    
    const openai = new OpenAI({ apiKey });
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: 'Привет! Это тест.' }],
      max_tokens: 10
    });
    
    console.log('✅ OpenAI работает');
    console.log('🤖 Ответ:', response.choices[0].message.content);
    
  } catch (error) {
    console.log('❌ Ошибка тестирования OpenAI:', error.message);
  }
}

async function runAllTests() {
  console.log('🚀 Запускаем все тесты...\n');
  
  await testNewsAPI();
  await testSupabase();
  await testOpenAI();
  
  console.log('\n✅ Все тесты завершены');
}

runAllTests().catch(console.error); 