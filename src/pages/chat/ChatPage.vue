<template>
  <v-app>
    <v-main style="overflow:auto; height: calc(100vh - 27vh);">
      <v-sheet>
        <v-col style="padding-left:30px; padding-right: 30px; max-height: 69vh; overflow: auto;">
          <div v-for="(responseObject, id) in messages" :key="id"
               :class="['d-flex flex-row align-center my-3', responseObject.nickname === nickname ? 'justify-end': null]">

            <!-- 로그인한 유저의 말풍선 -->
            <v-row v-if="responseObject.nickname === nickname" class="justify-end" style="max-width: 80%;">
              <v-col class="d-flex flex-row-reverse align-end">
                <v-card class="pa-3" color="primary">
                  {{ responseObject.content }}
                </v-card>
                <v-sheet style="min-width: 70px;">
                  {{formatTime(responseObject.createdAt)}}
                </v-sheet>
              </v-col>
            </v-row>

            <!-- 상대방의 말풍선과 아바타 -->
            <v-sheet v-if="responseObject.nickname !== nickname" class="d-flex" style="max-width: 80%">
              <v-avatar size="40" class=" mr-2 mt-5">
                <v-img alt="Profile Image" :src="responseObject.profileImage"></v-img>
              </v-avatar>
              <v-col class="d-flex flex-column">
                <v-sheet class="opponent-nickname mb-2">{{ responseObject.nickname }}</v-sheet>
                <v-sheet class="d-flex flex-row align-end">
                  <v-card class="pa-3 message" color="secondary">
                    {{ responseObject.content }}
                  </v-card>
                  <v-sheet style="margin-left: 10px; min-width: 70px;">
                    {{ formatTime(responseObject.createdAt) }}
                  </v-sheet>
                </v-sheet>
              </v-col>
            </v-sheet>
          </div>
        </v-col>
      </v-sheet>
    </v-main>
    <div style="width: 100%; margin-top: -2%;" class="input-container">
      <v-row no-gutters align="center">
        <v-col>
          <v-text-field
              v-model="message"
              placeholder="메시지 입력..."
              @keyup.enter="sendMessage"
              variant="outlined"
              hide-details
              rounded="pill"
              class="input-message"
          >
          </v-text-field>
        </v-col>
      </v-row>
    </div>
  </v-app>
</template>

<script>
import SockJS from 'sockjs-client'
import {Stomp} from '@stomp/stompjs'
import {jwtDecode} from "jwt-decode";
import {formatTime} from "@/utils/date-utils";

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
      isConnected: false
    }
  },

  watch: {
    // 이미 채팅 페이지가 로드된 상태에서 새로운 채팅방을 선택하는 상황을 처리.
    // selectedChatting prop이 변경될 때마다 initializeWebSocket 메서드를 호출.
    // 새로운 채팅방을 선택하면 이전 웹소켓 연결이 끊기고 새로운 웹소켓 연결이 생성되어 해당 채팅방을 구독.
    async selectedChatting(newChat, oldChat) {
      if (oldChat) {
        try {
          await this.disconnect();
          this.messages = [];
        } catch (error) {
          console.log("Failed to disconnect from old chat: ", error);
        }
      }
      if (newChat) {
        this.initializeWebSocket();
      }
    },
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

  beforeUnmount() {
    this.disconnect();
  },

  methods: {
    initializeWebSocket() {
      if (this.stompClient && this.stompClient.connected) return;

      const url = `${process.env.VUE_APP_API_BASE_URL}/ws-endpoint`;
      const authToken = localStorage.getItem("accessToken");
      const socket = new SockJS(url);
      this.stompClient = Stomp.over(socket);
      console.log("Initialize WebSocket!");

      this.stompClient.connect({Authorization: `Bearer ${authToken}`}, () => {
        console.log("Connected to WebSocket!");
        this.isConnected = true;

        // 메시지 수신
        this.stompClient.subscribe("/sub/chat/" + this.selectedChatting.id, (response) => {
          const responseObject = JSON.parse(response.body); // ChatResponse와 동일한 형식이다.
          console.log("responseObject 형식: ", responseObject);
          this.messages.push(responseObject);
        })
      }, (error) => {
        console.error("WebSocket connection error: ", error)
      })
    },

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

    disconnect() {
      return new Promise((resolve, reject) => {
        if (this.stompClient && this.stompClient.connected) {
          this.stompClient.unsubscribe(`/sub/chat/${this.selectedChatting.id}`);
          try {
            this.stompClient.disconnect(() => {
              this.isConnected = false;
              console.log("Disconnected from the WebSocket Connection.");
              resolve();
            });
          } catch (error) {
            console.log("Failed to disconnect: ", error);
            reject(error);
          }
        }
      });
    },

    formatTime(time) {
      return formatTime(time);
    }
  }
}
</script>

<style scoped>
.v-card {
  border-radius: 15px;
}

.input-container {
  padding: 0 20px;
}

.input-message .v-input__slot{
  padding: 0 20px;
}

.opponent-nickname {
  font-weight: 400;
  font-size: 18px;
}
</style>
