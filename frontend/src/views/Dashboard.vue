<template>
  <div class="dashboard">
    <el-row :gutter="20">
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-icon" style="background: #409EFF">
            <el-icon size="30"><User /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.totalEmployees }}</div>
            <div class="stat-label">员工总数</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-icon" style="background: #67C23A">
            <el-icon size="30"><Checked /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.todayCheckIn }}</div>
            <div class="stat-label">今日签到</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-icon" style="background: #E6A23C">
            <el-icon size="30"><Warning /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.todayLate }}</div>
            <div class="stat-label">今日迟到</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-icon" style="background: #F56C6C">
            <el-icon size="30"><Document /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.pendingApprovals }}</div>
            <div class="stat-label">待审批</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="16">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>快捷操作</span>
            </div>
          </template>
          <div class="quick-actions">
            <el-button type="primary" size="large" @click="checkIn" :disabled="todayRecord?.check_in_time">
              <el-icon><Clock /></el-icon>
              签到
            </el-button>
            <el-button type="success" size="large" @click="checkOut" :disabled="!todayRecord?.check_in_time || todayRecord?.check_out_time">
              <el-icon><Clock /></el-icon>
              签退
            </el-button>
            <el-button type="warning" size="large" @click="$router.push('/leave')">
              <el-icon><Document /></el-icon>
              请假申请
            </el-button>
            <el-button type="info" size="large" @click="$router.push('/overtime')">
              <el-icon><Timer /></el-icon>
              加班申请
            </el-button>
            <el-button size="large" @click="$router.push('/correction')">
              <el-icon><Edit /></el-icon>
              补卡申请
            </el-button>
          </div>
          
          <el-divider />
          
          <div class="today-status">
            <h4>今日考勤状态</h4>
            <el-descriptions :column="3" border>
              <el-descriptions-item label="签到时间">{{ todayRecord?.check_in_time || '未签到' }}</el-descriptions-item>
              <el-descriptions-item label="签退时间">{{ todayRecord?.check_out_time || '未签退' }}</el-descriptions-item>
              <el-descriptions-item label="考勤状态">
                <el-tag :type="getStatusType(todayRecord?.status)">{{ getStatusText(todayRecord?.status) }}</el-tag>
              </el-descriptions-item>
            </el-descriptions>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="8">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>系统公告</span>
            </div>
          </template>
          <div class="announcements">
            <div v-for="item in announcements" :key="item.id" class="announcement-item">
              <div class="announcement-title">{{ item.title }}</div>
              <div class="announcement-time">{{ item.publish_time }}</div>
            </div>
            <el-empty v-if="announcements.length === 0" description="暂无公告" />
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useUserStore } from '../stores/user'
import api from '../utils/api'

const userStore = useUserStore()
const stats = ref({
  totalEmployees: 0,
  todayCheckIn: 0,
  todayLate: 0,
  pendingApprovals: 0
})
const todayRecord = ref(null)
const announcements = ref([])

const getStatusType = (status) => {
  const types = {
    normal: 'success',
    late: 'warning',
    early_leave: 'warning',
    absent: 'danger'
  }
  return types[status] || 'info'
}

const getStatusText = (status) => {
  const texts = {
    normal: '正常',
    late: '迟到',
    early_leave: '早退',
    absent: '旷工'
  }
  return texts[status] || status || '未打卡'
}

const fetchStats = async () => {
  try {
    const [empRes, todayRes, pendingRes] = await Promise.all([
      api.get('/employees', { params: { pageSize: 1 } }),
      api.get('/attendance/today'),
      api.get('/leave', { params: { status: 'pending', pageSize: 1 } })
    ])
    
    stats.value.totalEmployees = empRes.data.total
    stats.value.todayCheckIn = todayRes.data ? 1 : 0
    stats.value.pendingApprovals = pendingRes.data.total
    
    if (todayRes.data) {
      todayRecord.value = todayRes.data
      if (todayRes.data.status?.includes('late')) {
        stats.value.todayLate = 1
      }
    }
  } catch (error) {
    console.error(error)
  }
}

const fetchAnnouncements = async () => {
  try {
    const res = await api.get('/system/announcements')
    announcements.value = res.data.slice(0, 5)
  } catch (error) {
    console.error(error)
  }
}

const checkIn = async () => {
  try {
    const res = await api.post('/attendance/check-in')
    ElMessage.success(res.data.message)
    fetchStats()
  } catch (error) {
    console.error(error)
  }
}

const checkOut = async () => {
  try {
    const res = await api.post('/attendance/check-out')
    ElMessage.success(res.data.message)
    fetchStats()
  } catch (error) {
    console.error(error)
  }
}

onMounted(() => {
  fetchStats()
  fetchAnnouncements()
})
</script>

<style scoped>
.stat-card {
  display: flex;
  align-items: center;
  padding: 20px;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.stat-info {
  margin-left: 20px;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #333;
}

.stat-label {
  font-size: 14px;
  color: #999;
  margin-top: 5px;
}

.quick-actions {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
}

.today-status {
  margin-top: 20px;
}

.today-status h4 {
  margin-bottom: 15px;
  color: #333;
}

.announcements {
  max-height: 300px;
  overflow-y: auto;
}

.announcement-item {
  padding: 10px 0;
  border-bottom: 1px solid #eee;
}

.announcement-item:last-child {
  border-bottom: none;
}

.announcement-title {
  font-size: 14px;
  color: #333;
  margin-bottom: 5px;
}

.announcement-time {
  font-size: 12px;
  color: #999;
}
</style>
