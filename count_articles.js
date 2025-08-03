const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function countArticles() {
  // Подсчитываем общее количество статей
  const { count, error } = await supabase
    .from('articles')
    .select('*', { count: 'exact', head: true });
  
  if (error) {
    console.error('Ошибка при подсчете:', error);
    return;
  }
  
  console.log(`📊 Общее количество статей в базе данных: ${count}`);
  
  // Подсчитываем статьи по датам создания
  const { data, error: dateError } = await supabase
    .from('articles')
    .select('created_at')
    .order('created_at', { ascending: false });
  
  if (dateError) {
    console.error('Ошибка при получении дат:', dateError);
    return;
  }
  
  // Группируем по датам
  const today = new Date().toISOString().split('T')[0];
  const todayArticles = data.filter(article => 
    article.created_at.startsWith(today)
  );
  
  console.log(`📅 Статей за сегодня (${today}): ${todayArticles.length}`);
  
  // Показываем последние 5 статей
  console.log('\n📰 Последние 5 статей:');
  data.slice(0, 5).forEach((article, index) => {
    console.log(`${index + 1}. ${article.created_at}`);
  });
}

countArticles(); 