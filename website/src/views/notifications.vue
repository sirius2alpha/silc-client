<template>
  <div class="notifications-page">
    <div class="page-header">
      <h1>通知管理</h1>
      <el-button type="primary" @click="showCreateDialog">
        <el-icon>
          <Plus />
        </el-icon>
        发布通知
      </el-button>
    </div>

    <!-- 搜索筛选 -->
    <div class="search-section">
      <el-form :model="searchForm" inline>
        <el-form-item label="关键词">
          <el-input v-model="searchForm.keyword" placeholder="搜索标题或内容" clearable style="width: 200px" />
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="searchForm.type" placeholder="请选择类型" clearable style="width: 120px">
            <el-option label="全部" value="" />
            <el-option label="系统通知" value="system" />
            <el-option label="公告" value="announcement" />
            <el-option label="更新提醒" value="update" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="请选择状态" clearable style="width: 120px">
            <el-option label="全部" value="" />
            <el-option label="激活" value="active" />
            <el-option label="停用" value="inactive" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="searchNotifications">
            <el-icon>
              <Search />
            </el-icon>
            搜索
          </el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 通知列表 -->
    <div class="table-section">
      <el-table :data="notificationList" v-loading="loading" stripe>
        <el-table-column prop="title" label="标题" min-width="200" />
        <el-table-column prop="content" label="内容" min-width="300" show-overflow-tooltip />
        <el-table-column prop="type" label="类型" width="120">
          <template #default="{ row }">
            <el-tag :type="getTypeTagType(row.type)">
              {{ getTypeText(row.type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'danger'">
              {{ row.status === 'active' ? '激活' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatTime(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button v-if="row.status === 'active'" type="warning" size="small"
              @click="updateStatus(row.id, 'inactive')">
              停用
            </el-button>
            <el-button v-else type="success" size="small" @click="updateStatus(row.id, 'active')">
              激活
            </el-button>
            <el-button type="danger" size="small" @click="deleteNotification(row.id)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination v-model:current-page="pagination.page" v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]" :total="pagination.total" layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange" @current-change="handleCurrentChange" />
      </div>
    </div>

    <!-- 创建通知对话框 -->
    <el-dialog v-model="createDialogVisible" title="发布通知" width="600px">
      <el-form :model="createForm" :rules="createRules" ref="createFormRef" label-width="80px">
        <el-form-item label="标题" prop="title">
          <el-input v-model="createForm.title" placeholder="请输入通知标题" maxlength="100" show-word-limit />
        </el-form-item>
        <el-form-item label="类型" prop="type">
          <el-select v-model="createForm.type" placeholder="请选择通知类型" style="width: 100%">
            <el-option label="系统通知" value="system" />
            <el-option label="公告" value="announcement" />
            <el-option label="更新提醒" value="update" />
          </el-select>
        </el-form-item>
        <el-form-item label="内容" prop="content">
          <el-input v-model="createForm.content" type="textarea" :rows="6" placeholder="请输入通知内容" maxlength="1000"
            show-word-limit />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="createDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="createNotification" :loading="createLoading">
            发布
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search } from '@element-plus/icons-vue'
import {
  getNotificationList,
  createNotification as createNotificationAPI,
  updateNotificationStatus,
  deleteNotification as deleteNotificationAPI
} from '../api/admin'
import { formatTime } from '../utils/util'

// 响应式数据
const loading = ref(false)
const createLoading = ref(false)
const createDialogVisible = ref(false)
const notificationList = ref([])
const createFormRef = ref()

// 搜索表单
const searchForm = reactive({
  keyword: '',
  type: '',
  status: ''
})

// 分页
const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

// 创建表单
const createForm = reactive({
  title: '',
  content: '',
  type: ''
})

// 创建表单验证规则
const createRules = {
  title: [
    { required: true, message: '请输入通知标题', trigger: 'blur' },
    { min: 1, max: 100, message: '标题长度在 1 到 100 个字符', trigger: 'blur' }
  ],
  type: [
    { required: true, message: '请选择通知类型', trigger: 'change' }
  ],
  content: [
    { required: true, message: '请输入通知内容', trigger: 'blur' },
    { min: 1, max: 1000, message: '内容长度在 1 到 1000 个字符', trigger: 'blur' }
  ]
}

// 获取通知列表
const fetchNotifications = async () => {
  try {
    loading.value = true
    const res = await getNotificationList({
      page: pagination.page,
      pageSize: pagination.pageSize,
      keyword: searchForm.keyword || undefined,
      type: searchForm.type || undefined,
      status: searchForm.status || undefined
    })

    notificationList.value = res.data?.notifications || res.notifications || []
    pagination.total = res.data?.pagination?.total || res.pagination?.total || 0
  } catch (error) {
    ElMessage.error('获取通知列表失败')
  } finally {
    loading.value = false
  }
}

// 搜索通知
const searchNotifications = () => {
  pagination.page = 1
  fetchNotifications()
}

// 重置搜索
const resetSearch = () => {
  searchForm.keyword = ''
  searchForm.type = ''
  searchForm.status = ''
  pagination.page = 1
  fetchNotifications()
}

// 显示创建对话框
const showCreateDialog = () => {
  createForm.title = ''
  createForm.content = ''
  createForm.type = ''
  createDialogVisible.value = true
}

// 创建通知
const createNotification = async () => {
  try {
    await createFormRef.value.validate()
    createLoading.value = true

    const response = await createNotificationAPI(createForm)

    ElMessage.success('通知发布成功')
    createDialogVisible.value = false
    fetchNotifications()
      } catch (error) {
      if (error !== false) { // 表单验证失败时会返回false
        ElMessage.error('发布通知失败')
      }
  } finally {
    createLoading.value = false
  }
}

// 更新通知状态
const updateStatus = async (id: string, status: string) => {
  try {
    const response = await updateNotificationStatus(id, status)
    ElMessage.success('状态更新成功')
    fetchNotifications()
  } catch (error) {
    ElMessage.error('状态更新失败')
  }
}

// 删除通知
const deleteNotification = async (id: string) => {
  try {
    await ElMessageBox.confirm('确定要删除这条通知吗？', '确认删除', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    const response = await deleteNotificationAPI(id)
    ElMessage.success('删除成功')
    fetchNotifications()
  } catch (error) {
    if (error === 'cancel') return
    ElMessage.error('删除失败')
  }
}

// 处理页码变化
const handleCurrentChange = (page: number) => {
  pagination.page = page
  fetchNotifications()
}

// 处理页大小变化
const handleSizeChange = (size: number) => {
  pagination.pageSize = size
  pagination.page = 1
  fetchNotifications()
}

// 获取类型标签类型
const getTypeTagType = (type: string) => {
  const typeMap: Record<string, string> = {
    system: '',
    announcement: 'warning',
    update: 'success'
  }
  return typeMap[type] || ''
}

// 获取类型文本
const getTypeText = (type: string) => {
  const typeMap: Record<string, string> = {
    system: '系统通知',
    announcement: '公告',
    update: '更新提醒'
  }
  return typeMap[type] || type
}

// 组件挂载时获取数据
onMounted(() => {
  fetchNotifications()
})
</script>

<style scoped>
.notifications-page {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h1 {
  margin: 0;
  color: #303133;
}

.search-section {
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.table-section {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  padding: 20px;
  background: #fff;
}
</style>