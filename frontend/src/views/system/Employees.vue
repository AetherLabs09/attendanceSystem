<template>
  <div class="employees-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>员工管理</span>
          <el-button type="primary" @click="handleAdd">新增员工</el-button>
        </div>
      </template>
      
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="部门">
          <el-select v-model="searchForm.department_id" placeholder="全部" clearable>
            <el-option v-for="d in departments" :key="d.id" :label="d.name" :value="d.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部" clearable>
            <el-option label="在职" value="active" />
            <el-option label="离职" value="inactive" />
          </el-select>
        </el-form-item>
        <el-form-item label="关键词">
          <el-input v-model="searchForm.keyword" placeholder="姓名/工号" clearable />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchEmployees">查询</el-button>
        </el-form-item>
      </el-form>
      
      <el-table :data="employees" stripe>
        <el-table-column prop="employee_no" label="工号" width="100" />
        <el-table-column prop="name" label="姓名" width="100" />
        <el-table-column prop="department_name" label="部门" width="120" />
        <el-table-column prop="position" label="岗位" width="120" />
        <el-table-column prop="phone" label="电话" width="130" />
        <el-table-column prop="hire_date" label="入职日期" width="120" />
        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'danger'">
              {{ row.status === 'active' ? '在职' : '离职' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
            <el-button 
              :type="row.status === 'active' ? 'warning' : 'success'" 
              link 
              @click="handleToggleStatus(row)"
            >
              {{ row.status === 'active' ? '禁用' : '启用' }}
            </el-button>
            <el-button type="danger" link @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next"
        @size-change="fetchEmployees"
        @current-change="fetchEmployees"
        style="margin-top: 20px; justify-content: flex-end"
      />
    </el-card>
    
    <el-dialog v-model="showDialog" :title="isEdit ? '编辑员工' : '新增员工'" width="600px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="80px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="姓名" prop="name">
              <el-input v-model="form.name" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="工号" prop="employee_no">
              <el-input v-model="form.employee_no" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="部门" prop="department_id">
              <el-select v-model="form.department_id" placeholder="请选择" style="width: 100%">
                <el-option v-for="d in departments" :key="d.id" :label="d.name" :value="d.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="岗位" prop="position">
              <el-input v-model="form.position" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="电话" prop="phone">
              <el-input v-model="form.phone" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="邮箱" prop="email">
              <el-input v-model="form.email" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="入职日期" prop="hire_date">
              <el-date-picker v-model="form.hire_date" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态" prop="status">
              <el-select v-model="form.status" style="width: 100%">
                <el-option label="在职" value="active" />
                <el-option label="离职" value="inactive" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item v-if="!isEdit" label="创建账号">
          <el-switch v-model="form.create_account" />
          <span style="margin-left: 10px; color: #999; font-size: 12px">默认密码: 123456</span>
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
const employees = ref([])
const departments = ref([])
const pagination = reactive({ page: 1, pageSize: 10, total: 0 })
const searchForm = reactive({ department_id: '', status: '', keyword: '' })

const form = reactive({
  id: null,
  name: '',
  employee_no: '',
  department_id: '',
  position: '',
  phone: '',
  email: '',
  hire_date: '',
  status: 'active',
  create_account: true
})

const rules = {
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  employee_no: [{ required: true, message: '请输入工号', trigger: 'blur' }],
  department_id: [{ required: true, message: '请选择部门', trigger: 'change' }]
}

const fetchEmployees = async () => {
  try {
    const res = await api.get('/employees', { params: { ...searchForm, ...pagination } })
    employees.value = res.data.list
    pagination.total = res.data.total
  } catch (error) {
    console.error(error)
  }
}

const fetchDepartments = async () => {
  try {
    const res = await api.get('/departments')
    departments.value = res.data
  } catch (error) {
    console.error(error)
  }
}

const handleAdd = () => {
  isEdit.value = false
  Object.assign(form, {
    id: null, name: '', employee_no: '', department_id: '', position: '',
    phone: '', email: '', hire_date: '', status: 'active', create_account: true
  })
  showDialog.value = true
}

const handleEdit = (row) => {
  isEdit.value = true
  Object.assign(form, { ...row, create_account: false })
  showDialog.value = true
}

const handleSubmit = async () => {
  await formRef.value.validate()
  try {
    if (isEdit.value) {
      await api.put(`/employees/${form.id}`, form)
      ElMessage.success('更新成功')
    } else {
      await api.post('/employees', form)
      ElMessage.success('创建成功')
    }
    showDialog.value = false
    fetchEmployees()
  } catch (error) {
    console.error(error)
  }
}

const handleToggleStatus = async (row) => {
  const newStatus = row.status === 'active' ? 'inactive' : 'active'
  try {
    await api.put(`/employees/${row.id}/status`, { status: newStatus })
    ElMessage.success('状态更新成功')
    fetchEmployees()
  } catch (error) {
    console.error(error)
  }
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除该员工吗？', '提示', { type: 'warning' })
    await api.delete(`/employees/${row.id}`)
    ElMessage.success('删除成功')
    fetchEmployees()
  } catch (error) {
    console.error(error)
  }
}

onMounted(() => {
  fetchEmployees()
  fetchDepartments()
})
</script>

<style scoped>
.search-form {
  margin-bottom: 20px;
}
</style>
