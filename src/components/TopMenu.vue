<script setup>
import { RouterLink } from 'vue-router'
</script>

<template>
    <nav class="top-menu">
        <div class="menu-links">
            <RouterLink class="menu-link" to="/">
                <span class="icon">🏠</span>
                <span class="text">Inicio</span>
            </RouterLink>
            <RouterLink class="menu-link" to="/documentos">
                <span class="icon">📄</span>
                <span class="text">Amigos</span>
            </RouterLink>
            <RouterLink class="menu-link" to="/configuracion">
                <span class="icon">⚙️</span>
                <span class="text">Mensajes</span>
            </RouterLink>
        </div>
    </nav>
</template>

<style scoped>
.top-menu {
    width: 100vw;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(to bottom, black 75%, #f4f4f4 100%);
    box-shadow: 0 2px 12px #0001;
    padding: 0;
    padding-bottom: 2vh;
    padding-left: 2.8vw;
    padding-top: 0.5vh;
    position: fixed;
    top: 7vh;
    left: 0;
    z-index: 1049;
    transition: height 0.25s;
    height: 6vh;
    margin-top: 0;
}

.menu-links {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    gap: 2vw;
    width: 100%;
}

.menu-link {
    display: flex;
    align-items: center;
    gap: 0.5em;
    color: #f4f4f4;
    font-weight: 600;
    font-size: 1.08rem;
    text-decoration: none;
    padding: 0.1vw 1.2em;
    /* padding vertical menor para separar del top/bottom */
    border-radius: 0.7em;
    transition: background 0.18s, color 0.18s, box-shadow 0.18s;
    position: relative;
}

.menu-link .icon {
    font-size: 1.3em;
    color: #8E44FF;
    filter: drop-shadow(0 0 2px #0008);
    transition: color 0.18s;
}

.menu-link .text {
    color: #f4f4f4;
    font-weight: 600;
    font-size: 1.05rem;
    transition: color 0.18s;
}

.menu-link.router-link-exact-active,
.menu-link:hover {
    background: rgba(142, 68, 255, 0.32);
    /* morado translúcido, menos opaco */
    color: #fff;
    box-shadow: 0 2px 8px #8E44FF22;
}

.menu-link.router-link-exact-active .icon,
.menu-link:hover .icon {
    color: #fff;
}

@media (max-width: 700px) {
    .menu-links {
        flex-direction: column;
        align-items: center;
        justify-content: center;
        background: linear-gradient(90deg, #232323 80%, #161515 100%);
        position: static;
        width: 100vw;
        padding: 0.5em 0 0.5em 0;
        box-shadow: none;
        border-radius: 0;
    }

    .top-menu {
        height: auto;
        padding-bottom: 0;
    }
}
</style>
