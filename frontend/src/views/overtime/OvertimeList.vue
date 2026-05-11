<template>
  <div class="overtime-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>加班申请</span>
          <el-button type="primary" @click="showDialog = true">新建申请</el-button>
        </div>
      </template>
      
      <el-table :data="overtimeList" stripe>
        <el-table-column prop="date" label="加班日期" width="120" />
        <el-table-column prop="start_time" label="开始时间" width="100" />
        <el-table-column prop="end_time" label="结束时间" width="100" />
        <el-table-column prop="hours" label="时长(小时)" width="100" />
        <el-table-column prop="reason" label="原因" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">{{ getStatusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="申请时间" width="180" />
        <el-table-column label="操作" width="120">
          <template #default="{ row }">
            <el-button v-if="row.status === 'pending'" type="danger" link @click="handleDelete(row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        layout="total, prev, pager, next"
        @current-change="fetchOvertimes"
        style="margin-top: 20px; justify-content: flex-end"
      />
    </el-card>
    
    <el-dialog v-model="showDialog" title="新建加班申请" width="500px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="80px">
        <el-form-item label="加班日期" prop="date">
          <el-date-picker v-model="form.date" type="date" placeholder="选择日期" value-format="YYYY-MM-DD" />
        </el-form-item>
        <el-form-item label="时间范围" required>
          <el-col :span="11">
            <el-form-item prop="start_time">
              <el-time-select v-model="form.start_time" placeholder="开始时间" :max-time="form.end_time" />
            </el-form-item>
          </el-col>
          <el-col :span="2" style="text-align: center">-</el-col>
          <el-col :span="11">
            <el-form-item prop="end_time">
              <el-time-select v-model="form.end_time" placeholder="结束时间" :min-time="form.start_time" />
            </el-form-item>
          </el-col>
        </el-form-item>
        <el-form-item label="时长" prop="hours">
          <el-input-number v-model="form.hours" :min="0.5" :step="0.5" />
        </el-form-item>
        <el-form-item label="原因" prop="reason">
          <el-input v-model="form.reason" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showDialog = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">提交</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import api from '../../utils/api'

const showDialog = ref(false)
const formRef = ref()
const overtimeList = ref([])
const pagination = reactive({ page: 1, pageSize: 10, total: 0 })

const form = reactive({
  date: '',
  start_time: '',
  end_time: '',
  hours: 1,
  reason: ''
})

const rules = {
  date: [{ required: true, message: '请选择日期', trigger: 'change' }],
  start_time: [{ required: true, message: '请选择开始时间', trigger: 'change' }],
  end_time: [{ required: true, message: '请选择结束时间', trigger: 'change' }],
  hours: [{ required: true, message: '请输入时长', trigger: 'blur' }]
}

const getStatusType = (status) => {
  const types = { pending: 'warning', approved: 'success', rejected: 'danger' }
  return types[status] || 'info'
}

const getStatusText = (status) => {
  const texts = { pending: '待审批', approved: '已批准', rejected: '已拒绝' }
  return texts[status] || status
}

const fetchOvertimes = async () => {
  try {
    const res = await api.get('/overtime', { params: pagination })
    overtimeList.value = res.data.list
    pagination.total = res.data.total
  } catch (error) {
    console.error(error)
  }
}

const handleSubmit = async () => {
  await formRef.value.validate()
  try {
    await api.post('/overtime', form)
    ElMessage.success('提交成功')
    showDialog.value = false
    formRef.value.resetFields()
    fetchOvertimes()
  } catch (error) {
    console.error(error)
  }
}

const handleDelete = async (id) => {
  try {
    await ElMessageBox.confirm('确定要删除该申请吗？', '提示', { type: 'warning' })
    await api.delete(`/overtime/${id}`)
    ElMessage.success('删除成功')
    fetchOvertimes()
  } catch (error) {
    console.error(error)
  }
}

onMounted(() => {
  fetchOvertimes()
})
</script>
