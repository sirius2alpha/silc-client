# SILC Robot 网站

基于Vue 3和TypeScript开发的前端网站，提供机器人控制界面、状态监控和用户管理等功能。

## 系统要求

- Node.js 16+
- npm 7+
- Vue 3.2+

## 安装步骤

1. 安装依赖
```bash
npm install
```

2. 配置环境变量
```bash
cp .env.example .env # 编辑.env文件，设置必要的环境变量
```

## 使用方法

1. 启动开发服务器
```bash
npm run dev
```

2. 构建生产版本
```bash
npm run build
```

## 部署说明

1. 运行`npm run build`构建生产版本

2. 将`dist/`文件夹下的内容放到服务器上，可以通过`scp`命令，注意`/var/www/silc-robot/`目录的所有者应该设置为`www-data`，权限设置为`755`

3. 配置服务器上的Nginx