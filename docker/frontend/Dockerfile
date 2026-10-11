FROM node:20-alpine

WORKDIR /app

COPY frontend/package*.json ./
RUN npm install --legacy-peer-deps --no-fund --no-audit

COPY frontend .

EXPOSE 3000

CMD ["sh", "-c", "npm start -- --host 0.0.0.0"]
