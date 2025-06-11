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
      <el-table-column prop="tags" label="标签" width="200">
        <template #default="{ row }">
          <div class="tags-container">
            <el-tag
              v-for="(tag, index) in (row.tags || [])"
              :key="`${row.id}-tag-${index}`"
              size="small"
              class="tag-item"
            >
              {{ tag }}
            </el-tag>
            <span v-if="!row.tags || row.tags.length === 0" class="no-tags">暂无标签</span>
          </div>
        </template>
      </el-table-column>
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
        <el-form-item label="标签" prop="tags">
          <div class="tags-editor">
            <div class="current-tags">
              <el-tag
                v-for="(tag, index) in form.tags"
                :key="index"
                :closable="true"
                size="small"
                class="tag-item"
                @close="removeTag(index)"
              >
                {{ tag }}
              </el-tag>
            </div>
            <div class="tag-input-section">
              <el-autocomplete
                v-model="newTagInput"
                :fetch-suggestions="querySearchTags"
                placeholder="输入新标签"
                class="tag-input"
                clearable
                @select="addExistingTag"
                @keyup.enter="addNewTag"
              >
                                 <template #default="{ item }">
                   <div class="suggestion-item">
                     <el-icon><PriceTag /></el-icon>
                     <span>{{ item.value }}</span>
                   </div>
                 </template>
              </el-autocomplete>
              <el-button type="primary" size="small" @click="addNewTag">添加标签</el-button>
            </div>
            <div v-if="availableTags.length > 0" class="available-tags">
              <span class="available-tags-label">常用标签：</span>
              <el-tag
                v-for="(tag, index) in availableTags.slice(0, 10)"
                :key="`available-tag-${index}`"
                size="small"
                class="available-tag"
                :class="{ 'tag-selected': form.tags.includes(tag) }"
                @click="toggleTag(tag)"
              >
                {{ tag }}
              </el-tag>
            </div>
          </div>
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
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Upload, Edit, Delete, PriceTag } from '@element-plus/icons-vue'
import { getKnowledgeList, manageKnowledge, KnowledgeOperation } from '@/api/admin'
import request from '@/utils/request'
import { formatDateTime } from '@/utils/date'

interface KnowledgeItem {
  id: string
  title: string
  content: string
  createdAt: string
  robotName?: string
  category?: string
  tags?: string[]
  status?: string
  embeddings?: boolean
  vector?: Record<string, number>
  updatedAt: string
  __v?: number
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
const newTagInput = ref('')
const currentEditingId = ref('')

const form = reactive({
  title: '',
  content: '',
  tags: [] as string[]
})

const rules = {
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  content: [{ required: true, message: '请输入内容', trigger: 'blur' }]
}

// 计算所有可用的标签
const availableTags = computed(() => {
  const allTags = new Set<string>()
  knowledgeList.value.forEach(item => {
    if (item.tags && Array.isArray(item.tags)) {
      item.tags.forEach(tag => allTags.add(tag))
    }
  })
  return Array.from(allTags).filter(tag => !form.tags.includes(tag))
})

// 标签搜索建议
const querySearchTags = (queryString: string, cb: (suggestions: any[]) => void) => {
  const suggestions = availableTags.value
    .filter(tag => tag.toLowerCase().includes(queryString.toLowerCase()))
    .map(tag => ({ value: tag }))
  cb(suggestions)
}

// 添加新标签
const addNewTag = () => {
  const tag = newTagInput.value.trim()
  if (tag && !form.tags.includes(tag)) {
    form.tags.push(tag)
    newTagInput.value = ''
  } else if (form.tags.includes(tag)) {
    ElMessage.warning('标签已存在')
  }
}

// 添加现有标签
const addExistingTag = (item: { value: string }) => {
  if (!form.tags.includes(item.value)) {
    form.tags.push(item.value)
    newTagInput.value = ''
  }
}

// 切换标签（添加或移除）
const toggleTag = (tag: string) => {
  const index = form.tags.indexOf(tag)
  if (index > -1) {
    form.tags.splice(index, 1)
  } else {
    form.tags.push(tag)
  }
}

// 移除标签
const removeTag = (index: number) => {
  form.tags.splice(index, 1)
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
  form.tags = []
  newTagInput.value = ''
  currentEditingId.value = ''
  dialogVisible.value = true
}

const handleEdit = (row: KnowledgeItem) => {
  dialogType.value = 'edit'
  form.title = row.title
  form.content = row.content
  form.tags = [...(row.tags || [])]
  newTagInput.value = ''
  currentEditingId.value = row.id
  dialogVisible.value = true
}

const handleDelete = async (row: KnowledgeItem) => {
  try {
    await ElMessageBox.confirm('确定要删除这条知识吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await manageKnowledge({
      operation: KnowledgeOperation.DELETE,
      knowledge_id: row.id,
      knowledge_data: {
        title: row.title,
        content: row.content,
        tags: row.tags || []
      }
    })
    ElMessage.success('删除成功')
    fetchKnowledgeList()
  } catch (error) {
    // 用户取消删除
  }
}

const handleSubmit = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
  } catch (error) {
    console.error('表单验证失败:', error)
    return
  }
  
  try {
    if (dialogType.value === 'upload') {
      await manageKnowledge({
        operation: KnowledgeOperation.CREATE,
        knowledge_id: '',
        knowledge_data: {
          title: form.title,
          content: form.content,
          tags: form.tags
        }
      })
      ElMessage.success('上传成功')
    } else {
      await manageKnowledge({
        operation: KnowledgeOperation.UPDATE,
        knowledge_id: currentEditingId.value,
        knowledge_data: {
          title: form.title,
          content: form.content,
          tags: form.tags
        }
      })
      ElMessage.success('更新成功')
    }
    dialogVisible.value = false
    fetchKnowledgeList()
  } catch (error) {
    console.error('操作失败:', error)
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

/* 标签相关样式 */
.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: center;
}

.tag-item {
  margin: 2px;
}

.no-tags {
  color: #909399;
  font-size: 12px;
}

.tags-editor {
  width: 100%;
}

.current-tags {
  margin-bottom: 10px;
  min-height: 32px;
  padding: 6px;
  border: 1px dashed #d9d9d9;
  border-radius: 4px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}

.current-tags:empty::before {
  content: '暂无标签';
  color: #c0c4cc;
  font-size: 14px;
}

.tag-input-section {
  display: flex;
  gap: 8px;
  margin-bottom: 10px;
  align-items: center;
}

.tag-input {
  flex: 1;
  max-width: 200px;
}

.available-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
  padding: 8px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.available-tags-label {
  color: #606266;
  font-size: 12px;
  margin-right: 8px;
  flex-shrink: 0;
}

.available-tag {
  cursor: pointer;
  transition: all 0.3s;
}

.available-tag:hover {
  background-color: #ecf5ff;
  border-color: #b3d8ff;
  color: #409eff;
}

.available-tag.tag-selected {
  background-color: #409eff;
  border-color: #409eff;
  color: white;
}

.suggestion-item {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style> 