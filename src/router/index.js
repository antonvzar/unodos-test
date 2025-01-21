import { createRouter, createWebHistory, createWebHashHistory } from 'vue-router'
import UsersList from '@/components/UsersList.vue'
import FriendDetails from '@/components/FriendDetails.vue';


const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', component: UsersList },
    { path: '/friend/:id', component: FriendDetails },
  ],
})

export default router
