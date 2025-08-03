require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');
const SimpleMercury = require('./simple_mercury');

console.log('🔍 ДИАГНОСТИКА ПАРСИНГА');

// Инициализация клиентов
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Переменные Supabase не настроены');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugParsingIssues() {
  console.log('\n📊 АНАЛИЗ СТАТЕЙ В БАЗЕ:');
  
  try {
    // Получаем статьи с пустым контентом
    const { data: emptyContentArticles, error } = await supabase
      .from('articles')
      .select('*')
      .or('mercury_content.is.null,mercury_content.eq.')
      .limit(5);
    
    if (error) {
      console.log('❌ Ошибка получения статей:', error.message);
      return;
    }
    
    console.log(`📰 Найдено ${emptyContentArticles.length} статей с пустым контентом`);
    
    if (emptyContentArticles.length === 0) {
      console.log('✅ Все статьи имеют контент');
      return;
    }
    
    // Анализируем каждую статью
    for (let i = 0; i < emptyContentArticles.length; i++) {
      const article = emptyContentArticles[i];
      console.log(`\n📝 [${i + 1}/${emptyContentArticles.length}] Анализируем: "${article.title}"`);
      console.log('🔗 Ссылка:', article.link);
      console.log('📄 Mercury контент:', article.mercury_content ? `"${article.mercury_content.substring(0, 100)}..."` : 'NULL');
      console.log('📄 Длина mercury контента:', article.mercury_content ? article.mercury_content.length : 0);
      
      // Пробуем перепарсить статью
      console.log('🔄 Пробуем перепарсить...');
      try {
        const parsed = await SimpleMercury.parse(article.link);
        console.log('✅ Парсинг успешен!');
        console.log('📝 Новый заголовок:', parsed.title);
        console.log('📄 Новый контент:', parsed.content ? `"${parsed.content.substring(0, 100)}..."` : 'NULL');
        console.log('📄 Длина нового контента:', parsed.content ? parsed.content.length : 0);
        
                  // Обновляем статью в базе (только существующие поля)
          if (parsed.content && parsed.content.length > 50) {
            console.log('💾 Обновляем статью в базе...');
            const updateData = {
              mercury_content: parsed.content,
              title: parsed.title
            };
            
            console.log('📦 Данные для обновления:', updateData);
            
            const { error: updateError } = await supabase
              .from('articles')
              .update(updateData)
              .eq('id', article.id);
          
          if (updateError) {
            console.log('❌ Ошибка обновления:', updateError.message);
          } else {
            console.log('✅ Статья обновлена');
          }
        } else {
          console.log('⚠️ Новый контент тоже слишком короткий');
        }
        
      } catch (parseError) {
        console.log('❌ Ошибка парсинга:', parseError.message);
      }
      
      // Пауза между запросами
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
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
    
    const { count: articlesWithContent } = await supabase
      .from('articles')
      .select('*', { count: 'exact', head: true })
      .not('mercury_content', 'is', null)
      .not('mercury_content', 'eq', '');
    
    const { count: articlesWithLongContent } = await supabase
      .from('articles')
      .select('*', { count: 'exact', head: true })
      .not('mercury_content', 'is', null)
      .not('mercury_content', 'eq', '')
      .gte('mercury_content.length', 100);
    
    console.log(`📰 Всего статей: ${totalArticles}`);
    console.log(`📄 С контентом: ${articlesWithContent}`);
    console.log(`📄 С длинным контентом (100+ символов): ${articlesWithLongContent}`);
    console.log(`📈 Процент с контентом: ${Math.round((articlesWithContent / totalArticles) * 100)}%`);
    console.log(`📈 Процент с длинным контентом: ${Math.round((articlesWithLongContent / totalArticles) * 100)}%`);
    
  } catch (error) {
    console.log('❌ Ошибка получения статистики:', error.message);
  }
}

async function testSpecificSites() {
  console.log('\n🧪 ТЕСТИРУЕМ КОНКРЕТНЫЕ САЙТЫ:');
  
  const testUrls = [
    'https://www.infobae.com/cultura/2025/08/02/una-propagandista-declarada-nuevo-documental-sobre-leni-riefenstahl-examina-su-rol-durante-el-nazismo/',
    'https://www.clarin.com/politica/2025/08/02/los-gobernadores-pasan-a-la-accion-y-quieren-diputados-y-senadores-propios/',
    'https://www.lanacion.com.ar/politica/2025/08/02/el-desopilante-exabrupto-de-luck-ra-que-descoloco-al-jurado-de-la-voz-argentina-a-ver-como-traducen-eso/'
  ];
  
  for (let i = 0; i < testUrls.length; i++) {
    const url = testUrls[i];
    console.log(`\n🔍 [${i + 1}/${testUrls.length}] Тестируем: ${url}`);
    
    try {
      const parsed = await SimpleMercury.parse(url);
      console.log('✅ Парсинг успешен!');
      console.log('📝 Заголовок:', parsed.title);
      console.log('📄 Контент:', parsed.content ? `"${parsed.content.substring(0, 200)}..."` : 'NULL');
      console.log('📄 Длина контента:', parsed.content ? parsed.content.length : 0);
      
    } catch (error) {
      console.log('❌ Ошибка парсинга:', error.message);
    }
    
    // Пауза между запросами
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
}

async function runDebug() {
  console.log('🚀 Запускаем диагностику парсинга...\n');
  
  await checkContentStatistics();
  await testSpecificSites();
  await debugParsingIssues();
  
  console.log('\n✅ Диагностика завершена');
}

runDebug().catch(console.error); 