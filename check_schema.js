require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

console.log('🔍 ПРОВЕРЯЕМ СХЕМУ ТАБЛИЦЫ ARTICLES');

// Инициализация клиентов
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Переменные Supabase не настроены');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  console.log('\n📊 ПРОВЕРЯЕМ СХЕМУ:');
  
  try {
    // Получаем одну статью, чтобы увидеть все поля
    const { data: article, error } = await supabase
      .from('articles')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('❌ Ошибка получения статьи:', error.message);
      return;
    }
    
    if (article && article.length > 0) {
      const sampleArticle = article[0];
      console.log('📋 ДОСТУПНЫЕ КОЛОНКИ В ТАБЛИЦЕ ARTICLES:');
      
      Object.keys(sampleArticle).forEach(key => {
        const value = sampleArticle[key];
        const type = typeof value;
        const length = value ? value.length : 0;
        console.log(`  - ${key}: ${type} (${length} символов)`);
      });
      
      console.log('\n📄 ПРИМЕР СТАТЬИ:');
      console.log('ID:', sampleArticle.id);
      console.log('Title:', sampleArticle.title);
      console.log('Link:', sampleArticle.link);
      console.log('Content:', sampleArticle.content ? 'Есть' : 'Нет');
      console.log('Mercury Content:', sampleArticle.mercury_content ? 'Есть' : 'Нет');
      console.log('OpenAI Score:', sampleArticle.openai_score);
      console.log('OpenAI Category:', sampleArticle.openai_category);
      
    } else {
      console.log('❌ Нет статей в таблице');
    }
    
  } catch (error) {
    console.log('❌ Общая ошибка:', error.message);
  }
}

async function testUpdate() {
  console.log('\n🧪 ТЕСТИРУЕМ ОБНОВЛЕНИЕ:');
  
  try {
    // Получаем первую статью
    const { data: articles, error } = await supabase
      .from('articles')
      .select('*')
      .limit(1);
    
    if (error || !articles || articles.length === 0) {
      console.log('❌ Нет статей для тестирования');
      return;
    }
    
    const article = articles[0];
    console.log(`📝 Тестируем обновление статьи ID: ${article.id}`);
    
    // Пробуем обновить только существующие поля
    const updateData = {
      openai_category: 'тест',
      openai_score: 5,
      openai_should_post: true,
      openai_post_title: 'Тестовый заголовок',
      openai_post_content: 'Тестовый контент',
      openai_translation: 'Тестовый перевод'
    };
    
    console.log('📦 Данные для обновления:', updateData);
    
    const { error: updateError } = await supabase
      .from('articles')
      .update(updateData)
      .eq('id', article.id);
    
    if (updateError) {
      console.log('❌ Ошибка обновления:', updateError.message);
    } else {
      console.log('✅ Обновление успешно');
    }
    
  } catch (error) {
    console.log('❌ Ошибка тестирования:', error.message);
  }
}

async function runCheck() {
  console.log('🚀 Запускаем проверку схемы...\n');
  
  await checkSchema();
  await testUpdate();
  
  console.log('\n✅ Проверка завершена');
}

runCheck().catch(console.error); 