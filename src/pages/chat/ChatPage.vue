<template>
  <v-app>
    <v-main style="margin-bottom:108px; padding: 16px; overflow:auto; height: calc(100vh - 112px)">
      <v-row style="max-height: 60vh">
        <v-col style="max-height: 60vh; overflow: auto">
          <div v-for="(responseObject, id) in messages" :key="id"
               :class="['d-flex flex-row align-center my-2', responseObject.nickname === nickname ? 'justify-end': null]">
            <span v-if="responseObject.nickname === nickname" class="blue--text mr-3">{{ responseObject.content }}</span>
            <v-avatar :color="responseObject.nickname === nickname ? 'indigo': 'red'" size="36">
              <span class="white--text">{{ responseObject.nickname[0] }}</span>
            </v-avatar>
            <span v-if="responseObject.nickname !== nickname" class="blue--text ml-3">{{ responseObject.content }}</span>
          </div>
        </v-col>
      </v-row>
    </v-main>

    <v-footer color="grey lighten-3" padless style="height: auto!important; position:fixed; bottom:0; width:100%;">
      <v-row no-gutters>
        <v-col>
          <v-text-field v-model="message" placeholder="Type Something" @keyup.enter="sendMessage"></v-text-field>
          <v-btn icon class="ml-4" @click="sendMessage"><v-icon>mdi-send</v-icon></v-btn>
        </v-col>
      </v-row>
    </v-footer>
  </v-app>
</template>
<script>
import {ref, onMounted, onUnmounted} from 'vue'
import SockJS from 'sockjs-client'
import {Stomp} from '@stomp/stompjs'
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

    return {messages, message, sendMessage, nickname}
  }
}
</script>
