#!/usr/bin/env node

require('dotenv').config();
require('./polyfills'); // Загружаем полифиллы

// Запускаем диагностику
console.log('🔍 Запускаем диагностику системы...');
require('./test');

// Запускаем тестовую версию CLI
console.log('\n🧪 Запускаем тестовую версию CLI...');
require('./test_cli');

// Запускаем тест сервисов
console.log('\n🔧 Запускаем тест сервисов...');
require('./test_services');

// Запускаем тест OpenAI анализа
console.log('\n🤖 Запускаем тест OpenAI анализа...');
require('./test_openai_analysis');

// Запускаем тест Telegram постинга
console.log('\n📱 Запускаем тест Telegram постинга...');
require('./test_telegram_posting');

// Запускаем детальную диагностику Telegram
console.log('\n🔍 Запускаем детальную диагностику Telegram...');
require('./debug_telegram');

// Запускаем исправление OpenAI анализа
console.log('\n🔧 Запускаем исправление OpenAI анализа...');
require('./fix_openai');

// Запускаем простой тест OpenAI
console.log('\n🧪 Запускаем простой тест OpenAI...');
require('./simple_openai_test');

const express = require('express');
const cron = require('node-cron');
const { exec } = require('child_process');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Переменные для отслеживания состояния
let lastRun = null;
let isRunning = false;
let runHistory = [];

// Функция для запуска полного цикла
async function runFullCycle() {
  if (isRunning) {
    console.log('⚠️ Цикл уже запущен, пропускаем...');
    return;
  }

  isRunning = true;
  const startTime = new Date();
  
  console.log(`🚀 Запускаем полный цикл в ${startTime.toISOString()}`);
  
  return new Promise((resolve, reject) => {
    exec('node cli.js --full_cycle --size=10', { 
      cwd: __dirname,
      maxBuffer: 1024 * 1024 * 10 // 10MB buffer
    }, (error, stdout, stderr) => {
      const endTime = new Date();
      const duration = endTime - startTime;
      
      const runResult = {
        id: Date.now(),
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        duration: duration,
        success: !error,
        error: error ? error.message : null,
        stdout: stdout,
        stderr: stderr
      };
      
      runHistory.unshift(runResult);
      runHistory = runHistory.slice(0, 10); // Храним только последние 10 запусков
      
      lastRun = runResult;
      isRunning = false;
      
      if (error) {
        console.error('❌ Ошибка в цикле:', error.message);
        reject(error);
      } else {
        console.log(`✅ Цикл завершен успешно за ${duration}ms`);
        resolve(runResult);
      }
    });
  });
}

// Планировщик задач - запуск каждые 5 минут
cron.schedule('*/5 * * * *', async () => {
  console.log('⏰ Планировщик: запускаем полный цикл...');
  try {
    await runFullCycle();
  } catch (error) {
    console.error('❌ Ошибка в планировщике:', error);
  }
});

// API endpoints

// Простой тестовый endpoint без аутентификации
app.get('/test', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Argentina Media Bot работает!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    hasEnvVars: {
      newsdata: !!process.env.NEWSDATA_API_KEY,
      supabase: !!process.env.SUPABASE_URL,
      openai: !!process.env.OPENAI_API_KEY,
      telegram: !!process.env.TELEGRAM_BOT_TOKEN
    }
  });
});

// Главная страница
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Argentina Media Bot</title>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .status { padding: 15px; border-radius: 5px; margin: 10px 0; }
        .status.running { background: #e3f2fd; border: 1px solid #2196f3; }
        .status.success { background: #e8f5e8; border: 1px solid #4caf50; }
        .status.error { background: #ffebee; border: 1px solid #f44336; }
        .button { background: #2196f3; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; margin: 5px; }
        .button:hover { background: #1976d2; }
        .button:disabled { background: #ccc; cursor: not-allowed; }
        .history { margin-top: 20px; }
        .history-item { padding: 10px; border: 1px solid #ddd; margin: 5px 0; border-radius: 5px; }
        .history-item.success { border-left: 4px solid #4caf50; }
        .history-item.error { border-left: 4px solid #f44336; }
        pre { background: #f5f5f5; padding: 10px; border-radius: 5px; overflow-x: auto; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🇦🇷 Argentina Media Bot</h1>
        <p>Автоматизированная система сбора и анализа новостей из Аргентины</p>
        
        <div id="status" class="status">
          <strong>Статус:</strong> <span id="statusText">Загрузка...</span>
        </div>
        
        <div>
          <button class="button" onclick="runCycle()" id="runButton">🚀 Запустить цикл сейчас</button>
          <button class="button" onclick="getStatus()">🔄 Обновить статус</button>
        </div>
        
        <div class="history">
          <h3>📊 История запусков</h3>
          <div id="history"></div>
        </div>
      </div>
      
      <script>
        async function runCycle() {
          const button = document.getElementById('runButton');
          button.disabled = true;
          button.textContent = '⏳ Запускается...';
          
          try {
            const response = await fetch('/api/run', { method: 'POST' });
            const result = await response.json();
            
            if (result.success) {
              alert('✅ Цикл запущен успешно!');
            } else {
              alert('❌ Ошибка: ' + result.error);
            }
          } catch (error) {
            alert('❌ Ошибка: ' + error.message);
          } finally {
            button.disabled = false;
            button.textContent = '🚀 Запустить цикл сейчас';
            getStatus();
          }
        }
        
        async function getStatus() {
          try {
            const response = await fetch('/api/status');
            const data = await response.json();
            
            const statusText = document.getElementById('statusText');
            const statusDiv = document.getElementById('status');
            
            if (data.isRunning) {
              statusText.textContent = 'Запущен';
              statusDiv.className = 'status running';
            } else if (data.lastRun) {
              statusText.textContent = \`Последний запуск: \${new Date(data.lastRun.startTime).toLocaleString()}\`;
              statusDiv.className = data.lastRun.success ? 'status success' : 'status error';
            } else {
              statusText.textContent = 'Не запускался';
              statusDiv.className = 'status';
            }
            
            // Обновляем историю
            const historyDiv = document.getElementById('history');
            historyDiv.innerHTML = data.history.map(run => \`
              <div class="history-item \${run.success ? 'success' : 'error'}">
                <strong>\${new Date(run.startTime).toLocaleString()}</strong>
                <br>Длительность: \${Math.round(run.duration / 1000)}с
                <br>Статус: \${run.success ? '✅ Успешно' : '❌ Ошибка'}
                \${run.error ? \`<br>Ошибка: \${run.error}\` : ''}
              </div>
            \`).join('');
            
          } catch (error) {
            console.error('Ошибка получения статуса:', error);
          }
        }
        
        // Загружаем статус при загрузке страницы
        getStatus();
        
        // Обновляем статус каждые 30 секунд
        setInterval(getStatus, 30000);
      </script>
    </body>
    </html>
  `);
});

// API для запуска цикла вручную
app.post('/api/run', async (req, res) => {
  try {
    const result = await runFullCycle();
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// API для получения статуса
app.get('/api/status', (req, res) => {
  res.json({
    isRunning,
    lastRun,
    history: runHistory
  });
});

// Health check для облачных платформ
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`🚀 Сервер запущен на порту ${PORT}`);
  console.log(`📊 Веб-интерфейс: http://localhost:${PORT}`);
  console.log(`⏰ Планировщик: каждые 5 минут`);
  console.log(`🔍 Health check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Получен SIGTERM, завершаем работу...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 Получен SIGINT, завершаем работу...');
  process.exit(0);
}); 