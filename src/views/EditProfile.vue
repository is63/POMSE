<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

axios.defaults.baseURL = 'http://localhost:8080/api/'

const router = useRouter()
const user = ref(JSON.parse(sessionStorage.getItem('user')) || {})
const form = ref({
    usuario: user.value.usuario || '',
    email: user.value.email || '',
    password: '',
    bio: user.value.bio || '',
    foto: null
})
const preview = ref(user.value.foto ? (user.value.foto.startsWith('http') ? user.value.foto : 'http://localhost:8080/' + user.value.foto) : '/icons/favicon.svg')
const errorMsg = ref('')
const successMsg = ref('')

function handleImage(e) {
    const file = e.target.files[0]
    if (file) {
        form.value.foto = file
        preview.value = URL.createObjectURL(file)
    }
}

async function submitForm() {
    errorMsg.value = ''
    successMsg.value = ''
    const data = new FormData()
    // El método override debe ir en el body, no en headers
    data.append('_method', 'PUT')
    if (form.value.usuario) data.append('usuario', form.value.usuario)
    if (form.value.email) data.append('email', form.value.email)
    if (form.value.password) data.append('password', form.value.password)
    if (form.value.bio) data.append('bio', form.value.bio)
    if (form.value.foto) data.append('foto', form.value.foto)
    try {
        const token = sessionStorage.getItem('token')
        await axios.post('/users', data, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        sessionStorage.setItem('userEdited', 'true')
        successMsg.value = 'Perfil actualizado correctamente.'
        router.push('/profile').then(async () => {
            try {
                const token = sessionStorage.getItem('token')
                const res = await axios.get('viewUser', { headers: { 'Authorization': `Bearer ${token}` } })
                if (res.data) {
                    sessionStorage.setItem('user', JSON.stringify(res.data))
                }
            } catch { }
        })
        // No recarga forzada aquí, para evitar problemas de sincronización inmediata
    } catch (e) {
        errorMsg.value = 'Error al actualizar el perfil.'
    }
}

onMounted(async () => {
    try {
        const token = sessionStorage.getItem('token')
        const res = await axios.get('viewUser', { headers: { 'Authorization': `Bearer ${token}` } })
        if (res.data) {
            sessionStorage.setItem('user', JSON.stringify(res.data))
            user.value = res.data
            form.value.usuario = user.value.usuario || ''
            form.value.email = user.value.email || ''
            form.value.bio = user.value.bio || ''
            form.value.password = ''
            form.value.foto = null
            preview.value = user.value.foto ? (user.value.foto.startsWith('http') ? user.value.foto : 'http://localhost:8080/' + user.value.foto) : '/icons/favicon.svg'
        }
    } catch { }
})
</script>

<template>
    <div class="container edit-profile-container">
        <div class="row justify-content-center">
            <div class="col-12 col-md-10 col-lg-8">
                <div class="profile-header d-flex mb-3">
                    <div class="profile-avatar me-3">
                        <img :src="preview" alt="avatar" class="rounded-circle"
                            style="width: 120px; height: 120px; object-fit: cover;" />
                    </div>
                    <div class="profile-info">
                        <h2 class="fw-bold fs-3 mb-0 me-2">Editar Perfil</h2>
                        <div v-if="errorMsg" class="alert alert-danger py-1 px-2 mt-2">{{ errorMsg }}</div>
                        <div v-if="successMsg" class="alert alert-success py-1 px-2 mt-2">{{ successMsg }}</div>
                    </div>
                </div>
                <form @submit.prevent="submitForm" class="edit-profile-form">
                    <div class="mb-3">
                        <label class="form-label">Usuario</label>
                        <input v-model="form.usuario" type="text" class="form-control" required />
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Email</label>
                        <input v-model="form.email" type="email" class="form-control" required />
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Contraseña (dejar en blanco para no cambiar)</label>
                        <input v-model="form.password" type="password" class="form-control" />
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Imagen de perfil</label>
                        <div class="d-flex align-items-center">
                            <label class="custom-file-upload">
                                Subir Imagen
                                <input type="file" accept="image/*" @change="handleImage" />
                            </label>
                            <span v-if="form.foto" class="ms-4"
                                style="color:#ffd91c; word-break:break-all; max-width: 180px;">
                                {{ form.foto.name }}
                            </span>
                        </div>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Bio</label>
                        <textarea v-model="form.bio" class="form-control" rows="3"></textarea>
                    </div>
                    <div class="d-flex justify-content-end">
                        <button type="submit" class="btn btn-warning">Guardar cambios</button>
                        <button type="button" class="btn btn-secondary ms-2"
                            @click="router.push('/profile')">Cancelar</button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</template>

<style scoped>
.edit-profile-container {
    margin-top: 60px;
}

.profile-header {

    border-radius: 18px;
    padding: 20px;
    align-items: center;
    
}

.profile-avatar img {
    width: 120px;
    height: 120px;
    object-fit: cover;
    border-radius: 50%;
    border: 2px solid #8E44FF;
}

.profile-info h2 {
    font-size: 28px;
    font-weight: 600;
    margin-bottom: 10px;

}

.edit-profile-form {

    border-radius: 18px;
    padding: 30px 24px 24px 24px;
    box-shadow: 0 2px 8px #0002;

}

.edit-profile-form label {
    color: #8E44FF;
    font-weight: 500;
}


.edit-profile-form input:focus,
.edit-profile-form textarea:focus {

    border-color: #8E44FF;
    box-shadow: none;
}

.custom-file-upload {
    display: inline-block;
    padding: 0.5em 1.2em;
    cursor: pointer;

    color: #8E44FF;
    border: 1.5px solid #8E44FF;
    border-radius: 6px;
    font-weight: 600;
    transition: background 0.2s, color 0.2s, border 0.2s;
    margin-bottom: 0.5em;

}

.custom-file-upload:hover {

    color: #8E44FF;
    border-color: #8E44FF;
}

.edit-profile-form input[type="file"] {
    display: none;
}

.btn-warning {
    background: #8E44FF;
    color: #fff;
    border: none;
    font-weight: 600;
}

.btn-warning:hover {

    color: #121212;
}

.btn-secondary {
    background: #8E44FF;
    color: #fff;
    border: none;
}

.btn-secondary:hover {

    color: #8E44FF;
}

</style>
