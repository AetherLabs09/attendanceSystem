<template>
  <div class="leave-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>请假申请</span>
          <el-button type="primary" @click="showDialog = true">新建申请</el-button>
        </div>
      </template>
      
      <el-table :data="leaveList" stripe>
        <el-table-column prop="leave_type" label="请假类型" width="100">
          <template #default="{ row }">
            <el-tag>{{ row.leave_type }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="start_date" label="开始日期" width="120" />
        <el-table-column prop="end_date" label="结束日期" width="120" />
        <el-table-column prop="days" label="天数" width="80" />
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
        @current-change="fetchLeaves"
        style="margin-top: 20px; justify-content: flex-end"
      />
    </el-card>
    
    <el-dialog v-model="showDialog" title="新建请假申请" width="500px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="80px">
        <el-form-item label="请假类型" prop="leave_type">
          <el-select v-model="form.leave_type" placeholder="请选择">
            <el-option label="事假" value="事假" />
            <el-option label="病假" value="病假" />
            <el-option label="年假" value="年假" />
            <el-option label="婚假" value="婚假" />
            <el-option label="产假" value="产假" />
            <el-option label="陪产假" value="陪产假" />
            <el-option label="丧假" value="丧假" />
          </el-select>
        </el-form-item>
        <el-form-item label="日期范围" prop="dateRange">
          <el-date-picker
            v-model="form.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item label="天数" prop="days">
          <el-input-number v-model="form.days" :min="0.5" :step="0.5" />
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
const leaveList = ref([])
const pagination = reactive({ page: 1, pageSize: 10, total: 0 })

const form = reactive({
  leave_type: '',
  dateRange: [],
  days: 1,
  reason: ''
})

const rules = {
  leave_type: [{ required: true, message: '请选择请假类型', trigger: 'change' }],
  dateRange: [{ required: true, message: '请选择日期范围', trigger: 'change' }],
  days: [{ required: true, message: '请输入天数', trigger: 'blur' }]
}

const getStatusType = (status) => {
  const types = { pending: 'warning', approved: 'success', rejected: 'danger' }
  return types[status] || 'info'
}

const getStatusText = (status) => {
  const texts = { pending: '待审批', approved: '已批准', rejected: '已拒绝' }
  return texts[status] || status
}

const fetchLeaves = async () => {
  try {
    const res = await api.get('/leave', { params: pagination })
    leaveList.value = res.data.list
    pagination.total = res.data.total
  } catch (error) {
    console.error(error)
  }
}

const handleSubmit = async () => {
  await formRef.value.validate()
  try {
    await api.post('/leave', {
      leave_type: form.leave_type,
      start_date: form.dateRange[0],
      end_date: form.dateRange[1],
      days: form.days,
      reason: form.reason
    })
    ElMessage.success('提交成功')
    showDialog.value = false
    formRef.value.resetFields()
    fetchLeaves()
  } catch (error) {
    console.error(error)
  }
}

const handleDelete = async (id) => {
  try {
    await ElMessageBox.confirm('确定要删除该申请吗？', '提示', { type: 'warning' })
    await api.delete(`/leave/${id}`)
    ElMessage.success('删除成功')
    fetchLeaves()
  } catch (error) {
    console.error(error)
  }
}

onMounted(() => {
  fetchLeaves()
})
</script>
