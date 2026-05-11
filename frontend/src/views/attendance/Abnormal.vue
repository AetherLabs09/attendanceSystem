<template>
  <div class="abnormal-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>异常考勤</span>
        </div>
      </template>
      
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="日期">
          <el-date-picker v-model="searchForm.date" type="date" placeholder="选择日期" value-format="YYYY-MM-DD" />
        </el-form-item>
        <el-form-item label="异常类型">
          <el-select v-model="searchForm.type" placeholder="全部" clearable>
            <el-option label="迟到" value="late" />
            <el-option label="早退" value="early_leave" />
            <el-option label="旷工" value="absent" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchAbnormal">查询</el-button>
        </el-form-item>
      </el-form>
      
      <el-table :data="abnormalList" stripe>
        <el-table-column prop="date" label="日期" width="120" />
        <el-table-column prop="employee_no" label="工号" width="100" />
        <el-table-column prop="employee_name" label="姓名" width="100" />
        <el-table-column prop="department_name" label="部门" width="120" />
        <el-table-column prop="check_in_time" label="签到时间" width="100" />
        <el-table-column prop="check_out_time" label="签退时间" width="100" />
        <el-table-column prop="status" label="异常类型" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">{{ getStatusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="late_minutes" label="迟到(分钟)" width="100" />
        <el-table-column prop="early_leave_minutes" label="早退(分钟)" width="100" />
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import api from '../../utils/api'

const searchForm = reactive({
  date: '',
  type: ''
})
const abnormalList = ref([])

const getStatusType = (status) => {
  if (status?.includes('late')) return 'warning'
  if (status?.includes('early_leave')) return 'warning'
  if (status === 'absent') return 'danger'
  return 'info'
}

const getStatusText = (status) => {
  if (status === 'absent') return '旷工'
  if (status?.includes('late') && status?.includes('early_leave')) return '迟到+早退'
  if (status?.includes('late')) return '迟到'
  if (status?.includes('early_leave')) return '早退'
  return status
}

const fetchAbnormal = async () => {
  try {
    const res = await api.get('/attendance/abnormal', { params: searchForm })
    abnormalList.value = res.data
  } catch (error) {
    console.error(error)
  }
}

onMounted(() => {
  fetchAbnormal()
})
</script>

<style scoped>
.search-form {
  margin-bottom: 20px;
}
</style>
