<template>
  <div class="correction-approve-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>补卡审批</span>
        </div>
      </template>
      
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部" clearable>
            <el-option label="待审批" value="pending" />
            <el-option label="已批准" value="approved" />
            <el-option label="已拒绝" value="rejected" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchCorrections">查询</el-button>
        </el-form-item>
      </el-form>
      
      <el-table :data="correctionList" stripe>
        <el-table-column prop="employee_no" label="工号" width="100" />
        <el-table-column prop="employee_name" label="姓名" width="100" />
        <el-table-column prop="department_name" label="部门" width="120" />
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
        <el-table-column label="操作" width="150">
          <template #default="{ row }">
            <template v-if="row.status === 'pending'">
              <el-button type="success" link @click="handleApprove(row.id, 'approved')">批准</el-button>
              <el-button type="danger" link @click="handleApprove(row.id, 'rejected')">拒绝</el-button>
            </template>
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
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import api from '../../utils/api'

const searchForm = reactive({ status: 'pending' })
const correctionList = ref([])
const pagination = reactive({ page: 1, pageSize: 10, total: 0 })

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
    const res = await api.get('/correction', { params: { ...searchForm, ...pagination } })
    correctionList.value = res.data.list
    pagination.total = res.data.total
  } catch (error) {
    console.error(error)
  }
}

const handleApprove = async (id, status) => {
  try {
    const { value: remark } = await ElMessageBox.prompt(
      status === 'approved' ? '批准备注（可选）' : '拒绝原因',
      status === 'approved' ? '批准补卡' : '拒绝补卡',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputPlaceholder: '请输入'
      }
    )
    
    await api.post(`/correction/${id}/approve`, { status, remark: remark || '' })
    ElMessage.success(status === 'approved' ? '已批准并修正考勤记录' : '已拒绝')
    fetchCorrections()
  } catch (error) {
    if (error !== 'cancel') {
      console.error(error)
    }
  }
}

onMounted(() => {
  fetchCorrections()
})
</script>

<style scoped>
.search-form {
  margin-bottom: 20px;
}
</style>
