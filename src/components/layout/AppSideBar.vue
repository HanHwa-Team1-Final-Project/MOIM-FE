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
        prepend-icon="mdi-trello"
        title="아이젠하워 메트릭스"
        value="matrix"
        @click="goToEisenhowerMatrix"
      ></v-list-item>
      <v-list-item
        prepend-icon="mdi-calendar-plus"
        title="일정 생성"
        value="createEvent"
        @click="createEventClicked"
      ></v-list-item>
      <EventDialog ref="EventCreate"></EventDialog>
      <v-list-item
        prepend-icon="mdi-account-details"
        title="모임 리스트"
        value="moim-list"
        @click="goToMoimList"
      ></v-list-item>
      <v-list-item
        prepend-icon="mdi-snapchat"
        title="채팅 테스트"
        value="chatTest"
        @click="goToChat"
      ></v-list-item>
      <v-list-item
        prepend-icon="mdi-widgets"
        title="채팅방 생성"
        value="createChat"
        @click="createChatClicked"
      ></v-list-item>
      <ChatDialog ref="ChatCreate"></ChatDialog>
      <v-list-item
        prepend-icon="mdi-message-text"
        title="채팅 리스트"
        value="chating-list"
        @click="goToChattingList"
      ></v-list-item>
    </v-list>

    <v-divider></v-divider>

    <v-col class="back">
    <v-list class="today-list">
      <v-subheader style="color:#353535">
        ✅ 오늘의 일정
      </v-subheader>
      <!-- 모임 -->
      <v-list-item-group>
        <!-- <v-list-item class="schedule-item"> -->
          <v-list-item-content v-for="moim in moims" :key="moim.id">
            <v-list-item-title> {{ moim.title }} </v-list-item-title>
            <v-list-item-subtitle>
              {{ formatTime(moim.confirmedDateTime) }} ~
              {{
                formatTime(
                  formattedlastDateTime(moim.confirmedDateTime, moim.runningTime)
                )
              }}</v-list-item-subtitle
            >
          </v-list-item-content>
        <!-- </v-list-item> -->

        <!-- 이벤트 및 투두 리스트 -->
        <v-list-item class="schedule-item" style="margin-left: 30px;">
          <v-list-item-content v-for="event in events" :key="event.id">
            <v-list-item-title style="margin-top: 8px;"> {{ event.title }} </v-list-item-title>
            <v-list-item-subtitle style="margin-bottom: -5px;"
              >{{ formatTime(event.startDate) }} ~ {{ formatTime(event.endDate) }}
            </v-list-item-subtitle>

            <v-col v-if="event.todoLists.length">
              <v-list-item-content v-for="todo in event.todoLists" :key="todo[0]">
                <v-row style="height: 50px; margin-top:-15%">
                  <v-col cols="12" md="2" class="mt-2 pa-0 d-flex align-center">
                    <v-checkbox
                      style="font-size: 12px;"
                      v-model="todo[2]"
                      :true-value="'Y'"
                      :false-value="'N'"
                      @change="updateIsChecked(todo[0], todo[2])"
                    ></v-checkbox>
                  </v-col>
                  <v-col cols="12" md="10" class="pa-0 pl-1" style="height: 10px;"> 
                    <input type="text" readonly>{{ todo[1] }}
                    <!-- <v-text-field variant="underlined" readonly>{{ todo[1] }}</v-text-field> -->
                  </v-col>
                </v-row>
              </v-list-item-content>
            </v-col>
          </v-list-item-content>
        </v-list-item>
      </v-list-item-group>
    </v-list>
    </v-col>
  </v-navigation-drawer>
</template>

<script>
import EventDialog from "@/pages/event/EventDialog.vue";
import MyPageDialog from "@/pages/myPage/MyPageDialog.vue";
import ChatDialog from "@/pages/chat/ChatDialog.vue";
import { formatTime } from "@/utils/date-utils";

// import {useMainStore} from "@/stores";
import axiosInstance from "@/axios";

export default {
  name: "AppSidebar",
  // setup() {
  //   const mainStore = useMainStore();
  //   return {
  //     mainStore
  //   }
  // },
  components: {
    EventDialog,
    MyPageDialog,
    ChatDialog,
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
      this.$refs.ChatCreate.openDialog();
    },
    goTo(route) {
      this.$router.push({ name: route });
    },
    goToEisenhowerMatrix() {
      this.$router.push({ path: "/EisenhowerMatrix" });
    },

    goToMoimList() {
      this.$router.push({ path: "/MoimList" });
    },
    MyPageClicked() {
      this.$refs.MyPageDialog.openDialog();
    },
    goToChat() {
      this.$router.push({ path: "/chatTest" });
    },
    goToChattingList() {
      this.$router.push({ path: "/ChattingList" });
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

      const date = new Date(); // 현재 날짜와 시간
      const year = date.getFullYear(); // 년도
      const month = date.getMonth() + 1; // 월 (0-11을 1-12로 조정)
      const day = date.getDate(); // 일
      console.log("오늘은", year, month, day);

      const url = `${process.env.VUE_APP_API_BASE_URL}/api/events/daily/${year}/${month}/${day}`;
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
        this.$router.push({ name: "Login" });
        return;
      }
      const headers = { Authorization: `Bearer ${token}` };
      // let checked = isChecked == true ? "Y" : "N";
      try {
        const response = await axiosInstance.post(
          `${process.env.VUE_APP_API_BASE_URL}/api/events/todolist/${id}?isChecked=${isChecked}`,
          { headers }
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
  padding-left: 20px;
  
}

.back {
  background-color: #f2fbef; 
  border-radius: 1rem; /* Round corners */
  padding: 0%;
  margin: 12px;
  width:auto;
}

.today-list .schedule-item {
  margin-top: 5px;
  

}

.today-list .schedule-item .v-icon {
  color: #6d6d6d;
}

.today-list .schedule-item v-list-item-title,
.today-list .schedule-item v-list-item-subtitle {
  color: #353535;
}


</style>
