<template>
  <div class="d-flex flex-column">
    <div v-for="(responseObject, id) in messages" :key="id" class="mb-3 mx-auto text-start">
      <v-card color="blue lighten-5" class="py-2 px-3" style="width: fit-content; max-width: 400px" outlined>
        {{ responseObject.content }}
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
import {jwtDecode} from "jwt-decode";

export default {
  setup() {
    const messages = ref([])
    const stompClient = ref(null)
    const message = ref('')
    const nickname = ref('')

    const initializeWebSocket = () => {
      const authToken = localStorage.getItem("accessToken");
      const socket = new SockJS(`http://localhost:8080/ws-endpoint`);
      stompClient.value = Stomp.over(socket);
      console.log("Initialize WebSocket!");

      stompClient.value.connect({'Authorization': `Bearer ${authToken}`}, () => {
        console.log('Connected to WebSocket!');

        // 메시지 수신
        stompClient.value.subscribe('/sub/chat', (response) => {
          const responseObject = JSON.parse(response.body); // ChatResponse와 동일한 형식이다.
          console.log("responseObject 형식: ", responseObject);
          messages.value.push(responseObject);
        });

      }, (error) => {
        console.error('WebSocket connection error:', error);
      });
    }

    // 메시지 송신
    const sendMessage = () => {
      if (stompClient.value && stompClient.value.connected) {
        // messageData 객체의 구조를 백엔드와 일치시키기
        const messageData = {
          type: "CHAT", // 메시지 타입
          content: message.value, // 메시지 내용
          sender: nickname.value, // 사용자 닉네임
          room: 1 // 채팅방 ID
        }
        stompClient.value.send('/pub/chat', {}, JSON.stringify(messageData))
        message.value = ''  // 메시지 입력 필드 비우기
      } else {
        console.error('Stomp connection is not established yet.')
      }
    }

    onMounted(() => {
      initializeWebSocket();
      const authToken = localStorage.getItem("accessToken");
      const decodedToken = jwtDecode(authToken);
      nickname.value = decodedToken.nickname;
      console.log("로그인한 사용자의 닉네임: ", nickname.value);
    })

    onUnmounted(() => {
      if (stompClient.value && stompClient.value.connected) {
        stompClient.value.disconnect()
      }
    })

    return {messages, message, sendMessage}
  }
}
</script>
