FROM node:20-slim

WORKDIR /app

# Install build dependencies for better-sqlite3
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci --production

COPY . .

# Create data directory for SQLite
RUN mkdir -p /data

ENV PORT=3000
ENV DB_PATH=/data/buoy.db
ENV NODE_ENV=production

EXPOSE 3000

CMD ["node", "src/server.js"]
