require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai');
const { getOpenAIPrompt } = require('./openai_prompt');

console.log('🔧 ИСПРАВЛЯЕМ OPENAI АНАЛИЗ');

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

async function analyzeUnprocessedArticles() {
  console.log('\n🤖 АНАЛИЗИРУЕМ НЕОБРАБОТАННЫЕ СТАТЬИ:');
  
  try {
    // Получаем статьи без OpenAI анализа
    console.log('📊 Получаем статьи без OpenAI анализа...');
    const { data: articles, error } = await supabase
      .from('articles')
      .select('*')
      .is('openai_score', null)
      .not('mercury_content', 'is', null)
      .not('mercury_content', 'eq', '')
      .limit(10);
    
    if (error) {
      console.log('❌ Ошибка получения статей:', error.message);
      return;
    }
    
    console.log(`📰 Найдено ${articles.length} статей для анализа`);
    
    if (articles.length === 0) {
      console.log('✅ Все статьи уже проанализированы');
      return;
    }
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < articles.length; i++) {
      const article = articles[i];
      console.log(`\n📝 [${i + 1}/${articles.length}] Анализируем: "${article.title}"`);
      
      try {
        // Проверяем контент
        console.log('📄 Текущий контент:', article.mercury_content ? `"${article.mercury_content.substring(0, 100)}..."` : 'NULL');
        console.log('📄 Длина контента:', article.mercury_content ? article.mercury_content.length : 0);
        
        if (!article.mercury_content || article.mercury_content.trim().length < 50) {
          console.log('⚠️ Недостаточно контента, пропускаем');
          continue;
        }
        
        // Формируем промпт
        const prompt = getOpenAIPrompt(article.title, article.mercury_content, article.link);
        
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
        
        // Парсим JSON ответ
        try {
          const analysis = JSON.parse(result);
          console.log('✅ JSON успешно распарсен');
          console.log('📊 Результат: категория =', analysis.category, ', оценка =', analysis.score);
          
          // Обновляем статью в базе (только существующие поля)
          const updateData = {
            openai_category: analysis.category,
            openai_score: analysis.score,
            openai_should_post: analysis.should_post,
            openai_post_title: analysis.post_title,
            openai_post_content: analysis.post_content,
            openai_translation: analysis.translation
          };
          
          console.log('📦 Данные для обновления:', updateData);
          
          const { error: updateError } = await supabase
            .from('articles')
            .update(updateData)
            .eq('id', article.id);
          
          if (updateError) {
            console.log('❌ Ошибка обновления статьи:', updateError.message);
            errorCount++;
          } else {
            console.log('✅ Статья успешно обновлена');
            successCount++;
          }
          
        } catch (parseError) {
          console.log('❌ Ошибка парсинга JSON:', parseError.message);
          console.log('📄 Ответ OpenAI:', result.substring(0, 200));
          errorCount++;
        }
        
        // Пауза между запросами
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        console.log('❌ Ошибка анализа статьи:', error.message);
        errorCount++;
      }
    }
    
    console.log(`\n📊 РЕЗУЛЬТАТЫ АНАЛИЗА:`);
    console.log(`✅ Успешно обработано: ${successCount}`);
    console.log(`❌ Ошибок: ${errorCount}`);
    
  } catch (error) {
    console.log('❌ Общая ошибка:', error.message);
  }
}

async function checkDatabaseStatus() {
  console.log('\n📊 СТАТУС БАЗЫ ДАННЫХ:');
  
  try {
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
    
    const { count: readyToPublish } = await supabase
      .from('articles')
      .select('*', { count: 'exact', head: true })
      .eq('openai_should_post', true)
      .gte('openai_score', 6);
    
    console.log(`📰 Всего статей: ${totalArticles}`);
    console.log(`🤖 Проанализировано OpenAI: ${analyzedArticles}`);
    console.log(`⭐ Интересных статей (оценка 6+): ${interestingArticles}`);
    console.log(`📤 Готово к публикации: ${readyToPublish}`);
    console.log(`📈 Процент проанализированных: ${Math.round((analyzedArticles / totalArticles) * 100)}%`);
    
  } catch (error) {
    console.log('❌ Ошибка получения статистики:', error.message);
  }
}

async function runFix() {
  console.log('🚀 Запускаем исправление OpenAI анализа...\n');
  
  await checkDatabaseStatus();
  await analyzeUnprocessedArticles();
  await checkDatabaseStatus();
  
  console.log('\n✅ Исправление завершено');
}

runFix().catch(console.error); 