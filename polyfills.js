// Полифиллы для совместимости
try {
  require('web-streams-polyfill/polyfill');
} catch (e) {
  console.log('⚠️ web-streams-polyfill не загружен:', e.message);
}

// Полифилл для Blob API
if (typeof globalThis.Blob === 'undefined') {
  globalThis.Blob = class Blob {
    constructor(parts = [], options = {}) {
      this.parts = parts;
      this.type = options.type || '';
      this.size = parts.reduce((size, part) => {
        if (typeof part === 'string') {
          return size + part.length;
        }
        if (part instanceof ArrayBuffer) {
          return size + part.byteLength;
        }
        return size;
      }, 0);
    }
    
    arrayBuffer() {
      return Promise.resolve(new ArrayBuffer(this.size));
    }
    
    text() {
      return Promise.resolve(this.parts.join(''));
    }
  };
  console.log('✅ Blob API полифилл загружен');
}

// Полифилл для File API
if (typeof globalThis.File === 'undefined') {
  globalThis.File = class File extends globalThis.Blob {
    constructor(bits, name, options = {}) {
      super(bits, options);
      this.name = name;
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