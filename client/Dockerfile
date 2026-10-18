# --- GIAI ĐOẠN 1: BUILD CODE REACT ---
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Nhận đường dẫn API Backend lúc build
ARG VITE_API_URL=http://localhost:5000/api
ENV VITE_API_URL=$VITE_API_URL

# Xuất code React ra thư mục /app/dist
RUN npm run build

# --- GIAI ĐOẠN 2: CHẠY WEB BẰNG NGINX ---
FROM nginx:stable-alpine

# Copy file cấu hình chống lỗi 404 khi F5 vào Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Chỉ lấy đúng thư mục dist từ Giai đoạn 1 bỏ vào Nginx (bỏ lại toàn bộ node_modules nặng nề)
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]