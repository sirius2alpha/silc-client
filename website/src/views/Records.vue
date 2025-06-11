<template>
  <div class="store-records">
    <!-- 核销区域 -->
    <div class="verify-section">
      <h2>兑换码核销</h2>
      <div class="verify-input">
        <el-input
          v-model="verifyCode"
          placeholder="请输入兑换码"
          style="width: 300px"
          @keyup.enter="handleVerify"
        />
        <el-button type="primary" @click="handleVerify" :loading="verifying">
          核销
        </el-button>
      </div>
    </div>

    <!-- 未核销统计 -->
    <div class="pending-stats">
      <h3>待核销商品统计</h3>
      <el-table :data="pendingStats" style="width: 100%" border>
        <el-table-column prop="name" label="商品名称" />
        <el-table-column prop="count" label="待核销数量" width="120" />
      </el-table>
    </div>

    <!-- 兑换记录列表 -->
    <div class="records-section">
      <h2>兑换记录</h2>
      <div class="search-bar">
        <el-input
          v-model="search"
          placeholder="搜索订单号"
          style="width: 200px"
          clearable
        />
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="YYYY-MM-DD"
        />
        <el-button type="primary" @click="handleSearch">搜索</el-button>
      </div>

      <el-table :data="records" style="width: 100%" v-loading="loading">
        <el-table-column prop="orderNo" label="订单号" width="180" />
        <el-table-column prop="itemName" label="商品名称" />
        <el-table-column label="兑换状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.isRedeemed ? 'success' : 'warning'">
              {{ row.isRedeemed ? '已核销' : '待核销' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="兑换时间" width="180" >
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column prop="redeemedAt" label="核销时间" width="180" >
          <template #default="{ row }">
            {{ row.redeemedAt ? formatDate(row.redeemedAt) : '-' }}
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
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getExchangeRecords, verifyByCode } from '@/api/admin'
import { formatDateTime } from '@/utils/date'

const loading = ref(false)
const verifying = ref(false)
const records = ref([])
const pendingStats = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)
const search = ref('')
const dateRange = ref([])
const verifyCode = ref('')


// 获取兑换记录
const fetchRecords = async () => {
  loading.value = true
  try {
    const res = await getExchangeRecords({
      page: currentPage.value,
      pageSize: pageSize.value,
      search: search.value,
      startDate: dateRange.value?.[0],
      endDate: dateRange.value?.[1]
    })
    console.log('兑换记录响应:', res) // 调试用
    
    // 处理响应数据格式
    if (res.data) {
      records.value = res.data.list || []
      total.value = res.data.pagination?.total || 0
      // 处理待核销统计数据
      pendingStats.value = res.data.pendingStats || []
    } else {
      // 兼容旧格式
      records.value = res.list || res.items || []
      total.value = res.pagination?.total || res.total || 0
      pendingStats.value = res.pendingStats || []
    }
  } catch (error) {
    console.error('获取兑换记录失败:', error)
    ElMessage.error('获取兑换记录失败')
  } finally {
    loading.value = false
  }
}

// 处理搜索
const handleSearch = () => {
  currentPage.value = 1
  fetchRecords()
}

// 处理分页
const handleSizeChange = (val: number) => {
  pageSize.value = val
  fetchRecords()
}

const handleCurrentChange = (val: number) => {
  currentPage.value = val
  fetchRecords()
}

// 处理核销
const handleVerify = async () => {
  if (!verifyCode.value) {
    ElMessage.warning('请输入兑换码')
    return
  }

  verifying.value = true
  try {
    const res = await verifyByCode(verifyCode.value)
    ElMessage.success('核销成功')
    verifyCode.value = ''
    fetchRecords() // 刷新列表和统计
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || '核销失败')
  } finally {
    verifying.value = false
  }
}



const formatDate = (date: string) => {
  return formatDateTime(date)
}

onMounted(() => {
  fetchRecords()
})
</script>

<style scoped>
.store-records {
  padding: 20px;
}

.verify-section {
  background: #fff;
  padding: 20px;
  border-radius: 4px;
  margin-bottom: 20px;
}

.verify-input {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

.pending-stats {
  background: #fff;
  padding: 20px;
  border-radius: 4px;
  margin-bottom: 20px;
}

.records-section {
  background: #fff;
  padding: 20px;
  border-radius: 4px;
}

.search-bar {
  display: flex;
  gap: 10px;
  margin: 20px 0;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style> 