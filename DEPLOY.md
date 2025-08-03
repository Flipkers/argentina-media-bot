# 🚀 Деплой Argentina Media Bot

## 📋 Что делает система:

- **📡 Автоматически** получает новости из Аргентины каждые 30 минут
- **🔍 Обрабатывает** статьи через Mercury Parser
- **🤖 Анализирует** через OpenAI GPT
- **💾 Сохраняет** в Supabase базу данных
- **📊 Показывает** веб-интерфейс с статистикой

## 🌐 Варианты деплоя:

### 1. Railway (Рекомендуется)
```bash
# 1. Установите Railway CLI
npm install -g @railway/cli

# 2. Войдите в аккаунт
railway login

# 3. Создайте проект
railway init

# 4. Добавьте переменные окружения
railway variables set NEWSDATA_API_KEY=your_key
railway variables set SUPABASE_URL=your_url
railway variables set SUPABASE_SERVICE_KEY=your_key
railway variables set OPENAI_API_KEY=your_key

# 5. Деплой
railway up
```

### 2. Render
```bash
# 1. Подключите GitHub репозиторий
# 2. Создайте новый Web Service
# 3. Укажите:
#    - Build Command: npm install
#    - Start Command: npm start
#    - Health Check Path: /health
# 4. Добавьте переменные окружения в Environment Variables
```

### 3. Vercel
```bash
# 1. Установите Vercel CLI
npm install -g vercel

# 2. Деплой
vercel

# 3. Добавьте переменные окружения в Vercel Dashboard
```

## 🔧 Переменные окружения:

```env
NEWSDATA_API_KEY=your_newsdata_api_key
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_supabase_service_key
OPENAI_API_KEY=your_openai_api_key
PORT=3000
```

## 📊 Веб-интерфейс:

После деплоя вы получите:
- **Главная страница**: Статус и управление
- **API endpoints**:
  - `GET /` - Веб-интерфейс
  - `POST /api/run` - Запустить цикл вручную
  - `GET /api/status` - Статус системы
  - `GET /health` - Health check

## ⏰ Расписание:

- **Автоматически**: каждые 30 минут
- **Вручную**: через веб-интерфейс
- **API**: POST запрос к `/api/run`

## 🔍 Мониторинг:

- **Логи**: в консоли облачной платформы
- **Статус**: через веб-интерфейс
- **Health check**: `/health` endpoint

## 💰 Стоимость:

- **Railway**: $5/месяц (после бесплатного периода)
- **Render**: Бесплатно (с ограничениями)
- **Vercel**: Бесплатно (с ограничениями)

## 🚨 Важно:

1. **API лимиты**: newsdata.io имеет лимиты на бесплатном плане
2. **OpenAI**: учитывайте стоимость API вызовов
3. **Supabase**: бесплатный план имеет лимиты
4. **Время выполнения**: цикл может занимать 2-5 минут

## 🔧 Настройка расписания:

В `server.js` измените строку:
```javascript
// Каждые 30 минут
cron.schedule('*/30 * * * *', async () => {

// Каждый час
cron.schedule('0 * * * *', async () => {

// Каждые 15 минут
cron.schedule('*/15 * * * *', async () => {
``` 