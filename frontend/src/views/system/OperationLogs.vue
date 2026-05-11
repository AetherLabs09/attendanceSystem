<template>
  <div class="operation-logs-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>操作日志</span>
        </div>
      </template>
      
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="用户">
          <el-select v-model="searchForm.user_id" placeholder="全部" clearable>
            <el-option v-for="u in users" :key="u.id" :label="u.username" :value="u.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="操作">
          <el-input v-model="searchForm.action" placeholder="操作关键词" clearable />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchLogs">查询</el-button>
        </el-form-item>
      </el-form>
      
      <el-table :data="logs" stripe>
        <el-table-column prop="username" label="用户" width="120" />
        <el-table-column prop="action" label="操作" width="150" />
        <el-table-column prop="target" label="对象" width="150" />
        <el-table-column prop="detail" label="详情" />
        <el-table-column prop="ip_address" label="IP地址" width="130" />
        <el-table-column prop="created_at" label="时间" width="180" />
      </el-table>
      
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="[20, 50, 100]"
        layout="total, sizes, prev, pager, next"
        @size-change="fetchLogs"
        @current-change="fetchLogs"
        style="margin-top: 20px; justify-content: flex-end"
      />
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import api from '../../utils/api'

const logs = ref([])
const users = ref([])
const searchForm = reactive({ user_id: '', action: '' })
const pagination = reactive({ page: 1, pageSize: 20, total: 0 })

const fetchLogs = async () => {
  try {
    const res = await api.get('/system/logs', { params: { ...searchForm, ...pagination } })
    logs.value = res.data.list
    pagination.total = res.data.total
  } catch (error) {
    console.error(error)
  }
}

const fetchUsers = async () => {
  try {
    const res = await api.get('/system/users')
    users.value = res.data
  } catch (error) {
    console.error(error)
  }
}

onMounted(() => {
  fetchLogs()
  fetchUsers()
})
</script>

<style scoped>
.search-form {
  margin-bottom: 20px;
}
</style>
