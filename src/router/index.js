import { createRouter, createWebHistory } from 'vue-router'
import Home from '@/views/Home.vue'
import Login from '@/views/Login.vue'
import Profile from '../views/Profile.vue'
import EditProfile from '@/views/EditProfile.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: Home,
    },
    {
      path: '/login',
      name: 'login',
      component: Login,
    },
    {
      path: '/profile',
      name: 'Profile',
      component: Profile,
    },
    {
      path: '/EditProfile',
      name: 'EditProfile',
      component: EditProfile,
    },
    {
      path: '/crearPost',
      name: 'CrearPost',
      component: () => import('../views/CreatePost.vue')
    },
    {
      path: '/posts/:id',
      name: 'PostView',
      component: () => import('../views/PostView.vue'),
      meta: { requiresAuth: false }
    },
  ],
})

export default router
