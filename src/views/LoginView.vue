<template>
  <div class="login-wrap">
    <div class="card login-card">
      <img src="../assets/logo-dark.svg" class="login-logo">
      <h1>Logga in på Mina sidor</h1>
      <input type="text" placeholder="E-postadress" v-model="email">
      <input type="password" placeholder="Lösenord" v-model="password">
      <p v-if="error" role="alert" class="login-error">{{ error }}</p>
      <button class="btn" style="width:100%" @click="handleLogin">Logga in</button>
      <p class="hint" style="margin-top:10px">Problem att logga in? Ring kundservice 020-123 456</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { login } from '../services/api'

const email = ref('')
const password = ref('')
const error = ref(null)
const router = useRouter()

const handleLogin = async () => {
  error.value = null
  try {
    const data = await login(email.value, password.value)
    // keep the token so the user stays logged in after reload
    localStorage.setItem('kraftly_token', data.token)
    localStorage.setItem('kraftly_name', data.name)
    router.push('/')
  } catch {
    error.value = 'Inloggningen misslyckades'
  }
}
</script>

<style scoped>
.login-wrap { display: flex; justify-content: center; padding-top: 60px; }
.login-card { width: 380px; }
.login-logo { height: 34px; margin-bottom: 18px; }
.login-error { color: #d92d20; font-size: 14px; margin: 0 0 10px; }
</style>
