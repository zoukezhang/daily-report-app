# 最终版 Dockerfile - 日常报告应用
# 专为国内网络环境优化，使用官方镜像

# 定义全局构建参数，确保两个阶段都能使用
ARG CACHE_BUST=1

# 使用官方nginx:alpine镜像，然后安装Node.js（避免依赖特定Node.js镜像源的问题）
FROM nginx:alpine AS build
WORKDIR /app
# 将全局参数传递到构建阶段
ARG CACHE_BUST

# 安装Node.js和npm
RUN apk add --no-cache nodejs npm
WORKDIR /app

# 替换Alpine软件源为国内源
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' /etc/apk/repositories

# 设置时区
RUN apk --no-cache add tzdata \
    && ln -sf /usr/share/zoneinfo/Asia/Shanghai /etc/localtime \
    && echo "Asia/Shanghai" > /etc/timezone

# 配置国内npm镜像源和超时设置
RUN npm config set registry https://registry.npmmirror.com \
    && npm config set fetch-retry-maxtimeout 600000 \
    && npm config set fetch-retry-mintimeout 100000 \
    && npm config set fetch-retry-factor 1.5

# 复制依赖文件
COPY package*.json ./

# 安装依赖（带重试机制和代理设置）
RUN npm install --legacy-peer-deps --maxsockets 1

# 强制缓存失效：每次构建时都会执行，确保后续步骤使用最新代码
ARG CACHE_BUST=1

# 复制项目文件
COPY . .

# 构建前端应用
RUN npm run build

# 第二阶段：运行后端服务器
FROM nginx:alpine
WORKDIR /app
# 将全局参数传递到运行阶段
ARG CACHE_BUST

# 安装Node.js、npm和curl
RUN apk add --no-cache nodejs npm curl

# 替换Alpine软件源为国内源
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' /etc/apk/repositories

# 设置时区
RUN apk --no-cache add tzdata \
    && ln -sf /usr/share/zoneinfo/Asia/Shanghai /etc/localtime \
    && echo "Asia/Shanghai" > /etc/timezone

# 配置国内npm镜像源和超时设置
RUN npm config set registry https://registry.npmmirror.com \
    && npm config set fetch-retry-maxtimeout 600000 \
    && npm config set fetch-retry-mintimeout 100000

# 安装curl用于健康检查
RUN apk --no-cache add curl

# 复制依赖文件
COPY package*.json ./

# 安装生产依赖（带重试机制）
RUN npm install --only=production --legacy-peer-deps --maxsockets 1

# 使用CACHE_BUST参数确保每次构建都能获取最新的后端代码
COPY server/ ./server/
COPY --from=build /app/dist ./dist

# 创建数据目录并设置权限
RUN mkdir -p /app/data

# 设置环境变量
ENV NODE_ENV=production

# 暴露端口
EXPOSE 3007

# 启动应用
CMD ["node", "server/index.js"]