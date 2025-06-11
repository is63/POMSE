<script setup>
import { ref, onMounted, watch, defineProps, defineEmits, onUnmounted } from 'vue'
import axios from 'axios'
import { getEcho } from '../echo.js';

axios.defaults.baseURL = 'http://localhost:8080/api/';
const props = defineProps({
    chatId: { type: [String, Number], required: true },
    visible: Boolean,
    user: Object
})
const emit = defineEmits(['close'])

const messages = ref([])
const loading = ref(false)
const error = ref('')
const newMessage = ref('')
const sending = ref(false)
const userId = ref(null)
const editingMessageId = ref(null)
const editingText = ref('')

const userToShow = ref(null)

function getToken() {
    return sessionStorage.getItem('token')
}

function getUserIdFromToken() {
    const token = getToken()
    if (!token) return null
    try {
        return JSON.parse(atob(token.split('.')[1])).sub
    } catch { return null }
}

async function fetchUserInfo(userId) {
    try {
        const token = getToken();
        const res = await axios.get(`/users/${userId}`, {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        return res.data;
    } catch (e) {
        return null;
    }
}

async function fetchMessages() {
    if (!props.chatId) return
    loading.value = true
    error.value = ''
    try {
        const token = getToken()
        const res = await axios.get(`chats/${props.chatId}`, {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        })
        // Buscar el otro usuario (no el actual)
        const users = res.data.users || []
        const myId = userId.value || getUserIdFromToken()
        const otherUser = users.find(u => String(u.id) !== String(myId)) || users[0] || null
        userToShow.value = null
        if (otherUser) {
            // Obtener info completa del usuario (incluida la foto)
            const userInfo = await fetchUserInfo(otherUser.id)
            userToShow.value = userInfo || otherUser
        }
        // Mensajes (si los hay)
        messages.value = Array.isArray(res.data.messages) ? res.data.messages.map(msg => ({
            id: msg.id,
            texto: msg.content,
            emisor_id: msg.user_id,
            created_at: msg.created_at,
            imagen: msg.image_path ? ('http://localhost:8080/storage/' + msg.image_path) : null,
            user: msg.user
        })) : []
    } catch (e) {
        error.value = e.response?.data?.error || 'Error al cargar mensajes'
    } finally {
        loading.value = false
    }
}

const selectedImage = ref(null)

async function sendMessage() {
    if (!newMessage.value.trim() && !selectedImage.value) return
    sending.value = true
    error.value = ''
    try {
        const token = getToken()
        const formData = new FormData()
        formData.append('chat_id', props.chatId)
        if (newMessage.value.trim()) formData.append('content', newMessage.value.trim())
        if (selectedImage.value) formData.append('image', selectedImage.value)
        await axios.post('messages', formData, {
            headers: {
                ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            }
        })
        // No añadir el mensaje aquí, se añadirá al llegar por websocket
        newMessage.value = ''
        selectedImage.value = null
    } catch (e) {
        error.value = e.response?.data?.error || 'Error al enviar mensaje'
    } finally {
        sending.value = false
    }
}

function scrollToBottom() {
    setTimeout(() => {
        const el = document.querySelector('.chat-messages')
        if (el) el.scrollTop = el.scrollHeight
    }, 100)
}

function subscribeToChatChannel(chatId) {
    const echo = getEcho();
    if (!echo) {
        return;
    }
    echo.private(`chat.${chatId}`)
        .listen('MessageSent', (e) => {
            if (!messages.value.some(m => m.id === e.message.id)) {
                messages.value.push({
                    id: e.message.id,
                    texto: e.message.content,
                    emisor_id: e.message.user_id,
                    created_at: e.message.created_at,
                    imagen: e.message.image_path ? ('http://localhost:8080/storage/' + e.message.image_path) : null,
                    user: e.message.user
                });
                scrollToBottom();
            }
        });
}

function unsubscribeFromChatChannel(chatId) {
    const echo = getEcho();
    if (echo && chatId) {
        echo.leave(`private-chat.${chatId}`);
    }
}

watch(() => props.chatId, (newChatId, oldChatId) => {
    fetchMessages();
    if (oldChatId) {
        unsubscribeFromChatChannel(oldChatId);
    }
    if (newChatId) {
        subscribeToChatChannel(newChatId);
    }
});

onMounted(() => {
    userId.value = getUserIdFromToken();
    fetchMessages();
    if (props.chatId) {
        subscribeToChatChannel(props.chatId);
    }
});

onUnmounted(() => {
    if (props.chatId) {
        unsubscribeFromChatChannel(props.chatId);
    }
});

// Detectar aparición de token tras login y suscribirse si es necesario
watch(() => sessionStorage.getItem('token'), (newToken, oldToken) => {
    if (newToken && props.chatId) {
        subscribeToChatChannel(props.chatId);
    }
});

function handleKeydown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (!sending.value && newMessage.value.trim()) {
            sendMessage();
        }
    }
}

</script>

<template>
    <transition name="slide-chat-sidebar">
        <div v-if="visible" class="chat-sidebar-overlay" @click.self="$emit('close')" tabindex="-1">
            <aside class="chat-sidebar">
                <button class="close-btn" @click="$emit('close')" aria-label="Cerrar chat">&times;</button>
                <div class="chat-header">
                    <img :src="userToShow?.foto ? ('http://localhost:8080/' + userToShow.foto) : '/public/icons/user.svg'"
                        class="chat-avatar" alt="avatar" />
                    <span class="chat-username">{{ userToShow?.usuario || 'Usuario' }}</span>
                </div>
                <div class="chat-messages">
                    <div v-if="loading" class="chat-loading">Cargando...</div>
                    <div v-else-if="error" class="chat-error">{{ error }}</div>
                    <div v-else-if="messages.length">
                        <div v-for="msg in messages" :key="msg.id"
                            :class="['chat-message-row', { 'own-row': String(msg.emisor_id) === String(userId), 'other-row': String(msg.emisor_id) !== String(userId) }]">
                            <div
                                :class="['chat-message', { 'own-message': String(msg.emisor_id) === String(userId), 'editing': editingMessageId === msg.id }]">
                                <template v-if="editingMessageId === msg.id">
                                    <div class="edit-inline-container full-width-edit">
                                        <textarea v-model="editingText" class="editing-textarea full-width-edit"
                                            @keydown="e => handleEditKeydown(e, msg)" @blur="cancelEdit" maxlength="500"
                                            :rows="Math.min(4, editingText.split('\n').length)"
                                            style="resize: vertical;" />
                                        <div class="edit-btn-group">
                                            <button class="edit-btn" @click="updateMessage" title="Guardar edición">
                                                ✔
                                            </button>
                                            <button class="edit-btn" @click="cancelEdit" title="Cancelar edición">
                                                ✖
                                            </button>
                                        </div>
                                    </div>
                                    <span v-if="editingError" class="edit-error">{{ editingError }}</span>
                                </template>
                                <template v-else>
                                    <span class="chat-message-text">{{ msg.texto }}</span>
                                </template>
                            </div>
                        </div>
                    </div>
                    <div v-else class="chat-empty">No hay mensajes.</div>
                </div>
                <div class="chat-input-bar">
                    <textarea v-model="newMessage" class="chat-input-textarea" placeholder="Escribe un mensaje..."
                        :disabled="sending" @keydown="handleKeydown" maxlength="500"
                        :rows="Math.min(4, newMessage.split('\n').length)" style="resize: vertical;" />
                    <button class="chat-send-btn" :disabled="sending || !newMessage.trim()" @click="sendMessage">
                        <svg v-if="!sending" class="send-plane" width="28" height="28" viewBox="0 0 28 28" fill="none"
                            xmlns="http://www.w3.org/2000/svg">
                            <path d="M3 25L25 14L3 3V12L19 14L3 16V25Z" fill="currentColor" />
                        </svg>
                        <svg v-else class="send-plane sending" width="28" height="28" viewBox="0 0 28 28" fill="none"
                            xmlns="http://www.w3.org/2000/svg">
                            <path d="M3 25L25 14L3 3V12L19 14L3 16V25Z" fill="currentColor" />
                        </svg>
                    </button>
                </div>
            </aside>
        </div>
    </transition>
</template>

<style scoped>
.chat-sidebar-overlay {
    position: fixed;
    top: 0;
    right: 0;
    width: 100vw;
    height: 100vh;
    z-index: 3000;
    display: flex;
    justify-content: flex-end;
    align-items: stretch;
}

.chat-sidebar {
    background: #181818;
    width: 400px;
    max-width: 98vw;
    height: 100vh;
    box-shadow: -2px 0 16px #0008;
    border-left: 2px solid #8E44FF;
    position: relative;
    display: flex;
    flex-direction: column;
    animation: slideInSidebar 0.28s cubic-bezier(0.4, 0, 0.2, 1);
}

.close-btn {
    position: absolute;
    top: 1.2rem;
    right: 1.2rem;
    background: none;
    border: none;
    color: #fff;
    font-size: 2rem;
    cursor: pointer;
    z-index: 10;
    transition: color 0.18s;
}

.close-btn:hover {
    color: #8E44FF;
}

.chat-header {
    display: flex;
    align-items: center;
    gap: 1em;
    padding: 1.5em 1.5em 1em 1.5em;
    border-bottom: 1px solid #8E44FF44;
}

.chat-avatar {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    object-fit: cover;
    background: #161515;
    border: 2px solid #8E44FF44;
}

.chat-username {
    color: #fff;
    font-weight: 600;
    font-size: 1.1em;
}

.chat-messages {
    flex: 1 1 auto;
    overflow-y: auto;
    padding: 1.2em;
    display: flex;
    flex-direction: column;
    gap: 0.7em;
    background: transparent;
}

.chat-message-row {
    display: flex;
    width: 100%;
    margin-bottom: 0.2em;
}

.own-row {
    justify-content: flex-end;
}

.other-row {
    justify-content: flex-start;
}

.chat-message {
    background: #232323;
    color: #fff;
    border-radius: 1.2em;
    padding: 0.7em 1.2em;
    max-width: 70%;
    box-shadow: 0 2px 8px #8E44FF22;
    font-size: 1em;
    position: relative;
    word-break: break-word;
}

.own-message {
    background: linear-gradient(90deg, #8E44FF 80%, #6c2bd7 100%);
    color: #fff;
    box-shadow: 0 2px 12px #8E44FF33;
    align-items: flex-end;
}

.chat-loading,
.chat-error,
.chat-empty {
    color: #fffbe6;
    text-align: center;
    font-size: 1em;
    margin: 2em 0;
}

.chat-input-bar {
    display: flex;
    align-items: center;
    padding: 1em 1.5em;
    border-top: 1px solid #8E44FF44;
    background: #181818;
}

.chat-input-textarea {
    flex: 1;
    border-radius: 1.2em;
    border: 1.5px solid #8E44FF;
    padding: 0.7em 1.2em;
    font-size: 1em;
    background: #232323;
    color: #fff;
    outline: none;
    margin-right: 1em;
    min-height: 3.2em;
    max-height: 8em;
    overflow-y: auto;
    resize: vertical;
    line-height: 1.4;
    box-sizing: border-box;
    width: 100%;
}

.chat-send-btn {
    background: #8E44FF;
    color: #fff;
    border: none;
    border-radius: 1.2em;
    padding: 0.7em 1.5em;
    font-size: 1em;
    font-weight: 600;
    cursor: pointer;
    opacity: 1;
    transition: background 0.18s, opacity 0.18s;
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 48px;
    min-height: 48px;
}

.chat-send-btn:disabled {
    cursor: not-allowed;
    opacity: 0.7;
}

.send-plane {
    width: 28px;
    height: 28px;
    display: block;
    color: #fff;
    transition: color 0.18s;
}

.send-plane.sending {
    animation: plane-fly 1.5s cubic-bezier(0.4, 0, 0.2, 1) infinite;
}

@keyframes plane-fly {
    0% {
        transform: translateY(0) rotate(-10deg);
    }

    20% {
        transform: translateY(-6px) rotate(-16deg);
    }

    40% {
        transform: translateY(-12px) rotate(-12deg);
    }

    60% {
        transform: translateY(-8px) rotate(-18deg);
    }

    80% {
        transform: translateY(0) rotate(-12deg);
    }

    100% {
        transform: translateY(0) rotate(-10deg);
    }
}

.edit-btn {
    background: none;
    border: none;
    color: #bfa600;
    font-size: 1.1em;
    margin-left: 0.7em;
    cursor: pointer;
    opacity: 0.7;
    transition: color 0.18s, opacity 0.18s;
}

.edit-btn:hover {
    color: #fffbe6;
    opacity: 1;
}

.edit-inline-container {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 90%;
    margin: 0 auto;
    gap: 0.5em;
}

.full-width-edit {
    width: 100% !important;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    align-items: stretch;
}

.edit-btn-group {
    display: flex;
    flex-direction: row;
    gap: 0.2em;
    align-items: center;
    justify-content: flex-end;
    margin-top: 0.3em;
}

.edit-error {
    color: #ffbaba;
    font-size: 0.95em;
    margin-left: 0.5em;
}

.chat-message.editing {
    background: #181818;
    box-shadow: 0 2px 8px #8E44FF44;
}

@media (max-width: 600px) {
    .chat-sidebar {
        width: 98vw;
        min-width: 0;
        max-width: 100vw;
    }

    .edit-inline-container {
        flex-direction: column;
        align-items: stretch;
        width: 98%;
    }

    .full-width-edit {
        width: 100% !important;
    }

    .editing-textarea.full-width-edit {
        width: 100% !important;
    }

    .chat-input-textarea {
        width: 100%;
    }
}

.slide-chat-sidebar-enter-active,
.slide-chat-sidebar-leave-active {
    transition: all 0.28s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-chat-sidebar-enter-from,
.slide-chat-sidebar-leave-to {
    transform: translateX(100%);
    opacity: 0;
}

.slide-chat-sidebar-enter-to,
.slide-chat-sidebar-leave-from {
    transform: translateX(0);
    opacity: 1;
}
</style>
