// Полифиллы для Node.js 18
import 'web-streams-polyfill/polyfill';

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
      // Простая реализация
      this.result = '';
      this.readyState = 2;
    }
  };
} 