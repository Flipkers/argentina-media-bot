require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai');
const { getOpenAIPrompt } = require('./openai_prompt');

console.log('🧪 ТЕСТИРУЕМ OPENAI АНАЛИЗ');

// Инициализация клиентов
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const openaiApiKey = process.env.OPENAI_API_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Переменные Supabase не настроены');
  process.exit(1);
}

if (!openaiApiKey) {
  console.error('❌ OPENAI_API_KEY не настроен');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const openai = new OpenAI({ apiKey: openaiApiKey });

async function testOpenAIAnalysis() {
  console.log('\n🤖 ТЕСТ OPENAI АНАЛИЗА:');
  
  try {
    // Получаем статьи без OpenAI анализа
    console.log('📊 Получаем статьи без OpenAI анализа...');
    const { data: articles, error } = await supabase
      .from('articles')
      .select('*')
      .is('openai_score', null)
      .limit(3);
    
    if (error) {
      console.log('❌ Ошибка получения статей:', error.message);
      return;
    }
    
    console.log(`📰 Найдено ${articles.length} статей без анализа`);
    
    if (articles.length === 0) {
      console.log('✅ Все статьи уже проанализированы');
      return;
    }
    
    // Тестируем анализ первой статьи
    const article = articles[0];
    console.log(`\n📝 Анализируем статью: "${article.title}"`);
    
    // Проверяем, есть ли контент для анализа
    if (!article.content || article.content.trim().length < 50) {
      console.log('⚠️ Статья не имеет достаточного контента для анализа');
      return;
    }
    
    // Формируем промпт
    const prompt = getOpenAIPrompt(article.title, article.content, article.link);
    console.log('📄 Промпт сформирован, длина:', prompt.length, 'символов');
    
    // Отправляем запрос к OpenAI
    console.log('📡 Отправляем запрос к OpenAI...');
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 2000,
      temperature: 0.7
    });
    
    const result = response.choices[0].message.content;
    console.log('✅ OpenAI ответ получен');
    console.log('📄 Ответ (первые 200 символов):', result.substring(0, 200));
    
    // Парсим JSON ответ
    try {
      const analysis = JSON.parse(result);
      console.log('✅ JSON успешно распарсен');
      console.log('📊 Результат анализа:');
      console.log('  - Категория:', analysis.category);
      console.log('  - Оценка:', analysis.score);
      console.log('  - Публиковать:', analysis.should_post);
      console.log('  - Заголовок поста:', analysis.post_title?.substring(0, 50));
      
      // Обновляем статью в базе
      console.log('\n💾 Обновляем статью в базе данных...');
      const { error: updateError } = await supabase
        .from('articles')
        .update({
          openai_category: analysis.category,
          openai_score: analysis.score,
          openai_should_post: analysis.should_post,
          openai_post_title: analysis.post_title,
          openai_post_content: analysis.post_content,
          openai_translation: analysis.translation,
          openai_analyzed_at: new Date().toISOString()
        })
        .eq('id', article.id);
      
      if (updateError) {
        console.log('❌ Ошибка обновления статьи:', updateError.message);
      } else {
        console.log('✅ Статья успешно обновлена в базе');
      }
      
    } catch (parseError) {
      console.log('❌ Ошибка парсинга JSON:', parseError.message);
      console.log('📄 Полный ответ OpenAI:', result);
    }
    
  } catch (error) {
    console.log('❌ Ошибка тестирования OpenAI анализа:', error.message);
    if (error.response) {
      console.log('📊 Статус:', error.response.status);
      console.log('📄 Данные:', error.response.data);
    }
  }
}

async function checkDatabaseStatus() {
  console.log('\n📊 СТАТУС БАЗЫ ДАННЫХ:');
  
  try {
    // Общая статистика
    const { count: totalArticles } = await supabase
      .from('articles')
      .select('*', { count: 'exact', head: true });
    
    const { count: analyzedArticles } = await supabase
      .from('articles')
      .select('*', { count: 'exact', head: true })
      .not('openai_score', 'is', null);
    
    const { count: interestingArticles } = await supabase
      .from('articles')
      .select('*', { count: 'exact', head: true })
      .gte('openai_score', 6);
    
    console.log(`📰 Всего статей: ${totalArticles}`);
    console.log(`🤖 Проанализировано OpenAI: ${analyzedArticles}`);
    console.log(`⭐ Интересных статей (оценка 6+): ${interestingArticles}`);
    console.log(`📈 Процент проанализированных: ${Math.round((analyzedArticles / totalArticles) * 100)}%`);
    
  } catch (error) {
    console.log('❌ Ошибка получения статистики:', error.message);
  }
}

async function runTests() {
  console.log('🚀 Запускаем тесты OpenAI анализа...\n');
  
  await checkDatabaseStatus();
  await testOpenAIAnalysis();
  
  console.log('\n✅ Тесты завершены');
}

runTests().catch(console.error); 