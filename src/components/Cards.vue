<script setup>
import { ref, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useInfiniteScroll } from '@vueuse/core'
import axios from 'axios'

import commentIcon from '/public/icons/comment.svg'
import likeIcon from '/public/icons/like.svg'
import saveIcon from '/public/icons/save.svg'

const router = useRouter()

axios.defaults.baseURL = 'http://localhost:8080/api/'

let data = ref([])
let error = ref(null)
let commentsCount = ref({})
let likesCount = ref({})
let savedsCount = ref({})
let page = ref(1)
let pageSize = 10
let loadingMore = ref(false)
let allLoaded = ref(false)
let loadedIds = ref(new Set())
let likedPosts = ref(new Set()) // Guarda los postId que el usuario ha dado like
let savedPosts = ref(new Set()) // Guarda los postId que el usuario ha guardado
const scrollComponent = ref(null)

// ALERTA BOOTSTRAP
const alertMessage = ref('')
const alertType = ref('danger')
const showAlert = ref(false)
function showBootstrapAlert(message, type = 'danger') {
    alertMessage.value = message
    alertType.value = type
    showAlert.value = true
    setTimeout(() => {
        showAlert.value = false
    }, 5000)
}

function getImageUrl(path) {
    if (!path) return null
    return 'http://localhost:8080/' + path;
}

async function fetchCommentsCount(postId) {
    try {
        let response = await axios.get(`commentsOfPost/${postId}?limit=1`)
        commentsCount.value[postId] = response.data.comments && typeof response.data.comments.total === 'number'
            ? response.data.comments.total
            : (Array.isArray(response.data.comments.data) ? response.data.comments.data.length : 0)
    } catch (e) {
        commentsCount.value[postId] = 0
    }
}

async function fetchLikesCount(postId) {
    try {
        const token = sessionStorage.getItem('token')
        let headers = {}
        if (token) {
            headers = {
                Authorization: `Bearer ${token}`,
                Accept: 'application/json'
            }
        }
        let response = await axios.get(`likesOfPost/${postId}`, { headers })
        likesCount.value[postId] = Array.isArray(response.data.likes)
            ? response.data.likes.length
            : 0
        // Si la API devuelve los likes del usuario, marcar el post como likeado
        if (token && response.data.likes && Array.isArray(response.data.likes)) {
            // Buscar si el usuario actual ha dado like
            const user = sessionStorage.getItem('user')
            let userId = null
            if (user) {
                try {
                    userId = JSON.parse(user).id
                } catch { }
            }
            if (userId) {
                if (response.data.likes.some(like => like.usuario_id === userId)) {
                    likedPosts.value.add(postId)
                } else {
                    likedPosts.value.delete(postId)
                }
            }
        }
    } catch (e) {
        likesCount.value[postId] = 0
    }
}

async function fetchSavedsCount(postId) {
    try {
        const token = sessionStorage.getItem('token')
        let headers = {}
        if (token) {
            headers = {
                Authorization: `Bearer ${token}`,
                Accept: 'application/json'
            }
        }
        let response = await axios.get(`savedsOfPost/${postId}`, { headers })
        savedsCount.value[postId] = Array.isArray(response.data.saveds)
            ? response.data.saveds.length
            : 0
        // Si la API devuelve los guardados del usuario, marcar el post como guardado
        if (token && response.data.saveds && Array.isArray(response.data.saveds)) {
            const user = sessionStorage.getItem('user')
            let userId = null
            if (user) {
                try {
                    userId = JSON.parse(user).id
                } catch { }
            }
            if (userId) {
                if (response.data.saveds.some(saved => saved.usuario_id === userId)) {
                    savedPosts.value.add(postId)
                } else {
                    savedPosts.value.delete(postId)
                }
            }
        }
    } catch (e) {
        savedsCount.value[postId] = 0
    }
}

async function giveLike(postId) {
    const token = sessionStorage.getItem('token')
    if (!token) {
        showBootstrapAlert('Debes iniciar sesión para dar like.', 'warning')
        return
    }
    try {
        await axios.post('likes', { post_id: postId }, {
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: 'application/json'
            }
        })
        likedPosts.value.add(postId)
        likesCount.value[postId] = (likesCount.value[postId] || 0) + 1
    } catch (e) {
        if (e.response && e.response.status === 401) {
            showBootstrapAlert('Token inválido o expirado. Por favor, inicia sesión de nuevo.', 'danger')
        } else {
            showBootstrapAlert('Error al dar like.', 'danger')
        }
    }
}

async function removeLike(postId) {
    const token = sessionStorage.getItem('token')
    if (!token) {
        showBootstrapAlert('Debes iniciar sesión para quitar el like.', 'warning')
        return
    }
    try {
        await axios.delete('likes', {
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: 'application/json'
            },
            data: { post_id: postId }
        })
        likedPosts.value.delete(postId)
        likesCount.value[postId] = Math.max((likesCount.value[postId] || 1) - 1, 0)
    } catch (e) {
        if (e.response && e.response.status === 401) {
            showBootstrapAlert('Token inválido o expirado. Por favor, inicia sesión de nuevo.', 'danger')
        } else {
            showBootstrapAlert('Error al quitar el like.', 'danger')
        }
    }
}

async function toggleLike(postId) {
    // Si ya está likeado, eliminar el like
    if (likedPosts.value.has(postId)) {
        await removeLike(postId)
    } else {
        // Si no está likeado, dar like
        await giveLike(postId)
    }
}

async function savePost(postId) {
    const token = sessionStorage.getItem('token')
    if (!token) {
        showBootstrapAlert('Debes iniciar sesión para guardar el post.', 'warning')
        return
    }
    try {
        await axios.post('saveds', { post_id: postId }, {
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: 'application/json'
            }
        })
        savedPosts.value.add(postId)
        savedsCount.value[postId] = (savedsCount.value[postId] || 0) + 1
    } catch (e) {
        if (e.response && e.response.status === 401) {
            showBootstrapAlert('Token inválido o expirado. Por favor, inicia sesión de nuevo.', 'danger')
        } else {
            showBootstrapAlert('Error al guardar el post.', 'danger')
        }
    }
}

async function unsavePost(postId) {
    const token = sessionStorage.getItem('token')
    if (!token) {
        showBootstrapAlert('Debes iniciar sesión para quitar el guardado.', 'warning')
        return
    }
    try {
        await axios.delete(`saveds/${postId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: 'application/json'
            }
        })
        savedPosts.value.delete(postId)
        savedsCount.value[postId] = Math.max((savedsCount.value[postId] || 1) - 1, 0)
    } catch (e) {
        if (e.response && e.response.status === 401) {
            showBootstrapAlert('Token inválido o expirado. Por favor, inicia sesión de nuevo.', 'danger')
        } else {
            showBootstrapAlert('Error al quitar el guardado.', 'danger')
        }
    }
}

async function fetchPage(pageNum) {
    try {
        loadingMore.value = true
        let response = await axios.get(`posts?page=${pageNum}&limit=${pageSize}`)
        let posts = response.data.data || []
        let newPosts = posts.filter(post => !loadedIds.value.has(post.id))

        // Detectar si es la última página
        if (!response.data.next_page_url || newPosts.length === 0) {
            allLoaded.value = true
        }

        for (let post of newPosts) {
            fetchCommentsCount(post.id)
            fetchLikesCount(post.id)
            fetchSavedsCount(post.id)
            loadedIds.value.add(post.id)
        }

        data.value = [...data.value, ...newPosts]
    } catch (err) {
        error.value = err
    } finally {
        loadingMore.value = false
    }
}

// Inicial carga
onMounted(async () => {
    await fetchPage(page.value)
})

// Esperar a que el scrollComponent exista
watch(scrollComponent, (el) => {
    if (!el) return

    useInfiniteScroll(
        scrollComponent,
        async () => {
            if (!loadingMore.value && !allLoaded.value) {
                page.value++
                await fetchPage(page.value)
            }
        },
        { distance: 200 }
    )
})
</script>



<template>
    <div class="layout-outer" ref="scrollComponent">
        <div class="layout">
            <!-- ALERTA BOOTSTRAP -->
            <div v-if="showAlert" :class="`alert alert-${alertType} neon-alert fixed-top mx-auto mt-3 w-auto fade show`"
                style="z-index:2000; max-width: 400px; left:0; right:0;">
                {{ alertMessage }}
            </div>
            <div v-if="error">Error: {{ error.message }}</div>
            <div v-else-if="data && data.length">
                <div class="cards-container">
                    <div v-for="(item, id) in data" :key="item.id || id" class="card"
                        :class="{ 'has-image': item.imagen }">
                        <!-- Cambia el enlace a router.push -->
                        <div class="card-link" tabindex="0"
                            style="text-decoration: none; color: inherit; display: block; cursor: pointer;"
                            @click="router.push(`/posts/${item.id}`)">
                            <div class="card-content">
                                <p class="h5 mb-1 card-title">{{ item.titulo }}</p>
                                <p class="h6 text-muted pt-2 mb-3">{{ item.descripcion }}</p>
                                <img v-if="item.imagen" :src="getImageUrl(item.imagen)" alt="Imagen" class="card-img"
                                    @error="event => event.target.style.display = 'none'" />
                            </div>
                        </div>
                        <div class="iconos">
                            <span class="icon-action" title="Comentar">
                                <span style="cursor:pointer" @click="router.push(`/posts/${item.id}`)">
                                    <img :src="commentIcon" alt="comment image" />
                                </span>
                                <span class="icon-count">{{ commentsCount[item.id] ?? '' }}</span>
                            </span>
                            <span v-if="!likedPosts.has(item.id)" class="icon-action" title="Me gusta"
                                @click="giveLike(item.id)">
                                <img :src="likeIcon" alt="Like image" />
                                <span class="icon-count">{{ likesCount[item.id] ?? '' }}</span>
                            </span>
                            <span v-else class="icon-action liked" title="Quitar like" @click="removeLike(item.id)">
                                <img :src="likeIcon" alt="Like image" />
                                <span class="icon-count">{{ likesCount[item.id] ?? '' }}</span>
                            </span>
                            <span v-if="!savedPosts.has(item.id)" class="icon-action" title="Guardar"
                                @click="savePost(item.id)">
                                <img :src="saveIcon" alt="Save image" />
                                <span class="icon-count">{{ savedsCount[item.id] ?? '' }}</span>
                            </span>
                            <span v-else class="icon-action liked" title="Quitar guardado" @click="unsavePost(item.id)">
                                <img :src="saveIcon" alt="Save image" />
                                <span class="icon-count">{{ savedsCount[item.id] ?? '' }}</span>
                            </span>
                        </div>
                    </div>
                </div>
                <div v-if="loadingMore" class="loading">Cargando más...</div>
                <div v-if="allLoaded && data.length > 0" class="end-message">No hay más posts.</div>
            </div>
            <div v-else>Cargando...</div>
        </div>
    </div>
</template>


<style scoped>
.layout-outer {
    width: 100vw;
    min-height: 90vh;
    overflow-y: auto;
    background: transparent;
}

.layout {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    min-height: 0;
    width: 100vw;
    overflow: hidden;
    padding-top: 3vh;
}

.cards-container {
    display: flex;
    flex-direction: column;
    gap: 2vh;
    width: 100%;
    align-items: center;
}

.card {

    border: none;
    padding-bottom: 0.5vh;
    border-bottom: 0.5vh solid #8E44FF22;
    background-color: transparent;
    width: 60vw;
    min-width: 260px;
    max-width: 700px;
    font-size: 1.1rem;
    overflow: hidden;
    transition: box-shadow 0.2s, transform 0.2s;
    display: flex;
    flex-direction: column;

}

.card:hover {
    box-shadow: 0 14px 36px rgba(0, 0, 0, 0.2);
    transform: translateY(-0.5vh);

}

.card.has-image {
    height: auto;
}

.card-content {
    padding: 2vh 2vw;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
}

.card-img {
    width: 100%;
    max-height: 30vh;
    object-fit: contain;
    border-radius: 0.7vw;
    margin-bottom: 1vh;
    margin-top: 1vh;
}

.iconos {
    display: flex;
    background-color: transparent;
    gap: 2vw;
    align-items: center;
    justify-content: center;
    padding: 1vh;
    z-index: 4;
}

.icon-action {
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 64px;
    height: 38px;
    padding: 0 18px;
    background: #fff;
    border-radius: 22px/19px;
    box-shadow: 0 2px 8px #0001;
    font-size: 1.5rem;
    cursor: pointer;
    transition: transform 0.1s, box-shadow 0.18s;
    margin: 0 0.2vw;
    border: 1.5px solid #f4f4f4;
}

.icon-action:hover {
    transform: scale(1.08);
    filter: brightness(1.1);
    box-shadow: 0 4px 16px #8E44FF22;
}

.icon-action img {
    width: 26px;
    height: 26px;
    object-fit: contain;
    display: block;
    margin-right: 0.5em;
    filter: brightness(0) invert(0);
    /*Cambia los iconos blancos en negro */
}

.icon-action.liked {
    background: #8E44FF;
    border-color: #8E44FF;
}

.icon-action.liked img {
    filter: brightness(1.5) sepia(1) hue-rotate(260deg) saturate(2);
}

.icon-count {
    font-size: 1.08rem;
    color: #232323;
    font-weight: 600;
    margin-left: 0.1em;
    vertical-align: middle;
}

.comment-count {
    font-size: 1rem;

    margin-left: 0.3em;
    vertical-align: middle;
}

.card-container {
    border-radius: 14px;
    box-shadow: 0 2px 12px #0002;
    padding: 1.5em 1em;
    margin: 1em auto;

}

.card-title {

    font-weight: 600;
    width: 100%;
    text-align: center;
    padding-bottom: 0.7vh;
}


.card-action {
    background: #FF1744;
    color: #fff;
    border-radius: 8px;
    padding: 0.5em 1em;
    cursor: pointer;
    transition: background 0.2s, color 0.2s;
    border: none;
}

.card-action:hover {
    color: #121212;
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

.liked {
    color: #FF1744;
}

.neon-alert {
    background: radial-gradient(ellipse at center, #8e44ff 0%, #3d1a6f 100%) !important;
    color: #fff !important;
    border: 1.5px solid #8e44ff !important;
    box-shadow: 0 0 18px 2px #8e44ffcc, 0 0 2px #fff inset;
    text-shadow: 0 0 4px #fff, 0 0 8px #8e44ff;
}
</style>
