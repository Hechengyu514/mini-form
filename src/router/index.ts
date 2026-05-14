import { createRouter, createWebHistory } from 'vue-router'
import FormEditor from '@/views/FormEditor/index.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'editor',
      component: FormEditor,
    },
    {
      path: '/form/:id',
      name: 'form-render',
      // 懒加载：分享表单页面仅在访问时加载
      component: () => import('@/views/FormRender/index.vue'),
    },
  ],
})

export default router
