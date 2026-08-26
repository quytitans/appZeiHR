# Production image: build tĩnh bằng Vite, phục vụ qua Nginx.
#
# QUAN TRỌNG: Vite bake biến VITE_API_URL vào bundle JS ngay tại lúc `npm run build`
# (build-time), KHÔNG đọc lại lúc container chạy như biến môi trường runtime thông thường.
# => Phải truyền đúng URL backend production qua --build-arg khi build image này:
#
#   docker build --build-arg VITE_API_URL=https://api.your-domain.com/api/v1 -t zei-hr-frontend .
#
# Xem thêm DEPLOYMENT.md mục "Frontend".

FROM node:20-alpine AS build
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .

ARG VITE_API_URL=http://localhost:8000/api/v1
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
