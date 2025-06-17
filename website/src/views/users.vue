<template>
  <div class="users-container">
    <div class="header">
      <h2>用户管理</h2>
    </div>

    <!-- 添加筛选表单 -->
    <el-form :model="filterForm" class="filter-form" inline>
      <el-form-item label="用户ID">
        <el-input v-model="filterForm.userId" placeholder="用户ID" clearable @clear="handleFilter" />
      </el-form-item>
      <el-form-item label="用户名">
        <el-input v-model="filterForm.username" placeholder="用户名" clearable @clear="handleFilter" />
      </el-form-item>
      <el-form-item label="昵称">
        <el-input v-model="filterForm.nickname" placeholder="昵称" clearable @clear="handleFilter" />
      </el-form-item>
      <el-form-item label="手机号">
        <el-input v-model="filterForm.phone" placeholder="手机号" clearable @clear="handleFilter" />
      </el-form-item>
      <el-form-item label="角色">
        <el-select class="wide-select" v-model="filterForm.role" placeholder="选择角色" clearable @clear="handleFilter">
          <el-option label="管理员" value="admin" />
          <el-option label="普通用户" value="user" />
        </el-select>
      </el-form-item>
      <el-form-item label="选择的机器人">
        <el-select class="wide-select" v-model="filterForm.selectedRobot" placeholder="选择机器人" clearable @clear="handleFilter">
          <el-option label="悉文" value="xiwen" />
          <el-option label="悉荟" value="xihui" />
        </el-select>
      </el-form-item>
      <el-form-item label="状态">
        <el-select class="wide-select" v-model="filterForm.status" placeholder="选择状态" clearable @clear="handleFilter">
          <el-option label="正常" value="active" />
          <el-option label="禁用" value="inactive" />
          <el-option label="未知" value="unknown" />
        </el-select>
      </el-form-item>
      <el-form-item label="积分范围">
        <el-input-number v-model="filterForm.pointsMin" placeholder="最小积分" :min="0" controls-position="right" style="width: 120px;" @change="handleFilter" />
        <span style="margin: 0 8px;">-</span>
        <el-input-number v-model="filterForm.pointsMax" placeholder="最大积分" :min="0" controls-position="right" style="width: 120px;" @change="handleFilter" />
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
      <el-table-column prop="id" label="用户ID" width="150">
        <template #default="{ row }">
          <el-button 
            v-if="row.id"
            type="text" 
            class="userid-btn" 
            @click="copyUserid(row.id)"
            :title="'点击复制用户ID: ' + row.id"
          >
            {{ row.id }}
          </el-button>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column prop="username" label="用户名" width="120" />
      <el-table-column prop="nickname" label="昵称" width="100">
        <template #default="{ row }">
          {{ row.nickname || '-' }}
        </template>
      </el-table-column>
      <el-table-column prop="avatar" label="头像" width="80">
        <template #default="{ row }">
          <img v-if="row.avatar" :src="row.avatar" style="width: 30px; height: 30px; border-radius: 50%;" />
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column prop="selectedRobot" label="机器人" width="80">
        <template #default="{ row }">
          <el-tag 
            v-if="row.selectedRobot || row.selected_robot"
            :type="getRobotInfo((row.selectedRobot || row.selected_robot) || '').type" 
            size="small"
          >
            {{ getRobotInfo((row.selectedRobot || row.selected_robot) || '').name }}
          </el-tag>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column prop="points" label="积分" width="70">
        <template #default="{ row }">
          {{ row.points || 0 }}
        </template>
      </el-table-column>
      <el-table-column prop="role" label="角色" width="90">
        <template #default="{ row }">
          <el-tag :type="row.role === 'admin' ? 'danger' : 'primary'" size="small">
            {{ row.role === 'admin' ? '管理员' : '普通用户' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="80">
        <template #default="{ row }">
          <el-tag :type="getStatusType(row.status)" size="small">
            {{ getStatusText(row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="phone" label="手机号" width="120">
        <template #default="{ row }">
          {{ row.phone || '-' }}
        </template>
      </el-table-column>
      <el-table-column prop="lastLoginAt" label="最后登录" width="150">
        <template #default="{ row }">
          {{ row.lastLoginAt ? formatDate(row.lastLoginAt) : '-' }}
        </template>
      </el-table-column>
      <el-table-column prop="createdAt" label="注册时间" width="150">
        <template #default="{ row }">
          {{ formatDate(row.createdAt) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="300" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" size="small" @click="handleViewDetail(row)">
            查看
          </el-button>
          <el-button :type="getToggleButtonType(row.status)" size="small"
            @click="handleToggleStatus(row)">
            {{ getToggleButtonText(row.status) }}
          </el-button>
          <el-button type="warning" size="small" @click="handleResetPassword(row)">
            重置密码
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination">
      <el-pagination 
        v-model:current-page="currentPage" 
        v-model:page-size="pageSize" 
        :page-sizes="[10, 20, 50, 100]"
        :total="total" 
        layout="total, sizes, prev, pager, next" 
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange" 
      />
    </div>

    <!-- 用户详情对话框 -->
    <el-dialog v-model="dialogVisible" title="用户详情" width="50%">
      <div v-if="currentUser" class="user-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="用户ID">
            <el-button 
              v-if="currentUser.id"
              type="text" 
              class="userid-btn-small" 
              @click="copyUserid(currentUser.id)"
              :title="'点击复制用户ID: ' + currentUser.id"
            >
              {{ currentUser.id }}
            </el-button>
            <span v-else>-</span>
          </el-descriptions-item>
          <el-descriptions-item label="用户名">{{ currentUser.username || '-' }}</el-descriptions-item>
          <el-descriptions-item label="昵称">{{ currentUser.nickname || '-' }}</el-descriptions-item>
          <el-descriptions-item label="头像">
            <img v-if="currentUser.avatar" :src="currentUser.avatar" style="width: 50px; height: 50px; border-radius: 50%;" />
            <span v-else>-</span>
          </el-descriptions-item>
          <el-descriptions-item label="积分">{{ currentUser.points || 0 }}</el-descriptions-item>
          <el-descriptions-item label="角色">
            <el-tag :type="currentUser.role === 'admin' || currentUser.isAdmin ? 'danger' : 'primary'">
              {{ currentUser.role === 'admin' || currentUser.isAdmin ? '管理员' : '普通用户' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getStatusType(currentUser.status)">
              {{ getStatusText(currentUser.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="选择的机器人">
            <el-tag 
              v-if="currentUser.selectedRobot || currentUser.selected_robot"
              :type="getRobotInfo((currentUser.selectedRobot || currentUser.selected_robot) || '').type" 
              size="small"
            >
              {{ getRobotInfo((currentUser.selectedRobot || currentUser.selected_robot) || '').name }}
            </el-tag>
            <span v-else>-</span>
          </el-descriptions-item>
          <el-descriptions-item label="微信ID">{{ currentUser.wechatId || currentUser.wechat_id || '-' }}</el-descriptions-item>
          <el-descriptions-item label="手机号">{{ currentUser.phone || '-' }}</el-descriptions-item>
          <el-descriptions-item label="登录方式">{{ getLoginTypeText(currentUser.loginType) || '-' }}</el-descriptions-item>
          <el-descriptions-item label="最后登录时间">{{ currentUser.lastLoginAt ? formatDate(currentUser.lastLoginAt) : '-' }}</el-descriptions-item>
          <el-descriptions-item label="最后登录IP">{{ currentUser.lastLoginIp || '-' }}</el-descriptions-item>
          <el-descriptions-item label="注册时间">{{ currentUser.createdAt ? formatDate(currentUser.createdAt) : '-' }}</el-descriptions-item>
          <el-descriptions-item label="最后更新">{{ currentUser.updatedAt ? formatDate(currentUser.updatedAt) : '-' }}</el-descriptions-item>
          <el-descriptions-item label="删除时间">{{ currentUser.deletedAt ? formatDate(currentUser.deletedAt) : '-' }}</el-descriptions-item>
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
  id?: string
  username: string
  nickname?: string
  avatar?: string
  selectedRobot?: string
  selected_robot?: string // 后端字段名
  points?: number
  role: string
  status: string
  wechatId?: string
  wechat_id?: string // 后端字段名
  phone?: string
  lastLoginAt?: string
  lastLoginIp?: string
  loginType?: string
  createdAt: string
  updatedAt: string
  deletedAt?: string
  // 兼容性字段
  email?: string
  isAdmin?: boolean
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
  userId: '',
  username: '',
  nickname: '',
  phone: '',
  role: '',
  selectedRobot: '',
  status: '',
  pointsMin: undefined,
  pointsMax: undefined,
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

// 机器人信息配置
const getRobotInfo = (robotId: string) => {
  if (!robotId) return { name: '-', type: 'info', color: '#909399' }
  
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

const fetchUserList = async () => {
  loading.value = true
  try {
    const params: any = {
      page: currentPage.value,
      pageSize: pageSize.value,
    }

    // 只添加有值的参数
    if (searchQuery.value) params.search = searchQuery.value
    if (filterForm.value.userId) params.userId = filterForm.value.userId
    if (filterForm.value.username) params.username = filterForm.value.username
    if (filterForm.value.nickname) params.nickname = filterForm.value.nickname
    if (filterForm.value.phone) params.phone = filterForm.value.phone
    if (filterForm.value.role) params.role = filterForm.value.role
    if (filterForm.value.selectedRobot) params.selectedRobot = filterForm.value.selectedRobot
    if (filterForm.value.status) params.status = filterForm.value.status
    if (filterForm.value.pointsMin !== undefined && filterForm.value.pointsMin !== null) params.pointsMin = filterForm.value.pointsMin
    if (filterForm.value.pointsMax !== undefined && filterForm.value.pointsMax !== null) params.pointsMax = filterForm.value.pointsMax
    if (filterForm.value.registerDate?.[0]) params.registerStartDate = filterForm.value.registerDate[0]
    if (filterForm.value.registerDate?.[1]) params.registerEndDate = filterForm.value.registerDate[1]
    if (filterForm.value.updateDate?.[0]) params.updateStartDate = filterForm.value.updateDate[0]
    if (filterForm.value.updateDate?.[1]) params.updateEndDate = filterForm.value.updateDate[1]

    const response = await getUserList(params)
    
    // 处理API返回的数据结构
    userList.value = response.data?.users || response.users || response.list || []
    total.value = response.data?.pagination?.total || response.pagination?.total || response.total || 0
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
    const userId = user.id
    if (!userId) {
      ElMessage.error('用户标识符缺失')
      return
    }
    const response = await getUserDetail(userId)
    
    // 处理API响应数据结构
    const userData = response.data?.user || response.data || response.user || response
    currentUser.value = userData
    dialogVisible.value = true

  } catch (error) {
    ElMessage.error('获取用户详情失败')
  }
}

const handleToggleStatus = async (user: User) => {
  if (user.status === 'unknown') {
    ElMessage.warning('当前用户状态未知，无法执行状态切换操作')
    return
  }

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

    const userId = user.id
    if (!userId) {
      ElMessage.error('用户标识符缺失')
      return
    }

    await updateUserStatus(userId, {
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
    userId: '',
    username: '',
    nickname: '',
    phone: '',
    role: '',
    selectedRobot: '',
    status: '',
    pointsMin: undefined,
    pointsMax: undefined,
    registerDate: [],
    updateDate: []
  }
  handleFilter()
}

const handleResetPassword = (user: User) => {
  const userId = user.id
  if (!userId) {
    ElMessage.error('用户标识符缺失')
    return
  }
  currentUserId.value = userId
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

const getStatusType = (status: string) => {
  if (status === 'active') return 'success'
  if (status === 'inactive') return 'danger'
  return 'info'
}

const getStatusText = (status: string) => {
  if (status === 'active') return '正常'
  if (status === 'inactive') return '禁用'
  return '未知'
}

const getToggleButtonType = (status: string) => {
  if (status === 'active') return 'danger'
  if (status === 'inactive') return 'success'
  return 'info'
}

const getToggleButtonText = (status: string) => {
  if (status === 'active') return '禁用'
  if (status === 'inactive') return '启用'
  return '未知'
}

const getLoginTypeText = (loginType?: string) => {
  if (!loginType) return '-'
  switch (loginType) {
    case 'password': return '密码登录'
    case 'wechat': return '微信登录'
    case 'phone': return '手机登录'
    case 'token': return '令牌登录'
    default: return loginType
  }
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
  max-width: 130px;
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
  max-width: 130px;
  display: inline-block;
}

.userid-btn-small:hover {
  color: #66b1ff;
  text-decoration: underline;
}
</style>