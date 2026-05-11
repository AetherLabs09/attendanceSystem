import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '../stores/user'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/',
    component: () => import('../layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        redirect: '/dashboard'
      },
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('../views/Dashboard.vue')
      },
      {
        path: 'attendance',
        name: 'Attendance',
        component: () => import('../views/attendance/Attendance.vue')
      },
      {
        path: 'attendance/records',
        name: 'AttendanceRecords',
        component: () => import('../views/attendance/Records.vue')
      },
      {
        path: 'attendance/abnormal',
        name: 'AttendanceAbnormal',
        component: () => import('../views/attendance/Abnormal.vue'),
        meta: { requiresAdmin: true }
      },
      {
        path: 'leave',
        name: 'Leave',
        component: () => import('../views/leave/LeaveList.vue')
      },
      {
        path: 'leave/approve',
        name: 'LeaveApprove',
        component: () => import('../views/leave/LeaveApprove.vue'),
        meta: { requiresAdmin: true }
      },
      {
        path: 'overtime',
        name: 'Overtime',
        component: () => import('../views/overtime/OvertimeList.vue')
      },
      {
        path: 'overtime/approve',
        name: 'OvertimeApprove',
        component: () => import('../views/overtime/OvertimeApprove.vue'),
        meta: { requiresAdmin: true }
      },
      {
        path: 'correction',
        name: 'Correction',
        component: () => import('../views/correction/CorrectionList.vue')
      },
      {
        path: 'correction/approve',
        name: 'CorrectionApprove',
        component: () => import('../views/correction/CorrectionApprove.vue'),
        meta: { requiresAdmin: true }
      },
      {
        path: 'departments',
        name: 'Departments',
        component: () => import('../views/system/Departments.vue'),
        meta: { requiresAdmin: true }
      },
      {
        path: 'employees',
        name: 'Employees',
        component: () => import('../views/system/Employees.vue'),
        meta: { requiresAdmin: true }
      },
      {
        path: 'rules',
        name: 'AttendanceRules',
        component: () => import('../views/system/AttendanceRules.vue'),
        meta: { requiresAdmin: true }
      },
      {
        path: 'reports/monthly',
        name: 'MonthlyReport',
        component: () => import('../views/reports/MonthlyReport.vue'),
        meta: { requiresAdmin: true }
      },
      {
        path: 'reports/daily',
        name: 'DailyReport',
        component: () => import('../views/reports/DailyReport.vue'),
        meta: { requiresAdmin: true }
      },
      {
        path: 'summary',
        name: 'MonthlySummary',
        component: () => import('../views/reports/MonthlySummary.vue')
      },
      {
        path: 'system/users',
        name: 'UserManagement',
        component: () => import('../views/system/UserManagement.vue'),
        meta: { requiresAdmin: true }
      },
      {
        path: 'system/logs',
        name: 'OperationLogs',
        component: () => import('../views/system/OperationLogs.vue'),
        meta: { requiresAdmin: true }
      },
      {
        path: 'system/announcements',
        name: 'Announcements',
        component: () => import('../views/system/Announcements.vue'),
        meta: { requiresAdmin: true }
      },
      {
        path: 'profile',
        name: 'Profile',
        component: () => import('../views/Profile.vue')
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  
  if (to.meta.requiresAuth !== false && !userStore.token) {
    next('/login')
  } else if (to.meta.requiresAdmin && userStore.user?.role === 'employee') {
    next('/dashboard')
  } else {
    next()
  }
})

export default router
