# ======= Stage 1: Build ứng dụng React =======
FROM node:20-alpine AS builder

WORKDIR /app

# Khởi tạo package và cài thư viện
COPY package*.json ./
RUN npm install

# Copy toàn bộ src và public vào container
COPY . .

# Build dự án (thư mục /app/build)
# Quá trình này sẽ sử dụng biến môi trường mặc định nếu không truyền
RUN npm run build

# ======= Stage 2: Serve ứng dụng và truyền biến Runtime =======
FROM node:20-alpine

WORKDIR /app

# Cài đặt serve để chạy web tĩnh
RUN npm install -g serve

# Copy sản phẩm từ bước build sang
COPY --from=builder /app/build ./build

# Copy file kịch bản inject biến môi trường
COPY entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

# Mở cổng 3001
EXPOSE 3001

# Chạy shell script lấy biến môi trường Hệ điều hành đè vào env-config.js
ENTRYPOINT ["./entrypoint.sh"]

# Chạy serve cổng 3001
CMD ["serve", "-s", "build", "-l", "3001"]
