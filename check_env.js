require('dotenv').config();

console.log('🔍 ПРОВЕРКА ПЕРЕМЕННЫХ ОКРУЖЕНИЯ');

const requiredVars = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_KEY',
  'OPENAI_API_KEY',
  'NEWSDATA_API_KEY',
  'TELEGRAM_BOT_TOKEN',
  'TELEGRAM_CHANNEL_ID'
];

console.log('\n📋 ПРОВЕРЯЕМ ОБЯЗАТЕЛЬНЫЕ ПЕРЕМЕННЫЕ:');
let allSet = true;

requiredVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`✅ ${varName}: ${value.substring(0, 20)}...`);
  } else {
    console.log(`❌ ${varName}: НЕ НАЙДЕН`);
    allSet = false;
  }
});

console.log('\n📊 ДОПОЛНИТЕЛЬНЫЕ ПЕРЕМЕННЫЕ:');
const optionalVars = [
  'TELEGRAM_CHAT_ID',
  'PORT'
];

optionalVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`✅ ${varName}: ${value}`);
  } else {
    console.log(`⚠️ ${varName}: НЕ НАЙДЕН (опционально)`);
  }
});

console.log('\n🔧 НАСТРОЙКИ TELEGRAM:');
const botToken = process.env.TELEGRAM_BOT_TOKEN;
const channelId = process.env.TELEGRAM_CHANNEL_ID;
const chatId = process.env.TELEGRAM_CHAT_ID;

if (botToken) {
  console.log(`🤖 Bot Token: ${botToken.substring(0, 10)}...${botToken.substring(botToken.length - 10)}`);
  console.log(`📢 Channel ID: ${channelId || 'НЕ НАЙДЕН'}`);
  console.log(`💬 Chat ID: ${chatId || 'НЕ НАЙДЕН'}`);
  
  if (channelId && channelId.startsWith('@')) {
    console.log('✅ Channel ID формат правильный');
  } else if (channelId) {
    console.log('⚠️ Channel ID должен начинаться с @');
  }
} else {
  console.log('❌ TELEGRAM_BOT_TOKEN не найден');
}

console.log('\n📈 РЕЗУЛЬТАТ:');
if (allSet) {
  console.log('✅ Все обязательные переменные настроены');
} else {
  console.log('❌ Некоторые обязательные переменные отсутствуют');
  console.log('💡 Проверьте Railway Dashboard -> Variables');
}

console.log('\n🔗 Ссылки для настройки:');
console.log('📊 Railway Dashboard: https://railway.app/dashboard');
console.log('🤖 Telegram Bot: https://t.me/BotFather');
console.log('📢 Telegram Channel: @argentinadigest'); 