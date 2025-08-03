require('dotenv').config();
const axios = require('axios');

console.log('🔍 ДЕТАЛЬНАЯ ДИАГНОСТИКА TELEGRAM');

async function debugTelegram() {
  console.log('\n📋 ПРОВЕРКА ПЕРЕМЕННЫХ ОКРУЖЕНИЯ:');
  
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  const channelId = process.env.TELEGRAM_CHANNEL_ID;
  
  console.log('🔑 TELEGRAM_BOT_TOKEN:', botToken ? `✅ Найден (${botToken.substring(0, 10)}...)` : '❌ Не найден');
  console.log('💬 TELEGRAM_CHAT_ID:', chatId ? `✅ Найден (${chatId})` : '❌ Не найден');
  console.log('📢 TELEGRAM_CHANNEL_ID:', channelId ? `✅ Найден (${channelId})` : '❌ Не найден');
  
  if (!botToken) {
    console.log('\n❌ TELEGRAM_BOT_TOKEN не настроен!');
    console.log('🔧 Как исправить:');
    console.log('1. Создайте бота через @BotFather в Telegram');
    console.log('2. Получите токен бота');
    console.log('3. Добавьте TELEGRAM_BOT_TOKEN в Railway Dashboard');
    return;
  }
  
  // Проверяем формат токена
  console.log('\n🔍 ПРОВЕРКА ФОРМАТА ТОКЕНА:');
  if (!botToken.match(/^\d+:[A-Za-z0-9_-]+$/)) {
    console.log('❌ Неверный формат токена!');
    console.log('📝 Правильный формат: 123456789:ABCdefGHIjklMNOpqrsTUVwxyz');
    console.log('📝 Ваш токен:', botToken);
    return;
  }
  console.log('✅ Формат токена корректный');
  
  // Тестируем API напрямую
  console.log('\n📡 ТЕСТИРУЕМ TELEGRAM API:');
  
  try {
    console.log('🔍 Проверяем информацию о боте...');
    const getMeUrl = `https://api.telegram.org/bot${botToken}/getMe`;
    console.log('📡 URL:', getMeUrl);
    
    const response = await axios.get(getMeUrl, { timeout: 10000 });
    
    if (response.data.ok) {
      const botInfo = response.data.result;
      console.log('✅ Бот найден!');
      console.log('🤖 Имя бота:', botInfo.first_name);
      console.log('👤 Username:', botInfo.username);
      console.log('🆔 ID бота:', botInfo.id);
      console.log('🔗 Ссылка на бота:', `https://t.me/${botInfo.username}`);
    } else {
      console.log('❌ Ошибка API:', response.data);
    }
    
  } catch (error) {
    console.log('❌ Ошибка при проверке бота:');
    console.log('📊 Статус:', error.response?.status);
    console.log('📄 Сообщение:', error.response?.data);
    console.log('🔍 Детали:', error.message);
    
    if (error.response?.status === 404) {
      console.log('\n🔧 РЕКОМЕНДАЦИИ ДЛЯ ИСПРАВЛЕНИЯ 404:');
      console.log('1. Проверьте, что токен скопирован полностью');
      console.log('2. Убедитесь, что бот не заблокирован');
      console.log('3. Попробуйте создать нового бота через @BotFather');
      console.log('4. Проверьте, что токен не содержит лишних символов');
    }
  }
  
  // Проверяем чат/канал
  if (chatId || channelId) {
    console.log('\n💬 ПРОВЕРКА ЧАТА/КАНАЛА:');
    
    const targetId = chatId || channelId;
    console.log('🎯 Целевой ID:', targetId);
    
    try {
      console.log('🔍 Проверяем доступ к чату/каналу...');
      const getChatUrl = `https://api.telegram.org/bot${botToken}/getChat?chat_id=${targetId}`;
      
      const response = await axios.get(getChatUrl, { timeout: 10000 });
      
      if (response.data.ok) {
        const chatInfo = response.data.result;
        console.log('✅ Доступ к чату/каналу есть!');
        console.log('📝 Тип:', chatInfo.type);
        console.log('📝 Название:', chatInfo.title || chatInfo.first_name);
        console.log('🆔 ID:', chatInfo.id);
        
        if (chatInfo.type === 'channel') {
          console.log('📢 Это канал');
          console.log('🔧 Убедитесь, что бот добавлен как администратор канала');
        } else if (chatInfo.type === 'group' || chatInfo.type === 'supergroup') {
          console.log('👥 Это группа');
          console.log('🔧 Убедитесь, что бот добавлен в группу');
        } else {
          console.log('💬 Это личный чат');
        }
      } else {
        console.log('❌ Ошибка доступа к чату:', response.data);
      }
      
    } catch (error) {
      console.log('❌ Ошибка при проверке чата:');
      console.log('📊 Статус:', error.response?.status);
      console.log('📄 Сообщение:', error.response?.data);
      
      if (error.response?.status === 400) {
        console.log('\n🔧 РЕКОМЕНДАЦИИ:');
        console.log('1. Убедитесь, что бот добавлен в чат/канал');
        console.log('2. Для каналов: добавьте бота как администратора');
        console.log('3. Для групп: добавьте бота в группу');
        console.log('4. Проверьте правильность ID чата/канала');
      }
    }
  } else {
    console.log('\n❌ TELEGRAM_CHAT_ID или TELEGRAM_CHANNEL_ID не настроены!');
    console.log('🔧 Как настроить:');
    console.log('1. Добавьте бота в чат/канал');
    console.log('2. Отправьте сообщение в чат/канал');
    console.log('3. Получите ID через: https://api.telegram.org/bot<TOKEN>/getUpdates');
    console.log('4. Добавьте TELEGRAM_CHAT_ID или TELEGRAM_CHANNEL_ID в Railway Dashboard');
  }
  
  // Тест отправки сообщения
  if (botToken && (chatId || channelId)) {
    console.log('\n📤 ТЕСТ ОТПРАВКИ СООБЩЕНИЯ:');
    
    const targetId = chatId || channelId;
    
    try {
      const testMessage = `🧪 Тестовое сообщение от Argentina Media Bot
⏰ Время: ${new Date().toISOString()}
🔧 Статус: Диагностика завершена`;

      const sendMessageUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
      const payload = {
        chat_id: targetId,
        text: testMessage,
        parse_mode: 'HTML'
      };
      
      console.log('📡 Отправляем тестовое сообщение...');
      const response = await axios.post(sendMessageUrl, payload, { timeout: 10000 });
      
      if (response.data.ok) {
        console.log('✅ Тестовое сообщение отправлено!');
        console.log('📝 ID сообщения:', response.data.result.message_id);
      } else {
        console.log('❌ Ошибка отправки:', response.data);
      }
      
    } catch (error) {
      console.log('❌ Ошибка при отправке тестового сообщения:');
      console.log('📊 Статус:', error.response?.status);
      console.log('📄 Сообщение:', error.response?.data);
    }
  }
}

debugTelegram().catch(console.error); 