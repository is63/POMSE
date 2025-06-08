<script setup>
import { ref } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'

axios.defaults.baseURL = 'http://localhost:8080/api/'

const titulo = ref('')
const descripcion = ref('')
const imagen = ref(null)
const imagenPreview = ref('')
const loading = ref(false)
const error = ref('')
const success = ref('')
const router = useRouter()

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
</script>

<template>
    <div class="crear-post-container">
        <h2 class="crear-post-title">Crear nuevo post</h2>
        <form class="crear-post-form" @submit.prevent="crearPost">
            <label for="titulo">Título *</label>
            <input id="titulo" v-model="titulo" type="text" maxlength="255" required />

            <label for="descripcion">Descripción</label>
            <textarea id="descripcion" v-model="descripcion" rows="3" maxlength="800" placeholder="Opcional"></textarea>

            <label class="custom-file-upload">
                <input type="file" accept="image/*" @change="handleFileChange" />
                📎 Seleccionar imagen
            </label>
            <div v-if="imagenPreview" class="preview-img">
                <img :src="imagenPreview" alt="preview" />
            </div>

            <button class="btn-crear" type="submit" :disabled="loading">
                {{ loading ? 'Creando...' : 'Crear post' }}
            </button>
            <div v-if="error" class="alert neon-alert alert-danger mt-3">{{ error }}</div>
            <div v-if="success" class="alert neon-alert alert-success mt-3">{{ success }}</div>
        </form>
    </div>
</template>

<style scoped>
.crear-post-container {
    border-radius: 18px;
    padding: 2.5em 2em 2em 2em;
    max-width: 650px;
    margin: 3em auto;
    box-shadow: 0 2px 24px #8e44ff22, 0 1px 8px #0002;
    background: #232323;
    color: #fff;
    border-bottom: 4px solid #8E44FF44;
}

.crear-post-title {
    color: #8E44FF;
    font-size: 2.1em;
    font-weight: 700;
    margin-bottom: 1.2em;
    text-align: center;
    text-shadow: 0 2px 8px #8e44ff44;
    letter-spacing: 0.01em;
}

.crear-post-form {
    display: flex;
    flex-direction: column;
    gap: 1.2em;
    color: #fff;
    border-radius: 14px;
    padding: 2em 2vw;
    background: transparent;
}

.crear-post-form label {
    color: #8E44FF;
    font-weight: 600;
    margin-bottom: 0.2em;
    letter-spacing: 0.01em;
}

.crear-post-form input[type="text"],
.crear-post-form textarea {
    background: #181818;
    color: #fff;
    border: 1.5px solid #8e44ff44;
    border-radius: 10px;
    padding: 0.8em 1.1em;
    font-size: 1.08em;
    transition: border 0.2s, background 0.2s;
    box-shadow: 0 1px 6px #8e44ff11;
}

.crear-post-form input[type="text"]:focus,
.crear-post-form textarea:focus {
    border-color: #8E44FF;
    background: #232323;
    outline: none;
    color: #fff;
}

.custom-file-upload {
    display: inline-block;
    padding: 0.5em 1.2em;
    cursor: pointer;
    color: #a259ff;
    border: 1.5px solid #8E44FF;
    border-radius: 8px;
    font-weight: 700;
    background: #181818;
    transition: background 0.2s, color 0.2s, border 0.2s;
    margin-bottom: 0.5em;
    letter-spacing: 0.01em;
    text-shadow: none;
    box-shadow: 0 1px 8px #8e44ff22;
}

.custom-file-upload:hover {
    color: #fff;
    background: #8E44FF;
    border-color: #8E44FF;
    box-shadow: 0 0 12px #8e44ff99;
}

.crear-post-form input[type="file"] {
    display: none;
}

.preview-img img {
    max-width: 160px;
    max-height: 160px;
    border-radius: 10px;
    margin-top: 0.5em;
    box-shadow: 0 1px 8px #8E44FF44;
    background: #181818;
    object-fit: cover;
    border: 2px solid #8E44FF44;
}

.btn-crear {
    background: linear-gradient(90deg, #8E44FF 80%, #6c2bd7 100%);
    color: #fff;
    border: none;
    font-weight: 700;
    border-radius: 10px;
    padding: 0.8em 1.6em;
    box-shadow: 0 2px 8px #8e44ff33;
    font-size: 1.13em;
    margin-top: 1em;
    transition: background 0.2s, color 0.2s;
    letter-spacing: 0.01em;
}

.btn-crear:disabled {
    opacity: 0.7;
    cursor: not-allowed;
}

.btn-crear:hover {
    background: #fff;
    color: #8E44FF;
}

.neon-alert {
    background: radial-gradient(ellipse at center, #8e44ff 0%, #3d1a6f 100%) !important;
    color: #fff !important;
    border: 1.5px solid #8e44ff !important;
    box-shadow: 0 0 18px 2px #8e44ffcc, 0 0 2px #fff inset;
    text-shadow: 0 0 4px #fff, 0 0 8px #8e44ff;
}
</style>
