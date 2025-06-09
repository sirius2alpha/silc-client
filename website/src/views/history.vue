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
      <el-input v-model="usernameQuery" placeholder="搜索用户名" class="search-input" clearable @clear="handleSearch"
        @input="handleSearch">
        <template #prefix>
          <el-icon>
            <User />
          </el-icon>
        </template>
      </el-input>
      <el-select v-model="filterTag" placeholder="筛选标签" clearable class="filter-select" @change="handleSearch">
        <el-option v-for="tag in availableTags" :key="tag" :label="tag" :value="tag" />
      </el-select>
      <el-date-picker v-model="dateRange" type="daterange" range-separator="至" start-placeholder="开始日期"
        end-placeholder="结束日期" @change="handleSearch" />
    </div>

    <el-table v-loading="loading" :data="chatList" style="width: 100%" border>
      <el-table-column prop="username" label="用户名" width="120" />
      <el-table-column prop="question" label="问题" min-width="200" show-overflow-tooltip />
      <el-table-column prop="answer" label="回答" min-width="300" show-overflow-tooltip />
      <el-table-column prop="tag" label="标签" width="120">
        <template #default="{ row }">
          <el-tag v-if="row.tag">{{ row.tag }}</el-tag>
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
      <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize" :total="total"
        :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper" @size-change="handleSizeChange"
        @current-change="handleCurrentChange" />
    </div>

    <!-- 详情对话框 -->
    <el-dialog v-model="detailVisible" title="对话详情" width="800px">
      <div v-if="currentChat" class="chat-detail">
        <div class="chat-message">
          <div class="message-header">
            <span class="user-label">{{ currentChat.username }}</span>
            <span class="time">{{ formatDate(currentChat.createdAt) }}</span>
          </div>
          <div class="message-content">{{ currentChat.question }}</div>
        </div>
        <div class="chat-message">
          <div class="message-header">
            <span class="assistant-label">助手</span>
            <span class="time">{{ formatDate(currentChat.updatedAt) }}</span>
          </div>
          <div class="message-content">{{ currentChat.answer }}</div>
        </div>
        <div class="chat-info">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="标签">
              <el-tag v-if="currentChat.tag">{{ currentChat.tag }}</el-tag>
              <span v-else>无</span>
            </el-descriptions-item>
            <el-descriptions-item label="耗时">
              {{ currentChat.duration }}ms
            </el-descriptions-item>
            <el-descriptions-item label="使用的知识库">
              {{ currentChat.knowledgeBase || '无' }}
            </el-descriptions-item>
            <el-descriptions-item label="错误信息" v-if="currentChat.error">
              {{ currentChat.error }}
            </el-descriptions-item>
          </el-descriptions>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { Search, User } from '@element-plus/icons-vue'
import { getChatList, getChatDetail } from '@/api/admin'
import { ElMessage } from 'element-plus'
import { formatDateTime } from '@/utils/date'

interface ChatItem {
  id: string
  username: string
  question: string
  answer: string
  tag: string
  createdAt: string
  updatedAt: string
  duration: number
  knowledgeBase?: string
  error?: string
}

const loading = ref(false)
const chatList = ref<ChatItem[]>([])
const searchQuery = ref('')
const usernameQuery = ref('')
const filterTag = ref('')
const dateRange = ref<string[]>([])
const availableTags = ref<string[]>([])
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
      username: usernameQuery.value,
      tag: filterTag.value,
      startDate: dateRange.value?.[0] || '',
      endDate: dateRange.value?.[1] || ''
    })
    chatList.value = response.items
    total.value = response.total
    // 更新可用标签列表
    const tags = new Set<string>()
    response.items.forEach((item: { tag?: string }) => {
      if (item.tag) {
        tags.add(item.tag)
      }
    })

    availableTags.value = Array.from(tags)
  } catch (error) {
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
    currentChat.value = {
      ...response,
      username: row.username
    }
    detailVisible.value = true
  } catch (error) {
    ElMessage.error('获取对话详情失败')
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

.chat-detail {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.chat-message {
  background-color: #f5f7fa;
  border-radius: 8px;
  padding: 16px;
}

.message-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 14px;
}

.user-label {
  color: #409eff;
  font-weight: bold;
}

.assistant-label {
  color: #67c23a;
  font-weight: bold;
}

.time {
  color: #909399;
}

.message-content {
  white-space: pre-wrap;
  line-height: 1.6;
}

.chat-info {
  margin-top: 20px;
}
</style>