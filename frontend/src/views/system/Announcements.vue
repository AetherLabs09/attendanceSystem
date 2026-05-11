<template>
  <div class="announcements-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>公告管理</span>
          <el-button type="primary" @click="handleAdd">发布公告</el-button>
        </div>
      </template>
      
      <el-table :data="announcements" stripe>
        <el-table-column prop="title" label="标题" />
        <el-table-column prop="publisher_name" label="发布人" width="120" />
        <el-table-column prop="publish_time" label="发布时间" width="180" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'published' ? 'success' : 'info'">
              {{ row.status === 'published' ? '已发布' : '草稿' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
            <el-button 
              v-if="row.status === 'draft'" 
              type="success" 
              link 
              @click="handlePublish(row)"
            >
              发布
            </el-button>
            <el-button type="danger" link @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
    
    <el-dialog v-model="showDialog" :title="isEdit ? '编辑公告' : '发布公告'" width="600px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="80px">
        <el-form-item label="标题" prop="title">
          <el-input v-model="form.title" />
        </el-form-item>
        <el-form-item label="内容" prop="content">
          <el-input v-model="form.content" type="textarea" :rows="6" />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="form.status">
            <el-radio label="draft">保存草稿</el-radio>
            <el-radio label="published">立即发布</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showDialog = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import api from '../../utils/api'

const showDialog = ref(false)
const isEdit = ref(false)
const formRef = ref()
const announcements = ref([])

const form = reactive({
  id: null,
  title: '',
  content: '',
  status: 'draft'
})

const rules = {
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  content: [{ required: true, message: '请输入内容', trigger: 'blur' }]
}

const fetchAnnouncements = async () => {
  try {
    const res = await api.get('/system/announcements/all')
    announcements.value = res.data
  } catch (error) {
    console.error(error)
  }
}

const handleAdd = () => {
  isEdit.value = false
  Object.assign(form, { id: null, title: '', content: '', status: 'draft' })
  showDialog.value = true
}

const handleEdit = (row) => {
  isEdit.value = true
  Object.assign(form, row)
  showDialog.value = true
}

const handleSubmit = async () => {
  await formRef.value.validate()
  try {
    if (isEdit.value) {
      await api.put(`/system/announcements/${form.id}`, form)
      ElMessage.success('更新成功')
    } else {
      await api.post('/system/announcements', form)
      ElMessage.success('创建成功')
    }
    showDialog.value = false
    fetchAnnouncements()
  } catch (error) {
    console.error(error)
  }
}

const handlePublish = async (row) => {
  try {
    await api.put(`/system/announcements/${row.id}`, { ...row, status: 'published' })
    ElMessage.success('发布成功')
    fetchAnnouncements()
  } catch (error) {
    console.error(error)
  }
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除该公告吗？', '提示', { type: 'warning' })
    await api.delete(`/system/announcements/${row.id}`)
    ElMessage.success('删除成功')
    fetchAnnouncements()
  } catch (error) {
    console.error(error)
  }
}

onMounted(() => {
  fetchAnnouncements()
})
</script>
