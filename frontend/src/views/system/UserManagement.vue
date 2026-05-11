<template>
  <div class="user-management-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>用户管理</span>
          <el-button type="primary" @click="handleAdd">新增用户</el-button>
        </div>
      </template>
      
      <el-table :data="users" stripe>
        <el-table-column prop="username" label="用户名" width="150" />
        <el-table-column prop="employee_name" label="关联员工" width="120" />
        <el-table-column prop="employee_no" label="员工工号" width="120" />
        <el-table-column prop="role" label="角色" width="120">
          <template #default="{ row }">
            <el-tag :type="getRoleType(row.role)">{{ getRoleText(row.role) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180" />
        <el-table-column label="操作" width="200">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
            <el-button type="danger" link @click="handleDelete(row)" :disabled="row.username === 'admin'">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
    
    <el-dialog v-model="showDialog" :title="isEdit ? '编辑用户' : '新增用户'" width="500px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="80px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" :disabled="isEdit" />
        </el-form-item>
        <el-form-item v-if="!isEdit" label="密码" prop="password">
          <el-input v-model="form.password" type="password" show-password />
        </el-form-item>
        <el-form-item label="角色" prop="role">
          <el-select v-model="form.role" style="width: 100%">
            <el-option label="超级管理员" value="admin" />
            <el-option label="人事管理员" value="hr" />
            <el-option label="普通员工" value="employee" />
          </el-select>
        </el-form-item>
        <el-form-item label="关联员工" prop="employee_id">
          <el-select v-model="form.employee_id" placeholder="请选择" clearable filterable style="width: 100%">
            <el-option v-for="e in employees" :key="e.id" :label="`${e.name}(${e.employee_no})`" :value="e.id" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showDialog = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import api from '../../utils/api'

const showDialog = ref(false)
const isEdit = ref(false)
const formRef = ref()
const users = ref([])
const employees = ref([])

const form = reactive({
  id: null,
  username: '',
  password: '',
  role: 'employee',
  employee_id: null
})

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
  role: [{ required: true, message: '请选择角色', trigger: 'change' }]
}

const getRoleType = (role) => {
  const types = { admin: 'danger', hr: 'warning', employee: '' }
  return types[role] || ''
}

const getRoleText = (role) => {
  const texts = { admin: '超级管理员', hr: '人事管理员', employee: '普通员工' }
  return texts[role] || role
}

const fetchUsers = async () => {
  try {
    const res = await api.get('/system/users')
    users.value = res.data
  } catch (error) {
    console.error(error)
  }
}

const fetchEmployees = async () => {
  try {
    const res = await api.get('/employees', { params: { pageSize: 1000 } })
    employees.value = res.data.list
  } catch (error) {
    console.error(error)
  }
}

const handleAdd = () => {
  isEdit.value = false
  Object.assign(form, { id: null, username: '', password: '', role: 'employee', employee_id: null })
  showDialog.value = true
}

const handleEdit = (row) => {
  isEdit.value = true
  Object.assign(form, { id: row.id, username: row.username, password: '', role: row.role, employee_id: row.employee_id })
  showDialog.value = true
}

const handleSubmit = async () => {
  await formRef.value.validate()
  try {
    if (isEdit.value) {
      await api.put(`/system/users/${form.id}`, form)
      ElMessage.success('更新成功')
    } else {
      await api.post('/system/users', form)
      ElMessage.success('创建成功')
    }
    showDialog.value = false
    fetchUsers()
  } catch (error) {
    console.error(error)
  }
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除该用户吗？', '提示', { type: 'warning' })
    await api.delete(`/system/users/${row.id}`)
    ElMessage.success('删除成功')
    fetchUsers()
  } catch (error) {
    console.error(error)
  }
}

onMounted(() => {
  fetchUsers()
  fetchEmployees()
})
</script>
