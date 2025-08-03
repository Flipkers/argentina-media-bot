require('dotenv').config();
require('./polyfills');

const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai');
const { getOpenAIPrompt } = require('./openai_prompt');

console.log('🔍 ДЕТАЛЬНАЯ ДИАГНОСТИКА ОБЛАКА');

// Инициализация клиентов
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Переменные Supabase не настроены');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugCloudIssues() {
  console.log('\n📊 АНАЛИЗ ПРОБЛЕМ В ОБЛАКЕ:');
  
  try {
    // Получаем все статьи без OpenAI анализа
    const { data: unprocessedArticles, error } = await supabase
      .from('articles')
      .select('*')
      .is('openai_score', null)
      .limit(10);
    
    if (error) {
      console.log('❌ Ошибка получения статей:', error.message);
      return;
    }
    
    console.log(`📰 Найдено ${unprocessedArticles.length} необработанных статей`);
    
    // Анализируем каждую статью детально
    for (let i = 0; i < Math.min(3, unprocessedArticles.length); i++) {
      const article = unprocessedArticles[i];
      console.log(`\n🔍 СТАТЬЯ ${i + 1}: "${article.title}"`);
      console.log('📄 ID:', article.id);
      console.log('📄 Link:', article.link);
      
      // Проверяем контент
      const content = article.mercury_content || article.description || article.content || 'Контент недоступен';
      console.log('📄 Mercury Content:', article.mercury_content ? `"${article.mercury_content.substring(0, 100)}..."` : 'NULL');
      console.log('📄 Mercury Content длина:', article.mercury_content ? article.mercury_content.length : 0);
      console.log('📄 Description:', article.description ? `"${article.description.substring(0, 100)}..."` : 'NULL');
      console.log('📄 Description длина:', article.description ? article.description.length : 0);
      console.log('📄 Content:', article.content ? `"${article.content.substring(0, 100)}..."` : 'NULL');
      console.log('📄 Content длина:', article.content ? article.content.length : 0);
      console.log('📄 Используемый контент длина:', content.length);
      
      if (content.length < 50) {
        console.log('❌ Недостаточно контента для анализа');
        continue;
      }
      
      // Пробуем проанализировать через OpenAI
      console.log('🤖 Пробуем анализ через OpenAI...');
      try {
        const prompt = getOpenAIPrompt(article.title, content, article.link);
        console.log('📄 Промпт сформирован, длина:', prompt.length);
        
        const response = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 2000,
          temperature: 0.7
        });
        
        const result = response.choices[0].message.content;
        console.log('✅ OpenAI ответ получен');
        console.log('📄 Ответ (первые 200 символов):', result.substring(0, 200));
        
        // Парсим JSON
        try {
          const analysis = JSON.parse(result);
          console.log('✅ JSON успешно распарсен');
          console.log('📊 Результат:', analysis);
          
          // Пробуем обновить базу
          console.log('💾 Пробуем обновить базу...');
          const { error: updateError } = await supabase
            .from('articles')
            .update({
              openai_category: { category: analysis.category },
              openai_score: analysis.score,
              openai_should_post: analysis.should_post,
              openai_post_title: { title: analysis.post_title },
              openai_post_content: { content: analysis.post_content },
              openai_translation: { translation: analysis.translation }
            })
            .eq('id', article.id);
          
          if (updateError) {
            console.log('❌ Ошибка обновления базы:', updateError.message);
          } else {
            console.log('✅ База успешно обновлена');
          }
          
        } catch (parseError) {
          console.log('❌ Ошибка парсинга JSON:', parseError.message);
          console.log('📄 Полный ответ:', result);
        }
        
      } catch (openaiError) {
        console.log('❌ Ошибка OpenAI:', openaiError.message);
        if (openaiError.response) {
          console.log('📊 Статус:', openaiError.response.status);
          console.log('📄 Данные:', openaiError.response.data);
        }
      }
      
      // Пауза между запросами
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
  } catch (error) {
    console.log('❌ Общая ошибка:', error.message);
  }
}

async function checkEnvironment() {
  console.log('\n🔧 ПРОВЕРКА ОКРУЖЕНИЯ:');
  console.log('📊 Node.js версия:', process.version);
  console.log('📊 Платформа:', process.platform);
  console.log('📊 Архитектура:', process.arch);
  console.log('📊 Память:', Math.round(process.memoryUsage().heapUsed / 1024 / 1024), 'MB');
  
  // Проверяем переменные окружения
  console.log('\n📋 ПЕРЕМЕННЫЕ ОКРУЖЕНИЯ:');
  const vars = ['SUPABASE_URL', 'OPENAI_API_KEY', 'TELEGRAM_BOT_TOKEN'];
  vars.forEach(varName => {
    const value = process.env[varName];
    console.log(`${varName}: ${value ? '✅ Найдена' : '❌ Не найдена'}`);
  });
}

async function runDebug() {
  console.log('🚀 Запускаем детальную диагностику облака...\n');
  
  await checkEnvironment();
  await debugCloudIssues();
  
  console.log('\n✅ Диагностика завершена');
}

runDebug().catch(console.error); 