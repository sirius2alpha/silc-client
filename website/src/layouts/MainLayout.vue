<template>
  <div class="app-container">
    <!-- 侧边栏 -->
    <aside class="sidebar">
      <div class="logo">
        <img src="@/assets/logo.png" alt="Logo" />
        <h1>悉商AI伙伴管理平台</h1>
      </div>
      <nav class="nav-menu">
        <router-link to="/dashboard" class="nav-item">
          <el-icon><DataLine /></el-icon>
          <span>数据看板</span>
        </router-link>
        <router-link to="/users" class="nav-item">
          <el-icon><User /></el-icon>
          <span>用户管理</span>
        </router-link>
        <router-link to="/knowledge" class="nav-item">
          <el-icon><Collection /></el-icon>
          <span>知识库管理</span>
        </router-link>
        <router-link to="/history" class="nav-item">
          <el-icon><ChatLineRound /></el-icon>
          <span>问答记录</span>
        </router-link>
        <router-link to="/feedback" class="nav-item">
          <el-icon><Message /></el-icon>
          <span>反馈管理</span>
        </router-link>

        <router-link to="/items" class="nav-item">
          <el-icon><Goods /></el-icon>
          <span>积分商品管理</span>
        </router-link>

        <router-link to="/records" class="nav-item">
          <el-icon><List /></el-icon>
          <span>兑换记录</span>
        </router-link>
        
        <router-link to="/notifications" class="nav-item">
          <el-icon><Bell /></el-icon>
          <span>通知管理</span>
        </router-link>
      </nav>
    </aside>

    <!-- 主要内容区 -->
    <main class="main-content">
      <!-- 顶部栏 -->
      <header class="top-bar">
        <div class="user-info">
          <el-dropdown @command="handleCommand">
            <span class="user-dropdown">
              <el-avatar :size="32" :src="userAvatar" />
              <span>{{ username }}</span>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="logout" >退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </header>

      <!-- 路由视图 -->
      <div class="content-wrapper">
        <router-view />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { DataLine, Collection, ChatLineRound, Message, Setting, User, Goods, List, Bell } from '@element-plus/icons-vue'

const router = useRouter()
const username = ref('管理员')
const userAvatar = ref('')

const handleCommand = (command: string) => {
  if (command === 'settings') {
    // 跳转到个人设置页面
    router.push('/settings')
  } else if (command === 'logout') {
    // 处理退出登录
    ElMessage.success('退出登录成功')
    router.push('/login')
  }
}
</script>

<style scoped>
.app-container {
  display: flex;
  min-height: 100vh;
  background-color: #f5f7fa;
}

.sidebar {
  width: 240px;
  background-color: #fff;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
  padding: 20px 0;
  position: fixed;
  height: 100vh;
}

.logo {
  padding: 20px;
  margin-bottom: 30px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  text-align: center;
}

.logo img {
  width: 100px;
  height: 100px;
  object-fit: contain;
}

.logo h1 {
  font-size: 16px;
  color: #409eff;
  margin: 0;
  font-weight: 600;
  line-height: 1.4;
  white-space: pre-line;
}

.nav-menu {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.nav-item {
  display: flex;
  align-items: center;
  padding: 12px 20px;
  color: #606266;
  text-decoration: none;
  transition: all 0.3s;
  border-radius: 4px;
  margin: 0 16px;
}

.nav-item:hover {
  background-color: #f5f7fa;
  color: #409eff;
}

.nav-item.router-link-active {
  background-color: #ecf5ff;
  color: #409eff;
  font-weight: 500;
}

.nav-item .el-icon {
  margin-right: 10px;
  font-size: 18px;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  margin-left: 240px;
}

.top-bar {
  height: 60px;
  background-color: #fff;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;
}

.user-info {
  display: flex;
  align-items: center;
}

.user-dropdown {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.user-dropdown:hover {
  background-color: #f5f7fa;
}

.content-wrapper {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  background-color: #f5f7fa;
}

/* 按钮组样式 */
.el-button-group {
  display: flex;
  gap: 8px;
}

.el-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 6px 12px;
  border-radius: 4px;
  transition: all 0.3s ease;
  font-size: 13px;
  font-weight: 500;
}

.el-button--primary {
  background-color: #409eff;
  border-color: #409eff;
  color: #fff;
}

.el-button--primary:hover {
  background-color: #66b1ff;
  border-color: #66b1ff;
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(64, 158, 255, 0.2);
}

.el-button--danger {
  background-color: #f56c6c;
  border-color: #f56c6c;
  color: #fff;
}

.el-button--danger:hover {
  background-color: #f78989;
  border-color: #f78989;
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(245, 108, 108, 0.2);
}

.el-button .el-icon {
  font-size: 14px;
}

.el-button--small {
  padding: 5px 11px;
  font-size: 12px;
}
</style> 