<template>
  <div class="correction-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>补卡申请</span>
          <el-button type="primary" @click="showDialog = true">新建申请</el-button>
        </div>
      </template>
      
      <el-table :data="correctionList" stripe>
        <el-table-column prop="date" label="补卡日期" width="120" />
        <el-table-column prop="type" label="补卡类型" width="100">
          <template #default="{ row }">
            <el-tag>{{ row.type === 'check_in' ? '签到' : '签退' }}</el-tag>
          </template>
        </el-table-column>
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
        @current-change="fetchCorrections"
        style="margin-top: 20px; justify-content: flex-end"
      />
    </el-card>
    
    <el-dialog v-model="showDialog" title="新建补卡申请" width="500px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="80px">
        <el-form-item label="补卡日期" prop="date">
          <el-date-picker v-model="form.date" type="date" placeholder="选择日期" value-format="YYYY-MM-DD" />
        </el-form-item>
        <el-form-item label="补卡类型" prop="type">
          <el-radio-group v-model="form.type">
            <el-radio label="check_in">签到</el-radio>
            <el-radio label="check_out">签退</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="原因" prop="reason">
          <el-input v-model="form.reason" type="textarea" :rows="3" placeholder="请填写补卡原因" />
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
const correctionList = ref([])
const pagination = reactive({ page: 1, pageSize: 10, total: 0 })

const form = reactive({
  date: '',
  type: 'check_in',
  reason: ''
})

const rules = {
  date: [{ required: true, message: '请选择日期', trigger: 'change' }],
  type: [{ required: true, message: '请选择类型', trigger: 'change' }],
  reason: [{ required: true, message: '请填写原因', trigger: 'blur' }]
}

const getStatusType = (status) => {
  const types = { pending: 'warning', approved: 'success', rejected: 'danger' }
  return types[status] || 'info'
}

const getStatusText = (status) => {
  const texts = { pending: '待审批', approved: '已批准', rejected: '已拒绝' }
  return texts[status] || status
}

const fetchCorrections = async () => {
  try {
    const res = await api.get('/correction', { params: pagination })
    correctionList.value = res.data.list
    pagination.total = res.data.total
  } catch (error) {
    console.error(error)
  }
}

const handleSubmit = async () => {
  await formRef.value.validate()
  try {
    await api.post('/correction', form)
    ElMessage.success('提交成功')
    showDialog.value = false
    formRef.value.resetFields()
    fetchCorrections()
  } catch (error) {
    console.error(error)
  }
}

const handleDelete = async (id) => {
  try {
    await ElMessageBox.confirm('确定要删除该申请吗？', '提示', { type: 'warning' })
    await api.delete(`/correction/${id}`)
    ElMessage.success('删除成功')
    fetchCorrections()
  } catch (error) {
    console.error(error)
  }
}

onMounted(() => {
  fetchCorrections()
})
</script>
