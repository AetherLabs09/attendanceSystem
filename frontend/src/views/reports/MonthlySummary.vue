<template>
  <div class="monthly-summary-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>月度考勤汇总</span>
        </div>
      </template>
      
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="年份">
          <el-select v-model="searchForm.year">
            <el-option v-for="y in years" :key="y" :label="y" :value="y" />
          </el-select>
        </el-form-item>
        <el-form-item label="月份">
          <el-select v-model="searchForm.month">
            <el-option v-for="m in 12" :key="m" :label="m + '月'" :value="m" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchSummary">查询</el-button>
        </el-form-item>
      </el-form>
      
      <el-descriptions title="考勤汇总" :column="3" border>
        <el-descriptions-item label="应出勤天数">{{ summary.total_days }}</el-descriptions-item>
        <el-descriptions-item label="正常打卡天数">{{ summary.normal_count }}</el-descriptions-item>
        <el-descriptions-item label="迟到次数">{{ summary.late_count }}</el-descriptions-item>
        <el-descriptions-item label="早退次数">{{ summary.early_leave_count }}</el-descriptions-item>
        <el-descriptions-item label="旷工天数">{{ summary.absent_count }}</el-descriptions-item>
        <el-descriptions-item label="请假总天数">{{ summary.leave_days }}</el-descriptions-item>
        <el-descriptions-item label="加班总时长">{{ summary.overtime_hours }}小时</el-descriptions-item>
      </el-descriptions>
      
      <el-divider />
      
      <h4>考勤明细</h4>
      <el-table :data="summary.records" stripe max-height="400">
        <el-table-column prop="date" label="日期" width="120" />
        <el-table-column prop="check_in_time" label="签到时间" width="100" />
        <el-table-column prop="check_out_time" label="签退时间" width="100" />
        <el-table-column prop="status" label="状态" width="100">
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
import { ref, reactive, computed, onMounted } from 'vue'
import api from '../../utils/api'

const currentYear = new Date().getFullYear()
const currentMonth = new Date().getMonth() + 1

const years = computed(() => {
  const arr = []
  for (let i = currentYear; i >= currentYear - 5; i--) {
    arr.push(i)
  }
  return arr
})

const searchForm = reactive({
  year: currentYear,
  month: currentMonth
})

const summary = ref({
  total_days: 0,
  normal_count: 0,
  late_count: 0,
  early_leave_count: 0,
  absent_count: 0,
  leave_days: 0,
  overtime_hours: 0,
  records: []
})

const getStatusType = (status) => {
  const types = { normal: 'success', late: 'warning', early_leave: 'warning', absent: 'danger' }
  return types[status] || 'info'
}

const getStatusText = (status) => {
  const texts = { normal: '正常', late: '迟到', early_leave: '早退', absent: '旷工' }
  return texts[status] || status
}

const fetchSummary = async () => {
  try {
    const res = await api.get('/attendance/monthly-summary', { params: searchForm })
    summary.value = res.data
  } catch (error) {
    console.error(error)
  }
}

onMounted(() => {
  fetchSummary()
})
</script>

<style scoped>
.search-form {
  margin-bottom: 20px;
}

h4 {
  margin-bottom: 15px;
  color: #333;
}
</style>
