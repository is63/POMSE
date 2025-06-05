<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'
import { defineEmits } from 'vue'

axios.defaults.baseURL = 'http://localhost:8080/api/'

const emit = defineEmits(['open-chat'])

let messages = ref([])
let searchMessages = ref('')
let loadingMessages = ref(true)
let searchResults = ref([])
let searchError = ref('')

// Nueva funcionalidad: búsqueda de amigos y creación de chats
let searchFriendsQuery = ref('')
let searchingFriends = ref(false)
let searchFriendsResults = ref([])
let searchFriendsError = ref('')

// Helper to get user info by ID
async function getUserInfo(id, token) {
    try {
        let response = await axios.get(`users/${id}`,
            token ? { headers: { 'Authorization': `Bearer ${token}` } } : undefined
        )
        return response.data
    } catch {
        return null
    }
}

// Cargar chats reales desde el backend propio (no Chatify)
async function loadMessages() {
    loadingMessages.value = true
    try {
        const token = sessionStorage.getItem('token')
        // Obtener los chats del usuario autenticado
        let response = await axios.get('chatsOfUser', {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        })
        let chatsArr = Array.isArray(response.data) ? response.data : []
        // Obtener el id del usuario actual
        let myId = null
        try {
            myId = token ? JSON.parse(atob(token.split('.')[1])).sub : null
        } catch { myId = null }
        // Para cada chat, obtener el otro usuario (no el actual)
        const chatDetails = await Promise.all(chatsArr.map(async chat => {
            // Llama a /chats/{id} para obtener los usuarios
            try {
                const chatRes = await axios.get(`chats/${chat.id}`, {
                    headers: token ? { 'Authorization': `Bearer ${token}` } : {}
                })
                const users = chatRes.data.users || []
                const otherUser = users.find(u => String(u.id) !== String(myId)) || users[0] || null
                return {
                    id: chat.id,
                    usuario: otherUser?.usuario || otherUser?.name || 'Usuario',
                    avatar: otherUser?.foto
                        ? (otherUser.foto.startsWith('http') ? otherUser.foto : 'http://localhost:8080/' + otherUser.foto)
                        : '/icons/favicon.svg',
                    user_id: otherUser?.id,
                }
            } catch {
                return {
                    id: chat.id,
                    usuario: 'Usuario',
                    avatar: '/icons/favicon.svg',
                    user_id: null,
                }
            }
        }))
        messages.value = chatDetails
        searchError.value = ''
    } catch (e) {
        messages.value = []
        searchError.value = 'No se pudieron cargar los chats: ' + (e.response?.data?.message || e.message || e)
        console.error('Error al cargar chats:', e)
    } finally {
        loadingMessages.value = false
    }
}

// Buscar amigos para crear chat
async function searchFriends() {
    searchFriendsError.value = ''
    searchFriendsResults.value = []
    if (!searchFriendsQuery.value.trim()) return
    searchingFriends.value = true
    try {
        const token = sessionStorage.getItem('token')
        let response = await axios.get('friendshipsOfUser', {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        })
        let data = response.data
        let usuario_id = null
        try {
            usuario_id = token ? JSON.parse(atob(token.split('.')[1])).sub : null
        } catch { usuario_id = null }
        // Solo amigos aceptados
        let accepted = Array.isArray(data) ? data.filter(f => String(f.accepted) === '1') : []
        // Obtener todos los usuarios
        let usersResp = await axios.get('users', {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        })
        let allUsers = Array.isArray(usersResp.data) ? usersResp.data : []
        // Match amigo info
        let friends = accepted.map(friend => {
            let amigoRealId = String(friend.usuario_id) === String(usuario_id)
                ? friend.amigo_id
                : friend.usuario_id
            const info = allUsers.find(u => String(u.id) == String(amigoRealId))
            if (!info) return null
            return {
                id: info.id,
                usuario: info.usuario,
                foto: info.foto,
            }
        }).filter(Boolean)
        // Filtrar por búsqueda
        let q = searchFriendsQuery.value.trim().toLowerCase()
        searchFriendsResults.value = friends.filter(f =>
            (f.usuario || '').toLowerCase().includes(q)
        )
        if (!searchFriendsResults.value.length) {
            searchFriendsError.value = 'No se encontraron amigos.'
        }
    } catch {
        searchFriendsError.value = 'No se pudo buscar amigos.'
    } finally {
        searchingFriends.value = false
    }
}

// Crear chat con amigo usando el endpoint propio (adaptado a nuevo formato)
async function startChatWith(friendId) {
    const token = sessionStorage.getItem('token')
    try {
        const res = await axios.post('chats', {
            user_ids: [friendId], // El backend espera un array de IDs
            name: null,           // Puedes pasar un nombre si quieres grupo
            is_group: false       // Es un DM
        }, {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        })
        // El backend devuelve { chat: {...}, ... }
        const chat = res.data.chat || res.data;
        await loadMessages(); // <-- Recarga la lista de chats tras crear uno nuevo
        emit('open-chat', {
            id: chat.id,
            usuario: chat.users?.find(u => u.id !== JSON.parse(atob(token.split('.')[1])).sub)?.usuario || '',
            avatar: chat.users?.find(u => u.id !== JSON.parse(atob(token.split('.')[1])).sub)?.foto || '',
            ...chat
        })
        searchFriendsQuery.value = ''
        searchFriendsResults.value = []
    } catch (e) {
        if (e.response && e.response.data && e.response.data.error) {
            searchFriendsError.value = e.response.data.error
        } else {
            searchFriendsError.value = 'No se pudo crear el chat.'
        }
    }
}

const filteredMessages = computed(() => {
    if (!searchMessages.value.trim()) return messages.value
    return messages.value.filter(m =>
        (m.usuario || '').toLowerCase().includes(searchMessages.value.trim().toLowerCase()) ||
        (m.texto || '').toLowerCase().includes(searchMessages.value.trim().toLowerCase())
    )
})

function openChatSidebar(chat) {
    // Pasa el chat_id real (msg.id) y la info del usuario al ChatSidebar
    emit('open-chat', { id: chat.id, usuario: chat.usuario, avatar: chat.avatar })
}

onMounted(loadMessages)
</script>

<template>
    <aside class="messages-list-aside">
        <!-- Buscar amigos para crear chat -->
        <div class="messages-search-header">
            <h2 class="messages-list-title">Nuevo chat</h2>
            <form class="messages-search-form" @submit.prevent="searchFriends">
                <input v-model="searchFriendsQuery" type="text" placeholder="Buscar amigo para chatear"
                    class="messages-search-input" />
                <button type="submit" class="messages-search-btn" :disabled="searchingFriends">
                    <i class="bi bi-search"></i>
                </button>
            </form>
        </div>
        <div class="messages-search-results-rect">
            <div v-if="searchingFriends" class="search-loading">Buscando...</div>
            <div v-else-if="searchFriendsError" class="search-error">{{ searchFriendsError }}</div>
            <div v-else-if="searchFriendsResults.length">
                <div v-for="user in searchFriendsResults" :key="user.id" class="user-card-rect">
                    <div class="user-card-img">
                        <img :src="user.foto ? (user.foto.startsWith('http') ? user.foto : 'http://localhost:8080/' + user.foto) : '/icons/favicon.svg'"
                            alt="avatar" width="36" height="36" />
                    </div>
                    <div class="user-card-content">
                        <div class="user-card-user">{{ user.usuario }}</div>
                        <button class="start-chat-btn" @click="startChatWith(user.id)">Chatear</button>
                    </div>
                </div>
            </div>
            <div v-else class="search-placeholder">Busca amigos para chatear.</div>
        </div>
        <!-- Lista de chats existentes -->
        <div class="messages-search-header" style="border-top: 1px solid rgba(255,255,255,0.08); margin-top: 0.5em;">
            <h2 class="messages-list-title">Chats</h2>
            <form class="messages-search-form" @submit.prevent>
                <input v-model="searchMessages" type="text" placeholder="Buscar Chat" class="messages-search-input" />
            </form>
        </div>
        <div class="messages-list-rect">
            <div v-if="loadingMessages" class="loading-messages-msg">Cargando...</div>
            <div v-else-if="searchError" class="search-error">{{ searchError }}</div>
            <div v-else-if="filteredMessages.length">
                <div v-for="msg in filteredMessages" :key="msg.id" class="message-card-rect"
                    @click="openChatSidebar(msg)" style="cursor:pointer;">
                    <div class="message-card-img">
                        <img :src="msg.avatar" alt="avatar" width="40" height="40" />
                    </div>
                    <div class="message-card-content">
                        <div class="message-card-user">{{ msg.usuario }}</div>
                        <div class="message-card-text">{{ msg.texto || '' }}</div>
                    </div>
                </div>
            </div>
            <div v-else class="no-messages-msg">No hay chats disponibles.</div>
        </div>
    </aside>
</template>

<style scoped>
.messages-list-aside {
    background: black;
    border-radius: 0.417vw;
    margin-bottom: 0;
    padding-bottom: 0;
    padding-top: 0.583vw;
    position: fixed;
    top: 0;
    left: 0;
    right: auto;
    bottom: 0;
    color: #8E44FF;
    z-index: 2000;
    border: 0.078vw solid rgba(255, 255, 255, 0.08);
    box-shadow: 0 0.208vw 0.729vw rgba(0, 0, 0, 0.22);
    min-width: 12.5vw;
    max-width: 100vw;
    display: flex;
    flex-direction: column;
    height: 100vh;
    max-height: 100vh;
    overflow: hidden;
}

.messages-search-header {
    padding: 0 1vw 0.417vw 1vw;
    border-bottom: 0.052vw solid rgba(255, 255, 255, 0.1);
    background: transparent;
}

.messages-list-title {
    text-transform: uppercase;
    font-size: 0.79vw;
    font-weight: 600;
    margin: 0 0 0.417vw 0;
    letter-spacing: 0.04em;
}

.messages-search-form {
    display: flex;
    align-items: center;
    gap: 0.417vw;
    margin-bottom: 0.167vw;
}

.messages-search-input {
    flex: 1;
    border-radius: 0.313vw;
    border: 0.078vw solid #8E44FF;
    padding: 0.375vw 0.75vw;
    font-size: 0.833vw;
    background: #181818;
    color: #fff;
    outline: none;
    transition: border 0.18s;
}

.messages-search-input:focus {
    border-color: #00FFC6;
}

.messages-search-btn {
    background: #8E44FF;
    color: #fff;
    border: none;
    border-radius: 0.313vw;
    padding: 0.375vw 0.75vw;
    font-size: 0.917vw;
    cursor: pointer;
    transition: background 0.18s;
    display: flex;
    align-items: center;
    justify-content: center;
}

.messages-search-btn:disabled {
    opacity: 0.7;
    cursor: not-allowed;
}

.messages-search-btn:hover {
    background: #00FFC6;
    color: #181818;
}

.search-placeholder {
    color: #fff;
    text-align: center;
    font-size: 0.833vw;
    padding: 0.583vw 0.167vw;
    padding-left: 1vw;
    padding-right: 1vw;
}

.messages-search-results-rect {
    max-height: 40vh;
    min-height: 6vh;
    overflow-y: auto;
    padding: 0.5em 1.2rem 0.5em 1.2rem;
    background: transparent;
    display: flex;
    flex-direction: column;
    gap: 0.7em;
}

.messages-list-rect {
    flex: 1 1 auto;
    overflow-y: auto;
    padding: 0.417vw 1vw 1vw 1vw;
    background: transparent;
    display: flex;
    flex-direction: column;
    gap: 0.583vw;
    min-height: 30vh;
    max-height: 75vh;
    border-bottom: 0.052vw solid rgba(255, 255, 255, 0.1);
}

.loading-messages-msg {
    color: #fff;
    text-align: center;
    font-size: 1.083vw;
    font-weight: 500;
    margin: 3vh 0 2vh 0;
    letter-spacing: 0.04em;
}

.message-card-rect {
    display: flex;
    align-items: center;
    background: #181818;
    border-radius: 0.521vw;
    box-shadow: 0 0.104vw 0.417vw #8e44ff22;
    padding: 0.417vw 0.833vw;
    gap: 0.833vw;
    margin-bottom: 0.104vw;
    min-height: 2.5vw;
    transition: box-shadow 0.18s, background 0.18s;
}

.message-card-rect:hover {
    background: #232323;
    box-shadow: 0 0.208vw 0.833vw #8e44ff44;
}

.message-card-img img {
    width: 2.083vw;
    height: 2.083vw;
    border-radius: 0.417vw;
    object-fit: cover;
    background: #161515;
    border: 0.104vw solid #8E44FF44;
    transition: transform 0.18s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.18s cubic-bezier(0.4, 0, 0.2, 1);
}

.message-card-img img:hover {
    transform: translateY(-0.313vw) scale(1.13);
    box-shadow: 0 0.417vw 1.25vw #8e44ff55, 0 0.104vw 0.417vw #0006;
    z-index: 2;
}

.message-card-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    color: #fff;
}

.message-card-user {
    font-weight: 600;
    font-size: 0.891vw;
    margin-bottom: 0.167vw;
}

.message-card-text {
    font-size: 0.812vw;
    color: #bfa600;
}

.no-messages-msg {
    color: #fffbe6;
    font-size: 0.833vw;
    text-align: center;
    padding: 0.583vw 0.167vw;
    padding-left: 1vw;
    padding-right: 1vw;
}

.search-loading {
    color: #00FFC6;
    text-align: center;
    font-size: 0.917vw;
    margin: 2vh 0;
}

.user-card-rect {
    display: flex;
    align-items: center;
    background: #181818;
    border-radius: 0.521vw;
    box-shadow: 0 0.104vw 0.417vw #8e44ff22;
    padding: 0.333vw 0.667vw;
    gap: 0.521vw;
    margin-bottom: 0.104vw;
    min-height: 2.29vw;
    max-height: 2.92vw;
    transition: box-shadow 0.18s, background 0.18s;
}

.user-card-rect:hover {
    background: #232323;
    box-shadow: 0 0.208vw 0.833vw #8e44ff44;
}

.user-card-img img {
    width: 1.875vw;
    height: 1.875vw;
    border-radius: 0.417vw;
    object-fit: cover;
    background: #161515;
    border: 0.104vw solid #8E44FF44;
    transition: transform 0.18s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.18s cubic-bezier(0.4, 0, 0.2, 1);
}

.user-card-img img:hover {
    transform: translateY(-0.26vw) scale(1.11);
    box-shadow: 0 0.313vw 0.938vw #8e44ff55, 0 0.104vw 0.417vw #0006;
    z-index: 2;
}

.user-card-content {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 0.521vw;
}

.user-card-user {
    font-weight: 600;
    font-size: 0.84vw;
    color: #fff;
}

.start-chat-btn {
    background: #8E44FF;
    color: #fff;
    border: none;
    border-radius: 0.313vw;
    padding: 0.167vw 0.75vw;
    font-size: 0.812vw;
    font-weight: 500;
    margin-left: 0.26vw;
    transition: background 0.18s, color 0.18s;
    box-shadow: 0 0.104vw 0.417vw #8e44ff22;
    cursor: pointer;
}

.start-chat-btn:hover {
    background: #00FFC6;
    color: #181818;
}
</style>
