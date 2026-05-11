<template>
  <el-container class="layout-container">
    <el-aside width="200px">
      <div class="logo">
        <h3>考勤管理</h3>
      </div>
      <el-menu
        :default-active="activeMenu"
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409EFF"
        router
      >
        <el-menu-item index="/dashboard">
          <el-icon><HomeFilled /></el-icon>
          <span>首页</span>
        </el-menu-item>
        
        <el-sub-menu index="attendance">
          <template #title>
            <el-icon><Clock /></el-icon>
            <span>考勤管理</span>
          </template>
          <el-menu-item index="/attendance">打卡签到</el-menu-item>
          <el-menu-item index="/attendance/records">考勤记录</el-menu-item>
          <el-menu-item index="/attendance/abnormal" v-if="isAdmin">异常考勤</el-menu-item>
        </el-sub-menu>
        
        <el-sub-menu index="requests">
          <template #title>
            <el-icon><Document /></el-icon>
            <span>申请管理</span>
          </template>
          <el-menu-item index="/leave">请假申请</el-menu-item>
          <el-menu-item index="/overtime">加班申请</el-menu-item>
          <el-menu-item index="/correction">补卡申请</el-menu-item>
        </el-sub-menu>
        
        <el-sub-menu index="approve" v-if="isAdmin">
          <template #title>
            <el-icon><Checked /></el-icon>
            <span>审批管理</span>
          </template>
          <el-menu-item index="/leave/approve">请假审批</el-menu-item>
          <el-menu-item index="/overtime/approve">加班审批</el-menu-item>
          <el-menu-item index="/correction/approve">补卡审批</el-menu-item>
        </el-sub-menu>
        
        <el-sub-menu index="reports" v-if="isAdmin">
          <template #title>
            <el-icon><DataAnalysis /></el-icon>
            <span>报表统计</span>
          </template>
          <el-menu-item index="/summary">月度汇总</el-menu-item>
          <el-menu-item index="/reports/monthly">月度报表</el-menu-item>
          <el-menu-item index="/reports/daily">考勤明细</el-menu-item>
        </el-sub-menu>
        
        <el-sub-menu index="system" v-if="isAdmin">
          <template #title>
            <el-icon><Setting /></el-icon>
            <span>系统管理</span>
          </template>
          <el-menu-item index="/departments">部门管理</el-menu-item>
          <el-menu-item index="/employees">员工管理</el-menu-item>
          <el-menu-item index="/rules">考勤规则</el-menu-item>
          <el-menu-item index="/system/users">用户管理</el-menu-item>
          <el-menu-item index="/system/announcements">公告管理</el-menu-item>
          <el-menu-item index="/system/logs">操作日志</el-menu-item>
        </el-sub-menu>
      </el-menu>
    </el-aside>
    
    <el-container>
      <el-header>
        <div class="header-left">
          <span>{{ currentTime }}</span>
        </div>
        <div class="header-right">
          <el-dropdown @command="handleCommand">
            <span class="user-info">
              <el-icon><User /></el-icon>
              {{ userStore.user?.username }}
              <el-tag size="small" style="margin-left: 10px">{{ roleText }}</el-tag>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">个人信息</el-dropdown-item>
                <el-dropdown-item command="password">修改密码</el-dropdown-item>
                <el-dropdown-item divided command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>
      
      <el-main>
        <router-view />
      </el-main>
    </el-container>
    
    <el-dialog v-model="passwordDialogVisible" title="修改密码" width="400px">
      <el-form :model="passwordForm" :rules="passwordRules" ref="passwordFormRef" label-width="80px">
        <el-form-item label="原密码" prop="oldPassword">
          <el-input v-model="passwordForm.oldPassword" type="password" show-password />
        </el-form-item>
        <el-form-item label="新密码" prop="newPassword">
          <el-input v-model="passwordForm.newPassword" type="password" show-password />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input v-model="passwordForm.confirmPassword" type="password" show-password />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="passwordDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="changePassword">确定</el-button>
      </template>
    </el-dialog>
  </el-container>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '../stores/user'
import api from '../utils/api'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const currentTime = ref('')
const passwordDialogVisible = ref(false)
const passwordFormRef = ref()

const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const passwordRules = {
  oldPassword: [{ required: true, message: '请输入原密码', trigger: 'blur' }],
  newPassword: [{ required: true, min: 6, message: '密码至少6位', trigger: 'blur' }],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    { validator: (rule, value, callback) => {
      if (value !== passwordForm.newPassword) {
        callback(new Error('两次密码不一致'))
      } else {
        callback()
      }
    }, trigger: 'blur' }
  ]
}

const activeMenu = computed(() => route.path)

const isAdmin = computed(() => userStore.user?.role !== 'employee')

const roleText = computed(() => {
  const roles = { admin: '超级管理员', hr: '人事管理员', employee: '普通员工' }
  return roles[userStore.user?.role] || '未知'
})

const updateTime = () => {
  const now = new Date()
  currentTime.value = now.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'long',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

const handleCommand = (command) => {
  if (command === 'logout') {
    ElMessageBox.confirm('确定要退出登录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(() => {
      userStore.logout()
      router.push('/login')
    })
  } else if (command === 'profile') {
    router.push('/profile')
  } else if (command === 'password') {
    passwordDialogVisible.value = true
  }
}

const changePassword = async () => {
  await passwordFormRef.value.validate()
  try {
    await api.post('/auth/change-password', {
      oldPassword: passwordForm.oldPassword,
      newPassword: passwordForm.newPassword
    })
    ElMessage.success('密码修改成功')
    passwordDialogVisible.value = false
    passwordFormRef.value.resetFields()
  } catch (error) {
    console.error(error)
  }
}

let timer
onMounted(() => {
  updateTime()
  timer = setInterval(updateTime, 1000)
})

onUnmounted(() => {
  clearInterval(timer)
})
</script>

<style scoped>
.layout-container {
  height: 100vh;
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #263445;
}

.logo h3 {
  color: #fff;
  font-size: 18px;
}

.header-left {
  font-size: 14px;
  color: #666;
}

.user-info {
  display: flex;
  align-items: center;
  cursor: pointer;
  color: #333;
}
</style>
