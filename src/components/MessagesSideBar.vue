<template>
    <div class="chat-container">
        <div class="chat-header">
            <h3>Chat</h3>
            <button @click="$emit('close')">Cerrar</button>
        </div>
        <div class="chat-messages" ref="messagesContainer">
            <div v-for="msg in messages" :key="msg.id" class="message"
                :class="{'my-message': msg.emisor_id === userId, 'other-message': msg.emisor_id !== userId}">
                <div class="message-content">
                    <div class="message-info">
                        <span class="message-sender" v-if="msg.emisor_id !== userId">{{ msg.user.name }}</span>
                        <span class="message-time">{{ new Date(msg.created_at).toLocaleTimeString() }}</span>
                    </div>
                    <div class="message-text" v-html="msg.texto"></div>
                    <img v-if="msg.imagen" :src="msg.imagen" class="message-image" />
                </div>
                <div v-if="msg.emisor_id === userId" class="message-actions">
                    <button @click="editMessage(msg)">Editar</button>
                    <button @click="deleteMessage(msg.id)">Eliminar</button>
                </div>
            </div>
            <div v-if="loading" class="loading-spinner">Cargando...</div>
            <div v-if="error" class="error-message">{{ error }}</div>
        </div>
        <div class="chat-input">
            <input type="file" @change="handleImageChange" accept="image/*" class="image-upload" />
            <textarea v-model="newMessage" class="chat-input-textarea" placeholder="Escribe un mensaje..."
                :disabled="sending" @keydown="handleKeydown" maxlength="500"
                :rows="Math.min(4, newMessage.split('\n').length)" style="resize: vertical;"></textarea>
            <button @click="sendMessage" class="send-button" :disabled="sending">
                <span v-if="sending" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                <span v-else>Enviar</span>
            </button>
        </div>
    </div>

    <div v-if="editingMessageId !== null" class="edit-message-container">
        <textarea v-model="editingText" class="editing-textarea full-width-edit"
            @keydown="e => handleEditKeydown(e, msg)" @blur="cancelEdit" maxlength="500"
            :rows="Math.min(4, editingText.split('\n').length)"
            style="resize: vertical;"></textarea>
        <button @click="updateMessage" class="update-button" :disabled="sending">
            <span v-if="sending" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
            <span v-else>Actualizar</span>
        </button>
        <button @click="cancelEdit" class="cancel-button">Cancelar</button>
    </div>
</template>

<script setup>
import { ref, onMounted, watch, defineProps, defineEmits, onUnmounted } from 'vue'
import axios from 'axios'
import echo from '../echo.js'; // Ajusta la ruta si es necesario

axios.defaults.baseURL = 'http://localhost:8080/api/';
const props = defineProps({
    chatId: { type: [String, Number], required: true },
    visible: Boolean,
    user: Object // info del usuario con el que se chatea
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
const editingError = ref('')
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
        userToShow.value = users.find(u => String(u.id) !== String(myId)) || users[0] || null
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

function handleImageChange(e) {
    const file = e.target.files[0]
    if (file && file.type.startsWith('image/')) {
        selectedImage.value = file
    } else {
        selectedImage.value = null
    }
}

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
        const res = await axios.post('messages', formData, {
            headers: {
                ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            }
        })
        // Añadir el mensaje enviado a la lista inmediatamente (optimista)
        if (res.data && res.data.message) {
            const msg = res.data.message
            messages.value.push({
                id: msg.id,
                texto: msg.content,
                emisor_id: msg.user_id,
                created_at: msg.created_at,
                imagen: msg.image_path ? ('http://localhost:8080/storage/' + msg.image_path) : null,
                user: msg.user
            })
            scrollToBottom()
        }
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

watch(() => props.chatId, (newChatId, oldChatId) => {
    fetchMessages();
    // Salir del canal anterior si existe
    if (oldChatId) {
        echo.leave(`chat.${oldChatId}`);
    }
    // Unirse al nuevo canal si existe
    if (newChatId) {
        echo.join(`chat.${newChatId}`)
            .here((users) => {
                // Usuarios conectados al chat
            })
            .joining((user) => {
                // Usuario se une al chat
            })
            .leaving((user) => {
                // Usuario sale del chat
            })
            .listen('MessageSent', (e) => {
                console.log('Nuevo mensaje recibido:', e.message);
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
});

onMounted(() => {
    userId.value = getUserIdFromToken();
    fetchMessages();
    // Unirse al canal del chat actual si existe
    if (props.chatId) {
        echo.join(`chat.${props.chatId}`)
            .here((users) => { })
            .joining((user) => { })
            .leaving((user) => { })
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
});

// Polling cada 3 segundos (comentado, solo usar si se necesita fallback sin websockets)
// let fetchInterval = setInterval(async () => {
//     if (!props.chatId) return;
//     try {
//         const token = getToken();
//         const res = await axios.get(`chats/${props.chatId}`, {
//             headers: token ? { 'Authorization': `Bearer ${token}` } : {}
//         });
//         const msgs = Array.isArray(res.data.messages) ? res.data.messages.map(msg => ({
//             id: msg.id,
//             texto: msg.content,
//             emisor_id: msg.user_id,
</script>

<style scoped>
.chat-container {
    display: flex;
    flex-direction: column;
    height: 100%;
}

.chat-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px;
    background-color: #f1f1f1;
    border-bottom: 1px solid #ddd;
}

.chat-header h3 {
    margin: 0;
    font-size: 18px;
}

.chat-header button {
    padding: 5px 10px;
    font-size: 14px;
    cursor: pointer;
}

.chat-messages {
    flex: 1;
    overflow-y: auto;
    padding: 10px;
    background-color: #fff;
}

.message {
    margin-bottom: 10px;
}

.my-message .message-content {
    background-color: #dcf8c6;
    align-self: flex-end;
}

.other-message .message-content {
    background-color: #f1f0f0;
}

.message-content {
    padding: 10px;
    border-radius: 10px;
    max-width: 80%;
    position: relative;
}

.message-info {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    color: #888;
}

.message-sender {
    font-weight: bold;
}

.message-time {
    margin-left: 10px;
}

.message-text {
    margin: 5px 0;
}

.message-image {
    max-width: 100%;
    border-radius: 10px;
}

.message-actions {
    display: flex;
    gap: 5px;
}

.edit-message-container {
    position: absolute;
    bottom: 10px;
    left: 10px;
    right: 10px;
    background-color: #fff;
    padding: 10px;
    border-radius: 10px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.editing-textarea {
    width: 100%;
    border: 1px solid #ddd;
    border-radius: 5px;
    padding: 10px;
    font-size: 14px;
    margin-bottom: 10px;
}

.update-button, .cancel-button {
    padding: 5px 10px;
    font-size: 14px;
    cursor: pointer;
}

.cancel-button {
    background-color: #f44336;
    color: white;
    border: none;
    border-radius: 5px;
}

.send-button {
    padding: 5px 10px;
    font-size: 14px;
    cursor: pointer;
    background-color: #007bff;
    color: white;
    border: none;
    border-radius: 5px;
}

.loading-spinner {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
}

.error-message {
    color: red;
    text-align: center;
}
</style>
