<template>
  <!-- <v-app-bar
      :elevation="0"
      color="teal-darken-4"
      image="https://picsum.photos/seed/picsum/1920/1080"
  > -->
  <v-app-bar
      :elevation="0"
  >
    <v-app-bar-title class="moim" @click="goCalendar">MOIM</v-app-bar-title>

    <v-spacer></v-spacer>

    <v-text-field
        @focus="searchClosed=false"
        @blur="searchClosed=true"
        v-model="searchQuery"
        variant="underlined"
        placeholder="일정 검색"
        prepend-inner-icon="mdi-magnify"
        class="expanding-search mt-4"
        :class="{ 'closed': searchClosed && !searchQuery }"
        filled
        dense
        clearable
        @keydown.enter="searchEvents"
        @click:append="searchEvents"
    ></v-text-field>

    <v-spacer></v-spacer>

    <v-menu>
      <template v-slot:activator="{ props }">
        <v-btn icon v-bind="props" @click="getNotification">
          <v-badge color="red" :content="notificationStore.newNotificationCount">
            <v-icon>mdi-bell-outline</v-icon>
          </v-badge>
        </v-btn>
      </template>

      <v-list style="max-height: 300px; overflow-y: auto;">
        <v-list-item
          v-for="(item, i) in items"
          :key="i"
          :value="i"
          @click="fromNoti(item)"
          :data-notificationType="item.notificationType"
          :data-id="item.id"
          :data-nickname="item.nickname"
          :data-message="item.message"
        >
          <v-list-item-content>
            <v-list-item-title>{{ item.title }}</v-list-item-title>
            <v-list-item-subtitle>{{ item.subtitle }}</v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>
      </v-list>
    </v-menu>

    <v-btn flat color="black" @click="logout">
      <v-icon>mdi-logout</v-icon>
      <span>로그아웃</span>
    </v-btn>
  </v-app-bar>

  <MoimDetail ref="moimDetail"></MoimDetail>
  <EventDetailDialog ref="EventDetail"></EventDetailDialog>

</template>

<script>
import { useNotificationStore } from '@/stores/notificationStore';
import { useSearchStore } from '@/stores/searchStore'
import { EventSourcePolyfill } from 'event-source-polyfill';
import Swal from 'sweetalert2'
import axiosInstance from "@/axios";
import MoimDetail from "@/pages/moim/MoimDetail.vue";
import EventDetailDialog from '@/pages/event/EventDetailDialog.vue'

export default {
  name: "AppHeader",
  components: {
    MoimDetail,
    EventDetailDialog,
  },
  setup() {
    const notificationStore = useNotificationStore();
    const Toast = Swal.mixin({
      toast: true,
      position: 'top-end',
      timer: 4000,
      timerProgressBar: true,
      didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer)
        toast.addEventListener('mouseleave', Swal.resumeTimer)
      }
    })
    return {
      notificationStore,
      Toast,
    }
  },

  data() {
    return {
      searchClosed: true,
      searchQuery: null,
      authToken: this.getAuthToken(),
      items: [],
      newNotification : 0,
    };
  },
  created() {
    this.setupSSE();
    this.initializeNotificationCount();
  },
  methods: {
    async initializeNotificationCount() {
      try {
        const token = localStorage.getItem('accessToken');
        const headers = { Authorization: `Bearer ${token}` };
        if (!token) {
          this.$router.push({ name: 'Login' });
          return;
        }
        const response = await axiosInstance.get(
          `${process.env.VUE_APP_API_BASE_URL}/api/notification`,
          { headers }
        );
        const notifications = response.data.data;
        if (notifications.length === 0) {
          this.notificationStore.initializeCount(0);
        } else {
          this.notificationStore.initializeCount(notifications.length);
        }
        } catch (error) {
        // 알림이 없을 때 처리: 0으로 초기화
        if (error.response.data.error.type === 'NotificationNotFoundException') {
          this.notificationStore.initializeCount(0);
          this.items = [];
        }
        console.error(error);
        }
    },
    setupSSE(){
      if(localStorage.getItem('accessToken') != null){
        const token = localStorage.getItem('accessToken');
        var sse = new EventSourcePolyfill('http://localhost:8080/connect', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        sse.addEventListener('connect', (e) => {
          const { data: receivedConnectData } = e;
          console.log('connect event data: ',receivedConnectData);
        });
        sse.addEventListener('sendEventAlarm', (e) => {
          const obj = JSON.parse(e.data);
          this.Toast.fire({
            showConfirmButton: true,
            confirmButtonColor: '#3085D6',
            confirmButtonText: '확인',
            icon: 'info',
            title: obj.message
          }).then((result) => {
            if (result.isConfirmed) {
              this.onNotiClick(obj)
            }
          })
          this.notificationStore.incrementCount();
        });
        sse.addEventListener('sendToParticipant', (e) => {
          const obj = JSON.parse(e.data);
          console.log("sse 정보", obj)
          this.Toast.fire({
            showConfirmButton: true,
            confirmButtonColor: '#3085D6',
            confirmButtonText: '확인',
            icon: 'info',
            title: obj.message,
          }).then((result) => {
            if (result.isConfirmed) {
              this.onNotiClick(obj)
            }
          })
          this.notificationStore.incrementCount();
        });
        sse.addEventListener('sendRoomAlarm', (e) => {
          const obj = JSON.parse(e.data);
          console.log("sse 정보", obj)
          this.Toast.fire({
            showConfirmButton: true,
            confirmButtonColor: '#3085D6',
            confirmButtonText: '확인',
            icon: 'info',
            title: obj.message,
          }).then((result) => {
            if (result.isConfirmed) {
              this.onNotiClick(obj)
            }
          })
          this.notificationStore.incrementCount();
        });
        this.getNotification();
      }
    },
    logout() {
        localStorage.clear();
        window.location.href = "/";
    },
    onNotiClick(notiInfo) {
      if(notiInfo.notificationType == "GROUP_CREATE" || notiInfo.notificationType == "GROUP_DEADLINE") {
        this.$refs.moimDetail.openDialog(notiInfo.groupId, notiInfo.hostName);
      }
      if(notiInfo.notificationType == "GROUP_CHOICE") {
        this.$refs.moimDetail.choiceDialog(notiInfo.groupId, notiInfo.hostName, notiInfo.message, notiInfo.notificationType);
      }
      if(notiInfo.notificationType == "GROUP_CONFIRM") {
        this.$refs.moimDetail.confirmDialog(notiInfo.groupId, notiInfo.hostName, notiInfo.notificationType);
      }
      if(notiInfo.notificationType == "GROUP_CANCEL") {
        window.location.reload();
      }
      if(notiInfo.notificationType == "ROOM") {
        window.location.href = "ChattingList";
      }
      if(notiInfo.notificationType == "EVENT") {
        this.$refs.EventDetail.openDialog(notiInfo.eventId);
      }
    },
    async fromNoti(noti) {
      // 알림을 읽음으로 표시하는 API 엔드포인트로 PATCH 요청을 보냄
      try {
        const headers = { Authorization: `Bearer ${localStorage.getItem('accessToken')}` };
        await axiosInstance.patch(`${process.env.VUE_APP_API_BASE_URL}/api/notification/${noti.redisId}`, null, { headers });
        // 요청이 성공하면 알림을 사용된 상태로 처리
        this.notificationStore.decrementCount();
        console.log("알림을 읽음 처리하였습니다.");
      } catch (error) {
        console.error("알림을 읽음 처리하는 중 오류가 발생하였습니다: ", error);
      }
        const notificationType = noti.notificationType;
        const id = noti.id;
        if(notificationType == "EVENT") {
          this.$refs.EventDetail.openDialog(id);
        }
        else if(notificationType == "ROOM") {
          window.location.href = "/ChattingList";
        }
        else {
          window.location.href = "/MoimList";
        }
    },
    getAuthToken() {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        // alert("로그인 후 이용해 주세요");
        window.location.href = "/login";
        return "";
      }
      return token;
    },
    goCalendar() {
      this.$router.push({ name: "fullCalendarComponent" });
    },

    async searchEvents() {
      // 토큰 관련 에러 처리
      if (!this.authToken) {
        console.error("Authentication token is missing");
        return;
      }
      // 검색어를 입력하지 않은 경우
      if (!this.searchQuery) return;

      const headers = {
        Authorization: `Bearer ${this.authToken}`
      };
      const url = `${process.env.VUE_APP_API_BASE_URL}/api/events/search/${this.searchQuery}`;
      const searchStore = useSearchStore();

      try {
        const response = await axiosInstance.get(url, {headers});
        console.log("!!!" + response.data.success);
        console.log("!!!" + response.data.data);
        if (response.data.success && response.data.data) {
          searchStore.setResults(response.data.data)
        } else {
          searchStore.setResults([]);
        }
      } catch (error) {
        console.error("Error occurred when searching events: ", error);
        searchStore.setResults([]);
      }
      // 검색 이후 항상 검색 결과 페이지로 이동함
      this.$router.push({name: "Search"});
    },
    async getNotification() {
      try {
        const token = localStorage.getItem("accessToken");
        const headers = { Authorization: `Bearer ${token}` };
        console.log(token)
        if (token == null) {
          this.$router.push({ name: "Login" });
          return;
        }
        const response = await axiosInstance
            .get(`${process.env.VUE_APP_API_BASE_URL}/api/notification`, { headers });
        const getNotifications = response.data.data;
        console.log(getNotifications);
        const notifications = [];
        let timeAgo;
        getNotifications.forEach(noti => {
          timeAgo = this.calculateTimeAgo(noti.sendTime),
          notifications.push({
              title: noti.message,
              subtitle: timeAgo,
              id: noti.id,
              redisId: noti.redisId,
              notificationType: noti.notificationType
          });
        });
        this.items = notifications;
      } catch (error) {
        if(error.response.data.error.type == 'NotificationNotFoundException') {
          this.items = [{title: '알림이 없습니다.'}];
        }
        console.log(error);
      }
    },
    calculateTimeAgo(timestamp) {
      const currentTime = new Date(); // 현재 시간
      const givenTime = new Date(timestamp); // 주어진 시간 데이터

      const timeDiff = currentTime - givenTime; // 현재 시간과 주어진 시간의 차이 (밀리초 단위)

       // 밀리초를 분으로 변환
      const minutes = Math.floor((timeDiff / 1000) / 60);

      if (minutes < 1) {
        return "방금";
      } else if (minutes < 60) {
        return minutes + "분 전";
      } else {
        const hours = Math.floor(minutes / 60);
        if (hours < 24) {
          return hours + "시간 전";
        } else {
          const days = Math.floor(hours / 24);
          return days + "일 전";
        }
      }
    }
  },
};
</script>

<style lang="sass" scoped>
.v-app-bar
  color: #162A2C
  border-bottom: 1px solid rgba(0, 0, 0, 0.06)
  .v-icon, .v-text-field, .v-app-bar-title
    color: #162A2C !important
.v-input.expanding-search
  transition: 0.3s
  max-width: 20%
  .v-input__slot
    cursor: pointer !important
    &:before, &:after
      border-color: transparent !important
  &.closed
    max-width: 100px
    
    .v-input__slot
      background: transparent !important
  .v-menu__content
    max-height: 300px
    overflow-y: auto

::v-deep .v-toolbar-title__placeholder 
  cursor: pointer
  width: 90px
  margin-left: 30px
  line-height: 1.2
  font-weight: 900 !important
  font-size: 30px
  background: linear-gradient(90deg, #0aca08, #06c7ba)
  background-size: 100%
  -webkit-background-clip: text
  -webkit-text-fill-color: transparent

</style>
