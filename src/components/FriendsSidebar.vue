<template>
    <transition name="slide-friends-sidebar">
        <div v-if="visible" class="friends-sidebar-overlay" @click.self="closeSidebar" tabindex="-1">
            <aside class="friends-sidebar" aria-label="Tus amigos">
                <button class="close-btn" @click="closeSidebar" aria-label="Cerrar sidebar">&times;</button>
                <FriendsList />
            </aside>
        </div>
    </transition>
</template>

<script setup>
import FriendsList from './FriendsList.vue';
import { defineProps, defineEmits } from 'vue';

const props = defineProps({
    visible: Boolean
});
const emit = defineEmits(['close']);

function closeSidebar() {
    emit('close');
}
</script>

<style scoped>
.friends-sidebar-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    
    z-index: 2000;
    display: flex;
    justify-content: flex-end;
    align-items: stretch;
}

.friends-sidebar {
    background: #181818;
    width: 320px;
    max-width: 90vw;
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

@media (max-width: 600px) {
    .friends-sidebar {
        width: 95vw;
        max-width: 100vw;
    }
}

.slide-friends-sidebar-enter-active,
.slide-friends-sidebar-leave-active {
    transition: all 0.28s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-friends-sidebar-enter-from,
.slide-friends-sidebar-leave-to {
    transform: translateX(100%);
    opacity: 0;
}

.slide-friends-sidebar-enter-to,
.slide-friends-sidebar-leave-from {
    transform: translateX(0);
    opacity: 1;
}

@keyframes slideInSidebar {
    from {
        transform: translateX(100%);
        opacity: 0;
    }

    to {
        transform: translateX(0);
        opacity: 1;
    }
}
</style>
