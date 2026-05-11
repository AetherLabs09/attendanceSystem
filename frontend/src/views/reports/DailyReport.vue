<template>
  <div class="daily-report-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>考勤明细导出</span>
        </div>
      </template>
      
      <el-form :model="form" label-width="80px">
        <el-form-item label="部门">
          <el-select v-model="form.department_id" placeholder="全部部门" clearable style="width: 200px">
            <el-option v-for="d in departments" :key="d.id" :label="d.name" :value="d.id" />
          </el-select>
        </el-form-item>
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
        <el-form-item>
          <el-button type="primary" @click="exportReport" :loading="loading">
            <el-icon><Download /></el-icon>
            导出明细
          </el-button>
        </el-form-item>
      </el-form>
      
      <el-alert type="info" :closable="false" style="margin-top: 20px">
        <p>导出内容包括：</p>
        <ul>
          <li>每日考勤记录明细</li>
          <li>签到/签退时间</li>
          <li>考勤状态（正常/迟到/早退/旷工）</li>
          <li>迟到/早退分钟数</li>
        </ul>
      </el-alert>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import api from '../../utils/api'

const loading = ref(false)
const departments = ref([])
const dateRange = ref([])

const form = reactive({
  department_id: '',
  start_date: '',
  end_date: ''
})

const fetchDepartments = async () => {
  try {
    const res = await api.get('/departments')
    departments.value = res.data
  } catch (error) {
    console.error(error)
  }
}

const exportReport = async () => {
  if (!dateRange.value || dateRange.value.length !== 2) {
    ElMessage.warning('请选择日期范围')
    return
  }
  
  loading.value = true
  try {
    const response = await api.get('/reports/daily', {
      params: {
        department_id: form.department_id,
        start_date: dateRange.value[0],
        end_date: dateRange.value[1]
      },
      responseType: 'blob'
    })
    
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `考勤明细_${dateRange.value[0]}_${dateRange.value[1]}.xlsx`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    
    ElMessage.success('导出成功')
  } catch (error) {
    console.error(error)
    ElMessage.error('导出失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchDepartments()
})
</script>

<style scoped>
ul {
  margin: 10px 0;
  padding-left: 20px;
}

li {
  margin: 5px 0;
}
</style>
