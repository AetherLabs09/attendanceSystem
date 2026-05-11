<template>
  <div class="rules-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>考勤规则设置</span>
          <el-button type="primary" @click="handleAdd">新增规则</el-button>
        </div>
      </template>
      
      <el-table :data="rules" stripe>
        <el-table-column prop="name" label="规则名称" width="150" />
        <el-table-column prop="work_start_time" label="上班时间" width="100" />
        <el-table-column prop="work_end_time" label="下班时间" width="100" />
        <el-table-column prop="late_threshold" label="迟到阈值(分钟)" width="120" />
        <el-table-column prop="early_leave_threshold" label="早退阈值(分钟)" width="120" />
        <el-table-column prop="absent_threshold" label="旷工阈值(分钟)" width="120" />
        <el-table-column prop="annual_leave_days" label="年假天数" width="100" />
        <el-table-column prop="sick_leave_days" label="病假天数" width="100" />
        <el-table-column label="操作" width="150">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
            <el-button type="danger" link @click="handleDelete(row)" :disabled="rules.length <= 1">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
    
    <el-dialog v-model="showDialog" :title="isEdit ? '编辑规则' : '新增规则'" width="600px">
      <el-form :model="form" :rules="formRules" ref="formRef" label-width="120px">
        <el-form-item label="规则名称" prop="name">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="上班时间" prop="work_start_time">
              <el-time-select v-model="form.work_start_time" :max-time="form.work_end_time" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="下班时间" prop="work_end_time">
              <el-time-select v-model="form.work_end_time" :min-time="form.work_start_time" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="迟到阈值" prop="late_threshold">
              <el-input-number v-model="form.late_threshold" :min="1" />
              <span style="margin-left: 10px">分钟</span>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="早退阈值" prop="early_leave_threshold">
              <el-input-number v-model="form.early_leave_threshold" :min="1" />
              <span style="margin-left: 10px">分钟</span>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="旷工阈值" prop="absent_threshold">
              <el-input-number v-model="form.absent_threshold" :min="1" />
              <span style="margin-left: 10px">分钟</span>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="加班起始时间" prop="overtime_start_time">
              <el-time-select v-model="form.overtime_start_time" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="月度周期起始" prop="monthly_cycle_start">
              <el-input-number v-model="form.monthly_cycle_start" :min="1" :max="28" />
              <span style="margin-left: 10px">日</span>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="年假天数" prop="annual_leave_days">
              <el-input-number v-model="form.annual_leave_days" :min="0" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="病假天数" prop="sick_leave_days">
              <el-input-number v-model="form.sick_leave_days" :min="0" />
            </el-form-item>
          </el-col>
        </el-row>
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
const rules = ref([])

const form = reactive({
  id: null,
  name: '',
  work_start_time: '09:00',
  work_end_time: '18:00',
  late_threshold: 15,
  early_leave_threshold: 15,
  absent_threshold: 60,
  overtime_start_time: '18:30',
  monthly_cycle_start: 1,
  annual_leave_days: 5,
  sick_leave_days: 10
})

const formRules = {
  name: [{ required: true, message: '请输入规则名称', trigger: 'blur' }],
  work_start_time: [{ required: true, message: '请选择上班时间', trigger: 'change' }],
  work_end_time: [{ required: true, message: '请选择下班时间', trigger: 'change' }]
}

const fetchRules = async () => {
  try {
    const res = await api.get('/attendance-rules')
    rules.value = res.data
  } catch (error) {
    console.error(error)
  }
}

const handleAdd = () => {
  isEdit.value = false
  Object.assign(form, {
    id: null, name: '', work_start_time: '09:00', work_end_time: '18:00',
    late_threshold: 15, early_leave_threshold: 15, absent_threshold: 60,
    overtime_start_time: '18:30', monthly_cycle_start: 1,
    annual_leave_days: 5, sick_leave_days: 10
  })
  showDialog.value = true
}

const handleEdit = (row) => {
  isEdit.value = true
  Object.assign(form, row)
  showDialog.value = true
}

const handleSubmit = async () => {
  await formRef.value.validate()
  try {
    if (isEdit.value) {
      await api.put(`/attendance-rules/${form.id}`, form)
      ElMessage.success('更新成功')
    } else {
      await api.post('/attendance-rules', form)
      ElMessage.success('创建成功')
    }
    showDialog.value = false
    fetchRules()
  } catch (error) {
    console.error(error)
  }
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除该规则吗？', '提示', { type: 'warning' })
    await api.delete(`/attendance-rules/${row.id}`)
    ElMessage.success('删除成功')
    fetchRules()
  } catch (error) {
    console.error(error)
  }
}

onMounted(() => {
  fetchRules()
})
</script>
