FROM mcr.microsoft.com/playwright:v1.40.0-jammy

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

EXPOSE 5000

CMD ["node", "dist/index.js"]