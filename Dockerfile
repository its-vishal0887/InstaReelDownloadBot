FROM node:22-bookworm

WORKDIR /app

ENV DEBIAN_FRONTEND=noninteractive
ENV YTDLP_PATH=/usr/local/bin/yt-dlp
ENV PORT=3000

# apt ke liye IPv4 force + pipelining disable (mirror corruption fix)
RUN apt-get update \
    -o Acquire::Retries=5 \
    -o Acquire::http::Pipeline-Depth=0 \
    -o Acquire::ForceIPv4=true

RUN apt-get install -y --no-install-recommends \
    -o Acquire::Retries=5 \
    -o Acquire::http::Pipeline-Depth=0 \
    -o Acquire::ForceIPv4=true \
    curl ca-certificates xz-utils && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# ffmpeg ko static binary se install karo - apt/mirror se independent
RUN curl -fsSL --retry 5 --retry-delay 2 \
    https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz \
    -o /tmp/ffmpeg.tar.xz && \
    tar -xf /tmp/ffmpeg.tar.xz -C /tmp && \
    mv /tmp/ffmpeg-*-static/ffmpeg /usr/local/bin/ffmpeg && \
    mv /tmp/ffmpeg-*-static/ffprobe /usr/local/bin/ffprobe && \
    rm -rf /tmp/ffmpeg*

# yt-dlp install
RUN curl -fsSL --retry 5 --retry-delay 2 \
    https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp \
    -o /usr/local/bin/yt-dlp && \
    chmod +x /usr/local/bin/yt-dlp

COPY package*.json ./
RUN npm install --omit=dev
COPY . .

EXPOSE 3000
CMD ["npm", "start"]