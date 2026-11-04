# ======= Stage 1: Build =======
FROM node:20-alpine AS builder

WORKDIR /app

# Tắt Source Map để bảo mật, làm rối mã và giảm dung lượng
ENV GENERATE_SOURCEMAP=false
ENV NODE_ENV=production

# Copy lockfile và cài đặt sạch
COPY package*.json ./
RUN npm ci --quiet && npm cache clean --force

# Copy mã nguồn và thực hiện build production
COPY . .
RUN npm run build

# Thực hiện làm rối mã (Obfuscation) cực mạnh sau khi build
RUN npx javascript-obfuscator ./build/static/js --output ./build/static/js \
    --compact true \
    --self-defending true \
    --string-array true \
    --string-array-rotate true \
    --string-array-shuffle true \
    --string-array-index-shift true \
    --unicode-escape-sequence true \
    --identifier-names-generator hexadecimal

# ======= Stage 2: Final Image =======
FROM node:20-alpine

WORKDIR /app

# Cài đặt serve nhẹ nhất có thể
RUN npm install -g serve && npm cache clean --force

# Chỉ lấy thư mục build và kịch bản khởi chạy
COPY --from=builder /app/build ./build
COPY entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

# Mở cổng 3001
EXPOSE 3001

# Container health check for the static frontend server.
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD node -e "fetch('http://127.0.0.1:3001').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

# Khởi chạy ứng dụng
ENTRYPOINT ["./entrypoint.sh"]
CMD ["serve", "-s", "build", "-l", "3001"]
