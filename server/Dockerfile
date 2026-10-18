# 1. Lấy hệ điều hành Linux Alpine siêu nhẹ có cài sẵn Node.js 20
FROM node:20-alpine

# 2. Tạo thư mục làm việc bên trong container
WORKDIR /app

# 3. Copy 2 file quản lý thư viện vào trước
COPY package*.json ./

# 4. Cài đặt các thư viện cần thiết để chạy Production
RUN npm install --omit=dev

# 5. Copy toàn bộ code còn lại trong thư mục server vào container
COPY . .

# 6. Khai báo cổng 5000 mà server Express đang lắng nghe
EXPOSE 5000

# 7. Lệnh khởi chạy server khi container bật lên
CMD ["node", "server.js"]