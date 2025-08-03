FROM node:16-alpine

WORKDIR /app

# Копируем package.json и package-lock.json
COPY package*.json ./

# Удаляем package-lock.json если он есть и устанавливаем зависимости заново
RUN rm -f package-lock.json && npm install --legacy-peer-deps

# Копируем остальные файлы
COPY . .

# Открываем порт
EXPOSE 3000

# Запускаем приложение
CMD ["npm", "start"] 