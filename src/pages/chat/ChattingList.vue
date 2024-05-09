<template>
  <v-container v-if="chattings.length > 0" style="margin-top: -17%;">
    <v-row>
      <v-col cols="4">
        <v-row v-if="chattings.length > 0">
          <v-col cols="12" v-for="chatting in chattings" :key="chatting.id">
            <v-card
                class="mx-auto result-card"
                :class="{'selected-chatting-card': selectedChatting && chatting.id === selectedChatting.id}"
                :title="chatting.title"
                :subtitle="chatting.hostNickName + ', ' + chatting.membersNickname"
                max-width="800"
                @click="onChattingClick(chatting)"
                elevation="3"
                link
            >
              <template v-slot:append>
                <v-list
                    lines="one"
                    class="result-card-time"
                    :class="{'selected-chatting-card': selectedChatting && chatting.id === selectedChatting.id}"
                >
                  <v-list-item title="채팅 종료일" :subtitle="chatting.chattingDeleteDateTime"/>
                </v-list>
              </template>
            </v-card>
          </v-col>
        </v-row>
        <v-row>
          <v-col class="page-button">
            <v-btn @click="prevPage" :disabled="currentPage === 1">이전 페이지</v-btn>
            <v-btn @click="nextPage" :disabled="!hasNextPage">다음 페이지</v-btn>
          </v-col>
        </v-row>
        <!-- 좌측 하단 플로팅 버튼 -->
        <v-btn fab icon="mdi-chat-plus-outline" @click="createChatRoom" class="fab-chat"></v-btn>
        <RoomCreateDialog ref="ChatRoomCreate"></RoomCreateDialog>
      </v-col>

      <!-- 채팅 페이지 -->
      <v-col cols="8">
        <v-card v-if="selectedChatting && !loadingChatHistory" class="chatting-card" style="height: 85vh" elevation="3">
          <v-card-title class="d-flex align-center chatpage-header">
            <v-btn
                icon="mdi-arrow-left"
                @click="selectedChatting = null"
                left
                density="compact"
                size="large"
                color="white"
            />
            <div class="d-flex justify-center align-center flex-grow-1 chatroom-title">
              {{ selectedChatting.title }}
            </div>
          </v-card-title>
          <v-card-text class="chatting-card-text">
            <ChatPage :selectedChatting="selectedChatting" :initialMessages="chatHistory || []"/>
          </v-card-text>
        </v-card>
        <v-card v-else-if="loadingChatHistory"
                class="chatting-card loading-card"
                style="height: 85vh"
                elevation="3"
        >
          <v-col>
            <v-row justify="center">
              <v-card-text class="loading-text">채팅 내역 불러오는 중</v-card-text>
            </v-row>
            <v-row justify="center">
              <v-progress-circular
                  color="#00d06a"
                  indeterminate
                  :size="40"
                  :width="6"
              ></v-progress-circular>
            </v-row>
          </v-col>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
  <v-container v-else class="nonChatting" style="margin-top: -20%;">
    <v-row>
      <v-col cols="12" class="d-flex flex-column justify-center align-center" style="height: calc(100vh - 27vh);">
        <div class="d-flex justify-center">
          <v-icon class="no-message-icon">mdi-chat-processing-outline</v-icon>
        </div>
        <div style="font-size: 24px; font-weight: 500;">채팅이 없습니다</div>
        <div style="font-size: 19px; font-weight: 300; color: #555555" class="pa-3">채팅방을 생성해서 메시지를 보내보세요</div>
        <v-btn flat @click="createChatRoom" class="no-message-btn">메시지 보내기</v-btn>
        <RoomCreateDialog ref="ChatRoomCreate"></RoomCreateDialog>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import axiosInstance from "@/axios";
import ChatPage from "@/pages/chat/ChatPage.vue";
import RoomCreateDialog from "@/pages/chat/RoomCreateDialog.vue";

export default {
  components: {RoomCreateDialog, ChatPage},
  data() {
    return {
      chattings: [],
      chattingId: "",
      userEmail: "",
      userNickname: "",
      membersNickname: "",
      chattingDeleteDateTime: "",
      selectedChatting: null,
      chatHistory: [],
      currentPage: 1,
      totalPages: null,
      hasNextPage: true,
      loadingChatHistory: false,
    };
  },
  watch: {},
  created() {
    this.getUserData();
    this.fetchChattings();
  },
  methods: {
    // 채팅룸 생성 다이얼로그 띄우기
    createChatRoom() {
      this.$refs.ChatRoomCreate.openDialog();
    },

    onChattingClick(chatting) {
      console.log("chatting 객체: ", chatting);
      this.selectedChatting = chatting;
      this.setChattingInfo(chatting);
      this.loadingChatHistory = true;
      this.fetchChatHistory(chatting.id)
          .finally(() => {
            this.loadingChatHistory = false;
          });
    },

    // 채팅방 정보 설정
    setChattingInfo(chatting) {
      const date = new Date(chatting.deleteDateTime);
      const options = {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      };
      chatting.chattingDeleteDateTime = date.toLocaleString("ko-KR", options);
      chatting.membersNickname = chatting.memberRooms.map(memberRooms => memberRooms[1]).join(', ');
    },

    // 채팅방 별 채팅 내역 불러오기
    async fetchChatHistory(chatRoomId) {
      const authToken = localStorage.getItem("accessToken");
      const url = `${process.env.VUE_APP_API_BASE_URL}/api/chat/messages/${chatRoomId}`;
      if (!authToken) {
        console.error("인증 토큰이 없습니다.");
        return;
      }

      try {
        const response = await axiosInstance.get(url, {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });
        if (response.data.success) {
          this.chatHistory = response.data.data;
          console.log('chatHistory: ', this.chatHistory);
        }
      } catch (error) {
        console.error('Error fetching chat messages:', error);
      }
    },

    async fetchChattings(page = 1) {
      const authToken = localStorage.getItem("accessToken");
      const url = `${process.env.VUE_APP_API_BASE_URL}/api/room/rooms/${page}`;
      if (!authToken) {
        console.error("인증 토큰이 없습니다.");
        return;
      }

      try {
        const response = await axiosInstance.get(url, {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });
        if (response.data.success && response.data.status === "OK") {
          this.chattings = response.data.data.sort(
              (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
          );
          this.currentPage = page;
          await this.checkNextPage(page + 1);

          // 모든 채팅방에 대해 참여자 닉네임과 채팅 종료일을 세팅한다.
          this.chattings.forEach(chatting => this.setChattingInfo(chatting));

          this.selectedChatting = null;
        }
      } catch (error) {
        console.error("Error fetching chattings:", error);
        this.chattings = [];
        this.hasNextPage = false;
      }
    },

    async checkNextPage(nextPage) {
      const authToken = localStorage.getItem("accessToken");
      const nextUrl = `${process.env.VUE_APP_API_BASE_URL}/api/room/rooms/${nextPage}`;
      try {
        const nextResponse = await axiosInstance.get(nextUrl, {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });
        this.hasNextPage = nextResponse.data.data.length > 0;
      } catch (error) {
        console.error("Error checking next page:", error);
        this.hasNextPage = false;
      }
    },

    nextPage() {
      if (this.hasNextPage) {
        this.fetchChattings(this.currentPage + 1);
      }
    },

    prevPage() {
      if (this.currentPage > 1) {
        this.fetchChattings(this.currentPage - 1);
      }
    },

    async getUserData() {
      const authToken = localStorage.getItem("accessToken");
      const url = `${process.env.VUE_APP_API_BASE_URL}/api/members`;
      if (!authToken) {
        console.error("인증 토큰이 없습니다.");
        return;
      }
      try {
        const response = await axiosInstance.get(url, {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });
        if (response.data.success && response.data.status === "OK") {
          this.userEmail = response.data.data.email;
          this.userNickname = response.data.data.nickname;
        } else {
          console.error("Failed to fetch user data");
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    },
  },
};
</script>

<style>

.nonChatting {
  display: flex;
  justify-content: center; /* 가로 중앙 정렬 */
  height: 100vh;
}

.participant-info span {
  margin-left: 8px;
}

.selected-chatting-card {
  background-color: #cdd0cb; /* 선택되면 바뀌는 색 */
}

.page-button {
  justify-content: center;
  left: auto;
}

.chatting-card {
  height: 80vh;
  overflow: hidden;
}

.chatting-card-text {
  padding-left: 0 !important;
  padding-right: 0 !important;
}

.result-card {
  padding-top: 0 !important;
  padding-bottom: 0 !important;
  margin-top: 0 !important;
  border: 1px solid rgba(34, 173, 157, 0.14);
}

.chatpage-header {
  background: linear-gradient(
      90deg,
      #00d06a,
      #06c7ba
  ); /* 그라데이션 배경 적용 */
  background-size: 100%; /* 그라데이션 정도*/
}

.chatroom-title {
  color: white;
  font-weight: 800;
  font-size: 20px;
}

.loading-card {
  flex-grow: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
}

.loading-text {
  font-size: 25px;
  font-weight: 700;
  color: rgba(54, 54, 54, 0.86);
  padding: 30px;
}

.no-message-icon {
  font-size: 100px;
  background: linear-gradient(
      90deg,
      #00d06a,
      #06c7ba
  ); /* 그라데이션 배경 적용 */
  background-size: 100%; /* 그라데이션 정도*/
  -webkit-background-clip: text; /* 그라데이션을 텍스트에 적용 */
  -webkit-text-fill-color: transparent; /* 원래의 텍스트 색상을 투명하게 하여 그라데이션을 보여줌 */
}

.no-message-btn {
  color: white !important;
  font-weight: 600 !important;
  font-size: 19px !important;
  padding-top: 5px !important;
  padding-bottom: 5px !important;
  background: linear-gradient(
      90deg,
      #00d06a,
      #06c7ba
  );
  background-size: 100%;
}

.fab-chat {
  color: white !important;
  position: fixed; /* 고정 위치 */
  left: 30vw;
  bottom: 3vh;
  z-index: 100; /* 다른 요소 위에 표시 */
  background-color: #00d06a;
}

.participant-info {
  display: flex;
  align-items: center;
  margin-bottom: 10px; /* 각 참여자 정보 사이의 간격 */
  color: #162a2c;
}

.full-width-input {
  width: 100%;
}

.chatting-detail {
  background-color: rgba(172, 198, 255, 1);
}

.vote-button {
  margin-right: 2%;
}

.cancelled-chatting-card-button {
  background-color: #dc8686;
}

.confirm-chatting-card-button {
  background-color: rgba(172, 198, 255, 1);
}

/* 모임리스트 위의 n */
.action-required-indicator {
  position: absolute;
  top: 3px;
  left: -10px;
  background-color: #d35d6e; /* 빨간색 배경 */
  color: white;
  width: 35%; /* 작은 원형 표시기 크기 */
  height: 35%; /* 작은 원형 표시기 크기 */
  border-radius: 50%; /* 원형으로 만듬 */
  display: flex; /* Flexbox를 사용하여 내용 중앙 정렬 */
  align-items: center; /* 세로 중앙 정렬 */
  justify-content: center; /* 가로 중앙 정렬 */
  font-size: 10px; /* 글자 크기 */
  transform: translate(50%, -50%); /* 원형 표시기가 버튼의 경계를 넘어서도록 조정 */
}
</style>
