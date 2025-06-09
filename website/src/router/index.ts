import { createRouter, createWebHistory } from 'vue-router'
import Items from '@/views/Items.vue'
import Records from '@/views/Records.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/login'
    },
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/views/login.vue')
    },
    {
      path: '/dashboard',
      name: 'Dashboard',
      component: () => import('@/layouts/MainLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          component: () => import('@/views/dashboard.vue')
        }
      ]
    },
    {
      path: '/users',
      name: 'Users',
      component: () => import('@/layouts/MainLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          component: () => import('@/views/users.vue')
        }
      ]
    },
    {
      path: '/knowledge',
      name: 'Knowledge',
      component: () => import('@/layouts/MainLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          component: () => import('@/views/knowledge.vue')
        }
      ]
    },
    {
      path: '/history',
      name: 'History',
      component: () => import('@/layouts/MainLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          component: () => import('@/views/history.vue')
        }
      ]
    },
    {
      path: '/feedback',
      name: 'Feedback',
      component: () => import('@/layouts/MainLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          component: () => import('@/views/feedback.vue')
        }
      ]
    },
    {
      path: '/items',
      name: 'Items',
      component: () => import('@/layouts/MainLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          component: () => import('@/views/Items.vue')
        }
      ]
    },
    {
      path: '/records',
      name: 'Records',
      component: () => import('@/layouts/MainLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          component: () => import('@/views/Records.vue')
        }
      ]
    },
  ]
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  if (to.meta.requiresAuth && !token) {
    next('/login')
  } else {
    next()
  }
})

export default router 