<script setup>
import { ref } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'

axios.defaults.baseURL = 'https://localhost:8443/api/'

const titulo = ref('')
const descripcion = ref('')
const imagen = ref(null)
const imagenPreview = ref('')
const loading = ref(false)
const error = ref('')
const success = ref('')
const router = useRouter()
const fileInput = ref(null)
const isDragOver = ref(false)

function handleFileChange(e) {
    const file = e.target.files[0]
    imagen.value = file
    if (file) {
        imagenPreview.value = URL.createObjectURL(file)
    } else {
        imagenPreview.value = ''
    }
}

async function crearPost() {
    error.value = ''
    success.value = ''
    if (!titulo.value.trim()) {
        error.value = 'El título es obligatorio.'
        return
    }
    loading.value = true
    try {
        const formData = new FormData()
        formData.append('titulo', titulo.value)
        if (descripcion.value) formData.append('descripcion', descripcion.value)
        if (imagen.value) formData.append('imagen', imagen.value)
        const token = sessionStorage.getItem('token')
        const headers = token ? { Authorization: `Bearer ${token}` } : {}
        await axios.post('/posts', formData, { headers })
        success.value = '¡Post creado exitosamente!'
        setTimeout(() => router.push('/'), 1200)
    } catch (e) {
        error.value = e.response?.data?.message || 'No se pudo crear el post.'
    } finally {
        loading.value = false
    }
}

function onDropzoneDragOver() {
    isDragOver.value = true
}
function onDropzoneDragLeave() {
    isDragOver.value = false
}
function onDropzoneDrop(e) {
    isDragOver.value = false
    const files = e.dataTransfer.files
    if (files && files.length > 0) {
        const file = files[0]
        imagen.value = file
        imagenPreview.value = URL.createObjectURL(file)
    }
}

function getImageUrl(path) {
    if (!path) return null
    return 'https://localhost:8443/' + path;
}
</script>

<template>
    <div class="crear-post-social-container">
        <h2 class="crear-post-social-title">Crear nuevo post</h2>
        <form class="crear-post-social-form" @submit.prevent="crearPost">
            <input id="titulo" v-model="titulo" type="text" maxlength="255" required placeholder="Título del post *"
                class="social-title-input" />
            <textarea id="descripcion" v-model="descripcion" rows="3" maxlength="800"
                placeholder="¿Qué quieres compartir? (opcional)" class="social-desc-input"></textarea>
            <div class="social-dropzone" @click="$refs.fileInput.click()" @dragover.prevent="onDropzoneDragOver"
                @dragleave.prevent="onDropzoneDragLeave" @drop.prevent="onDropzoneDrop"
                :class="{ 'dropzone-dragover': isDragOver }">
                <span v-if="!imagenPreview" class="dropzone-text">📸 Arrastra una imagen o haz click aquí</span>
                <img v-if="imagenPreview" :src="imagenPreview" alt="preview" class="dropzone-img-preview" />
                <input ref="fileInput" type="file" accept="image/*" @change="handleFileChange" style="display:none;" />
            </div>
            <button class="social-btn-crear" type="submit" :disabled="loading">
                <span v-if="loading" class="social-loader"></span>
                <span v-else>Publicar</span>
            </button>
            <div v-if="error" class="alert social-alert alert-danger mt-3">{{ error }}</div>
            <div v-if="success" class="alert social-alert alert-success mt-3">{{ success }}</div>
        </form>
    </div>
</template>

<style scoped>
.crear-post-social-container {
    border-radius: 18px;
    padding: 2.5em 2em 2em 2em;
    max-width: 540px;
    margin: 3em auto;
    box-shadow: 0 2px 24px #8e44ff22, 0 1px 8px #0002;
    background: #232323;
    color: #fff;
    border-bottom: 4px solid #8E44FF44;
}

.crear-post-social-title {
    color: #8E44FF;
    font-size: 2.1em;
    font-weight: 700;
    margin-bottom: 1.2em;
    text-align: center;
    text-shadow: 0 2px 8px #8e44ff44;
    letter-spacing: 0.01em;
}

.crear-post-social-form {
    display: flex;
    flex-direction: column;
    gap: 1.2em;
    color: #fff;
    border-radius: 14px;
    padding: 2em 2vw;
    background: transparent;
}

.social-dropzone {
    background: rgba(255, 255, 255, 0.08);
    border: 2.5px dashed #8E44FF;
    border-radius: 16px;
    min-height: 120px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: border-color 0.2s, background 0.2s;
    margin-bottom: 0.5em;
    margin-top: 0.5em;
    position: relative;
    overflow: hidden;
}

.social-dropzone:hover {
    border-color: #fff205;
    background: rgba(142, 68, 255, 0.10);
}

.social-dropzone.dropzone-dragover {
    border-color: #C471ED;
    background: rgba(196, 113, 237, 0.12);
    transition: border-color 0.18s, background 0.18s;
}

.dropzone-text {
    color: #8E44FF;
    font-size: 1.1em;
    font-weight: 600;
    text-align: center;
    opacity: 0.85;
}

.dropzone-img-preview {
    max-width: 100%;
    max-height: 180px;
    border-radius: 12px;
    object-fit: cover;
    box-shadow: 0 1px 8px #8E44FF44;
    background: #181818;
    border: 2px solid #8E44FF44;
}

.social-title-input {
    background: #181818;
    color: #fff;
    border: none;
    border-bottom: 2.5px solid #8E44FF44;
    border-radius: 14px;
    padding: 0.8em 1.1em;
    font-size: 1.13em;
    font-weight: 700;
    transition: border-color 0.2s, background 0.2s;
    box-shadow: none;
}

.social-title-input:focus {
    border-bottom: 2.5px solid #8E44FF;
    background: #2d2340;
    /* Fondo diferente al contenedor padre */
    outline: none;
}

.social-desc-input {
    background: #181818;
    color: #fff;
    border: none;
    border-bottom: 2.5px solid #8E44FF44;
    border-radius: 14px;
    /* Más redondeado */
    padding: 0.8em 1.1em;
    font-size: 1.08em;
    min-height: 60px;
    max-height: 120px;
    resize: vertical;
    transition: border-color 0.2s, background 0.2s;
    box-shadow: none;
}

.social-desc-input:focus {
    border-bottom: 2.5px solid #8E44FF;
    background: #2d2340;
    /* Fondo diferente al contenedor padre */
    outline: none;
}

.social-btn-crear {
    background: linear-gradient(90deg, #8E44FF 0%, #C471ED 100%);
    /* Morado a lila, transición suave */
    color: #fff;
    border: none;
    font-weight: 700;
    border-radius: 24px;
    padding: 0.8em 1.6em;
    box-shadow: 0 2px 8px #8e44ff33;
    font-size: 1.13em;
    margin-top: 1em;
    transition: background 0.2s, color 0.2s, transform 0.18s;
    letter-spacing: 0.01em;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5em;
    background-size: 200% 100%;
    background-position: left;
}

.social-btn-crear:disabled {
    opacity: 0.7;
    cursor: not-allowed;
}

.social-btn-crear:hover {
    background-position: right;
    background: linear-gradient(90deg, #C471ED 0%, #8E44FF 100%);
    color: #fff;
    transform: scale(1.04);
}

.social-loader {
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top: 2px solid #8E44FF;
    border-radius: 50%;
    width: 1.2em;
    height: 1.2em;
    animation: spin 0.6s linear infinite;
    display: inline-block;
}

@keyframes spin {
    0% {
        transform: rotate(0deg);
    }

    100% {
        transform: rotate(360deg);
    }
}

.social-alert {
    background: radial-gradient(ellipse at center, #8e44ff 0%, #3d1a6f 100%) !important;
    color: #fff !important;
    border: 1.5px solid #8e44ff !important;
    box-shadow: 0 0 18px 2px #8e44ffcc, 0 0 2px #fff inset;
    text-shadow: 0 0 4px #fff, 0 0 8px #8e44ff;
}
</style>
