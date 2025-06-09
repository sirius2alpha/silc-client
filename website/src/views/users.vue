<template>
  <div class="users-container">
    <div class="header">
      <h2>用户管理</h2>
    </div>

    <!-- 添加筛选表单 -->
    <el-form :model="filterForm" class="filter-form" inline>
      <el-form-item label="用户名">
        <el-input v-model="filterForm.username" placeholder="用户名" clearable @clear="handleFilter" />
      </el-form-item>
      <el-form-item label="昵称">
        <el-input v-model="filterForm.nickname" placeholder="昵称" clearable @clear="handleFilter" />
      </el-form-item>
      <el-form-item label="角色">
        <el-select class="wide-select" v-model="filterForm.role" placeholder="选择角色" clearable @clear="handleFilter">
          <el-option label="管理员" value="admin" />
          <el-option label="普通用户" value="user" />
        </el-select>
      </el-form-item>
      <el-form-item label="状态">
        <el-select class="wide-select" v-model="filterForm.status" placeholder="选择状态" clearable @clear="handleFilter">
          <el-option label="正常" value="active" />
          <el-option label="禁用" value="inactive" />
        </el-select>
      </el-form-item>
      <el-form-item label="邮箱">
        <el-input v-model="filterForm.email" placeholder="邮箱" clearable @clear="handleFilter" />
      </el-form-item>
      <el-form-item label="注册时间">
        <el-date-picker
          v-model="filterForm.registerDate"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="YYYY-MM-DD"
          @change="handleFilter"
        />
      </el-form-item>
      <el-form-item label="最后更新">
        <el-date-picker
          v-model="filterForm.updateDate"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="YYYY-MM-DD"
          @change="handleFilter"
        />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="handleFilter">筛选</el-button>
        <el-button @click="resetFilter">重置</el-button>
      </el-form-item>
    </el-form>

    <el-table :data="userList"  style="width: 100%" v-loading="loading" border>
      <el-table-column prop="username" label="用户名" />
      <el-table-column prop="nickname" label="昵称" />
      <el-table-column prop="role" label="角色">
        <template #default="{ row }">
          <el-tag :type="row.role === 'admin' ? 'danger' : 'primary'">
            {{ row.role === 'admin' ? '管理员' : '普通用户' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态">
        <template #default="{ row }">
          <el-tag :type="row.status === 'active' ? 'success' : 'danger'">
            {{ row.status === 'active' ? '正常' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createdAt" label="注册时间">
        <template #default="{ row }">
          {{ formatDate(row.createdAt) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="300">
        <template #default="{ row }">
          <el-button type="primary" size="small" @click="handleViewDetail(row)">
            查看
          </el-button>
          <el-button :type="row.status === 'active' ? 'danger' : 'success'" size="small"
            @click="handleToggleStatus(row)">
            {{ row.status === 'active' ? '禁用' : '启用' }}
          </el-button>
          <el-button type="warning" size="small" @click="handleResetPassword(row)">
            重置密码
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination">
      <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize" :page-sizes="[10, 20, 50, 100]"
        :total="total" layout="total, sizes, prev, pager, next" @size-change="handleSizeChange"
        @current-change="handleCurrentChange" />
    </div>

    <!-- 用户详情对话框 -->
    <el-dialog v-model="dialogVisible" title="用户详情" width="50%">
      <div v-if="currentUser" class="user-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="用户名">{{ currentUser.username || '-' }}</el-descriptions-item>
          <el-descriptions-item label="昵称">{{ currentUser.nickname || '-' }}</el-descriptions-item>
          <el-descriptions-item label="邮箱">{{ currentUser.email || '-' }}</el-descriptions-item>
          <el-descriptions-item label="积分">{{ currentUser.points || 0 }}</el-descriptions-item>
          <el-descriptions-item label="角色">
            <el-tag :type="currentUser.isAdmin ? 'danger' : 'primary'">
              {{ currentUser.isAdmin ? '管理员' : '普通用户' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="currentUser.status === 'active' ? 'success' : 'danger'">
              {{ currentUser.status === 'active' ? '正常' : '禁用' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="选择的机器人">{{ currentUser.selectedRobot || '-' }}</el-descriptions-item>
          <el-descriptions-item label="登录方式">{{ currentUser.loginType || '-' }}</el-descriptions-item>
          <el-descriptions-item label="注册时间">{{ currentUser.createdAt ? formatDate(currentUser.createdAt) : '-'
            }}</el-descriptions-item>
          <el-descriptions-item label="最后更新">{{ currentUser.updatedAt ? formatDate(currentUser.updatedAt) : '-'
            }}</el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>

    <!-- 重置密码对话框 -->
    <el-dialog v-model="resetPasswordDialogVisible" title="重置密码" width="30%">
      <el-form :model="resetPasswordForm" label-width="100px">
        <el-form-item label="新密码">
          <el-input v-model="resetPasswordForm.password" type="password" show-password />
        </el-form-item>
        <el-form-item label="确认密码">
          <el-input v-model="resetPasswordForm.confirmPassword" type="password" show-password />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="resetPasswordDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="confirmResetPassword">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import { formatDate } from '@/utils/date'
import { getUserList, getUserDetail, updateUserStatus, resetUserPassword } from '@/api/admin'

interface User {
  _id: string
  username: string
  nickname: string
  email: string
  points: number
  role: string
  isAdmin: boolean
  selectedRobot: string
  status: string
  createdAt: string
  updatedAt: string
  loginType: string
}

const loading = ref(false)
const userList = ref<User[]>([])
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const searchQuery = ref('')
const dialogVisible = ref(false)
const currentUser = ref<User | null>(null)

// 添加筛选表单数据
const filterForm = ref({
  username: '',
  nickname: '',
  role: '',
  status: '',
  email: '',
  registerDate: [],
  updateDate: []
})

// 重置密码相关
const resetPasswordDialogVisible = ref(false)
const resetPasswordForm = ref({
  password: '',
  confirmPassword: ''
})
const currentUserId = ref('')

const fetchUserList = async () => {
  loading.value = true
  try {
    const response = await getUserList({
      page: currentPage.value,
      pageSize: pageSize.value,
      search: searchQuery.value,
      ...filterForm.value,
      registerStartDate: filterForm.value.registerDate?.[0],
      registerEndDate: filterForm.value.registerDate?.[1],
      updateStartDate: filterForm.value.updateDate?.[0],
      updateEndDate: filterForm.value.updateDate?.[1]
    })
    userList.value = response.list
    total.value = response.total
  } catch (error) {
    ElMessage.error('获取用户列表失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  currentPage.value = 1
  fetchUserList()
}

const handleSizeChange = (val: number) => {
  pageSize.value = val
  fetchUserList()
}

const handleCurrentChange = (val: number) => {
  currentPage.value = val
  fetchUserList()
}

const handleViewDetail = async (user: User) => {
  try {
    const data = await getUserDetail(user._id)
    currentUser.value = data
    dialogVisible.value = true

  } catch (error) {
    console.error('获取用户详情错误:', error)
    ElMessage.error('获取用户详情失败')
  }
}

const handleToggleStatus = async (user: User) => {
  try {
    await ElMessageBox.confirm(
      `确定要${user.status === 'active' ? '禁用' : '启用'}该用户吗？`,
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    await updateUserStatus(user._id, {
      status: user.status === 'active' ? 'inactive' : 'active'
    })

    ElMessage.success('操作成功')
    fetchUserList()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('操作失败')
    }
  }
}

const handleFilter = () => {
  currentPage.value = 1
  fetchUserList()
}

const resetFilter = () => {
  filterForm.value = {
    username: '',
    nickname: '',
    role: '',
    status: '',
    email: '',
    registerDate: [],
    updateDate: []
  }
  handleFilter()
}

const handleResetPassword = (user: User) => {
  currentUserId.value = user._id
  resetPasswordForm.value = {
    password: '',
    confirmPassword: ''
  }
  resetPasswordDialogVisible.value = true
}

const confirmResetPassword = async () => {
  if (!resetPasswordForm.value.password) {
    ElMessage.warning('请输入新密码')
    return
  }
  if (resetPasswordForm.value.password !== resetPasswordForm.value.confirmPassword) {
    ElMessage.warning('两次输入的密码不一致')
    return
  }

  try {
    await resetUserPassword(currentUserId.value, resetPasswordForm.value.password)
    ElMessage.success('密码重置成功')
    resetPasswordDialogVisible.value = false
  } catch (error) {
    ElMessage.error('密码重置失败')
  }
}

onMounted(() => {
  fetchUserList()
})
</script>

<style scoped>
.users-container {
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.search-box {
  width: 300px;
}

.filter-form {
  margin-bottom: 20px;
  padding: 15px;
  background-color: #fff;
  /* border-radius: 8px; */
  /* box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1); */
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.user-detail {
  padding: 20px;
}

.wide-select {
  width: 200px;
}

</style>