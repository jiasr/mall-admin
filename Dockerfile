# 基础镜像
FROM node:20.11.1
# 设置工作目录
WORKDIR /app
# 复制应用程序代码到容器中
COPY . .
# 安装依赖
RUN yarn install
# 构建应用程序
RUN yarn build
# 设置环境变量
ENV NODE_ENV=production
# 暴露端口
EXPOSE 8888
# 启动应用程序
CMD ["npm", "run", "dev"]