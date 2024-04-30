<template>
  <div class="d-flex flex-column">
    <div v-for="(msg, id) in messages" :key="id" class="mb-3 mx-auto text-start">
      <v-card color="blue lighten-5" class="py-2 px-3" style="width: fit-content; max-width: 400px" outlined>
        {{ msg.message }}
      </v-card>
    </div>
  </div>
  <div class="d-flex justify-end my-3">
    <v-text-field v-model="message" @keyup.enter="sendMessage" placeholder="Type a message..." outlined hide-details></v-text-field>
    <v-btn color="blue" @click="sendMessage" class="ms-3" text>Send</v-btn>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted } from 'vue'
import SockJS from 'sockjs-client'
import { Stomp } from '@stomp/stompjs'

export default {
  setup() {
    // Data
    const messages = ref([])
    const stompClient = ref(null)
    const message = ref('')

    // Methods
    const initializeWebSocket = () => {
      const socket = new SockJS('http://localhost:8080/ws-endpoint')
      stompClient.value = Stomp.over(socket)

      stompClient.value.connect({}, () => {
        stompClient.value.subscribe('/sub/chat', (response) => {
          const msg = JSON.parse(response.body)
          messages.value.push(msg)
        })
      }, (error) => {
        console.error('WebSocket connection error:', error)
      })
    }

    const sendMessage = () => {
      if(stompClient.value && stompClient.value.connected) {
        const messageData = { message: message.value }

        stompClient.value.send('/pub/chat', {}, JSON.stringify(messageData))
        message.value = ''
      } else {
        console.error('Stomp connection is not established yet.')
      }
    }

    // Lifecycle hooks
    onMounted(initializeWebSocket)

    onUnmounted(() => {
      if(stompClient.value && stompClient.value.connected) {
        stompClient.value.disconnect()
      }
    })

    return { messages, message, sendMessage }
  }
}
</script>
