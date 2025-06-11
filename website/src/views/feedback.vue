<template>
  <div class="feedback-container">
    <div class="page-header">
      <h2>反馈管理</h2>
    </div>

    <div class="search-bar">
      <el-input
        v-model="searchQuery"
        placeholder="搜索反馈内容"
        class="search-input"
        clearable
        @clear="handleSearch"
        @input="handleSearch"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
      <el-select
        v-model="filterType"
        placeholder="反馈类型"
        clearable
        class="filter-select"
        @change="handleSearch"
      >
        <el-option label="问题反馈" value="bug" />
        <el-option label="功能建议" value="feature" />
        <el-option label="其他" value="other" />
      </el-select>
      <el-select
        v-model="filterStatus"
        placeholder="处理状态"
        clearable
        class="filter-select"
        @change="handleSearch"
      >
        <el-option label="待处理" value="pending" />
        <el-option label="已解决" value="resolved" />
      </el-select>
      <el-date-picker
        v-model="dateRange"
        type="daterange"
        range-separator="至"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
        value-format="YYYY-MM-DD"
        class="date-picker"
        @change="handleSearch"
      />
    </div>

    <el-table
      v-loading="loading"
      :data="feedbackList"
      style="width: 100%"
      border
    >
      <el-table-column prop="userId" label="用户ID" width="200">
        <template #default="{ row }">
          <el-button 
            v-if="row.userId"
            type="text" 
            class="userid-btn" 
            @click="copyUserid(row.userId)"
            :title="'点击复制用户ID: ' + row.userId"
          >
            {{ row.userId }}
          </el-button>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column prop="content" label="反馈内容" min-width="300" show-overflow-tooltip />
      <el-table-column prop="type" label="类型" width="100">
        <template #default="{ row }">
          <el-tag :type="getTypeTag(row.type)">
            {{ getTypeText(row.type) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="处理状态" width="100">
        <template #default="{ row }">
          <el-tag :type="getStatusTag(row.status)">
            {{ getStatusText(row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="contactInfo" label="联系方式" width="150" />
      <el-table-column prop="createdAt" label="提交时间" width="180" >
        <template #default="{ row }">
          {{ row.createdAt ? formatDate(row.createdAt) : '-' }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link @click="handleViewDetail(row)">
            查看详情
          </el-button>
          <el-button 
            v-if="row.status === 'pending'"
            type="success" 
            link 
            @click="handleUpdateStatus(row, 'resolved')"
            :loading="updatingStatus && currentUpdatingId === row.id"
          >
            标记已解决
          </el-button>
          <el-button 
            v-if="row.status === 'resolved'"
            type="warning" 
            link 
            @click="handleUpdateStatus(row, 'pending')"
            :loading="updatingStatus && currentUpdatingId === row.id"
          >
            标记待处理
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
    <el-dialog
      v-model="detailVisible"
      title="反馈详情"
      width="600px"
    >
      <div v-if="currentFeedback" class="feedback-detail">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="用户ID">
            <el-button 
              v-if="currentFeedback.userId"
              type="text" 
              class="userid-btn-small" 
              @click="copyUserid(currentFeedback.userId)"
              :title="'点击复制用户ID: ' + currentFeedback.userId"
            >
              {{ currentFeedback.userId }}
            </el-button>
            <span v-else>-</span>
          </el-descriptions-item>
          <el-descriptions-item label="反馈内容">
            {{ currentFeedback.content }}
          </el-descriptions-item>
          <el-descriptions-item label="反馈类型">
            <el-tag :type="getTypeTag(currentFeedback.type)">
              {{ getTypeText(currentFeedback.type) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="处理状态">
            <el-tag :type="getStatusTag(currentFeedback.status)">
              {{ getStatusText(currentFeedback.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="联系方式">
            {{ currentFeedback.contactInfo }}
          </el-descriptions-item>
          <el-descriptions-item label="提交时间">
            {{ currentFeedback.createdAt ? formatDate(currentFeedback.createdAt) : '-' }}
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Search } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getFeedbackList, updateFeedbackStatus } from '@/api/admin'
import { formatDate } from '@/utils/date'

interface FeedbackItem {
  id: string
  userId: string
  content: string
  type: string
  status: string
  createdAt: string
  contactInfo: string
}

const loading = ref(false)
const feedbackList = ref<FeedbackItem[]>([])
const searchQuery = ref('')
const filterType = ref('')
const filterStatus = ref('')
const dateRange = ref<[string, string] | null>(null)
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const detailVisible = ref(false)
const currentFeedback = ref<FeedbackItem | null>(null)
const updatingStatus = ref(false)
const currentUpdatingId = ref('')

const getTypeTag = (type: string) => {
  const typeMap: Record<string, string> = {
    'feature': 'success',
    'bug': 'danger',
    'other': 'info'
  }
  return typeMap[type] || 'info'
}

const getTypeText = (type: string) => {
  const typeMap: Record<string, string> = {
    'feature': '功能建议',
    'bug': '问题反馈',
    'other': '其他'
  }
  return typeMap[type] || '其他'
}

const getStatusTag = (status: string) => {
  const statusMap: Record<string, string> = {
    pending: 'warning',
    resolved: 'success'
  }
  return statusMap[status] || 'info'
}

const getStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    pending: '待处理',
    resolved: '已解决'
  }
  return statusMap[status] || '未知'
}

const fetchFeedbackList = async () => {
  loading.value = true
  try {
    const response = await getFeedbackList({
      page: currentPage.value,
      pageSize: pageSize.value,
      search: searchQuery.value,
      type: filterType.value,
      status: filterStatus.value,
      startDate: dateRange.value?.[0],
      endDate: dateRange.value?.[1]
    })
    
    if (response.data && response.data.list) {
      feedbackList.value = response.data.list.map((item: any) => ({
        id: item.id,
        userId: item.userId,
        content: item.content,
        type: item.type,
        status: item.status,
        contactInfo: item.contactInfo || '',
        createdAt: item.createdAt
      }))
      total.value = response.data.pagination.total
    } else if (response.list) {
      feedbackList.value = response.list
      total.value = response.total
    } else {
      feedbackList.value = []
      total.value = 0
    }
  } catch (error) {
    console.error('获取反馈列表失败:', error)
    ElMessage.error('获取反馈列表失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  currentPage.value = 1
  fetchFeedbackList()
}

const handleSizeChange = (val: number) => {
  pageSize.value = val
  fetchFeedbackList()
}

const handleCurrentChange = (val: number) => {
  currentPage.value = val
  fetchFeedbackList()
}

const handleViewDetail = (row: FeedbackItem) => {
  currentFeedback.value = row
  detailVisible.value = true
}

const copyUserid = async (userid: string) => {
  try {
    await navigator.clipboard.writeText(userid)
    ElMessage.success('用户ID已复制到剪贴板')
  } catch (error) {
    // 如果clipboard API不可用，使用fallback方法
    const textArea = document.createElement('textarea')
    textArea.value = userid
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

const handleUpdateStatus = async (row: FeedbackItem, newStatus: string) => {
  const statusText = newStatus === 'resolved' ? '已解决' : '待处理'
  
  try {
    await ElMessageBox.confirm(
      `确定要将反馈状态标记为"${statusText}"吗？`,
      '确认操作',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    updatingStatus.value = true
    currentUpdatingId.value = row.id
    
    await updateFeedbackStatus(row.id, newStatus)
    
    // 更新本地数据
    const index = feedbackList.value.findIndex(item => item.id === row.id)
    if (index !== -1) {
      feedbackList.value[index].status = newStatus
    }
    
    // 如果正在查看详情且是同一条反馈，更新详情数据
    if (currentFeedback.value && currentFeedback.value.id === row.id) {
      currentFeedback.value.status = newStatus
    }
    
    ElMessage.success(`反馈状态已更新为"${statusText}"`)
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('更新反馈状态失败:', error)
      ElMessage.error('更新反馈状态失败')
    }
  } finally {
    updatingStatus.value = false
    currentUpdatingId.value = ''
  }
}

onMounted(() => {
  fetchFeedbackList()
})
</script>

<style scoped>
.feedback-container {
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
  flex-wrap: wrap;
}

.search-input {
  width: 300px;
}

.filter-select {
  width: 120px;
}

.date-picker {
  width: 300px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.feedback-detail {
  padding: 20px 0;
}

.userid-btn {
  color: #409eff;
  cursor: pointer;
  padding: 0;
  font-size: 12px;
  text-decoration: none;
  border: none;
  background: none;
  font-family: monospace;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 180px;
  display: inline-block;
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
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 180px;
  display: inline-block;
}

.userid-btn-small:hover {
  color: #66b1ff;
  text-decoration: underline;
}
</style> 