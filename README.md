# Argentina Media Bot 🤖

Автоматизированная система сбора, анализа и публикации новостей из аргентинских СМИ.

## 🚀 Возможности

- 📡 **Автоматический сбор новостей** из аргентинских источников через newsdata.io API
- 🔍 **Извлечение содержимого** статей с помощью Mercury Parser
- 🤖 **AI-анализ** статей через OpenAI GPT для определения интереса и категоризации
- 💾 **Сохранение данных** в Supabase PostgreSQL базу данных
- 📤 **Автоматическая публикация** интересных статей в Telegram канал
- ⏰ **Планировщик задач** с запуском каждые 5 минут

## 🛠 Технологии

- **Node.js** - серверная платформа
- **Express.js** - веб-фреймворк
- **node-cron** - планировщик задач
- **OpenAI API** - AI-анализ контента
- **Supabase** - база данных PostgreSQL
- **Telegram Bot API** - публикация в канал
- **Mercury Parser** - извлечение содержимого статей

## 📋 Требования

- Node.js >= 16.0.0
- API ключи для:
  - newsdata.io
  - OpenAI
  - Supabase
  - Telegram Bot

## 🔧 Установка

1. Клонируйте репозиторий:
```bash
git clone <repository-url>
cd argentina-media-bot
```

2. Установите зависимости:
```bash
npm install
```

3. Создайте файл `.env` с вашими API ключами:
```env
NEWSDATA_API_KEY=your_newsdata_api_key
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_supabase_service_key
OPENAI_API_KEY=your_openai_api_key
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_CHANNEL_ID=your_telegram_channel_id
```

4. Настройте базу данных Supabase (выполните SQL скрипты):
   - `create_articles_table.sql`
   - `add_openai_fields.sql`
   - `add_telegram_fields.sql`

## 🚀 Запуск

### Локальный запуск
```bash
npm start
```

### Разработка
```bash
npm run dev
```

### CLI команды
```bash
# Полный цикл
npm run full-cycle

# Только новости
npm run news

# Только анализ OpenAI
npm run analyze

# Только публикация
npm run publish

# Тест Telegram
npm test
```

## ☁️ Деплой

### Railway
1. Подключите GitHub репозиторий к Railway
2. Добавьте переменные окружения
3. Деплой автоматический

### Render
1. Подключите GitHub репозиторий к Render
2. Добавьте переменные окружения
3. Деплой автоматический

### Vercel
1. Подключите GitHub репозиторий к Vercel
2. Добавьте переменные окружения
3. Деплой автоматический

## 📊 Структура проекта

```
├── cli.js                 # Основной CLI интерфейс
├── server.js              # Express сервер с планировщиком
├── telegram_bot.js        # Telegram Bot API интеграция
├── openai_prompt.js       # Промпты для OpenAI
├── package.json           # Зависимости и скрипты
├── railway.json           # Конфигурация Railway
├── vercel.json            # Конфигурация Vercel
├── render.yaml            # Конфигурация Render
└── *.sql                  # SQL скрипты для базы данных
```

## 🔄 Рабочий цикл

1. **Сбор новостей** - получение статей из newsdata.io API
2. **Парсинг** - извлечение содержимого через Mercury Parser
3. **Сохранение** - запись в Supabase базу данных
4. **AI-анализ** - оценка и категоризация через OpenAI
5. **Публикация** - отправка интересных статей в Telegram

## 📈 Мониторинг

- Веб-интерфейс: `http://localhost:3000`
- Статус: `/api/status`
- Здоровье: `/health`
- Ручной запуск: `/api/run`

## 🤝 Вклад в проект

1. Форкните репозиторий
2. Создайте ветку для новой функции
3. Внесите изменения
4. Создайте Pull Request

## 📄 Лицензия

MIT License

## 📞 Поддержка

По вопросам и предложениям создавайте Issues в GitHub.
