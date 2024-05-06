<template>
  <v-container fluid class="search-results">
    <v-container v-if="chattings.length === 0" class="nonChatting">
      <v-row>
        <v-col cols="12" justify="center" class="none-result">
          <div class="no-chatting-message">채팅이 없습니다.</div>
        </v-col>
      </v-row>
    </v-container>

    <v-container v-else>
      <v-row>
        <v-col cols="4">
          <v-row v-if="chattings.length > 0">
            <v-col cols="12" v-for="chatting in chattings" :key="chatting.id">
              <v-card
                  class="mx-auto result-card"
                  :class="{'selected-chatting-card': selectedChatting && chatting.id === selectedChatting.id}"
                  :title="chatting.title"
                  :subtitle="chatting.hostNickName + ', ' + membersNickname"
                  max-width="800"
                  @click="onChattingClick(chatting)"
                  link
              >
                <template v-slot:append>
                  <v-list
                      lines="one"
                      class="result-card-time"
                      :class="{'selected-chatting-card': selectedChatting && chatting.id === selectedChatting.id}"
                  >
                    <v-list-item title="채팅 종료일" :subtitle="chattingDeleteDateTime"/>
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
        </v-col>

        <!-- 채팅 페이지 -->
        <v-col cols="8">
          <v-card v-if="selectedChatting && !loadingChatHistory" class="chatting-card" style="height: 85vh">
            <v-card-title style="background-color: #2b783b">
              <v-row>
                <v-col cols="10">
                  {{ selectedChatting.title }}
                </v-col>
                <v-col cols="2">
                  <v-btn icon="mdi-close" @click="selectedChatting = null"/>
                </v-col>
              </v-row>
            </v-card-title>
            <v-card-text class="chatting-card-text">
              <ChatPage :selectedChatting="selectedChatting" :initialMessages="chatHistory || []"/>
            </v-card-text>
          </v-card>
          <v-card v-else-if="loadingChatHistory">
            <v-card-title>채팅 내역 불러오는 중...</v-card-title>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </v-container>
</template>

<script>
import axiosInstance from "@/axios";
import ChatPage from "@/pages/chat/ChatPage.vue";

export default {
  components: {ChatPage},
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
    onChattingClick(chatting) {
      // alert(`Chatting with ID ${chatting.id} clicked`);
      console.log("chatting 객체: ", chatting);
      this.selectedChatting = chatting;
      this.loadingChatHistory = true;

      // this.messages = [];
      this.fetchChatHistory(chatting.id)
          .finally(() => {
            this.loadingChatHistory = false;
          });
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
          // this.selectedChatting = this.chattings[0] || null;
          this.currentPage = page;

          if (this.selectedChatting) {
            //마감시간의 날짜 형식 변경
            const date = new Date(this.selectedChatting.deleteDateTime);
            const options = {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            };
            this.chattingDeleteDateTime = date.toLocaleString("ko-KR", options);
            this.membersNickname = this.selectedChatting.memberRooms.map(memberRooms => memberRooms[1]).join(', ');
          }
          await this.checkNextPage(page + 1);
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
.search-results {
  margin-top: 1vh;
}

.nonChatting {
  display: flex;
  justify-content: center; /* 가로 중앙 정렬 */
  height: 100vh;
}

.no-chatting-message {
  text-align: center; /* 텍스트 중앙 정렬 */
  color: #162a2c;
  font-size: 20px;
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
  background-color: #f8d7da;
  padding-top: 0 !important;
  padding-bottom: 0 !important;
  margin-top: 0 !important;
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
