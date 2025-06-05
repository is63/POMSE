<script setup>
import { ref } from 'vue'
import { RouterLink } from 'vue-router'

const expanded = ref(false)
</script>

<template>
    <div class="sidebar" :class="{ expanded }" @mouseenter="expanded = true" @mouseleave="expanded = false">
        <div class="sidebar-content">
            <RouterLink class="menu-item text-decoration-none text-white fw-semibold" to="/">
                <span class="icon">🏠</span>
                <span class="text">Inicio</span>
            </RouterLink>
            <RouterLink class="menu-item text-decoration-none text-white fw-semibold" to="/documentos">
                <span class="icon">📄</span>
                <span class="text">Documentos</span>
            </RouterLink>
            <RouterLink class="menu-item text-decoration-none text-white fw-semibold" to="/configuracion">
                <span class="icon">⚙️</span>
                <span class="text">Configuración</span>
            </RouterLink>
        </div>
    </div>
</template>

<style scoped>
.sidebar {
    position: fixed;
    top: 7vh;
    left: 0.05vw;
    height: 90vh;
    width: 2.5vw;
    min-width: 48px;
    max-width: 220px;
    background: linear-gradient(135deg, rgba(0, 0, 0, 0.92) 0%, #232323 60%, rgba(36, 36, 36, 0.7) 80%, rgba(0, 0, 0, 0.05) 100%);
    color: #f4f4f4;
    transition: width 0.32s cubic-bezier(0.4, 0, 0.2, 1), background 0.3s, box-shadow 0.3s;
    overflow-x: hidden;
    z-index: 1000;
    box-shadow: 0.3vw 0 1vw 0.15vw #8E44FF33;
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-top: 2.5vh;
    border-radius: 1vw;
    border: 0.12vw solid;
    border-image: linear-gradient(135deg, #000 0%, transparent 100%) 1;
    backdrop-filter: blur(10px) saturate(1.2);
    background-clip: padding-box;
}

.sidebar.expanded {
    width: 10vw;
    min-width: 120px;
    background: linear-gradient(135deg, rgba(0, 0, 0, 0.92) 0%, #232323 60%, rgba(36, 36, 36, 0.7) 80%, rgba(0, 0, 0, 0.05) 100%);
    box-shadow: 0.2vw 0 1vw 0.1vw #8E44FF33;
    border-radius: 1vw;
    border: 0.12vw solid;
    border-image: linear-gradient(135deg, #000 0%, transparent 100%) 1;
}

@media (max-width: 900px) {
    .sidebar {
        width: 8vw;
        min-width: 40px;
    }

    .sidebar.expanded {
        width: 40vw;
        min-width: 120px;
    }
}

@media (max-width: 600px) {
    .sidebar {
        position: fixed;
        top: 7vh;
        left: 0;
        width: 0;
        min-width: 0;
        height: 0;
        border: none;
        box-shadow: none;
        background: transparent;
        pointer-events: none;
    }

    .sidebar.expanded {
        width: 60vw;
        min-width: 120px;
        height: calc(100vh - 7vh);
        background: rgba(36, 36, 36, 0.95);
        pointer-events: auto;
        box-shadow: 0.2vw 0 0.5vw 0.05vw #8E44FF44;
        backdrop-filter: blur(8px);
        border-radius: 1vw;
        border: 0.12vw solid;
        border-image: linear-gradient(135deg, #000 0%, transparent 100%) 1;
    }
}

.sidebar-content {
    width: 100%;
    margin-top: 2vh;
    display: flex;
    flex-direction: column;
    gap: 2vh;
}

.menu-item {
    padding: 1.1vh 0.8vw;
    border-radius: 0.7vw;
    cursor: pointer;
    white-space: nowrap;
    transition: background 0.22s, color 0.22s, box-shadow 0.22s, border 0.18s;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    border-left: 3px solid transparent;
    font-size: 1.08rem;
    background: transparent;
    color: #f4f4f4;
    font-weight: 500;
    letter-spacing: 0.01em;
    box-shadow: none;
}

.menu-item .icon {
    font-size: 2.1vh;
    color: #8E44FF;
    filter: drop-shadow(0 0 2px #0008);
    margin-right: 0.22vw;
    transition: color 0.18s;
}

.menu-item .text {
    margin-left: 0.3vw;
    margin-right: 0.2vw;
    transition: opacity 0.2s, width 0.2s, color 0.18s;
    white-space: nowrap;
    overflow: hidden;
    font-weight: 600;
    font-size: 1.05rem;
    color: #f4f4f4;
}

.sidebar:not(.expanded) .menu-item .text {
    opacity: 0;
    width: 0;
    margin-left: 0;
    pointer-events: none;
}

.sidebar.expanded .menu-item {
    justify-content: flex-start;
}

.menu-item:hover,
.menu-item.router-link-exact-active {
    background: linear-gradient(90deg, #8E44FF22 60%, transparent 100%);
    color: #8E44FF;
    border-left: 3px solid #8E44FF;
    border-bottom: 2.5px solid #232323;
    box-shadow: 0 2px 8px #8E44FF22;
}

.menu-item:hover .icon,
.menu-item.router-link-exact-active .icon {
    color: #fff;
}

.menu-item:not(:last-child) {
    border-bottom: 1px solid #8E44FF11;
}
</style>
