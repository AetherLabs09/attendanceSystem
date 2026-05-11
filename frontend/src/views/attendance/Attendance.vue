<template>
  <div class="attendance-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>打卡签到</span>
        </div>
      </template>
      
      <div class="clock-container">
        <div class="clock-time">{{ currentTime }}</div>
        <div class="clock-date">{{ currentDate }}</div>
        
        <div class="check-buttons">
          <el-button 
            type="primary" 
            size="large" 
            :disabled="todayRecord?.check_in_time"
            @click="checkIn"
          >
            <el-icon><Clock /></el-icon>
            签到
          </el-button>
          <el-button 
            type="success" 
            size="large" 
            :disabled="!todayRecord?.check_in_time || todayRecord?.check_out_time"
            @click="checkOut"
          >
            <el-icon><Clock /></el-icon>
            签退
          </el-button>
        </div>
        
        <div class="status-info">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="签到时间">
              <el-tag v-if="todayRecord?.check_in_time" :type="todayRecord.late_minutes > 0 ? 'warning' : 'success'">
                {{ todayRecord.check_in_time }}
                <span v-if="todayRecord.late_minutes > 0">(迟到{{ todayRecord.late_minutes }}分钟)</span>
              </el-tag>
              <span v-else>未签到</span>
            </el-descriptions-item>
            <el-descriptions-item label="签退时间">
              <el-tag v-if="todayRecord?.check_out_time" :type="todayRecord.early_leave_minutes > 0 ? 'warning' : 'success'">
                {{ todayRecord.check_out_time }}
                <span v-if="todayRecord.early_leave_minutes > 0">(早退{{ todayRecord.early_leave_minutes }}分钟)</span>
              </el-tag>
              <span v-else>未签退</span>
            </el-descriptions-item>
          </el-descriptions>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import api from '../../utils/api'

const currentTime = ref('')
const currentDate = ref('')
const todayRecord = ref(null)

const updateTime = () => {
  const now = new Date()
  currentTime.value = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  currentDate.value = now.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })
}

const fetchTodayRecord = async () => {
  try {
    const res = await api.get('/attendance/today')
    todayRecord.value = res.data
  } catch (error) {
    console.error(error)
  }
}

const checkIn = async () => {
  try {
    const res = await api.post('/attendance/check-in')
    ElMessage.success(res.data.message)
    fetchTodayRecord()
  } catch (error) {
    console.error(error)
  }
}

const checkOut = async () => {
  try {
    const res = await api.post('/attendance/check-out')
    ElMessage.success(res.data.message)
    fetchTodayRecord()
  } catch (error) {
    console.error(error)
  }
}

let timer
onMounted(() => {
  updateTime()
  timer = setInterval(updateTime, 1000)
  fetchTodayRecord()
})

onUnmounted(() => {
  clearInterval(timer)
})
</script>

<style scoped>
.clock-container {
  text-align: center;
  padding: 40px;
}

.clock-time {
  font-size: 72px;
  font-weight: bold;
  color: #409EFF;
  font-family: 'Courier New', monospace;
}

.clock-date {
  font-size: 24px;
  color: #666;
  margin: 20px 0 40px;
}

.check-buttons {
  margin-bottom: 40px;
}

.check-buttons .el-button {
  width: 150px;
  height: 60px;
  font-size: 18px;
  margin: 0 20px;
}

.status-info {
  max-width: 600px;
  margin: 0 auto;
}
</style>
