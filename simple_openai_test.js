require('dotenv').config();

const OpenAI = require('openai');

console.log('🧪 ПРОСТОЙ ТЕСТ OPENAI');

async function testOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    console.log('❌ OPENAI_API_KEY не найден');
    return;
  }
  
  console.log('🔑 API Key найден:', apiKey.substring(0, 10) + '...');
  
  try {
    const openai = new OpenAI({ apiKey });
    
    console.log('📡 Отправляем простой запрос к OpenAI...');
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: 'Ответь одним словом: работает?' }],
      max_tokens: 5
    });
    
    const answer = response.choices[0].message.content;
    console.log('✅ OpenAI работает! Ответ:', answer);
    
    // Тестируем более сложный запрос
    console.log('\n📡 Тестируем анализ статьи...');
    
    const testPrompt = `Проанализируй эту статью и верни JSON:
{
  "category": "важная/неинтересная",
  "score": 1-10,
  "should_post": true/false,
  "post_title": "заголовок поста",
  "post_content": "краткое содержание",
  "translation": "перевод заголовка на русский"
}

Статья: "Test article about technology"
Содержание: "This is a test article about new technology developments."
Ссылка: "https://example.com"`;

    const analysisResponse = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: testPrompt }],
      max_tokens: 500
    });
    
    const analysisResult = analysisResponse.choices[0].message.content;
    console.log('✅ Анализ работает!');
    console.log('📄 Результат:', analysisResult.substring(0, 200));
    
    // Пробуем распарсить JSON
    try {
      const parsed = JSON.parse(analysisResult);
      console.log('✅ JSON парсинг работает!');
      console.log('📊 Категория:', parsed.category);
      console.log('📊 Оценка:', parsed.score);
    } catch (e) {
      console.log('❌ JSON парсинг не работает:', e.message);
    }
    
  } catch (error) {
    console.log('❌ Ошибка OpenAI:', error.message);
    if (error.response) {
      console.log('📊 Статус:', error.response.status);
      console.log('📄 Данные:', error.response.data);
    }
  }
}

testOpenAI().catch(console.error); 