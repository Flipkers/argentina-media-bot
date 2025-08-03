// Полифиллы для совместимости
try {
  require('web-streams-polyfill/polyfill');
} catch (e) {
  console.log('⚠️ web-streams-polyfill не загружен:', e.message);
}

// Полифилл для File API
if (typeof globalThis.File === 'undefined') {
  globalThis.File = class File {
    constructor(bits, name, options = {}) {
      this.name = name;
      this.size = bits.length;
      this.type = options.type || '';
      this.lastModified = options.lastModified || Date.now();
    }
  };
  console.log('✅ File API полифилл загружен');
}

// Полифилл для FileReader API
if (typeof globalThis.FileReader === 'undefined') {
  globalThis.FileReader = class FileReader {
    constructor() {
      this.readyState = 0;
      this.result = null;
      this.error = null;
    }
    
    readAsText(blob) {
      this.result = '';
      this.readyState = 2;
    }
  };
  console.log('✅ FileReader API полифилл загружен');
}

console.log('🔧 Полифиллы загружены'); 