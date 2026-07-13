# DJ Sample Webapp — Docker Setup

FROM node:20-slim

# Install yt-dlp dependencies and ffmpeg
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    ffmpeg \
    curl \
    && curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp \
    && chmod a+rx /usr/local/bin/yt-dlp \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy and install server deps
COPY server/package*.json ./server/
RUN cd server && npm install --production

# Copy and install client deps + build
COPY client/package*.json ./client/
COPY client/vite.config.ts ./client/
COPY client/tsconfig.json ./client/
COPY client/tailwind.config.cjs ./client/
COPY client/postcss.config.cjs ./client/
RUN cd client && npm install

COPY client/ ./client/
RUN cd client && npx vite build

# Copy server code
COPY server/ ./server/

EXPOSE 4000

ENV NODE_ENV=production

CMD ["node", "server/index.js"]
