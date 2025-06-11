<template>
  <div class="store-items">
    <div class="header">
      <h2>积分商品管理</h2>
      <el-button type="primary" @click="handleAdd">添加商品</el-button>
    </div>

    <el-table :data="items" style="width: 100%" v-loading="loading">
      <el-table-column prop="name" label="商品名称" />
      <el-table-column prop="points" label="所需积分" width="100" />
      <el-table-column prop="stock" label="库存" width="100" />
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="row.status === 'active' ? 'success' : 'info'">
            {{ row.status === 'active' ? '上架' : '下架' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="description" label="描述" show-overflow-tooltip />
      <el-table-column label="图片" width="100">
        <template #default="{ row }">
          <el-image 
            style="width: 50px; height: 50px" 
            :src="row.image" 
            :preview-src-list="[row.image]"
            fit="cover"
          />
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200">
        <template #default="{ row }">
          <el-button-group>
            <el-button type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button 
              :type="row.status === 'active' ? 'warning' : 'success'" 
              size="small" 
              @click="handleToggleStatus(row)"
            >
              {{ row.status === 'active' ? '下架' : '上架' }}
            </el-button>
            <el-button type="danger" size="small" @click="handleDelete(row)">删除</el-button>
          </el-button-group>
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

    <!-- 添加/编辑商品对话框 -->
    <el-dialog
      :title="dialogTitle"
      v-model="dialogVisible"
      width="500px"
    >
      <el-form :model="form" label-width="80px">
        <el-form-item label="商品名称">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="所需积分">
          <el-input-number v-model="form.points" :min="0" />
        </el-form-item>
        <el-form-item label="库存">
          <el-input-number v-model="form.stock" :min="0" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" />
        </el-form-item>
        <el-form-item label="图片">
          <el-upload
            class="avatar-uploader"
            action="/api/admin/upload"
            :show-file-list="false"
            :on-success="handleUploadSuccess"
          >
            <img v-if="form.image" :src="form.image" class="avatar" />
            <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
          </el-upload>
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
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { getStoreItems, addStoreItem, updateStoreItem, deleteStoreItem, updateStoreItemStatus } from '@/api/admin'

interface StoreItem {
  id?: string;
  name: string;
  points: number;
  stock: number;
  description: string;
  image: string;
  status: 'active' | 'inactive';
}

const loading = ref(false)
const items = ref<StoreItem[]>([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)
const dialogVisible = ref(false)
const dialogTitle = ref('添加商品')
const form = ref<StoreItem>({
  name: '',
  points: 0,
  stock: 0,
  description: '',
  image: '',
  status: 'active'
})

// 获取商品列表
const fetchItems = async () => {
  loading.value = true
  try {
    const res = await getStoreItems({
      page: currentPage.value,
      pageSize: pageSize.value
    })
    console.log('商品列表响应:', res) // 调试用
    
    // 处理新的响应格式
    if (res.data) {
      items.value = res.data.items || []
      total.value = res.data.pagination?.total || 0
    } else {
      // 兼容旧格式
      items.value = res.items || []
      total.value = res.pagination?.total || res.total || 0
    }
  } catch (error) {
    console.error('获取商品列表失败:', error)
    ElMessage.error('获取商品列表失败')
  } finally {
    loading.value = false
  }
}

// 处理分页
const handleSizeChange = (val: number) => {
  pageSize.value = val
  fetchItems()
}

const handleCurrentChange = (val: number) => {
  currentPage.value = val
  fetchItems()
}

// 处理添加商品
const handleAdd = () => {
  dialogTitle.value = '添加商品'
  form.value = {
    name: '',
    points: 0,
    stock: 0,
    description: '',
    image: '',
    status: 'active'
  }
  dialogVisible.value = true
}

// 处理编辑商品
const handleEdit = (row: any) => {
  dialogTitle.value = '编辑商品'
  form.value = { ...row }
  dialogVisible.value = true
}

// 处理切换商品状态
const handleToggleStatus = async (row: any) => {
  try {
    const newStatus = row.status === 'active' ? 'inactive' : 'active';
    await updateStoreItemStatus(row.id, newStatus);
    ElMessage.success(`${newStatus === 'active' ? '上架' : '下架'}成功`);
    fetchItems();
  } catch (error) {
    ElMessage.error('操作失败');
  }
}

// 处理删除商品
const handleDelete = (row: any) => {
  ElMessageBox.confirm('确定要删除该商品吗？', '提示', {
    type: 'warning',
    confirmButtonText: '确定',
    cancelButtonText: '取消'
  }).then(async () => {
    try {
      const result = await deleteStoreItem(row.id);
      if (result.hasRecords) {
        ElMessage.warning('该商品已有兑换记录，已自动下架');
      } else {
        ElMessage.success('删除成功');
      }
      fetchItems();
    } catch (error) {
      ElMessage.error('操作失败');
    }
  });
}

// 处理图片上传成功
const handleUploadSuccess = (res: any) => {
  form.value.image = res.data.url
}

// 处理表单提交
const handleSubmit = async () => {
  try {
    if (form.value.id) {
      await updateStoreItem(form.value.id, form.value)
      ElMessage.success('更新成功')
    } else {
      await addStoreItem(form.value)
      ElMessage.success('添加成功')
    }
    dialogVisible.value = false
    fetchItems()
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

onMounted(() => {
  fetchItems()
})
</script>

<style scoped>
.store-items {
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.avatar-uploader {
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  width: 100px;
  height: 100px;
}

.avatar-uploader:hover {
  border-color: #409eff;
}

.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 100px;
  height: 100px;
  line-height: 100px;
  text-align: center;
}

.avatar {
  width: 100px;
  height: 100px;
  display: block;
}
</style> 