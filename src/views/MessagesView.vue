<template>
  <div>
    <h1>Meddelanden</h1>
    <p class="hint" style="margin-bottom:14px">Meddelanden från Kraftly om ditt avtal, dina fakturor och din flyttanmälan.</p>
    <div class="card message" v-for="m in messages" :key="m.id">
      <div class="message-date">{{ m.date }}</div>
      <!-- messages come as HTML from the API so the campaign team can use bold and links /M -->
      <div class="message-body" v-html="m.html"></div>
    </div>
    <p v-if="!messages.length" class="hint">Inga meddelanden ännu.</p>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { fetchMessages } from '../services/api'

const messages = ref([])

onMounted(async () => {
  messages.value = await fetchMessages()
})
</script>

<style scoped>
.message-date { font-size: 12px; color: #7c8698; margin-bottom: 6px; }
.message-body { font-size: 15px; line-height: 1.5; }
</style>
