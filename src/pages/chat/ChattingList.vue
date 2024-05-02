<template>
  <v-container fluid class="search-results">
    <v-container v-if="chatings.length === 0" class="nonChating">
      <v-row>
        <v-col cols="12" justify="center" class="none-result">
          <div class="no-chatings-message">채팅이 없습니다.</div>
        </v-col>
      </v-row>
    </v-container>

    <v-container v-else>
      <v-row>
        <v-col cols="12" md="4">
          <v-row v-if="chatings.length > 0">
            <v-col cols="12" v-for="chating in chatings" :key="chating.id">
              <v-card
                class="mx-auto result-card"
                :class="{
                  'selected-chating-card':
                    selectedChating && chating.id === selectedChating.id,
                }"
                :title="chating.title"
                :subtitle="chating.hostNickName + ', ' + membersNickname"
                max-width="800"
                @click="onChatingClick(chating)"
                link
              >
                <!-- <template v-slot:prepend>
                </template> -->
                <template v-slot:append>
                  <v-list
                    lines="one"
                    class="result-card-time"
                    :class="{
                      // 선택된 모임은 회색으로 처리
                      'selected-chating-card':
                        selectedChating && chating.id === selectedChating.id,
                    }"
                  >
                    <v-list-item title="채팅 종료일" :subtitle="chatingDeleteDateTime" />
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
        <v-col cols="12" md="8">
          <v-card class="pa-4">
            <div v-if="selectedChating"></div>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </v-container>
  <EventDialog ref="eventDialog"></EventDialog>
</template>

<script>
import axiosInstance from "@/axios";

export default {
  data() {
    return {
      chatings: [],
      chatingId: "",
      userEmail: "",
      userNickname: "",
      membersNickname: "",
      chatingDeleteDateTime: "",
      selectedChating: null,
      currentPage: 1,
      totalPages: null,
      hasNextPage: true,
    };
  },
  watch: {},
  created() {
    this.getUserData();
    this.fetchChatings();
  },
  methods: {
    onChatingClick(chating) {
      // alert(`Chating with ID ${chating.id} clicked`);
      this.selectedChating = chating;
    },

    async fetchChatings(page = 1) {
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
          this.chatings = response.data.data.sort(
            (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
          );
          this.selectedChating = this.chatings[0] || null;
          this.currentPage = page;
          //마감시간의 날짜 형식 변경
          const date = new Date(this.selectedChating.deleteDateTime);
          const options = {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          };
          this.chatingDeleteDateTime = date.toLocaleString("ko-KR", options);
          this.membersNickname = this.selectedChating.memberRooms.map(memberRooms => memberRooms[1]).join(', ');


          // this.membersNickname =
          // this.hasNextPage = response.data.data.length  > 0; // 다음 페이지 존재 여부 업데이트
          await this.checkNextPage(page + 1);
        }
      } catch (error) {
        console.error("Error fetching chatings:", error);
        this.chatings = [];
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
        this.fetchChatings(this.currentPage + 1);
      }
    },

    prevPage() {
      if (this.currentPage > 1) {
        this.fetchChatings(this.currentPage - 1);
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
.nonChating {
  display: flex;
  justify-content: center; /* 가로 중앙 정렬 */
  height: 100vh;
}
.no-chatings-message {
  text-align: center; /* 텍스트 중앙 정렬 */
  color: #162a2c;
  font-size: 20px;
}

.participant-info {
  display: flex;
  align-items: center;
  margin-bottom: 10px; /* 각 참여자 정보 사이의 간격 */
  color: #162a2c;
}
.participant-info span {
  margin-left: 8px;
}
.result-card-time {
}
.result-card[title="취소"] {
  background-color: #f8d7da;
}
.full-width-input {
  width: 100%;
}

.selected-chating-card {
  background-color: #cdd0cb; /* 선택되면 바뀌는 색 */
}

.cancelled-chating-card-button {
  background-color: #dc8686;
}
.confirm-chating-card-button {
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
.page-button {
  justify-content: center;
  left: auto;
}
.chating-detail {
  background-color: rgba(172, 198, 255, 1);
}
.vote-button {
  margin-right: 2%;
}
</style>
``
