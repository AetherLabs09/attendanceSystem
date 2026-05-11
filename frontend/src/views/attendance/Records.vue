<template>
  <div class="records-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>考勤记录</span>
        </div>
      </template>
      
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="日期范围">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部" clearable>
            <el-option label="正常" value="normal" />
            <el-option label="迟到" value="late" />
            <el-option label="早退" value="early_leave" />
            <el-option label="旷工" value="absent" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchRecords">查询</el-button>
        </el-form-item>
      </el-form>
      
      <el-table :data="records" stripe>
        <el-table-column prop="date" label="日期" width="120" />
        <el-table-column prop="check_in_time" label="签到时间" width="120">
          <template #default="{ row }">
            <span :class="{ 'text-warning': row.late_minutes > 0 }">
              {{ row.check_in_time || '-' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="check_out_time" label="签退时间" width="120">
          <template #default="{ row }">
            <span :class="{ 'text-warning': row.early_leave_minutes > 0 }">
              {{ row.check_out_time || '-' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">{{ getStatusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="late_minutes" label="迟到(分钟)" width="100" />
        <el-table-column prop="early_leave_minutes" label="早退(分钟)" width="100" />
        <el-table-column prop="remark" label="备注" />
      </el-table>
      
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next"
        @size-change="fetchRecords"
        @current-change="fetchRecords"
        style="margin-top: 20px; justify-content: flex-end"
      />
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import api from '../../utils/api'

const dateRange = ref([])
const searchForm = reactive({
  status: ''
})
const records = ref([])
const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

const getStatusType = (status) => {
  const types = { normal: 'success', late: 'warning', early_leave: 'warning', absent: 'danger' }
  return types[status] || 'info'
}

const getStatusText = (status) => {
  const texts = { normal: '正常', late: '迟到', early_leave: '早退', absent: '旷工' }
  return texts[status] || status
}

const fetchRecords = async () => {
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      ...searchForm
    }
    
    if (dateRange.value?.length === 2) {
      params.start_date = dateRange.value[0]
      params.end_date = dateRange.value[1]
    }
    
    const res = await api.get('/attendance/records', { params })
    records.value = res.data.list
    pagination.total = res.data.total
  } catch (error) {
    console.error(error)
  }
}

onMounted(() => {
  fetchRecords()
})
</script>

<style scoped>
.search-form {
  margin-bottom: 20px;
}

.text-warning {
  color: #E6A23C;
}
</style>
