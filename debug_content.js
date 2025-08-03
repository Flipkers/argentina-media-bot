require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

console.log('🔍 ДИАГНОСТИКА КОНТЕНТА СТАТЕЙ');

// Инициализация клиентов
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Переменные Supabase не настроены');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugContent() {
  console.log('\n📊 ПРОВЕРЯЕМ КОНТЕНТ СТАТЕЙ:');
  
  try {
    // Получаем статьи без OpenAI анализа
    const { data: articles, error } = await supabase
      .from('articles')
      .select('*')
      .is('openai_score', null)
      .limit(5);
    
    if (error) {
      console.log('❌ Ошибка получения статей:', error.message);
      return;
    }
    
    console.log(`📰 Найдено ${articles.length} статей без анализа`);
    
    articles.forEach((article, index) => {
      console.log(`\n📝 Статья ${index + 1}: "${article.title}"`);
      console.log('📄 Content:', article.content ? `"${article.content.substring(0, 100)}..."` : 'NULL');
      console.log('📄 Content длина:', article.content ? article.content.length : 0);
      console.log('📄 Mercury Content:', article.mercury_content ? `"${article.mercury_content.substring(0, 100)}..."` : 'NULL');
      console.log('📄 Mercury Content длина:', article.mercury_content ? article.mercury_content.length : 0);
      console.log('📄 Description:', article.description ? `"${article.description.substring(0, 100)}..."` : 'NULL');
      console.log('📄 Description длина:', article.description ? article.description.length : 0);
      
      // Проверяем, какой контент будет использоваться
      const content = article.mercury_content || article.description || 'Контент недоступен';
      console.log('📄 Используемый контент:', content.length > 50 ? '✅ Достаточно' : '❌ Недостаточно');
      console.log('📄 Длина используемого контента:', content.length);
    });
    
  } catch (error) {
    console.log('❌ Общая ошибка:', error.message);
  }
}

async function checkContentStatistics() {
  console.log('\n📊 СТАТИСТИКА КОНТЕНТА:');
  
  try {
    const { count: totalArticles } = await supabase
      .from('articles')
      .select('*', { count: 'exact', head: true });
    
    const { count: withContent } = await supabase
      .from('articles')
      .select('*', { count: 'exact', head: true })
      .not('content', 'is', null)
      .not('content', 'eq', '');
    
    const { count: withMercuryContent } = await supabase
      .from('articles')
      .select('*', { count: 'exact', head: true })
      .not('mercury_content', 'is', null)
      .not('mercury_content', 'eq', '');
    
    const { count: withLongMercuryContent } = await supabase
      .from('articles')
      .select('*', { count: 'exact', head: true })
      .not('mercury_content', 'is', null)
      .not('mercury_content', 'eq', '')
      .gte('mercury_content.length', 100);
    
    const { count: withoutOpenAI } = await supabase
      .from('articles')
      .select('*', { count: 'exact', head: true })
      .is('openai_score', null);
    
    const { count: withoutOpenAIButWithContent } = await supabase
      .from('articles')
      .select('*', { count: 'exact', head: true })
      .is('openai_score', null)
      .not('mercury_content', 'is', null)
      .not('mercury_content', 'eq', '')
      .gte('mercury_content.length', 50);
    
    console.log(`📰 Всего статей: ${totalArticles}`);
    console.log(`📄 С контентом: ${withContent}`);
    console.log(`📄 С mercury контентом: ${withMercuryContent}`);
    console.log(`📄 С длинным mercury контентом (100+): ${withLongMercuryContent}`);
    console.log(`🤖 Без OpenAI анализа: ${withoutOpenAI}`);
    console.log(`🤖 Без OpenAI, но с контентом (50+): ${withoutOpenAIButWithContent}`);
    
  } catch (error) {
    console.log('❌ Ошибка получения статистики:', error.message);
  }
}

async function runDebug() {
  console.log('🚀 Запускаем диагностику контента...\n');
  
  await checkContentStatistics();
  await debugContent();
  
  console.log('\n✅ Диагностика завершена');
}

runDebug().catch(console.error); 