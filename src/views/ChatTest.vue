<template>
  <div class="d-flex flex-column">
    <div v-for="(msg, id) in messages" :key="id" class="mb-3 mx-auto text-start">
      <v-card color="blue lighten-5" class="py-2 px-3" style="width: fit-content; max-width: 400px" outlined>
        {{ msg.content }} <!-- msg.message에서 msg.content로 변경 -->
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
    const messages = ref([])
    const stompClient = ref(null)
    const message = ref('')

    const initializeWebSocket = () => {
      const authToken = localStorage.getItem("accessToken");
      console.log("start")
      console.log("토큰 정보", authToken);

      const socket = new SockJS(`http://localhost:8080/ws-endpoint`)
      stompClient.value = Stomp.over(socket)

      stompClient.value.connect({
        'Authorization': `Bearer ${authToken}`
      }, () => {
        console.log('Connected to WebSocket');
        stompClient.value.subscribe('/sub/chat', (response) => { // 경로 수정
          const msg = JSON.parse(response.body);
          console.log("msg 어떻게 생김?", msg);
          messages.value.push(msg);
        });
      }, (error) => {
        console.error('WebSocket connection error:', error);
      });
    }

    const sendMessage = () => {
      if (stompClient.value && stompClient.value.connected) {
        // messageData 객체의 구조를 백엔드와 일치시키기
        const messageData = {
          type: "CHAT", // 메시지 타입 지정
          content: message.value, // content 필드 사용
          sender: "User" // 임시로 사용자 이름 하드코딩
        }
        
        console.log("메시지 형식!!!", messageData);

        stompClient.value.send('/pub/chat', {}, JSON.stringify(messageData))
        message.value = ''
      } else {
        console.error('Stomp connection is not established yet.')
      }
    }

    onMounted(initializeWebSocket)
    onUnmounted(() => {
      if (stompClient.value && stompClient.value.connected) {
        stompClient.value.disconnect()
      }
    })

    return {messages, message, sendMessage}
  }
}
</script>
