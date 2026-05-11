<template>
  <div class="monthly-report-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>月度报表导出</span>
        </div>
      </template>
      
      <el-form :model="form" label-width="80px">
        <el-form-item label="部门">
          <el-select v-model="form.department_id" placeholder="全部部门" clearable style="width: 200px">
            <el-option v-for="d in departments" :key="d.id" :label="d.name" :value="d.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="年份">
          <el-select v-model="form.year" style="width: 120px">
            <el-option v-for="y in years" :key="y" :label="y" :value="y" />
          </el-select>
        </el-form-item>
        <el-form-item label="月份">
          <el-select v-model="form.month" style="width: 120px">
            <el-option v-for="m in 12" :key="m" :label="m + '月'" :value="m" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="exportReport" :loading="loading">
            <el-icon><Download /></el-icon>
            导出报表
          </el-button>
        </el-form-item>
      </el-form>
      
      <el-alert type="info" :closable="false" style="margin-top: 20px">
        <p>导出内容包括：</p>
        <ul>
          <li>员工基本信息（工号、姓名、部门）</li>
          <li>出勤统计（应出勤天数、正常打卡天数）</li>
          <li>异常统计（迟到次数、早退次数、旷工天数）</li>
          <li>假期统计（事假、病假、年假等）</li>
          <li>加班统计（加班总时长）</li>
        </ul>
      </el-alert>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import api from '../../utils/api'

const loading = ref(false)
const departments = ref([])
const currentYear = new Date().getFullYear()

const years = computed(() => {
  const arr = []
  for (let i = currentYear; i >= currentYear - 5; i--) {
    arr.push(i)
  }
  return arr
})

const form = reactive({
  department_id: '',
  year: currentYear,
  month: new Date().getMonth() + 1
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
  loading.value = true
  try {
    const response = await api.get('/reports/monthly', {
      params: form,
      responseType: 'blob'
    })
    
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `考勤汇总_${form.year}_${form.month}月.xlsx`)
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
