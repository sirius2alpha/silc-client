<template>
  <div class="knowledge-container">
    <div class="page-header">
      <h2>知识库管理</h2>
      <el-button type="primary" @click="handleUpload">
        <el-icon><Upload /></el-icon>
        上传知识
      </el-button>
    </div>

    <div class="search-bar">
      <el-input
        v-model="searchQuery"
        placeholder="搜索知识库"
        class="search-input"
        clearable
        @clear="handleSearch"
        @input="handleSearch"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
    </div>

    <el-table
      v-loading="loading"
      :data="knowledgeList"
      style="width: 100%"
      border
    >
      <el-table-column prop="title" label="标题" min-width="200" />
      <el-table-column prop="content" label="内容" min-width="300" show-overflow-tooltip />
      <el-table-column prop="createdAt" label="创建时间" width="180">
        <template #default="{ row }">
          {{ formatDate(row.createdAt) }}
        </template>
      </el-table-column>
      <el-table-column prop="updatedAt" label="修改时间" width="180">
        <template #default="{ row }">
          {{ formatDate(row.updatedAt) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button-group>
            <el-button type="primary" size="small" @click="handleEdit(row)">
              <el-icon><Edit /></el-icon>
              编辑
            </el-button>
            <el-button type="danger" size="small" @click="handleDelete(row)">
              <el-icon><Delete /></el-icon>
              删除
            </el-button>
          </el-button-group>
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

    <!-- 上传/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'upload' ? '上传知识' : '编辑知识'"
      width="600px"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="80px"
      >
        <el-form-item label="标题" prop="title">
          <el-input v-model="form.title" placeholder="请输入标题" />
        </el-form-item>
        <el-form-item label="内容" prop="content">
          <el-input
            v-model="form.content"
            type="textarea"
            :rows="6"
            placeholder="请输入内容"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Upload, Edit, Delete } from '@element-plus/icons-vue'
import { getKnowledgeList, uploadKnowledge, deleteKnowledge, updateKnowledge } from '@/api/admin'
import request from '@/utils/request'
import { formatDateTime } from '@/utils/date'

interface KnowledgeItem {
  _id: string
  title: string
  content: string
  createdAt: string
  robotName: string
  category: string
  tags: string[]
  status: string
  embeddings: boolean
  vector: Record<string, number>
  updatedAt: string
  __v: number
}

const loading = ref(false)
const knowledgeList = ref<KnowledgeItem[]>([])
const searchQuery = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const dialogVisible = ref(false)
const dialogType = ref<'upload' | 'edit'>('upload')
const formRef = ref()

const form = reactive({
  title: '',
  content: ''
})

const rules = {
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  content: [{ required: true, message: '请输入内容', trigger: 'blur' }]
}

const fetchKnowledgeList = async () => {
  loading.value = true
  try {
    console.log('开始获取知识库列表...')
    console.log('请求参数:', {
      page: currentPage.value,
      pageSize: pageSize.value,
      keyword: searchQuery.value
    })
    
    const response = await getKnowledgeList({
      page: currentPage.value,
      pageSize: pageSize.value,
      keyword: searchQuery.value
    })
    
    console.log('知识库列表响应:', response)
    console.log('响应类型:', typeof response)
    console.log('响应数据结构:', Object.keys(response))
    
    knowledgeList.value = response.items
    total.value = response.total
    console.log('更新后的列表:', knowledgeList.value)
  } catch (error: any) {
    console.error('获取知识列表错误:', error)
    console.error('错误详情:', {
      message: error?.message,
      stack: error?.stack,
      response: error?.response
    })
    ElMessage.error('获取知识列表失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  currentPage.value = 1
  fetchKnowledgeList()
}

const handleSizeChange = (val: number) => {
  pageSize.value = val
  fetchKnowledgeList()
}

const handleCurrentChange = (val: number) => {
  currentPage.value = val
  fetchKnowledgeList()
}

const handleUpload = () => {
  dialogType.value = 'upload'
  form.title = ''
  form.content = ''
  dialogVisible.value = true
}

const handleEdit = (row: KnowledgeItem) => {
  dialogType.value = 'edit'
  form.title = row.title
  form.content = row.content
  dialogVisible.value = true
}

const handleDelete = async (row: KnowledgeItem) => {
  try {
    await ElMessageBox.confirm('确定要删除这条知识吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await deleteKnowledge(row._id)
    ElMessage.success('删除成功')
    fetchKnowledgeList()
  } catch (error) {
    // 用户取消删除
  }
}

const handleSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate()
  
  try {
    if (dialogType.value === 'upload') {
      const formData = new FormData()
      formData.append('title', form.title)
      formData.append('content', form.content)
      await uploadKnowledge(formData)
      ElMessage.success('上传成功')
    } else {
      const currentRow = knowledgeList.value.find(item => item.title === form.title)
      if (currentRow) {
        await updateKnowledge(currentRow._id, form)
        ElMessage.success('更新成功')
      } else {
        ElMessage.error('未找到要更新的记录')
        return
      }
    }
    dialogVisible.value = false
    fetchKnowledgeList()
  } catch (error) {
    ElMessage.error(dialogType.value === 'upload' ? '上传失败' : '更新失败')
  }
}

const formatDate = (date: string) => {
  return formatDateTime(date)
}

onMounted(() => {
  fetchKnowledgeList()
})
</script>

<style scoped>
.knowledge-container {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  color: #303133;
}

.search-bar {
  margin-bottom: 20px;
}

.search-input {
  width: 300px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style> 