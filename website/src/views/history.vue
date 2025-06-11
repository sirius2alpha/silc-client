<template>
  <div class="history-container">
    <div class="page-header">
      <h2>问答记录</h2>
    </div>

    <div class="search-bar">
      <el-input v-model="searchQuery" placeholder="搜索对话内容" class="search-input" clearable @clear="handleSearch"
        @input="handleSearch">
        <template #prefix>
          <el-icon>
            <Search />
          </el-icon>
        </template>
      </el-input>
      <el-input v-model="useridQuery" placeholder="搜索用户ID" class="search-input" clearable @clear="handleSearch"
        @input="handleSearch">
        <template #prefix>
          <el-icon>
            <User />
          </el-icon>
        </template>
      </el-input>
      <el-select v-model="filterRobotId" placeholder="筛选机器人" clearable class="filter-select" @change="handleSearch">
        <el-option 
          v-for="robotId in availableRobotIds" 
          :key="robotId" 
          :label="getRobotInfo(robotId).name" 
          :value="robotId" 
        />
      </el-select>
      <el-select v-model="filterTag" placeholder="筛选标签" clearable class="filter-select" @change="handleSearch">
        <el-option v-for="tag in availableTags" :key="tag" :label="tag" :value="tag" />
      </el-select>
      <el-date-picker v-model="dateRange" type="daterange" range-separator="至" start-placeholder="开始日期"
        end-placeholder="结束日期" @change="handleSearch" />
    </div>

    <el-table v-loading="loading" :data="chatList" style="width: 100%" border>
      <el-table-column prop="userId" label="用户ID" width="200">
        <template #default="{ row }">
          <el-button 
            type="text" 
            class="userid-btn" 
            @click="copyUserid(row.userId!)"
            :title="'点击复制用户ID: ' + row.userId"
          >
            {{ row.userId }}
          </el-button>
        </template>
      </el-table-column>
      <el-table-column prop="robotId" label="机器人" width="100">
        <template #default="{ row }">
          <el-tag :type="getRobotInfo(row.robotId).type" size="small">
            {{ getRobotInfo(row.robotId).name }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="question" label="问题" min-width="200" show-overflow-tooltip />
      <el-table-column prop="answer" label="回答" min-width="300" show-overflow-tooltip />
      <el-table-column prop="tag" label="标签" width="150">
        <template #default="{ row }">
          <div v-if="row.tags && row.tags.length > 0" class="tags-container">
            <el-tag v-for="tag in row.tags.slice(0, 2)" :key="tag" size="small" class="tag-item">
              {{ tag }}
            </el-tag>
            <el-tag v-if="row.tags.length > 2" size="small" type="info">
              +{{ row.tags.length - 2 }}
            </el-tag>
          </div>
          <el-tag v-else-if="row.tag" size="small">{{ row.tag }}</el-tag>
          <span v-else class="no-tag">无标签</span>
        </template>
      </el-table-column>
      <el-table-column prop="knowledgeFrom" label="知识来源" width="120">
        <template #default="{ row }">
          <el-tag v-if="row.knowledgeFrom" type="success" size="small" effect="plain">
            <el-icon><Document /></el-icon>
            知识库
          </el-tag>
          <el-tag v-else type="warning" size="small" effect="plain">
            <el-icon><ChatDotRound /></el-icon>
            默认回复
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createdAt" label="创建时间" width="180">
        <template #default="{ row }">
          {{ formatDate(row.createdAt) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="120" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link @click="handleViewDetail(row)">
            查看详情
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination">
      <el-pagination 
        v-model:current-page="currentPage" 
        v-model:page-size="pageSize" 
        :total="total"
        :page-sizes="[10, 20, 50, 100]" 
        layout="total, sizes, prev, pager, next, jumper" 
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange" 
      />
    </div>

    <!-- 详情对话框 -->
    <el-dialog v-model="detailVisible" title="对话详情" width="900px" class="chat-detail-dialog">
      <div v-if="currentChat" class="chat-detail">
        <!-- 对话头部信息 -->
        <div class="chat-header">
          <div class="header-left">
            <div class="user-info">
              <el-avatar :size="40" :src="'https://api.dicebear.com/7.x/avataaars/svg?seed=' + currentChat.userId" />
              <div class="user-details">
                <div class="user-name">用户对话</div>
                <div class="user-id">
                  <el-button 
                    type="text" 
                    class="userid-btn-small" 
                    @click="copyUserid(currentChat.userId!)"
                    :title="'点击复制用户ID: ' + currentChat.userId"
                  >
                    {{ currentChat.userId }}
                  </el-button>
                </div>
              </div>
            </div>
          </div>
          <div class="header-right">
            <el-tag :type="getRobotInfo(currentChat.robotId).type" size="large">
              {{ getRobotInfo(currentChat.robotId).name }}
            </el-tag>
          </div>
        </div>

        <!-- 对话内容 -->
        <div class="conversation">
          <!-- 用户问题 -->
          <div class="message-item user-message">
            <div class="message-avatar">
              <el-avatar :size="32" :src="'https://api.dicebear.com/7.x/avataaars/svg?seed=' + currentChat.userId" />
            </div>
            <div class="message-content">
              <div class="message-header">
                <span class="sender-name">用户</span>
                <span class="message-time">{{ formatDate(currentChat.createdAt) }}</span>
              </div>
              <div class="message-text">{{ currentChat.question }}</div>
            </div>
          </div>

          <!-- 助手回答 -->
          <div class="message-item bot-message">
            <div class="message-avatar">
              <el-avatar :size="32" :style="{ backgroundColor: getRobotInfo(currentChat.robotId).color }">
                {{ getRobotInfo(currentChat.robotId).name.charAt(0) }}
              </el-avatar>
            </div>
            <div class="message-content">
              <div class="message-header">
                <span class="sender-name">{{ getRobotInfo(currentChat.robotId).name }}</span>
                <span class="message-time">{{ currentChat.updatedAt ? formatDate(currentChat.updatedAt) : formatDate(currentChat.createdAt) }}</span>
              </div>
              <div class="message-text">{{ currentChat.answer }}</div>
              <!-- 知识来源标识 -->
              <div v-if="currentChat.knowledgeFrom" class="knowledge-badge">
                <el-tag type="success" size="small" effect="plain">
                  <el-icon><Document /></el-icon>
                  来自知识库
                </el-tag>
              </div>
            </div>
          </div>
        </div>

        <!-- 详细信息面板 -->
        <div class="info-panels">
          <!-- 标签信息 -->
          <div class="info-panel">
            <div class="panel-header">
              <el-icon><Search /></el-icon>
              <span>相关标签</span>
            </div>
            <div class="panel-content">
              <div v-if="currentChat.tags && currentChat.tags.length > 0" class="tags-display">
                <el-tag 
                  v-for="tag in currentChat.tags" 
                  :key="tag" 
                  size="small" 
                  class="tag-item"
                  effect="light"
                >
                  {{ tag }}
                </el-tag>
              </div>
              <div v-else-if="currentChat.tag" class="tags-display">
                <el-tag size="small" class="tag-item" effect="light">{{ currentChat.tag }}</el-tag>
              </div>
              <div v-else class="no-data">无相关标签</div>
            </div>
          </div>

          <!-- 技术信息 -->
          <div class="info-panel">
            <div class="panel-header">
              <el-icon><Document /></el-icon>
              <span>技术信息</span>
            </div>
            <div class="panel-content">
              <div class="tech-info">
                <div class="tech-item">
                  <span class="tech-label">知识来源:</span>
                  <div class="tech-value">
                    <el-tag v-if="currentChat.knowledgeFrom" type="success" size="small" effect="plain">
                      <el-icon><Document /></el-icon>
                      知识库匹配
                    </el-tag>
                    <el-tag v-else type="warning" size="small" effect="plain">
                      <el-icon><ChatDotRound /></el-icon>
                      默认回复
                    </el-tag>
                  </div>
                </div>
                <div v-if="currentChat.knowledgeFrom" class="tech-item">
                  <span class="tech-label">知识ID:</span>
                  <div class="tech-value">
                    <el-button 
                      type="text" 
                      class="knowledge-id-btn" 
                      @click="copyKnowledgeId(currentChat.knowledgeFrom!)"
                      :title="'点击复制知识ID: ' + currentChat.knowledgeFrom"
                    >
                      {{ currentChat.knowledgeFrom }}
                    </el-button>
                  </div>
                </div>
                <div v-if="currentChat.duration" class="tech-item">
                  <span class="tech-label">响应耗时:</span>
                  <span class="tech-value">{{ currentChat.duration }}ms</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { Search, User, Document, ChatDotRound } from '@element-plus/icons-vue'
import { getChatList, getChatDetail } from '@/api/admin'
import { ElMessage } from 'element-plus'
import { formatDateTime } from '@/utils/date'

interface ChatItem {
  id: string
  userId: string
  question: string
  answer: string
  robotId: string
  createdAt: string
  updatedAt?: string
  tag?: string // 兼容旧数据，展示第一个标签
  tags?: string[] // 新的标签数组
  knowledgeFrom?: string // 知识来源ID
  duration?: number
  knowledgeBase?: string
  error?: string
}

// 机器人信息配置
const getRobotInfo = (robotId: string) => {
  const robotConfig = {
    xiwen: {
      name: '悉文',
      type: 'primary',
      color: '#409eff'
    },
    xihui: {
      name: '悉荟', 
      type: 'danger',
      color: '#f56c6c'
    }
  }
  return robotConfig[robotId as keyof typeof robotConfig] || {
    name: robotId,
    type: 'info',
    color: '#909399'
  }
}

const loading = ref(false)
const chatList = ref<ChatItem[]>([])
const searchQuery = ref('')
const useridQuery = ref('')
const filterRobotId = ref('')
const filterTag = ref('')
const dateRange = ref<string[]>([])
const availableTags = ref<string[]>([])
const availableRobotIds = ref<string[]>([])
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const detailVisible = ref(false)
const currentChat = ref<ChatItem | null>(null)

const fetchChatList = async () => {
  loading.value = true
  try {
    const response = await getChatList({
      page: currentPage.value,
      pageSize: pageSize.value,
      search: searchQuery.value,
      username: useridQuery.value, // 注意：这里使用username参数传递userid，因为后端API可能还是用username参数
      tag: filterTag.value,
      robotId: filterRobotId.value,
      startDate: dateRange.value?.[0] || '',
      endDate: dateRange.value?.[1] || ''
    })
    
    console.log('API响应完整数据:', response)
    
    // 处理API返回的数据结构
    // 由于响应拦截器返回的是data字段，所以response直接包含items和pagination
    if (response.items) {
      chatList.value = response.items.map((item: any) => ({
        ...item,
        // 处理标签数据，确保向后兼容
        tags: item.tags || (item.tag ? [item.tag] : []),
        tag: item.tag || (item.tags && item.tags.length > 0 ? item.tags[0] : undefined)
      }))
      // 从响应中获取total值
      total.value = response.pagination?.total || 0
      console.log('设置total为:', total.value)
    } else {
      // 兼容旧的数据结构
      chatList.value = (response.items || []).map((item: any) => ({
        ...item,
        tags: item.tags || (item.tag ? [item.tag] : []),
        tag: item.tag || (item.tags && item.tags.length > 0 ? item.tags[0] : undefined)
      }))
      total.value = response.total || 0
    }
    
    // 更新可用标签列表 - 从所有标签数组中收集
    const tags = new Set<string>()
    chatList.value.forEach((item: ChatItem) => {
      if (item.tags && item.tags.length > 0) {
        item.tags.forEach(tag => tags.add(tag))
      } else if (item.tag) {
        tags.add(item.tag)
      }
    })

    availableTags.value = Array.from(tags)
    availableRobotIds.value = Array.from(new Set(chatList.value.map(item => item.robotId)))
  } catch (error) {
    console.error('获取对话记录失败:', error)
    ElMessage.error('获取对话记录失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  currentPage.value = 1
  fetchChatList()
}

const handleSizeChange = (val: number) => {
  pageSize.value = val
  fetchChatList()
}

const handleCurrentChange = (val: number) => {
  currentPage.value = val
  fetchChatList()
}

const handleViewDetail = async (row: ChatItem) => {
  try {
    const response = await getChatDetail(row.id)
    console.log('API响应:', response)
    // 由于响应拦截器返回的是data字段，所以response直接包含chat数据
    const chatData = response.chat || response
    console.log('处理后的聊天数据:', chatData)
    
    currentChat.value = {
      ...chatData,
      // 确保这些字段正确设置
      userId: chatData.userId || row.userId,
      robotId: chatData.robotId || row.robotId,
      knowledgeFrom: chatData.knowledgeFrom || row.knowledgeFrom,
      question: chatData.question,
      answer: chatData.answer,
      // 处理标签数据，确保向后兼容
      tags: chatData.tags || row.tags || (chatData.tag || row.tag ? [chatData.tag || row.tag] : []),
      tag: chatData.tag || row.tag || (chatData.tags && chatData.tags.length > 0 ? chatData.tags[0] : undefined)
    }
    
    console.log('最终设置的currentChat:', currentChat.value)
    detailVisible.value = true
  } catch (error) {
    console.error('获取对话详情失败:', error)
    ElMessage.error('获取对话详情失败')
  }
}

const copyUserid = async (userId: string) => {
  if (!userId) {
    ElMessage.error('用户ID为空，无法复制')
    return
  }
  
  try {
    await navigator.clipboard.writeText(userId)
    ElMessage.success('用户ID已复制到剪贴板')
  } catch (error) {
    // 如果clipboard API不可用，使用fallback方法
    const textArea = document.createElement('textarea')
    textArea.value = userId
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()
    try {
      document.execCommand('copy')
      ElMessage.success('用户ID已复制到剪贴板')
    } catch (fallbackError) {
      ElMessage.error('复制失败，请手动复制')
    }
    document.body.removeChild(textArea)
  }
}

const copyKnowledgeId = async (knowledgeId: string) => {
  if (!knowledgeId) {
    ElMessage.error('知识ID为空，无法复制')
    return
  }
  
  try {
    await navigator.clipboard.writeText(knowledgeId)
    ElMessage.success('知识ID已复制到剪贴板')
  } catch (error) {
    // 如果clipboard API不可用，使用fallback方法
    const textArea = document.createElement('textarea')
    textArea.value = knowledgeId
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()
    try {
      document.execCommand('copy')
      ElMessage.success('知识ID已复制到剪贴板')
    } catch (fallbackError) {
      ElMessage.error('复制失败，请手动复制')
    }
    document.body.removeChild(textArea)
  }
}

const formatDate = (date: string) => {
  return formatDateTime(date)
}

onMounted(() => {
  fetchChatList()
})
</script>

<style scoped>
.history-container {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  color: #303133;
}

.search-bar {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
}

.search-input {
  width: 300px;
}

.filter-select {
  width: 120px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.chat-detail-dialog .el-dialog__body {
  padding: 0;
}

.chat-detail {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 20px;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background-color: #f5f7fa;
  border-radius: 8px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-details {
  display: flex;
  flex-direction: column;
}

.user-name {
  font-size: 16px;
  font-weight: bold;
}

.user-id {
  font-size: 14px;
  color: #909399;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.conversation {
  margin: 16px 0;
}

.message-item {
  display: flex;
  align-items: flex-start;
  margin-bottom: 16px;
}

.message-avatar {
  margin-right: 16px;
}

.message-content {
  flex: 1;
}

.message-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 14px;
}

.sender-name {
  font-weight: bold;
}

.message-time {
  color: #909399;
}

.message-text {
  white-space: pre-wrap;
  line-height: 1.6;
  word-wrap: break-word;
  word-break: break-word;
  font-size: 14px;
  color: #303133;
}

.user-message {
  justify-content: flex-start;
}

.bot-message {
  justify-content: flex-start;
}

.user-message .message-content {
  background-color: #e3f2fd;
  padding: 12px 16px;
  border-radius: 16px 16px 16px 4px;
  max-width: 70%;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.bot-message .message-content {
  background-color: #ffffff;
  padding: 12px 16px;
  border-radius: 16px 16px 4px 16px;
  max-width: 70%;
  border: 1px solid #e0e0e0;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.info-panels {
  display: flex;
  gap: 16px;
}

.info-panel {
  flex: 1;
  padding: 16px;
  background-color: #f5f7fa;
  border-radius: 8px;
}

.panel-header {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
}

.panel-header span {
  font-size: 16px;
  font-weight: bold;
  margin-left: 8px;
}

.panel-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.tech-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tech-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.tech-label {
  font-weight: bold;
  min-width: 80px;
}

.tech-value {
  color: #909399;
  flex: 1;
  text-align: right;
}

.tech-value .el-tag {
  margin-right: 8px;
}

.tech-value .knowledge-id {
  display: block;
  margin-top: 4px;
}

.knowledge-badge {
  margin-top: 8px;
}

.tags-display {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.tag-item {
  background-color: #e6f7ff;
  border-color: #91d5ff;
  color: #1890ff;
}

.no-data {
  color: #909399;
}

.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.no-tag {
  color: #909399;
}

.knowledge-source {
  display: flex;
  align-items: center;
  gap: 4px;
}

.knowledge-id {
  color: #909399;
}

.userid-btn {
  color: #409eff;
  cursor: pointer;
  padding: 0;
  font-size: 14px;
  text-decoration: none;
  border: none;
  background: none;
  font-family: monospace;
}

.userid-btn:hover {
  color: #66b1ff;
  text-decoration: underline;
}

.userid-btn-small {
  color: #409eff;
  cursor: pointer;
  padding: 0;
  font-size: 12px;
  text-decoration: none;
  border: none;
  background: none;
  font-family: monospace;
}

.userid-btn-small:hover {
  color: #66b1ff;
  text-decoration: underline;
}

.knowledge-id-btn {
  color: #409eff;
  cursor: pointer;
  padding: 0;
  font-size: 12px;
  text-decoration: none;
  border: none;
  background: none;
  font-family: monospace;
  word-break: break-all;
}

.knowledge-id-btn:hover {
  color: #66b1ff;
  text-decoration: underline;
}
</style>