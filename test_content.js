require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

console.log('🧪 ТЕСТ КОНТЕНТА В БАЗЕ');

// Инициализация клиентов
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Переменные Supabase не настроены');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testContent() {
  console.log('\n📊 ПРОВЕРЯЕМ КОНТЕНТ В БАЗЕ:');
  
  try {
    // Получаем несколько статей для проверки
    const { data: articles, error } = await supabase
      .from('articles')
      .select('*')
      .limit(5);
    
    if (error) {
      console.log('❌ Ошибка получения статей:', error.message);
      return;
    }
    
    console.log(`📰 Получено ${articles.length} статей для проверки`);
    
    for (let i = 0; i < articles.length; i++) {
      const article = articles[i];
      console.log(`\n📝 [${i + 1}/${articles.length}] Статья: "${article.title}"`);
      console.log('🔗 Ссылка:', article.link);
      console.log('📄 content поле:', article.content ? `"${article.content.substring(0, 50)}..."` : 'NULL');
      console.log('📄 mercury_content поле:', article.mercury_content ? `"${article.mercury_content.substring(0, 50)}..."` : 'NULL');
      console.log('📄 Длина content:', article.content ? article.content.length : 0);
      console.log('📄 Длина mercury_content:', article.mercury_content ? article.mercury_content.length : 0);
      console.log('🤖 OpenAI score:', article.openai_score);
    }
    
    // Проверяем статьи без OpenAI анализа
    console.log('\n📊 СТАТЬИ БЕЗ OPENAI АНАЛИЗА:');
    const { data: unanalyzedArticles, error: unanalyzedError } = await supabase
      .from('articles')
      .select('*')
      .is('openai_score', null)
      .limit(3);
    
    if (unanalyzedError) {
      console.log('❌ Ошибка получения неанализированных статей:', unanalyzedError.message);
      return;
    }
    
    console.log(`📰 Найдено ${unanalyzedArticles.length} статей без анализа`);
    
    for (let i = 0; i < unanalyzedArticles.length; i++) {
      const article = unanalyzedArticles[i];
      console.log(`\n📝 [${i + 1}/${unanalyzedArticles.length}] Неанализированная: "${article.title}"`);
      console.log('📄 mercury_content:', article.mercury_content ? `"${article.mercury_content.substring(0, 100)}..."` : 'NULL');
      console.log('📄 Длина mercury_content:', article.mercury_content ? article.mercury_content.length : 0);
      
      if (article.mercury_content && article.mercury_content.length > 50) {
        console.log('✅ Есть контент для анализа!');
      } else {
        console.log('❌ Недостаточно контента для анализа');
      }
    }
    
  } catch (error) {
    console.log('❌ Общая ошибка:', error.message);
  }
}

testContent().catch(console.error); 