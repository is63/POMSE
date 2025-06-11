<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'

axios.defaults.baseURL = 'http://127.0.0.1:8080/api/'

const route = useRoute()
const router = useRouter()
const userInfo = ref(null)
const userPosts = ref([])
const loadingPosts = ref(true)
const noPostsMsg = ref('')
const userFriends = ref([])
const loadingFriends = ref(true)
const page = ref(1)
const pageSize = 10
const allLoaded = ref(false)
const loadingMore = ref(false)
const scrollComponent = ref(null)

const userId = computed(() => route.query.id)

onMounted(async () => {
    if (!userId.value) {
        router.push('/')
        return
    }
    try {
        loadingPosts.value = true
        const token = sessionStorage.getItem('token')
        // Obtener info del usuario externo
        const userRes = await axios.get(`users/${userId.value}`, token ? { headers: { 'Authorization': `Bearer ${token}` } } : undefined)
        userInfo.value = userRes.data
        // Posts ya no son paginados, vienen en res.data.posts
        const res = await axios.get(`postsOfUser/${userId.value}`, token ? { headers: { 'Authorization': `Bearer ${token}` } } : undefined)
        if (res.data && Array.isArray(res.data.posts)) {
            userPosts.value = res.data.posts
            if (userPosts.value.length === 0) noPostsMsg.value = 'No hay posts.'
        } else {
            userPosts.value = []
            noPostsMsg.value = 'No hay posts.'
        }
    } catch {
        userInfo.value = null
        router.push('/')
    } finally {
        loadingPosts.value = false
    }
    fetchUserFriends()
})

async function fetchUserFriends() {
    loadingFriends.value = true
    try {
        const token = sessionStorage.getItem('token')
        const res = await axios.get(`numberOfFriends/${userId.value}`, token ? { headers: { 'Authorization': `Bearer ${token}` } } : undefined)
        if (res.data && typeof res.data.number_of_friends === 'number') {
            userFriends.value = Array(res.data.number_of_friends).fill({})
        } else {
            userFriends.value = []
        }
    } catch {
        userFriends.value = []
    } finally {
        loadingFriends.value = false
    }
}

const userAvatar = computed(() => {
    if (userInfo.value && userInfo.value.foto) {
        if (userInfo.value.foto.startsWith('http')) return userInfo.value.foto
        if (userInfo.value.foto.startsWith('storage/')) return 'http://localhost:8080/' + userInfo.value.foto
        return '/' + userInfo.value.foto.replace(/^public\//, '')
    }
    return '/icons/favicon.svg'
})
</script>

<template>
    <div class="container" v-if="userInfo">
        <div class="row justify-content-center">
            <div class="col-12 col-md-10 col-lg-8">
                <!-- Profile Header restaurado: solo info básica, sin botones de acción -->
                <div class="profile-header d-flex mb-3">
                    <div class="profile-avatar me-3">
                        <img :src="userAvatar" alt="avatar" class="rounded-circle profile-img" />
                    </div>
                    <div class="profile-info position-relative w-100">
                        <div class="d-flex align-items-center mb-2">
                            <h2 class="fw-bold fs-3 mb-0 me-2">{{ userInfo.usuario }}</h2>
                            <span v-if="userInfo.verificado" class="badge bg-success me-1"><i class="bi bi-check"></i>
                                Verificado</span>
                            <span v-if="userInfo.is_admin" class="badge bg-warning text-dark">Administrador</span>
                        </div>
                        <div class="d-flex gap-4 mb-2 profile-stats align-items-center profile-stats-pos">
                            <div><span class="stat-value">{{ userPosts.length }}</span> <span
                                    class="stat-label">Posts</span></div>
                            <div>
                                <span class="stat-value">{{ loadingFriends ? '...' : userFriends.length }}</span>
                                <span class="stat-label">
                                    {{ loadingFriends ? ' Amigos' : (userFriends.length === 1 ? ' Amigo' : ' Amigos') }}
                                </span>
                            </div>
                        </div>
                        <div v-if="userInfo.bio" class="bio mb-2 small">{{ userInfo.bio }}</div>
                    </div>
                </div>
                <!-- Tab nav igual que en Profile.vue pero solo con Posts -->
                <ul class="nav nav-tabs justify-content-center mb-4" id="profileTab" role="tablist">
                    <li class="nav-item" role="presentation">
                        <button class="nav-link active" id="posts-tab" data-bs-toggle="tab" data-bs-target="#posts"
                            type="button" role="tab" aria-controls="posts" aria-selected="true">Posts</button>
                    </li>
                </ul>
                <div class="tab-content" id="profileTabContent">
                    <div class="tab-pane fade show active" id="posts" role="tabpanel" aria-labelledby="posts-tab">
                        <div v-if="!loadingPosts && userPosts.length === 0" class="no-posts-message">{{ noPostsMsg }}
                        </div>
                        <div v-if="loadingPosts" class="mt-5 text-center" style="color: #fff;">Cargando...</div>
                        <div class="posts-grid" v-else>
                            <template v-if="userPosts.length > 0">
                                <div v-for="post in userPosts" :key="post.id" class="post-item card-style">
                                    <a :href="`/posts/${post.id}`" class="card-link">
                                        <div class="card-content">
                                            <div class="card-title text-dark">{{ post.titulo }}</div>
                                            <div class="card-desc">{{ post.descripcion }}</div>
                                            <img v-if="post.imagen" :src="'http://localhost:8080/' + post.imagen"
                                                alt="Imagen" class="card-img"
                                                @error="event.target.style.display = 'none'" />
                                        </div>
                                    </a>
                                </div>
                            </template>
                        </div>
                    </div>
                </div>
                <!-- Eliminar action-buttons -->
            </div>
        </div>
    </div>
</template>

<style scoped>
.profile-header {
    border-radius: 18px;
    padding: 20px;
    align-items: center;
    /* Fondo negro al centro y difuminado a #F4F4F4 en los bordes */
    background: rgba(0, 0, 0, 0.774);
    border: 0.13vw solid #8e44ff;
}

.profile-avatar img {
    width: 150px;
    height: 150px;
    object-fit: cover;
    border-radius: 50%;
}

.profile-img {
    width: 150px;
    height: 150px;
    object-fit: cover;
    border-radius: 50%;

}

.profile-info h2 {
    font-size: 28px;
    font-weight: 600;
    margin-bottom: 10px;
}

.edit-profile-btn {
    background: #00fff79a;
    color: #fff;
    border: none;
    border-radius: 6px;
    margin-left: 10px;
    font-size: 1.1em;
    transition: background 0.2s, color 0.2s;
}

.edit-profile-btn:hover {
    color: #121212;
}

.profile-stats .stat-value {
    font-weight: 600;
    color: #7CFF01;
}

.profile-stats-pos {
    position: relative;
}

.nav-link {
    border-bottom: none;
    color: black;
    font-weight: 600;

}

.nav-link:hover {
    color: #8E44FF;
    border-bottom: 2px solid #8E44FF;
}

.nav-link.active {

    color: #8E44FF;
    border-bottom: 2px solid #8E44FF;
}

.tab-content {
    height: 52vh;
    background-color: #e2e2e2 !important;
    overflow-y: auto;
    background: #fcfcfc;
    color: #232323;
    border-radius: 12px;
    border: 2px solid #8E44FF33;
    box-shadow: 0 2px 12px #0001;
    margin-bottom: 3vh;
}

.posts-header-bar {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    margin-bottom: 0.7em;
    margin-top: 1.2em;
    margin-left: 0.2em;
}

.posts-header-title {
    font-size: 1.25em;
    font-weight: 600;
    color: #fff;
    letter-spacing: 0.01em;
    margin-bottom: 0.1em;
}

.posts-header-underline {
    width: 48px;
    height: 3px;
    background: #8E44FF;
    border-radius: 2px;
    margin-top: 0.1em;
}

.posts-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1.2vh;
    margin-top: 1.5em;
}

.post-item {
    border-radius: 14px;
    border: 2.5px solid;
    box-shadow: 0 2px 12px #0002;
    padding: 0;
    transition: box-shadow 0.2s, border-color 0.2s, transform 0.18s;
    display: flex;
    flex-direction: column;
    cursor: pointer;
    min-height: 180px;
    position: relative;
}

.post-item:hover {
    box-shadow: 0 8px 32px #8E44FF33, 0 2px 12px #00fff733;
    border-color: #8E44FF;
    transform: translateY(-2px) scale(1.012);
}

.card-style {
    background: #fcfcfc;
    border: none;
    border-radius: 14px 14px 24px 24px;
    box-shadow: 0 2px 12px #0002;
    transition: box-shadow 0.2s, transform 0.2s, border-color 0.2s;
    overflow: hidden;
    padding-bottom: 0.5vh;
    margin-bottom: 0.5vh;
    max-width: 320px;
    min-width: 180px;
    width: 100%;
    margin-left: auto;
    margin-right: auto;
}

.card-style:hover {
    box-shadow: 0 8px 32px #8E44FF33, 0 2px 12px #00fff733;
    transform: translateY(-0.5vh) scale(1.01);
}

.card-link {
    text-decoration: none;
    color: inherit;
    display: block;
}

.card-content {
    padding: 2vh 2vw;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
}

.card-title {
    font-weight: 600;
    width: 100%;
    text-align: center;
    padding-bottom: 0.7vh;
    color: #fff;
    font-size: 1.3em;
    letter-spacing: 0.01em;
}

.card-desc {
    font-size: 1.08em;
    color: #8E44FF;
    margin-bottom: 0.7em;
    text-align: center;
    font-weight: 500;
}

.card-img {
    width: 100%;
    max-height: 30vh;
    object-fit: contain;
    border-radius: 0.7vw;
    margin-bottom: 1vh;
    margin-top: 1vh;
    background: #232323;
}

.no-posts-message {

    text-align: center;
    margin-top: 2em;
}

.badge.bg-success {
    background: #39ff14 !important;
    color: #181818;
}

.badge.bg-warning {
    background: #ffd600 !important;
    color: #181818;
}

.loading {
    color: #8E44FF;
    text-align: center;
    font-size: 1.2em;
    margin: 2em 0 1em 0;
}

.end-message {
    color: #aaa;
    text-align: center;
    font-size: 1.1em;
    margin: 2em 0 1em 0;
}
</style>
