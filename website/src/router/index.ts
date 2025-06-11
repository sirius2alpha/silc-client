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
      component: () => import('@/layouts/MainLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          name: 'Dashboard',
          component: () => import('@/views/dashboard.vue')
        }
      ]
    },
    {
      path: '/users',
      component: () => import('@/layouts/MainLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          name: 'Users',
          component: () => import('@/views/users.vue')
        }
      ]
    },
    {
      path: '/knowledge',
      component: () => import('@/layouts/MainLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          name: 'Knowledge',
          component: () => import('@/views/knowledge.vue')
        }
      ]
    },
    {
      path: '/history',
      component: () => import('@/layouts/MainLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          name: 'History',
          component: () => import('@/views/history.vue')
        }
      ]
    },
    {
      path: '/feedback',
      component: () => import('@/layouts/MainLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          name: 'Feedback',
          component: () => import('@/views/feedback.vue')
        }
      ]
    },
    {
      path: '/items',
      component: () => import('@/layouts/MainLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          name: 'Items',
          component: () => import('@/views/Items.vue')
        }
      ]
    },
    {
      path: '/records',
      component: () => import('@/layouts/MainLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          name: 'Records',
          component: () => import('@/views/Records.vue')
        }
      ]
    },
  ]
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const accessToken = localStorage.getItem('accessToken')
  if (to.meta.requiresAuth && !accessToken) {
    next('/login')
  } else {
    next()
  }
})

export default router 