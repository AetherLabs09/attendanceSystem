<template>
  <div class="profile-page">
    <el-row :gutter="20">
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>个人信息</span>
          </template>
          <el-descriptions :column="1" border v-if="employee">
            <el-descriptions-item label="工号">{{ employee.employee_no }}</el-descriptions-item>
            <el-descriptions-item label="姓名">{{ employee.name }}</el-descriptions-item>
            <el-descriptions-item label="部门">{{ employee.department_name }}</el-descriptions-item>
            <el-descriptions-item label="岗位">{{ employee.position }}</el-descriptions-item>
            <el-descriptions-item label="电话">{{ employee.phone }}</el-descriptions-item>
            <el-descriptions-item label="邮箱">{{ employee.email }}</el-descriptions-item>
            <el-descriptions-item label="入职日期">{{ employee.hire_date }}</el-descriptions-item>
            <el-descriptions-item label="状态">
              <el-tag :type="employee.status === 'active' ? 'success' : 'danger'">
                {{ employee.status === 'active' ? '在职' : '离职' }}
              </el-tag>
            </el-descriptions-item>
          </el-descriptions>
          <el-empty v-else description="未关联员工信息" />
        </el-card>
      </el-col>
      
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>账号信息</span>
          </template>
          <el-descriptions :column="1" border>
            <el-descriptions-item label="用户名">{{ userStore.user?.username }}</el-descriptions-item>
            <el-descriptions-item label="角色">
              <el-tag :type="getRoleType(userStore.user?.role)">{{ getRoleText(userStore.user?.role) }}</el-tag>
            </el-descriptions-item>
          </el-descriptions>
          
          <el-divider />
          
          <el-button type="primary" @click="showPasswordDialog = true">修改密码</el-button>
        </el-card>
      </el-col>
    </el-row>
    
    <el-dialog v-model="showPasswordDialog" title="修改密码" width="400px">
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
        <el-button @click="showPasswordDialog = false">取消</el-button>
        <el-button type="primary" @click="changePassword">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useUserStore } from '../stores/user'
import api from '../utils/api'

const userStore = useUserStore()
const employee = ref(null)
const showPasswordDialog = ref(false)
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

const getRoleType = (role) => {
  const types = { admin: 'danger', hr: 'warning', employee: '' }
  return types[role] || ''
}

const getRoleText = (role) => {
  const texts = { admin: '超级管理员', hr: '人事管理员', employee: '普通员工' }
  return texts[role] || role
}

const fetchEmployee = async () => {
  try {
    const res = await api.get('/employees/my-info')
    employee.value = res.data
  } catch (error) {
    console.error(error)
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
    showPasswordDialog.value = false
    passwordFormRef.value.resetFields()
  } catch (error) {
    console.error(error)
  }
}

onMounted(() => {
  if (userStore.user?.employee_id) {
    fetchEmployee()
  }
})
</script>
