const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function checkArticles() {
  const { data, error } = await supabase
    .from('articles')
    .select('article_id, title, created_at, openai_processed_at')
    .order('created_at', { ascending: false })
    .limit(15);
  
  if (error) {
    console.error('Ошибка:', error);
    return;
  }
  
  console.log('📊 Последние статьи в базе данных:');
  data.forEach((article, index) => {
    const processed = article.openai_processed_at ? '✅' : '❌';
    console.log(`${index + 1}. ${processed} ${article.title}`);
    console.log(`   ID: ${article.article_id}`);
    console.log(`   Создана: ${article.created_at}`);
    console.log(`   OpenAI: ${article.openai_processed_at || 'не обработана'}`);
    console.log('');
  });
  
  console.log(`📈 Всего статей: ${data.length}`);
}

checkArticles(); 