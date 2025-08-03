const axios = require('axios');
const cheerio = require('cheerio');

class SimpleMercury {
  static async parse(url) {
    try {
      console.log(`🔍 Парсим: ${url}`);
      
      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      
      const $ = cheerio.load(response.data);
      
      // Извлекаем заголовок
      const title = $('title').text() || 
                   $('h1').first().text() || 
                   $('meta[property="og:title"]').attr('content') || 
                   'Без заголовка';
      
      // Извлекаем описание
      const description = $('meta[name="description"]').attr('content') || 
                         $('meta[property="og:description"]').attr('content') || 
                         '';
      
      // Извлекаем контент (упрощенно)
      const content = $('article, .article, .content, .post-content, .entry-content')
        .first()
        .text()
        .trim()
        .substring(0, 2000) || 
        $('p').map((i, el) => $(el).text()).get().join(' ').substring(0, 2000);
      
      // Извлекаем изображение
      const image = $('meta[property="og:image"]').attr('content') || 
                   $('img').first().attr('src') || 
                   '';
      
      return {
        title: title.trim(),
        content: content.trim(),
        excerpt: description.trim(),
        lead_image_url: image,
        domain: new URL(url).hostname,
        url: url,
        total_pages: 1,
        rendered_pages: 1
      };
      
    } catch (error) {
      console.error(`❌ Ошибка парсинга ${url}:`, error.message);
      return {
        title: 'Ошибка парсинга',
        content: '',
        excerpt: '',
        lead_image_url: '',
        domain: new URL(url).hostname,
        url: url,
        total_pages: 1,
        rendered_pages: 1
      };
    }
  }
}

module.exports = SimpleMercury; 