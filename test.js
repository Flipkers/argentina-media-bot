console.log('=== ДИАГНОСТИКА СИСТЕМЫ ===');
console.log('Node.js версия:', process.version);
console.log('Платформа:', process.platform);
console.log('Архитектура:', process.arch);

// Тест полифиллов
console.log('\n=== ТЕСТ ПОЛИФИЛЛОВ ===');
try {
  require('./polyfills');
  console.log('✅ Полифиллы загружены');
} catch (e) {
  console.log('❌ Ошибка загрузки полифиллов:', e.message);
}

// Тест Blob API
console.log('\n=== ТЕСТ BLOB API ===');
try {
  if (typeof globalThis.Blob !== 'undefined') {
    console.log('✅ Blob API доступен');
  } else {
    console.log('❌ Blob API недоступен');
  }
} catch (e) {
  console.log('❌ Ошибка проверки Blob API:', e.message);
}

// Тест File API
console.log('\n=== ТЕСТ FILE API ===');
try {
  if (typeof globalThis.File !== 'undefined') {
    console.log('✅ File API доступен');
  } else {
    console.log('❌ File API недоступен');
  }
} catch (e) {
  console.log('❌ Ошибка проверки File API:', e.message);
}

// Тест основных модулей
console.log('\n=== ТЕСТ МОДУЛЕЙ ===');
const modules = [
  'dotenv',
  'express',
  'node-cron',
  'axios',
  '@supabase/supabase-js',
  'openai',
  'cheerio',
  'turndown',
  'iconv-lite'
];

modules.forEach(module => {
  try {
    require(module);
    console.log(`✅ ${module} загружен`);
  } catch (e) {
    console.log(`❌ ${module} не загружен:`, e.message);
  }
});

// Тест Mercury Parser
console.log('\n=== ТЕСТ MERCURY PARSER ===');
try {
  const Mercury = require('./dist/mercury');
  console.log('✅ Mercury Parser загружен');
} catch (e) {
  console.log('❌ Mercury Parser не загружен:', e.message);
  console.log('Стек ошибки:', e.stack);
}

console.log('\n=== ДИАГНОСТИКА ЗАВЕРШЕНА ==='); 