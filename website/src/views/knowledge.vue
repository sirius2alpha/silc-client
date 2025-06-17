<template>
  <div class="knowledge-container">
    <div class="page-header">
      <h2>知识库管理</h2>
      <div class="header-buttons">
        <el-button type="primary" @click="handleUpload">
          <el-icon><Upload /></el-icon>
          上传知识
        </el-button>
        <el-button type="success" @click="handleBatchUpload">
          <el-icon><DocumentAdd /></el-icon>
          批量上传
        </el-button>
      </div>
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

    <!-- 批量上传对话框 -->
    <el-dialog
      v-model="batchUploadVisible"
      title="批量上传知识"
      width="80%"
      :close-on-click-modal="false"
    >
      <div class="batch-upload-container">
        <!-- 文件上传区域 -->
        <div v-if="parsedKnowledgeList.length === 0" class="file-upload-area">
          <div class="template-download">
            <el-button type="info" size="small" @click="downloadTemplate">
              <el-icon><Download /></el-icon>
              下载模板文件
            </el-button>
          </div>
          
          <el-upload
            :before-upload="handleFileUpload"
            :show-file-list="false"
            accept=".xlsx,.xls,.csv"
            drag
          >
            <el-icon class="el-icon--upload"><Document /></el-icon>
            <div class="el-upload__text">
              将文件拖到此处，或<em>点击上传</em>
            </div>
            <template #tip>
              <div class="el-upload__tip">
                支持 Excel (.xlsx/.xls) 和 CSV 格式文件，文件格式要求：
                <br>
                Excel/CSV: 第一行为表头，必须包含"标题"或"title"列和"内容"或"content"列
                <br>
                可选包含"标签"或"tags"列，多个标签用逗号、分号或竖线分隔
              </div>
            </template>
          </el-upload>
        </div>

        <!-- 解析结果预览和编辑 -->
        <div v-else class="parsed-data-area">
          <div class="data-header">
            <h3>解析结果预览 (共 {{ parsedKnowledgeList.length }} 条)</h3>
            <el-button @click="parsedKnowledgeList = []">重新上传文件</el-button>
          </div>

          <el-table
            :data="parsedKnowledgeList"
            border
            max-height="400"
          >
            <el-table-column type="index" label="序号" width="60" />
            <el-table-column label="标题" min-width="200">
              <template #default="{ row, $index }">
                <el-input
                  v-model="row.title"
                  @input="editParsedItem($index, 'title', $event)"
                  placeholder="请输入标题"
                />
              </template>
            </el-table-column>
            <el-table-column label="内容" min-width="300">
              <template #default="{ row, $index }">
                <el-input
                  v-model="row.content"
                  type="textarea"
                  :rows="2"
                  @input="editParsedItem($index, 'content', $event)"
                  placeholder="请输入内容"
                />
              </template>
            </el-table-column>
            <el-table-column label="标签" min-width="200">
              <template #default="{ row, $index }">
                <div class="tags-edit-area">
                  <el-tag
                    v-for="(tag, tagIndex) in row.tags"
                    :key="tagIndex"
                    closable
                    @close="row.tags.splice(tagIndex, 1)"
                    class="tag-item"
                  >
                    {{ tag }}
                  </el-tag>
                  <el-input
                    v-model="newTagValue"
                    size="small"
                    placeholder="添加标签"
                    style="width: 80px;"
                    @keyup.enter="addTagToItem($index, newTagValue); newTagValue = ''"
                  />
                </div>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="80">
              <template #default="{ $index }">
                <el-button
                  type="danger"
                  size="small"
                  @click="removeParsedItem($index)"
                >
                  <el-icon><Delete /></el-icon>
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <!-- 上传进度 -->
          <div v-if="batchUploadLoading" class="upload-progress">
            <el-progress
              :percentage="uploadProgress"
              :status="uploadProgress === 100 ? 'success' : undefined"
            />
            <p>正在上传中... {{ uploadProgress }}%</p>
          </div>
        </div>
      </div>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="batchUploadVisible = false" :disabled="batchUploadLoading">取消</el-button>
          <el-button
            v-if="parsedKnowledgeList.length > 0"
            type="primary"
            @click="confirmBatchUpload"
            :loading="batchUploadLoading"
          >
            <el-icon><Check /></el-icon>
            确认上传 ({{ parsedKnowledgeList.length }} 条)
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Upload, Edit, Delete, PriceTag, DocumentAdd, Document, Check, Close, Download } from '@element-plus/icons-vue'
import { getKnowledgeList, manageKnowledge, batchUploadKnowledge, KnowledgeOperation } from '@/api/admin'
import request from '@/utils/request'
import { formatDateTime } from '@/utils/date'
import * as XLSX from 'xlsx'

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

// 批量上传相关状态
const batchUploadVisible = ref(false)
const uploadedFile = ref<File | null>(null)
const parsedKnowledgeList = ref<KnowledgeItem[]>([])
const batchUploadLoading = ref(false)
const uploadProgress = ref(0)
const newTagValue = ref('')

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
    const response = await getKnowledgeList({
      page: currentPage.value,
      pageSize: pageSize.value,
      keyword: searchQuery.value
    })
    
    knowledgeList.value = response.data?.items || []
    total.value = response.data?.pagination?.total || 0
  } catch (error: any) {
    console.error('获取知识列表失败:', error)
    const errorMessage = error?.response?.data?.message || error?.message || '获取知识列表失败'
    ElMessage.error(errorMessage)
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

// 批量上传相关函数
const handleBatchUpload = () => {
  batchUploadVisible.value = true
  uploadedFile.value = null
  parsedKnowledgeList.value = []
  uploadProgress.value = 0
}

const handleFileUpload = (file: File) => {
  uploadedFile.value = file
  parseFile(file)
  return false // 阻止自动上传
}

const parseFile = async (file: File) => {
  try {
    const arrayBuffer = await file.arrayBuffer()
    const workbook = XLSX.read(arrayBuffer, { type: 'array' })
    
    // 获取第一个工作表
    const firstSheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[firstSheetName]
    
    // 将工作表转换为JSON数组
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
    
    if (jsonData.length < 2) {
      ElMessage.error('文件内容为空或格式不正确')
      return
    }
    
    // 获取表头
    const headers = jsonData[0] as string[]
    
    // 查找必需列的索引
    const titleIndex = headers.findIndex(h => 
      h && (h.toLowerCase().includes('title') || h.includes('标题') || h === '标题'))
    const contentIndex = headers.findIndex(h => 
      h && (h.toLowerCase().includes('content') || h.includes('内容') || h === '内容'))
    const tagsIndex = headers.findIndex(h => 
      h && (h.toLowerCase().includes('tags') || h.includes('标签') || h === '标签'))
    
    if (titleIndex === -1) {
      ElMessage.error('未找到标题列，请确保文件包含"title"或"标题"列')
      return
    }
    
    if (contentIndex === -1) {
      ElMessage.error('未找到内容列，请确保文件包含"content"或"内容"列')
      return
    }
    
    // 解析数据行
    const parsedData: any[] = []
    for (let i = 1; i < jsonData.length; i++) {
      const row = jsonData[i] as any[]
      
      if (!row[titleIndex] || !row[contentIndex]) {
        continue // 跳过空行
      }
      
      const tags = tagsIndex !== -1 && row[tagsIndex] 
        ? String(row[tagsIndex]).split(/[,，;；|｜]/).map(t => t.trim()).filter(t => t)
        : []
      
      parsedData.push({
        title: String(row[titleIndex]).trim(),
        content: String(row[contentIndex]).trim(),
        tags: tags
      })
    }
    
    if (parsedData.length === 0) {
      ElMessage.error('没有找到有效的数据行')
      return
    }
    
    // 转换为知识项格式
    parsedKnowledgeList.value = parsedData.map((item, index) => ({
      id: `temp-${index}`,
      title: item.title,
      content: item.content,
      tags: item.tags,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }))
    
    ElMessage.success(`成功解析 ${parsedKnowledgeList.value.length} 条知识`)
  } catch (error) {
    console.error('文件解析失败:', error)
    ElMessage.error('文件解析失败，请检查文件格式')
  }
}

const editParsedItem = (index: number, field: keyof KnowledgeItem, value: any) => {
  if (field === 'tags') {
    parsedKnowledgeList.value[index].tags = Array.isArray(value) ? value : [value]
  } else if (field === 'title' || field === 'content') {
    (parsedKnowledgeList.value[index] as any)[field] = value
  }
}

const removeParsedItem = (index: number) => {
  parsedKnowledgeList.value.splice(index, 1)
}

const addTagToItem = (index: number, tag: string) => {
  if (tag.trim() && !parsedKnowledgeList.value[index].tags?.includes(tag.trim())) {
    if (!parsedKnowledgeList.value[index].tags) {
      parsedKnowledgeList.value[index].tags = []
    }
    parsedKnowledgeList.value[index].tags?.push(tag.trim())
  }
}

// 下载模板文件
const downloadTemplate = () => {
  // 创建模板数据
  const templateData = [
    ['标题', '内容', '标签'],
    ['如何查询课程表', '你可以通过以下方式查询课程表：1. 登录教务系统2. 点击"课程表查询"选项3. 选择相应的学期4. 系统会显示你的完整课程表', '教务,课程表'],
    ['如何申请缓考', '申请缓考的步骤如下：1. 在考试前至少3天提交缓考申请2. 准备相关证明材料（如医院证明等）3. 填写缓考申请表4. 提交给所在学院教务办公室5. 等待审核结果', '考试,缓考'],
    ['如何办理学生证补办', '学生证补办流程：1. 准备一寸照片2. 填写补办申请表3. 到学生事务中心办理4. 缴纳补办费用5. 等待3-5个工作日领取新证', '学生证,补办']
  ]
  
  // 创建工作簿
  const worksheet = XLSX.utils.aoa_to_sheet(templateData)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, '知识库模板')
  
  // 设置列宽
  worksheet['!cols'] = [
    { wch: 20 }, // 标题列
    { wch: 60 }, // 内容列
    { wch: 20 }  // 标签列
  ]
  
  // 下载文件
  XLSX.writeFile(workbook, '知识库批量上传模板.xlsx')
  ElMessage.success('模板文件已下载')
}

const confirmBatchUpload = async () => {
  if (parsedKnowledgeList.value.length === 0) {
    ElMessage.warning('没有可上传的知识')
    return
  }
  
  try {
    batchUploadLoading.value = true
    uploadProgress.value = 50 // 开始上传
    
    // 准备批量上传数据
    const knowledgeItems = parsedKnowledgeList.value.map(item => ({
      title: item.title,
      content: item.content,
      tags: item.tags || []
    }))
    
    // 调用批量上传API
    const response = await batchUploadKnowledge(knowledgeItems)
    
    uploadProgress.value = 100 // 完成上传
    
    if (response.result) {
      const { totalCount, successCount, failedCount, errors } = response.result
      
      // 显示详细结果
      if (failedCount && failedCount > 0) {
        console.warn('部分知识上传失败:', errors)
        ElMessage.warning(`批量上传完成，成功 ${successCount}/${totalCount} 条，${failedCount} 条失败`)
      } else {
        ElMessage.success(`批量上传完成，成功上传 ${successCount} 条知识`)
      }
    } else {
      ElMessage.success('批量上传完成')
    }
    
    batchUploadVisible.value = false
    fetchKnowledgeList()
  } catch (error: any) {
    console.error('批量上传失败:', error)
    ElMessage.error(error?.message || '批量上传失败')
  } finally {
    batchUploadLoading.value = false
  }
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

.header-buttons {
  display: flex;
  gap: 12px;
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

/* 批量上传相关样式 */
.batch-upload-container {
  min-height: 400px;
}

.file-upload-area {
  padding: 40px;
}

.template-download {
  text-align: center;
  margin-bottom: 20px;
}

.parsed-data-area {
  padding: 20px 0;
}

.data-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.data-header h3 {
  margin: 0;
  color: #303133;
}

.tags-edit-area {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: center;
}

.upload-progress {
  margin-top: 20px;
  padding: 20px;
  background-color: #f5f7fa;
  border-radius: 4px;
  text-align: center;
}

.upload-progress p {
  margin: 10px 0 0 0;
  color: #606266;
}
</style> 