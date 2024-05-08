<template>
  <v-navigation-drawer class="sidebar-navigation-drawer" permanent>
    <v-list>
      <v-list-item
          :prepend-avatar="profileImage"
          :subtitle="email"
          :title="nickname"
          @click="MyPageClicked"
      ></v-list-item>
      <MyPageDialog ref="MyPageDialog"></MyPageDialog>
    </v-list>

    <v-divider></v-divider>

    <v-list density="compact" nav>
      <v-list-item
          prepend-icon="mdi-calendar"
          title="캘린더"
          value="calendar"
          @click="goTo('fullCalendarComponent')"
      ></v-list-item>
      <v-list-item
          prepend-icon="mdi-calendar-plus"
          title="일정 생성"
          value="createEvent"
          @click="createEventClicked"
      ></v-list-item>
      <EventDialog ref="EventCreate"></EventDialog>
      <v-list-item
          prepend-icon="mdi-trello"
          title="아이젠하워 매트릭스"
          value="matrix"
          @click="goToEisenhowerMatrix"
      ></v-list-item>
      <v-list-item
          prepend-icon="mdi-account-details"
          title="모임"
          value="moim-list"
          @click="goToMoimList"
      ></v-list-item>
      <v-list-item
          prepend-icon="mdi-chat-outline"
          title="채팅"
          value="chating-list"
          @click="goToChattingList"
      ></v-list-item>
    </v-list>

    <v-divider></v-divider>

    <v-col class="back">
    <v-list class="today-list">
      <v-subheader style="color:#353535;">
        ✅ 오늘의 일정
      </v-subheader>
      <!-- 모임 -->
      <v-list-item-group>
        <!-- <v-list-item class="schedule-item" v-if="!moims.length == 0">
          <v-list-item-content v-for="moim in moims" :key="moim.id">
            <v-list-item-title v-if="moim"> {{ moim.title }} </v-list-item-title>
            <v-list-item-subtitle v-if="moim">
              {{ formatTime(moim.confirmedDateTime) }} ~
              {{
                formatTime(
                  formattedlastDateTime(moim.confirmedDateTime, moim.runningTime)
                )
              }}</v-list-item-subtitle
            >
          </v-list-item-content>
        </v-list-item> -->

        <!-- 이벤트 및 투두 리스트 -->
        <!-- 일정이 없을 경우 -->
        <v-list-item v-if="events.length === 0" style="text-align: center;">
          일정이 없습니다.
        </v-list-item>

        <!-- 일정이 있을 경우 -->
        <template v-else>
          <v-list-item class="schedule-item" v-for="(event, index) in events" :key="event.id">
            <v-list-item-content class="todayEvent">
              <!-- <v-row> -->
                <!-- <v-col cols="12" md="2" class="mt-2">
                  <v-icon class="mr-1">mdi-circle-small</v-icon>
                </v-col> -->
                <!-- <v-col cols="12" md="10" class="todayEvent"> -->
                  <v-list-item-title >
                    <v-icon style="margin-left: -5%;">mdi-circle-small</v-icon>{{ event.title }}</v-list-item-title>
                  <v-list-item-subtitle>
                    {{ matrixToDescription(event.matrix) }}
                  </v-list-item-subtitle>
                <!-- </v-col> -->
              <!-- </v-row> -->
              <!-- 투두리스트 -->
              <v-row v-if="event.todoLists.length > 0" style="margin-top: -8%; margin-left: 2%; margin-bottom:5%">
                <v-col cols="12">
                  <v-list-item-content v-for="todo in event.todoLists" :key="todo[0]">
                    <v-row style="height: 50px; margin-top:-20%; padding-top: 8%; margin-left: -13%; margin-bottom: 1%;">
                      <v-col cols="12" md="2" class="mt-2 pa-0 d-flex align-center">
                        <v-checkbox
                          style="font-size: 10px;"
                          v-model="todo[2]"
                          :true-value="'Y'"
                          :false-value="'N'"
                          @change="updateIsChecked(todo[0], todo[2])"
                        ></v-checkbox>
                      </v-col>
                      <v-col cols="12" md="10" class="mt-6 pa-0" style="height: 10px;">
                        <div :style="todo[2] === 'Y' ? 'text-decoration: line-through; text-decoration-color: #6d6d6d;' : ''" style="font-size: 14px;">
                          {{ todo[1] }}
                        </div>
                      </v-col>
                    </v-row>
                  </v-list-item-content>
                </v-col>
              </v-row>
            </v-list-item-content>
            <!-- 이벤트 사이의 구분선 -->
            <v-divider v-if="index < events.length - 1" class="mt-2"></v-divider>
          </v-list-item>
        </template>
      </v-list-item-group>
    </v-list>
    </v-col>
  </v-navigation-drawer>
</template>

<script>
import axiosInstance from "@/axios";
import EventDialog from "@/pages/event/EventDialog.vue";
import MyPageDialog from "@/pages/myPage/MyPageDialog.vue";
import {formatTime} from "@/utils/date-utils";

// import {useMainStore} from "@/stores";

export default {
  name: "AppSidebar",
  components: {
    EventDialog,
    MyPageDialog
  },
  data() {
    return {
      moims: "",
      profileImage: "",
      email: "",
      nickname: "",
      events: "",
      todos: [],
      isChecked: "",
    };
  },
  setup() {
    return {
      formatTime: formatTime,
    };
  },
  mounted() {
    this.fetchUserData();
    this.fetchMoims();
    this.fetchEvents();
  },
  methods: {
    isTodoChecked(todo) {
      console.log("메소드 todo", todo);
      if (todo[2] == "N") {
        return false;
      }
      return todo[2] === "Y";
    },
    matrixToDescription(matrix) {
      switch (matrix) {
          case 'Q1':
              return '중요 & 긴급하지 않음';
          case 'Q2':
              return '중요 & 긴급';
          case 'Q3':
              return '긴급 & 중요하지 않음';
          case 'Q4':
              return '긴급하지 않음 & 중요하지 않음';
          default:
              return '';
      }
    },

    async fetchUserData() {
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
          const userData = response.data.data;
          this.profileImage = userData.profileImage;
          this.email = userData.email;
          this.nickname = userData.nickname;
        } else {
          console.error("Failed to fetch user data");
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    },

    createEventClicked() {
      console.log("일정 생성 클릭");
      this.$refs.EventCreate.openDialog();
    },
    createChatClicked() {
      console.log("채팅방 생성 클릭");
      this.$refs.RoomCreate.openDialog();
    },
    goTo(route) {
      this.$router.push({name: route});
    },
    goToEisenhowerMatrix() {
      this.$router.push({path: "/EisenhowerMatrix"});
    },

    goToMoimList() {
      this.$router.push({path: "/MoimList"});
    },
    MyPageClicked() {
      this.$refs.MyPageDialog.openDialog();
    },
    goToChat() {
      this.$router.push({path: '/chat'})
    },
    goToChattingList() {
      this.$router.push({path: "/ChattingList"});
    },
    async fetchMoims() {
      const authToken = localStorage.getItem("accessToken");
      const url = `${process.env.VUE_APP_API_BASE_URL}/api/groups/today`;
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
          this.moims = response.data.data;

          // this.email = userData.email;
          // this.nickname = userData.nickname;
        } else {
          console.error("Failed to fetch user data");
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    },
    async fetchEvents() {
      const authToken = localStorage.getItem("accessToken");

      // const date = new Date(); // 현재 날짜와 시간
      // const year = date.getFullYear(); // 년도
      // const month = date.getMonth() + 1; // 월 (0-11을 1-12로 조정)
      // const day = date.getDate(); // 일
      // console.log("오늘은", year, month, day);

      // const url = `${process.env.VUE_APP_API_BASE_URL}/api/events/daily/${year}/${month}/${day}`;
      const url = `${process.env.VUE_APP_API_BASE_URL}/api/events/today`;
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
          this.events = response.data.data;

          this.events.forEach((event) => {
            const todos = event.todoLists;

            todos.forEach((todo) => {
              console.log("foreach", todo);
              this.isChecked = todo[2] == "Y";
            });
            this.todos = todos;
            console.log("this.todos", this.todos);
          });

          // this.email = userData.email;
          // this.nickname = userData.nickname;
        } else {
          console.error("Failed to get event data");
        }
      } catch (error) {
        console.error("Error get event data:", error);
      }
    },
    async updateIsChecked(id, isChecked) {
      console.log("id", id);
      console.log("isChecked", isChecked);
      const token = localStorage.getItem("accessToken");
      if (token == null) {
        this.$router.push({name: "Login"});
        return;
      }
      const headers = {Authorization: `Bearer ${token}`};
      // let checked = isChecked == true ? "Y" : "N";
      try {
        const response = await axiosInstance.post(
            `${process.env.VUE_APP_API_BASE_URL}/api/events/todolist/${id}?isChecked=${isChecked}`,
            {headers}
        );
        console.log(response.data.data);
      } catch (e) {
        console.log(e);
      }
    },
    formattedlastDateTime(confirmedDateTime, runningTime) {
      let lastDateTime = new Date(confirmedDateTime);
      lastDateTime.setMinutes(lastDateTime.getMinutes() + runningTime);
      return lastDateTime;
    },
  },
};
</script>

<style>
.active-menu-item {
  background-color: #eee; /* 활성 메뉴 항목의 배경색 */
}

.sidebar-navigation-drawer .today-list v-subheader {
  color: #000000;
  font-weight: bold;
  padding-left: 10px;

}

.back {
  background-color: #f5fcf2;
  border-radius: 1rem; /* Round corners */
  padding: 0%;
  margin: 12px;
  width: auto;
}

.todayEvent .v-list-item-title {
  font-size: 0.9rem;
  font-weight: 600;
}

.todayEvent .v-list-item-subtitle {
  font-size: 0.75rem;
}

.today-list .schedule-item {
  margin-left: 10px;
}

.today-list .schedule-item .v-icon {
  color: #6d6d6d;
}

.today-list .schedule-item v-list-item-title,
.today-list .schedule-item v-list-item-subtitle {
  color: #353535;
}


</style>
