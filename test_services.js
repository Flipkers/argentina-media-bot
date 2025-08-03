require('dotenv').config();

const OpenAI = require('openai');
const TelegramBot = require('./telegram_bot');

console.log('🧪 ТЕСТИРУЕМ СЕРВИСЫ');

async function testOpenAI() {
  console.log('\n🤖 ТЕСТ OPENAI:');
  
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.log('❌ OPENAI_API_KEY не найден');
    return false;
  }
  
  try {
    const openai = new OpenAI({ apiKey });
    
    console.log('📡 Отправляем запрос к OpenAI...');
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: 'Ответь одним словом: работает?' }],
      max_tokens: 5
    });
    
    const answer = response.choices[0].message.content;
    console.log('✅ OpenAI работает! Ответ:', answer);
    return true;
    
  } catch (error) {
    console.log('❌ Ошибка OpenAI:', error.message);
    if (error.response) {
      console.log('📊 Статус:', error.response.status);
      console.log('📄 Данные:', error.response.data);
    }
    return false;
  }
}

async function testTelegram() {
  console.log('\n📱 ТЕСТ TELEGRAM:');
  
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  
  if (!botToken) {
    console.log('❌ TELEGRAM_BOT_TOKEN не найден');
    return false;
  }
  
  if (!chatId) {
    console.log('❌ TELEGRAM_CHAT_ID не найден');
    return false;
  }
  
  try {
    const telegramBot = new TelegramBot();
    
    console.log('📡 Тестируем подключение к Telegram...');
    const isConnected = await telegramBot.testConnection();
    
    if (!isConnected) {
      console.log('❌ Не удалось подключиться к Telegram');
      return false;
    }
    
    console.log('✅ Подключение к Telegram успешно');
    
    console.log('📤 Отправляем тестовое сообщение...');
    const testMessage = `🧪 Тестовое сообщение от Argentina Media Bot
⏰ Время: ${new Date().toISOString()}
🔧 Статус: Система работает!`;
    
    const success = await telegramBot.sendMessage(testMessage);
    
    if (success) {
      console.log('✅ Тестовое сообщение отправлено в Telegram');
      return true;
    } else {
      console.log('❌ Не удалось отправить тестовое сообщение');
      return false;
    }
    
  } catch (error) {
    console.log('❌ Ошибка Telegram:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Запускаем тесты сервисов...\n');
  
  const openaiResult = await testOpenAI();
  const telegramResult = await testTelegram();
  
  console.log('\n📊 РЕЗУЛЬТАТЫ ТЕСТОВ:');
  console.log('OpenAI:', openaiResult ? '✅' : '❌');
  console.log('Telegram:', telegramResult ? '✅' : '❌');
  
  if (!openaiResult || !telegramResult) {
    console.log('\n🔧 РЕКОМЕНДАЦИИ:');
    if (!openaiResult) {
      console.log('- Проверьте OPENAI_API_KEY в Railway Dashboard');
      console.log('- Убедитесь, что у вас есть кредиты на OpenAI');
    }
    if (!telegramResult) {
      console.log('- Проверьте TELEGRAM_BOT_TOKEN в Railway Dashboard');
      console.log('- Проверьте TELEGRAM_CHAT_ID в Railway Dashboard');
      console.log('- Убедитесь, что бот добавлен в чат/канал');
    }
  }
}

runTests().catch(console.error); 