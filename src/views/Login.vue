<script setup>

import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

axios.defaults.baseURL = 'http://localhost:8080/api/'


let username = ref('')
let password = ref('')
let email = ref('')
let passwordConfirmation = ref('')
let error = ref('')    // Mensaje de error
let loading = ref(false) // Estado de carga
let router = useRouter() // Router para redirección
let showRegister = ref(false) // Alterna entre login y registro
let registerSuccess = ref(false) // Indica exito en el registro
const loginPageVisible = ref(true)

function animateAndRedirectHome() {
  loginPageVisible.value = false
  setTimeout(() => {
    window.dispatchEvent(new Event('token-changed'))
    router.push('/')
  }, 700) // Duración de la animación
}


// Redirigir si ya está logeado
onMounted(() => {
  if (sessionStorage.getItem('token')) {
    setTimeout(() => {
      router.push('/')
    }, 1500)
  }
})


// Envía email y contraseña a la API
// Si es correcto, guarda el token y redirige a home
async function login() {
  error.value = ''
  loading.value = true
  try {
    let response = await axios.post('apiLogin', {
      email: email.value,
      password: password.value
    })
    if (response.data && response.data.access_token) {
      sessionStorage.setItem('token', response.data.access_token)
      sessionStorage.setItem('user', JSON.stringify(response.data.user_info))
      animateAndRedirectHome()
      return
    } else {
      error.value = 'Credenciales incorrectas.'
    }
  } catch (e) {
    error.value = 'Email o contraseña incorrectos.'
  } finally {
    loading.value = false
  }
}


// Envía usuario, email y contraseña a la API
// Si es correcto, muestra mensaje de éxito y limpia los campos
async function register() {
  error.value = ''
  registerSuccess.value = false
  loading.value = true
  if (password.value !== passwordConfirmation.value) {
    error.value = 'Las contraseñas no coinciden.'
    loading.value = false
    return
  }
  try {
    const response = await axios.post('apiRegister', {
      usuario: username.value,
      email: email.value,
      password: password.value,
      password_confirmation: passwordConfirmation.value
    })
    if (response.data && response.data.access_token) {
      sessionStorage.setItem('token', response.data.access_token)
      sessionStorage.setItem('user', JSON.stringify(response.data.user_info))
      registerSuccess.value = true
      setTimeout(() => {
        showRegister.value = false
        registerSuccess.value = false
        username.value = ''
        password.value = ''
        email.value = ''
        passwordConfirmation.value = ''
        animateAndRedirectHome()
      }, 700)
      return
    } else {
      error.value = response.data.message || 'No se pudo registrar.'
    }
  } catch (e) {
    if (e.response && e.response.data && e.response.data.message) {
      error.value = e.response.data.message
    } else {
      error.value = 'No se pudo registrar.'
    }
  } finally {
    loading.value = false
  }
}


// --- Animacion de cambio de formulario ---
function onBeforeLeave(el) {
  // Forzar reflow para que la animacion se aplique correctamente
  void el.offsetWidth;
}
function onAfterLeave(el) {
  // Limpiar estilos si es necesario
}
</script>

<template>
  <transition name="fall-away" appear>
    <div v-if="loginPageVisible" class="login-bg">
      <!-- Transición entre login y registro -->
      <transition name="dust" mode="out-in" @before-leave="onBeforeLeave" @after-leave="onAfterLeave">
        <!-- FORMULARIO DE LOGIN -->
        <form v-if="!showRegister" key="login" class="login-card" @submit.prevent="login">
          <h2 class="login-title">Iniciar Sesión</h2>
          <div v-if="error" class="login-error">{{ error }}</div>
          <div class="login-group">
            <label for="login-email">Email</label>
            <input id="login-email" v-model="email" type="email" required autocomplete="email" />
          </div>
          <div class="login-group">
            <label for="password">Contraseña</label>
            <input id="password" v-model="password" type="password" required autocomplete="current-password" />
          </div>
          <button class="login-btn" :disabled="loading">
            {{ loading ? 'Accediendo...' : 'Acceder' }}
          </button>
          <div class="login-switch">
            ¿No tienes cuenta?
            <a href="#" @click.prevent="showRegister = true">Regístrate</a>
          </div>
        </form>
        <!-- FORMULARIO DE REGISTRO -->
        <form v-else key="register" class="login-card" @submit.prevent="register">
          <h2 class="login-title">Registro</h2>
          <div v-if="error" class="login-error">{{ error }}</div>
          <div v-if="registerSuccess" class="login-success">¡Registro exitoso! </div>
          <div class="login-group">
            <label for="reg-username">Usuario</label>
            <input id="reg-username" v-model="username" type="text" required autocomplete="username" />
          </div>
          <div class="login-group">
            <label for="reg-email">Email</label>
            <input id="reg-email" v-model="email" type="email" required autocomplete="email" />
          </div>
          <div class="login-group">
            <label for="reg-password">Contraseña</label>
            <input id="reg-password" v-model="password" type="password" required autocomplete="new-password" />
          </div>
          <div class="login-group">
            <label for="reg-password-confirm">Confirmar Contraseña</label>
            <input id="reg-password-confirm" v-model="passwordConfirmation" type="password" required
              autocomplete="new-password" />
          </div>
          <button class="login-btn" :disabled="loading">
            {{ loading ? 'Registrando...' : 'Registrarse' }}
          </button>
          <div class="login-switch">
            ¿Ya tienes cuenta?
            <a href="#" @click.prevent="showRegister = false">Inicia sesión</a>
          </div>
        </form>
      </transition>
    </div>
  </transition>
</template>

<style scoped>
.login-bg {
  min-height: 75vh;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
}

.login-card {
  background: #222;
  color: white;
  border-radius: 1vw;
  box-shadow: 0 2px 16px rgb(0, 0, 0);
  padding: 3vh 3vw 2vh 3vw;
  min-width: 320px;
  max-width: 90vw;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.login-title {
  margin-bottom: 2vh;
  font-size: 2rem;
  font-weight: bold;
  color: white;
}

.login-group {
  width: 100%;
  margin-bottom: 2vh;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.login-group label {
  color: white;
  margin-bottom: 0.5vh;
  font-weight: 500;
}

.login-group input {
  width: 100%;
  padding: 0.7em 1em;
  border-radius: 0.5em;
  border: 1px solid #575757;
  background: #161515;
  color: white;
  font-size: 1.1rem;
  outline: none;
  transition: border 0.2s;
}

.login-group input:focus {
  border: 1.5px solid #fff205;
}

.login-btn {
  width: 100%;
  padding: 0.8em 0;
  background: #fff205;
  color: #222;
  font-weight: bold;
  font-size: 1.1rem;
  border: none;
  border-radius: 0.5em;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
  margin-top: 1vh;
}

.login-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.login-error {
  color: #ff4d4f;
  background: #2b1a1a;
  border-radius: 0.5em;
  padding: 0.5em 1em;
  margin-bottom: 1vh;
  width: 100%;
  text-align: center;
  font-size: 1rem;
}

.login-success {
  color: #4caf50;
  background: #1a2b1a;
  border-radius: 0.5em;
  padding: 0.5em 1em;
  margin-bottom: 1vh;
  width: 100%;
  text-align: center;
  font-size: 1rem;
}

.login-switch {
  margin-top: 1.5vh;
  color: #fff205;
  font-size: 1rem;
  text-align: center;
}

.login-switch a {
  color: #fff205;
  text-decoration: underline;
  cursor: pointer;
  margin-left: 0.3em;
}

/* Animación de desaparecer para el formulario que sale */
.dust-leave-active {
  animation: dust-exit 0.7s cubic-bezier(0.4, 0, 0.2, 1) both;
}

.dust-enter-active {
  animation: dust-fade-in 0.7s cubic-bezier(0.4, 0, 0.2, 1) both;
}

/*Animacion de desaparicion */
@keyframes dust-exit {
  0% {
    opacity: 1;
    filter: blur(0px);
    transform: scale(1) translateY(0);
  }

  60% {
    opacity: 0.7;
    filter: blur(2px);
    transform: scale(1.05) translateY(-10px);
  }

  100% {
    opacity: 0;
    filter: blur(8px);
    transform: scale(1.1) translateY(-40px) skewX(10deg) skewY(2deg);
  }
}

/*Animacion de Aparicion  */
@keyframes dust-fade-in {
  0% {
    opacity: 0;
    filter: blur(8px);
    transform: scale(1.1) translateY(40px) skewX(-10deg) skewY(-2deg);
  }

  60% {
    opacity: 0.7;
    filter: blur(2px);
    transform: scale(1.05) translateY(10px);
  }

  100% {
    opacity: 1;
    filter: blur(0px);
    transform: scale(1) translateY(0);
  }
}

.fall-away-leave-active {
  animation: fall-away-exit 0.7s cubic-bezier(0.4, 0, 0.2, 1) both;
}

@keyframes fall-away-exit {
  0% {
    opacity: 1;
    transform: none;
    filter: blur(0px);
  }

  60% {
    opacity: 0.7;
    transform: rotateZ(2deg) translateY(-10px) scale(1.05);
    filter: blur(2px);
  }

  100% {
    opacity: 0;
    transform: rotateZ(18deg) translateY(120vh) scale(0.8) skewX(10deg);
    filter: blur(12px);
  }
}
</style>
