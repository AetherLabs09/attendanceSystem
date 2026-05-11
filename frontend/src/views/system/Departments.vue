<template>
  <div class="departments-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>部门管理</span>
          <el-button type="primary" @click="handleAdd">新增部门</el-button>
        </div>
      </template>
      
      <el-table :data="departments" row-key="id" border default-expand-all>
        <el-table-column prop="name" label="部门名称" />
        <el-table-column prop="parent_name" label="上级部门" width="150" />
        <el-table-column prop="level" label="层级" width="80" />
        <el-table-column prop="employee_count" label="员工数" width="100" />
        <el-table-column label="操作" width="200">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
            <el-button type="danger" link @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
    
    <el-dialog v-model="showDialog" :title="isEdit ? '编辑部门' : '新增部门'" width="500px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="80px">
        <el-form-item label="部门名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入部门名称" />
        </el-form-item>
        <el-form-item label="上级部门" prop="parent_id">
          <el-cascader
            v-model="form.parent_path"
            :options="departmentTree"
            :props="{ checkStrictly: true, value: 'id', label: 'name', emitPath: false }"
            placeholder="请选择上级部门"
            clearable
            @change="handleParentChange"
          />
        </el-form-item>
        <el-form-item label="层级" prop="level">
          <el-input-number v-model="form.level" :min="1" :max="10" />
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
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import api from '../../utils/api'

const showDialog = ref(false)
const isEdit = ref(false)
const formRef = ref()
const departments = ref([])
const form = reactive({
  id: null,
  name: '',
  parent_id: null,
  parent_path: null,
  level: 1
})

const rules = {
  name: [{ required: true, message: '请输入部门名称', trigger: 'blur' }]
}

const departmentTree = computed(() => {
  const buildTree = (items, parentId = null) => {
    return items
      .filter(item => item.parent_id === parentId)
      .map(item => ({
        ...item,
        children: buildTree(items, item.id)
      }))
  }
  return buildTree(departments.value)
})

const fetchDepartments = async () => {
  try {
    const res = await api.get('/departments')
    departments.value = res.data
  } catch (error) {
    console.error(error)
  }
}

const handleParentChange = (val) => {
  form.parent_id = val
  if (val) {
    const parent = departments.value.find(d => d.id === val)
    form.level = (parent?.level || 0) + 1
  } else {
    form.level = 1
  }
}

const handleAdd = () => {
  isEdit.value = false
  Object.assign(form, { id: null, name: '', parent_id: null, parent_path: null, level: 1 })
  showDialog.value = true
}

const handleEdit = (row) => {
  isEdit.value = true
  Object.assign(form, {
    id: row.id,
    name: row.name,
    parent_id: row.parent_id,
    parent_path: row.parent_id,
    level: row.level
  })
  showDialog.value = true
}

const handleSubmit = async () => {
  await formRef.value.validate()
  try {
    if (isEdit.value) {
      await api.put(`/departments/${form.id}`, form)
      ElMessage.success('更新成功')
    } else {
      await api.post('/departments', form)
      ElMessage.success('创建成功')
    }
    showDialog.value = false
    fetchDepartments()
  } catch (error) {
    console.error(error)
  }
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除该部门吗？', '提示', { type: 'warning' })
    await api.delete(`/departments/${row.id}`)
    ElMessage.success('删除成功')
    fetchDepartments()
  } catch (error) {
    console.error(error)
  }
}

onMounted(() => {
  fetchDepartments()
})
</script>
