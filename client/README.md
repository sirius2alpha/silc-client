# SILC Robot 微信小程序客户端

基于微信小程序原生框架开发的客户端程序，提供用户界面和机器人控制功能。

## 项目结构

```
client/
├── api/           # API接口封装
├── assets/        # 静态资源
├── components/    # 公共组件
├── pages/         # 页面文件
├── utils/         # 工具函数
├── app.js         # 小程序入口文件
├── app.json       # 小程序配置文件
└── app.wxss       # 全局样式文件
```

## 安装步骤

1. [安装微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)

2. 导入项目
   - 打开微信开发者工具
   - 选择"导入项目"
   - 选择项目目录

3. 配置项目
   - 在`project.config.json`中配置AppID
   - 在`config.js`中配置服务器地址

## 发布流程

1. 代码审核
   - 检查代码规范
   - 测试功能完整性

2. 提交审核
   - 在微信开发者工具中上传代码
   - 填写版本信息

3. 发布上线
   - 审核通过后发布
   - 监控线上版本