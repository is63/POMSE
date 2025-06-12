<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import Header from './components/Header.vue';


onMounted(async () => {
  if (!sessionStorage.getItem('token')) return;
  try {
    const response = await fetch('https://localhost:8443/api/check-token', {
      headers: {
        'Authorization': `Bearer ${sessionStorage.getItem('token')}`
      }
    });
    if (!response.ok) {
      sessionStorage.removeItem('token');
      window.location.reload();
    }
  } catch (e) {
    sessionStorage.removeItem('token');
    window.location.reload();
  }
});

const isLogged = ref(!!sessionStorage.getItem('token'))

window.addEventListener('storage', () => {
  isLogged.value = !!sessionStorage.getItem('token')
})

const router = useRouter()

router.afterEach(() => {
  isLogged.value = !!sessionStorage.getItem('token')
})

const showFriendsSidebar = ref(false)
const showMessagesSidebar = ref(false)

// Escuchar eventos de Header para controlar showMessagesSidebar
defineExpose({ showMessagesSidebar })
</script>

<template>
  <div class="body">
    <Header class="fixed-top" :show-friends-sidebar="showFriendsSidebar"
      @update:show-friends-sidebar="val => showFriendsSidebar = val"
      @update:show-messages-sidebar="val => showMessagesSidebar = val" />
    <div class="main-layout">
      <div class="main-content">
        <RouterView class="layout" :show-friends-sidebar="showFriendsSidebar"
          :show-messages-sidebar="showMessagesSidebar" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.body {
  background: #F4F4F4;
  color: white;
  min-height: 100vh;
  overflow-y: auto;
  padding-top: 8vh;
  /* deja espacio para el header fijo */
  cursor: url('/puntero/puntero1.png'), auto;
}


.main-content {
  flex: 1;
  margin-left: 2.5vw;
  transition: margin-left 0.2s;
}

@media (max-width: 900px) {
  .main-content {
    margin-left: 8vw;
  }
}

@media (max-width: 600px) {
  .main-content {
    margin-left: 0;
  }
}

.layout {
  background-color: transparent;
  color: white;
}
</style>
<style>
/*
  Ampliación de la personalización del cursor pointer para todos los elementos y clases interactivos de la app.
  Incluye selectores de botones, links, tabs, acciones, íconos, etc.
*/
.body a,
.body button,
.body [role="button"],
.body .amigos-btn,
.body .menu-link,
.body .icon-action,
.body .close-btn,
.body .edit-btn,
.body .send-btn,
.body .friends-search-btn,
.body .messages-search-btn,
.body .social-btn-crear,
.body .user-card-add-btn,
.body .user-card-remove-btn,
.body .start-chat-btn,
.body .nav-link,
.body .dropdown-item,
.body .card-link,
.body .post-item,
.body .fab-icon,
.body .crear-post-fab,
.body .tab-link,
.body .tab-pane,
.body .router-link,
.body .router-link-exact-active,
.body .sidebar-btn,
.body .sidebar-link,
.body .profile-btn,
.body .action-btn,
.body .external-link,
.body .user-link,
.body .user-btn,
.body .chat-btn,
.body .chat-link,
.body .message-btn,
.body .message-link,
.body .friend-btn,
.body .friend-link,
.body .list-btn,
.body .list-link,
.body .header-btn,
.body .header-link,
.body .file-btn,
.body .card-action,
.body .create-comment-btn,
.body .cancel-btn,
.body .custom-file-upload,
.body .edit-profile-btn,
.body .login-switch a,
.body .social-dropzone {
  cursor: url('/puntero/puntero2.png') 0 0, pointer !important;
}

/* Para deshabilitados: not-allowed */
.body button:disabled,
.body .send-btn:disabled,
.body .social-btn-crear:disabled,
.body .friends-search-btn:disabled,
.body .messages-search-btn:disabled {
  cursor: not-allowed !important;
}
</style>
