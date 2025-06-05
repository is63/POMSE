<script setup>
import Cards from '../components/Cards.vue'
import { useRouter } from 'vue-router'
import { ref, computed } from 'vue'

const props = defineProps({
  showFriendsSidebar: Boolean,
  showMessagesSidebar: Boolean
})

const router = useRouter()
const isLogged = ref(!!sessionStorage.getItem('token'))

function goToCrearPost() {
  router.push('/crearPost')
}

window.addEventListener('storage', () => {
  isLogged.value = !!sessionStorage.getItem('token')
})

const fabClass = computed(() => props.showFriendsSidebar ? 'crear-post-fab fab-left' : 'crear-post-fab')
</script>

<template>
  <div class="center">
    <Cards />
  </div>
  <div v-if="isLogged && !props.showMessagesSidebar" :class="fabClass" @click="goToCrearPost" title="Crear nuevo post">
    <span class="fab-icon">+</span>
  </div>
</template>

<style scoped>
.center {
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100vh;
  overflow-y: auto;
}

#friends {
  text-align: center;
}

.crear-post-fab {
  position: fixed;
  right: 2.5vw;
  bottom: 2.5vw;
  width: 64px;
  height: 64px;
  color: #fff;
  background: linear-gradient(135deg, #8E44FF 60%, #3d1a6f 100%);
  border-radius: 50%;
  box-shadow: 0 4px 32px #8e44ff88, 0 2px 12px #0006;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 2000;
  border: 2.5px solid #fff;
  transition: background 0.2s, color 0.2s, box-shadow 0.2s, border 0.2s, transform 0.13s, right 0.2s, left 0.2s;
  animation: fab-pop 0.7s cubic-bezier(.23, 1.13, .5, 1.01);
}

.fab-left {
  right: auto !important;
  left: 2.5vw !important;
}

@keyframes fab-pop {
  0% {
    transform: scale(0.7);
  }

  70% {
    transform: scale(1.15);
  }

  100% {
    transform: scale(1);
  }
}

.crear-post-fab:hover {
  background: linear-gradient(135deg, #a259ff 70%, #8E44FF 100%);
  color: #fff;
  border: 2.5px solid #8E44FF;
  box-shadow: 0 6px 32px #8e44ffcc, 0 4px 18px #0007;
  transform: scale(1.08);
}

.fab-icon {
  font-size: 2.5em;
  font-weight: bold;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  text-shadow: 0 2px 12px #8e44ffcc, 0 1px 4px #000a;
  letter-spacing: 0.01em;
  user-select: none;
}
</style>
