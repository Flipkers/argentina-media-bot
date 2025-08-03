// Telegram Bot для публикации готовых постов
const axios = require('axios');

class TelegramBot {
  constructor() {
    this.botToken = process.env.TELEGRAM_BOT_TOKEN;
    this.channelId = process.env.TELEGRAM_CHANNEL_ID;
    this.chatId = process.env.TELEGRAM_CHAT_ID;
    
    if (!this.botToken) {
      console.error('❌ TELEGRAM_BOT_TOKEN не найден в переменных окружения');
    }
    
    if (!this.channelId && !this.chatId) {
      console.error('❌ TELEGRAM_CHANNEL_ID или TELEGRAM_CHAT_ID не найдены в переменных окружения');
    }
    
    // Логируем настройки для отладки
    console.log('🔧 Telegram Bot настройки:');
    console.log('  - Bot Token:', this.botToken ? '✅ Найден' : '❌ Не найден');
    console.log('  - Channel ID:', this.channelId || '❌ Не найден');
    console.log('  - Chat ID:', this.chatId || '❌ Не найден');
  }

  // Отправка сообщения в канал или чат
  async sendMessage(message, options = {}) {
    try {
      if (!this.botToken) {
        console.error('❌ Telegram Bot Token не настроен');
        return false;
      }

      const targetId = this.channelId || this.chatId;
      if (!targetId) {
        console.error('❌ Не указан канал или чат для отправки');
        return false;
      }

      console.log(`📤 Отправляем сообщение в: ${targetId}`);
      console.log(`📄 Длина сообщения: ${message.length} символов`);

      const url = `https://api.telegram.org/bot${this.botToken}/sendMessage`;
      
      const payload = {
        chat_id: targetId,
        text: message,
        parse_mode: 'HTML',
        disable_web_page_preview: false,
        ...options
      };

      console.log('📡 URL:', url);
      console.log('📦 Payload chat_id:', payload.chat_id);

      const response = await axios.post(url, payload);
      
      if (response.data.ok) {
        console.log(`✅ Сообщение отправлено в Telegram (ID: ${response.data.result.message_id})`);
        return true;
      } else {
        console.error('❌ Ошибка отправки в Telegram:', response.data);
        return false;
      }
    } catch (error) {
      console.error('❌ Ошибка при отправке в Telegram:', error.message);
      if (error.response) {
        console.error('📊 Статус:', error.response.status);
        console.error('📄 Данные:', error.response.data);
      }
      return false;
    }
  }

  // Отправка поста с заголовком и контентом
  async sendPost(article) {
    try {
      if (!article.openai_should_post || !article.openai_post_title || !article.openai_post_content) {
        console.log(`⚠️ Статья "${article.title}" не подходит для публикации`);
        return false;
      }

      // Формируем сообщение для Telegram
      const message = this.formatPostMessage(article);
      
      // Отправляем сообщение
      const success = await this.sendMessage(message);
      
      if (success) {
        console.log(`📤 Пост опубликован: ${article.openai_post_title}`);
        return true;
      } else {
        console.error(`❌ Не удалось опубликовать пост: ${article.openai_post_title}`);
        return false;
      }
    } catch (error) {
      console.error('❌ Ошибка при публикации поста:', error.message);
      return false;
    }
  }

  // Форматирование сообщения для Telegram
  formatPostMessage(article) {
    const title = article.openai_post_title;
    const content = article.openai_post_content;
    const source = article.source_name || 'Источник';
    const link = article.link;
    
    // Ограничиваем длину контента для Telegram (максимум 4096 символов)
    const maxLength = 3500; // Оставляем место для заголовка и ссылки
    let truncatedContent = content.length > maxLength 
      ? content.substring(0, maxLength) + '...' 
      : content;

    // Разбиваем контент на абзацы по смыслу
    const formattedContent = this.formatContentIntoParagraphs(truncatedContent);

    const message = `
<b>${title}</b>

${formattedContent}

🔗 <a href="${link}">Читать полностью в ${source}</a>
    `.trim();

    return message;
  }

  // Функция для разбивки контента на абзацы
  formatContentIntoParagraphs(content) {
    // Убираем лишние пробелы и переносы строк
    let cleanContent = content.trim().replace(/\s+/g, ' ');
    
    // Разбиваем по точкам, но сохраняем логическую структуру
    const sentences = cleanContent.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    if (sentences.length <= 2) {
      // Если мало предложений, возвращаем как есть
      return cleanContent;
    }
    
    // Группируем предложения в абзацы по смыслу
    const paragraphs = [];
    let currentParagraph = [];
    
    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i].trim();
      
      // Добавляем предложение в текущий абзац
      currentParagraph.push(sentence);
      
      // Решаем, когда начать новый абзац
      const shouldStartNewParagraph = this.shouldStartNewParagraph(sentences, i);
      
      if (shouldStartNewParagraph && currentParagraph.length > 0) {
        // Завершаем текущий абзац
        paragraphs.push(currentParagraph.join('. ') + '.');
        currentParagraph = [];
      }
    }
    
    // Добавляем последний абзац, если он есть
    if (currentParagraph.length > 0) {
      paragraphs.push(currentParagraph.join('. ') + '.');
    }
    
    // Объединяем абзацы с двойными переносами строк
    return paragraphs.join('\n\n');
  }

  // Функция для определения, когда начать новый абзац
  shouldStartNewParagraph(sentences, currentIndex) {
    if (currentIndex === 0) return false; // Первое предложение всегда в первом абзаце
    
    const currentSentence = sentences[currentIndex].toLowerCase();
    const prevSentence = sentences[currentIndex - 1].toLowerCase();
    
    // Ключевые слова, которые часто начинают новый абзац
    const paragraphStarters = [
      'однако', 'но', 'впрочем', 'между тем', 'тем временем',
      'кроме того', 'более того', 'также', 'также стоит отметить',
      'важно отметить', 'следует отметить', 'стоит отметить',
      'по словам', 'согласно', 'как сообщается', 'как отмечается',
      'в результате', 'в итоге', 'в конечном счете',
      'в связи с этим', 'в связи с чем', 'поэтому',
      'таким образом', 'итак', 'следовательно'
    ];
    
    // Если текущее предложение начинается с ключевого слова
    for (const starter of paragraphStarters) {
      if (currentSentence.startsWith(starter)) {
        return true;
      }
    }
    
    // Если предыдущий абзац уже достаточно длинный (3+ предложения)
    // и текущее предложение не очень короткое
    if (currentIndex >= 3 && currentSentence.length > 50) {
      return true;
    }
    
    return false;
  }

  // Отправка статистики
  async sendStats(stats) {
    try {
      const message = `
📊 <b>Статистика за сегодня</b>

📰 Всего статей: ${stats.totalArticles}
🤖 Проанализировано OpenAI: ${stats.analyzedArticles}
⭐ Интересных статей: ${stats.interestingArticles}
📤 Опубликовано постов: ${stats.publishedPosts}

🕐 Время: ${new Date().toLocaleString('ru-RU')}
      `.trim();

      return await this.sendMessage(message);
    } catch (error) {
      console.error('❌ Ошибка при отправке статистики:', error.message);
      return false;
    }
  }

  // Проверка подключения к Telegram API
  async testConnection() {
    try {
      if (!this.botToken) {
        console.error('❌ TELEGRAM_BOT_TOKEN не настроен');
        return false;
      }

      const url = `https://api.telegram.org/bot${this.botToken}/getMe`;
      const response = await axios.get(url);
      
      if (response.data.ok) {
        const botInfo = response.data.result;
        console.log(`✅ Telegram Bot подключен: @${botInfo.username} (${botInfo.first_name})`);
        return true;
      } else {
        console.error('❌ Ошибка подключения к Telegram Bot:', response.data);
        return false;
      }
    } catch (error) {
      console.error('❌ Ошибка при проверке подключения к Telegram:', error.message);
      return false;
    }
  }
}

module.exports = TelegramBot; 