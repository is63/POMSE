<script setup>
import { ref, computed, onMounted } from 'vue'
import FriendsSidebar from './FriendsSidebar.vue'
import MessagesSidebarContainer from './ChatSidebarContainer.vue'

const logoSrc = ref('/public/favicon2.png')
const hasToken = ref(!!sessionStorage.getItem('token'))
const userInfo = ref(null)
const showFriendsSidebar = ref(false)
const showMessagesSidebar = ref(false)

const props = defineProps({
    showFriendsSidebar: Boolean
})
const emit = defineEmits(['update:showFriendsSidebar', 'update:show-messages-sidebar'])

function updateTokenStatus() {
    hasToken.value = sessionStorage.getItem('token') !== null;
    if (hasToken.value) {
        try {
            userInfo.value = JSON.parse(sessionStorage.getItem('user'))
        } catch {
            userInfo.value = null
        }
    } else {
        userInfo.value = null
    }
}

window.addEventListener('storage', updateTokenStatus)
window.addEventListener('token-changed', updateTokenStatus)

function logout() {
    sessionStorage.removeItem('token')
    sessionStorage.removeItem('user')
    hasToken.value = false
    userInfo.value = null
    window.dispatchEvent(new Event('token-changed'))
    window.location.reload()
}

const userAvatar = computed(() => {
    if (userInfo.value && userInfo.value.foto) {
        if (userInfo.value.foto.startsWith('http')) return userInfo.value.foto
        if (userInfo.value.foto.startsWith('storage/')) return 'http://localhost:8080/' + userInfo.value.foto
        return '/' + userInfo.value.foto.replace(/^public\//, '')
    }
    return '/icons/favicon.svg'
})

function openFriendsSidebar() { emit('update:showFriendsSidebar', true) }
function closeFriendsSidebar() { emit('update:showFriendsSidebar', false) }
function openMessagesSidebar() {
    showMessagesSidebar.value = true
    emit('update:show-messages-sidebar', true)
}
function closeMessagesSidebar() {
    showMessagesSidebar.value = false
    emit('update:show-messages-sidebar', false)
}

onMounted(updateTokenStatus)
</script>

<template>
    <nav class="navbar navbar-expand-md navbar-dark">
        <div class="container-fluid container pb-3">
            <!-- Parte Izquierda -->
            <a class="navbar-brand d-flex align-items-center ml-5" href="/">
                <img :src="logoSrc" width="32" alt="Logo" />
                <span class="fw-semibold fs-4">POMSE</span>
            </a>
            <!-- TopMenu Links (centrados, visibles solo si hasToken) -->
            <div v-if="hasToken" class="menu-links-header">
                <RouterLink class="menu-link" to="/">
                    <i class="bi bi-house-fill icon"></i>
                    <span class="text">Inicio</span>
                </RouterLink>
                <button class="amigos-btn" type="button" @click="openMessagesSidebar">
                    <i class="bi bi-chat-left-text-fill icon"></i>
                    <span class="text">Mensajes</span>
                </button>
                <button class="amigos-btn" type="button" @click="openFriendsSidebar">
                    <i class="bi bi-people-fill icon"></i>
                    <span class="text">Amigos</span>
                </button>

            </div>
            <!-- Parte Derecha -->
            <div class="collapse navbar-collapse justify-content-end">
                <ul class="navbar-nav mb-md-0">
                    <li class="nav-item dropdown">
                        <a class="nav-link dropdown-toggle d-flex align-items-center" href="#" id="userDropdown"
                            role="button" data-bs-toggle="dropdown" aria-expanded="false">
                            <span class="avatar-img-header">
                                <img :src="userAvatar" alt="avatar" width="36" height="36" />
                            </span>
                        </a>
                        <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="userDropdown">
                            <template v-if="hasToken">
                                <li>
                                    <a class="dropdown-item" href="/profile">Mi perfil</a>
                                </li>
                                <li>
                                    <button class="dropdown-item text-danger" @click="logout">Cerrar sesión</button>
                                </li>
                            </template>
                            <template v-else>
                                <li>
                                    <a class="dropdown-item" href="/login">Identificarse</a>
                                </li>
                            </template>
                        </ul>
                    </li>
                </ul>
            </div>
        </div>
    </nav>
    <FriendsSidebar v-if="props.showFriendsSidebar" :visible="props.showFriendsSidebar" @close="closeFriendsSidebar" />
    <MessagesSidebarContainer v-if="showMessagesSidebar" :visible="showMessagesSidebar" @close="closeMessagesSidebar" />
</template>

<style scoped>
.container {
    max-width: 190vh;
}

.navbar {
    background: black;
    height: 7vh;
    padding-top: 2vh;
    min-height: 48px;
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    z-index: 1050;
}

@media (max-width: 600px) {
    .navbar {
        height: 6vh;
        min-height: 40px;
        padding: 0 1vw;
    }

    .navbar-brand span {
        font-size: 1.1rem;
    }

    .navbar-brand img {
        width: 24px;
    }
}

.avatar-img-header {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: #161515;
    overflow: hidden;
    border: none;
    margin-right: 0.5em;
}

.avatar-img-header img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 50%;
}

.dropdown-menu {
    background: #232323;
    color: #fff;
    border: 1px solid #8E44FF;
}

.dropdown-item {
    color: #fff;
    transition: background 0.18s, color 0.18s;
}

.dropdown-item:hover,
.dropdown-item:focus {
    background: #8E44FF33;
    color: #8E44FF;
}

.dropdown-item.text-danger {
    color: #ff4d4f;
}

.page-title {
    color: #fff !important;
    border-bottom: 2.5px solid #00FFC6;
    padding-bottom: 2px;
    line-height: 1.1;
    box-shadow: 0 2px 8px #00ffc666;
}

.menu-links-header {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    gap: 2vw;
    width: 100%;
    margin-left: 2vw;
}

.menu-link,
.amigos-btn {
    display: flex;
    align-items: center;
    gap: 0.5em;
    color: #f4f4f4;
    font-weight: 600;
    font-size: 1.08rem;
    text-decoration: none;
    padding: 0.1vw 1.2em;
    border-radius: 0.7em;
    transition: background 0.18s, color 0.18s, box-shadow 0.18s;
    position: relative;
    background: none;
    border: none;
    cursor: pointer;
    outline: none;
}

/* Iconos */
.menu-link .icon,
.amigos-btn .icon {
    font-size: 1.3em;
    color: #fff;
    filter: drop-shadow(0 0 2px #0008);
    transition: color 0.18s;
}

.menu-link .text,
.amigos-btn .text {
    color: #f4f4f4;
    font-weight: 600;
    font-size: 1.05rem;
    transition: color 0.18s;
}

/* Hover y activo para ambos */
.menu-link.router-link-exact-active,
.menu-link:hover,
.amigos-btn:hover,
.amigos-btn:focus {
    background: rgba(142, 68, 255, 0.32);
    color: #fff;
    box-shadow: 0 2px 8px #8E44FF22;
}

.menu-link.router-link-exact-active .icon,
.menu-link:hover .icon,
.amigos-btn:hover .icon,
.amigos-btn:focus .icon {
    color: #fff;
}

@media (max-width: 700px) {
    .menu-links-header {
        flex-direction: column;
        align-items: center;
        justify-content: center;
        width: 100vw;
        padding: 0.5em 0 0.5em 0;
        box-shadow: none;
        border-radius: 0;
        margin-left: 0;
    }
}
</style>
