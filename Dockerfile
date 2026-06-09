# 构建阶段
FROM node:20.11.1 as builder
WORKDIR /app
COPY . .
RUN yarn install && yarn build

# 运行阶段 - nginx
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
