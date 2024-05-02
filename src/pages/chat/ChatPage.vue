<template>
  <v-app>
    <v-main style="margin-bottom:108px; padding: 16px; overflow:auto; height: calc(100vh - 112px)">
      <v-row style="max-height: 60vh">
        <v-col style="max-height: 60vh; overflow: auto">
          <div v-for="(responseObject, id) in messages" :key="id"
               :class="['d-flex flex-row align-center my-2', responseObject.nickname === nickname ? 'justify-end': null]">
            <span v-if="responseObject.nickname === nickname" class="blue--text mr-3">{{
                responseObject.content
              }}</span>
            <v-avatar :color="responseObject.nickname === nickname ? 'indigo': 'red'" size="36">
              <span class="white--text">{{ responseObject.nickname[0] }}</span>
            </v-avatar>
            <span v-if="responseObject.nickname !== nickname" class="blue--text ml-3">{{
                responseObject.content
              }}</span>
          </div>
        </v-col>
      </v-row>
    </v-main>

    <v-footer color="grey lighten-3" padless style="height: auto!important; position:fixed; bottom:0; width:100%;">
      <v-row no-gutters>
        <v-col>
          <v-text-field v-model="message" placeholder="Type Something" @keyup.enter="sendMessage"></v-text-field>
          <v-btn icon class="ml-4" @click="sendMessage">
            <v-icon>mdi-send</v-icon>
          </v-btn>
        </v-col>
      </v-row>
    </v-footer>
  </v-app>
</template>
<script>
import SockJS from 'sockjs-client'
import {Stomp} from '@stomp/stompjs'
import {jwtDecode} from "jwt-decode";

export default {
  props: {
    selectedChatting: Object,
  },

  data() {
    return {
      messages: [],
      message: "",
      nickname: "",
      stompClient: null,
    }
  },

  watch: {
    // 이미 채팅 페이지가 로드된 상태에서 새로운 채팅방을 선택하는 상황을 처리.
    // selectedChatting prop이 변경될 때마다 initializeWebSocket 메서드를 호출.
    // 새로운 채팅방을 선택하면 이전 웹소켓 연결이 끊기고 새로운 웹소켓 연결이 생성되어 해당 채팅방을 구독.
    selectedChatting(newChat, oldChat) {
      if (oldChat) {
        if (this.stompClient && this.stompClient.connected) {
          this.stompClient.disconnect();
          console.log("Disconnected from the old WebSocket connection.");
        }
      }
      if (newChat) {
        this.initializeWebSocket();
      }
    },
  },

  methods: {
    initializeWebSocket() {
      if(this.stompClient && this.stompClient.connected) return;

      const url = `${process.env.VUE_APP_API_BASE_URL}/ws-endpoint`;
      const authToken = localStorage.getItem("accessToken");
      const socket = new SockJS(url);
      this.stompClient = Stomp.over(socket);
      console.log("Initialize WebSocket!");

      this.stompClient.connect({ Authorization: `Bearer ${authToken}` }, () => {
        console.log("Connected to WebSocket!");

        // 메시지 수신
        this.stompClient.subscribe("/sub/chat/" + this.selectedChatting.id, (response) => {
          const responseObject = JSON.parse(response.body); // ChatResponse와 동일한 형식이다.
          this.messages.push(responseObject);
        })
      }, (error) => {
        console.error("WebSocket connection error: ", error)
      })
    },

    // initializeWebSocket() {
    //   if(this.stompClient && this.stompClient.connected) return;
    //
    //   const url = `${process.env.VUE_APP_API_BASE_URL}/ws-endpoint`;
    //   const ws = new SockJS(url);
    //
    //   this.stompClient = Stomp.StompJs.Client.over(() => ws);
    //
    //   console.log("Initialize WebSocket!");
    //
    //   const authToken = localStorage.getItem("accessToken");
    //
    //   this.stompClient.connectHeaders = { Authorization: `Bearer ${authToken}` };
    //
    //   this.stompClient.onConnect = () => {
    //     console.log("Connected to WebSocket!");
    //
    //     this.stompClient.subscribe("/sub/chat/" + this.selectedChatting.id, (response) => {
    //       const responseObject = JSON.parse(response.body); // ChatResponse와 동일한 형식이다.
    //       this.messages.push(responseObject);
    //     })
    //   };
    //
    //   this.stompClient.onStompError = (error) => {
    //     console.error("WebSocket connection error: ", error)
    //   };
    //
    //   this.stompClient.activate();
    // },

    sendMessage() {
      if (this.stompClient && this.stompClient.connected) {
        const messageData = {
          type: "CHAT",
          content: this.message,
          sender: this.nickname,
          room: this.selectedChatting.id // 채팅방 ID
        }
        this.stompClient.send("/pub/chat/" + this.selectedChatting.id, {}, JSON.stringify(messageData))
        this.message = ""
      } else {
        console.error("Stomp connection is not established yet.")
      }
    },

    // sendMessage() {
    //   if (this.stompClient && this.stompClient.connected) {
    //     const messageData = {
    //       type: "CHAT",
    //       content: this.message,
    //       sender: this.nickname,
    //       room: this.selectedChatting.id // 채팅방 ID
    //     }
    //     this.stompClient.publish({
    //       destination: "/pub/chat/" + this.selectedChatting.id,
    //       body: JSON.stringify(messageData)
    //     });
    //
    //     this.message = ""
    //   } else {
    //     console.error("Stomp connection is not established yet.")
    //   }
    // },
  },

  created() {
    const authToken = localStorage.getItem("accessToken");
    const decodedToken = jwtDecode(authToken);
    this.nickname = decodedToken.nickname;
    console.log("로그인한 사용자의 닉네임: ", this.nickname);
  },

  mounted() {
    // Component가 마운트되면서 선택된 채팅방이 있다면 웹소켓 연결을 초기화.
    // 만약 선택된 채팅방이 없다면 소켓 연결을 초기화하지 않고, 나중에 selectedChatting 값이 변경되거나 선택되었을 때 watch 훅에서 초기화.
    if (this.selectedChatting) {
      this.initializeWebSocket();
    }
  },

}
</script>
