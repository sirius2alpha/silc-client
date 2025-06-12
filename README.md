# silc-client

## 项目介绍

silc-client 是一个基于 Vue 3 + TypeScript 构建的现代化前端应用项目。该项目使用了最新的前端技术栈，提供了一个响应式、高性能的用户界面。

## 技术栈

- **框架**: Vue 3.5.13 (Composition API)
- **语言**: TypeScript 5.8.0
- **构建工具**: Vite 6.2.4
- **状态管理**: Pinia 3.0.2
- **路由**: Vue Router 4.5.0
- **UI组件库**: Element Plus 2.9.9
- **图表库**: ECharts 5.6.0
- **HTTP客户端**: Axios 1.9.0
- **工具函数**: Lodash 4.17.21
- **日期处理**: Day.js 1.11.13

## 项目特性

- 🚀 基于 Vue 3 Composition API 的现代化开发体验
- 🎨 使用 Element Plus 提供的丰富UI组件
- 📊 集成 ECharts 支持数据可视化
- 🔄 使用 Pinia 进行状态管理
- 🛣️ Vue Router 实现单页应用路由
- 💾 TypeScript 提供类型安全
- ⚡ Vite 提供快速的开发服务器和构建

## 开发环境要求

- Node.js >= 18.0.0
- npm 或 yarn 或 pnpm

## 安装与运行

### 1. 克隆项目
```bash
git clone <repository-url>
cd silc-client/website
```

### 2. 安装依赖
```bash
npm install
# 或者
yarn install
# 或者
pnpm install
```

### 3. 启动开发服务器
```bash
npm run dev
# 或者
yarn dev
# 或者
pnpm dev
```

项目将在 `http://localhost:5173` 启动

### 4. 构建生产版本
```bash
npm run build
# 或者
yarn build
# 或者
pnpm build
```

### 5. 预览生产构建
```bash
npm run preview
# 或者
yarn preview
# 或者
pnpm preview
```

## 部署方法

### 方法一：静态文件部署

1. 执行构建命令：
```bash
npm run build
```

2. 构建完成后，`dist` 目录将包含所有静态文件

3. 将 `dist` 目录内容上传到任何静态文件服务器（如 Nginx、Apache、云存储等）

### 方法二：Docker 部署

创建 `Dockerfile`：
```dockerfile
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

构建和运行：
```bash
docker build -t silc-client .
docker run -p 80:80 silc-client
```

### 方法三：云平台部署

#### Vercel 部署
```bash
npm i -g vercel
vercel --prod
```

#### Netlify 部署
```bash
npm run build
# 然后将 dist 目录拖拽到 Netlify 部署界面
```

## 开发脚本

- `npm run dev` - 启动开发服务器
- `npm run build` - 构建生产版本
- `npm run preview` - 预览生产构建
- `npm run type-check` - TypeScript 类型检查
- `npm run format` - 代码格式化

## 项目结构

```
website/
├── src/
│   ├── api/          # API 接口定义
│   ├── assets/       # 静态资源
│   ├── layouts/      # 布局组件
│   ├── router/       # 路由配置
│   ├── stores/       # Pinia 状态管理
│   ├── types/        # TypeScript 类型定义
│   ├── utils/        # 工具函数
│   ├── views/        # 页面组件
│   ├── App.vue       # 根组件
│   └── main.ts       # 应用入口
├── public/           # 公共静态文件
├── package.json      # 项目配置
└── vite.config.ts    # Vite 配置
```

## 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 许可证

[MIT License](LICENSE)
