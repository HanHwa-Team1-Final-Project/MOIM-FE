<template>
  <v-navigation-drawer permanent>
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

      <v-list-item prepend-icon="mdi-calendar" title="Calendar" value="calendar" @click="goTo('fullCalendarComponent')"></v-list-item>
      <v-list-item prepend-icon="mdi-trello" title="Eisenhower Matrix" value="matrix" @click="goToEisenhowerMatrix"></v-list-item>
      <v-list-item
        prepend-icon="mdi-widgets"
        title="일정 생성"
        value="createEvent"
        @click="createEventClicked"
      ></v-list-item>
      <EventDialog ref="EventCreate"></EventDialog>
      <v-list-item prepend-icon="mdi-widgets" title="모임 생성" value="createMoim" @click="createMoimClicked"></v-list-item>
      <MoimDialog ref="MoimCreate"></MoimDialog>
      <v-list-item prepend-icon="mdi-view-dashboard" title="모임 리스트" value="moim-list" @click="goToMoimList"></v-list-item>
      <v-list-item prepend-icon="mdi-snapchat" title="채팅 테스트" value="chat" @click="goToChat"></v-list-item>
      <v-list-item prepend-icon="mdi-widgets" title="채팅방 생성" value="createChat" @click="createChatClicked"></v-list-item>
      <RoomCreateDialog ref="RoomCreate"></RoomCreateDialog>
      <v-list-item prepend-icon="mdi-view-dashboard" title="채팅 리스트" value="chating-list" @click="goToChattingList"></v-list-item>
    </v-list>
  </v-navigation-drawer>

</template>

<script>
import axiosInstance from "@/axios";
import EventDialog from '@/pages/event/EventDialog.vue';
import MoimDialog from '@/pages/moim/MoimDialog.vue';
import MyPageDialog from '@/pages/myPage/MyPageDialog.vue';
import RoomCreateDialog from "@/pages/chat/RoomCreateDialog.vue";

export default {
  name: "AppSidebar",
  components: {
    EventDialog,
    MoimDialog,
    MyPageDialog,
    RoomCreateDialog
  },
  data() {
    return {
      profileImage: "",
      email: "",
      nickname: "",
    };
  },
  mounted() {
    this.fetchUserData();
  },
  methods: {
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
    createMoimClicked() {
      console.log("모임 생성 클릭");
      this.$refs.MoimCreate.openDialog();
    },
    createChatClicked() {
      console.log("채팅방 생성 클릭");
      this.$refs.RoomCreate.openDialog();
    },
    goTo(route) {
      this.$router.push({ name: route });
    },
    goToEisenhowerMatrix() {
      this.$router.push({ path: '/EisenhowerMatrix' });
    },

    goToMoimList() {
      this.$router.push({ path: '/MoimList' });
    },
    MyPageClicked(){
      this.$refs.MyPageDialog.openDialog();
    },
    goToChat() {
      this.$router.push({path: '/chat'})
    },
    goToChattingList() {
      this.$router.push({ path: '/ChattingList' });
    }
  }
}
</script>

<style>
.active-menu-item {
  background-color: #eee; /* 활성 메뉴 항목의 배경색 */
}
</style>
