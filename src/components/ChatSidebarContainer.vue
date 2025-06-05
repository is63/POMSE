<script setup>
import MessagesSidebar from './ChatSidebar.vue';
import ChatSidebar from './MessagesSideBar.vue';
import { ref, defineProps, defineEmits } from 'vue';

const props = defineProps({
    visible: Boolean
});
const emit = defineEmits(['close']);

const showChatSidebar = ref(false)
const selectedChat = ref(null)

function handleOpenChat(chat) {
    selectedChat.value = chat
    showChatSidebar.value = true
}
function closeChatSidebar() {
    showChatSidebar.value = false
    selectedChat.value = null
}
</script>

<template>
    <transition name="slide-messages-sidebar">
        <div v-if="visible" class="messages-sidebar-overlay" @click.self="emit('close')" tabindex="-1">
            <aside class="messages-sidebar">
                <button class="close-btn" @click="emit('close')" aria-label="Cerrar sidebar">&times;</button>
                <MessagesSidebar @open-chat="handleOpenChat" />
            </aside>
            <ChatSidebar v-if="showChatSidebar" :chat-id="selectedChat?.id" :user="selectedChat"
                :visible="showChatSidebar" @close="closeChatSidebar" />
        </div>
    </transition>
</template>

<style scoped>
.messages-sidebar-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    z-index: 2000;
    display: flex;
    justify-content: flex-start;
    align-items: stretch;
}

.messages-sidebar {
    background: #181818;
    width: 320px;
    max-width: 90vw;
    height: 100vh;
    box-shadow: 2px 0 16px #0008;
    border-right: 2px solid #8E44FF;
    position: relative;
    display: flex;
    flex-direction: column;
    animation: slideInSidebarLeft 0.28s cubic-bezier(0.4, 0, 0.2, 1);
}

.close-btn {
    position: absolute;
    top: 1.2rem;
    left: 1.2rem;
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

@media (max-width: 600px) {
    .messages-sidebar {
        width: 95vw;
        max-width: 100vw;
    }
}

.slide-messages-sidebar-enter-active,
.slide-messages-sidebar-leave-active {
    transition: all 0.28s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-messages-sidebar-enter-from,
.slide-messages-sidebar-leave-to {
    transform: translateX(-100%);
    opacity: 0;
}

.slide-messages-sidebar-enter-to,
.slide-messages-sidebar-leave-from {
    transform: translateX(0);
    opacity: 1;
}

@keyframes slideInSidebarLeft {
    from {
        transform: translateX(-100%);
        opacity: 0;
    }

    to {
        transform: translateX(0);
        opacity: 1;
    }
}
</style>
