<template>
  <v-dialog v-model="isVisible" max-width="600">
    <v-card class="pa-4">
      <v-card-title style="width: 100%; display: flex; align-items: center;">
        <v-icon class="mr-4" style="font-size: 25px;">mdi-calendar-check</v-icon>
        <div
            class="title-text"
            style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;"
        >{{ title }}
        </div>
        <v-spacer></v-spacer>
        <v-btn class="no-shadow" density="comfortable" icon="mdi-close" @click="closeDialog"></v-btn>
      </v-card-title>
      <v-card-text class="mt-5">
        <v-row>
          <v-col cols="12" md="2"><h4>시작일</h4></v-col>
          <v-col cols="12" md="10">
            <input type="datetime-local" :value="startDateTime" readonly>
          </v-col>
          <v-col cols="12" md="2"><h4>종료일</h4></v-col>
          <v-col cols="12" md="10">
            <input type="datetime-local" :value="endDateTime" readonly>
          </v-col>
           <!-- 장소 조회 -->
          <v-col cols="12" md="2" v-if="place"><v-icon class="mr-2">mdi-map-marker</v-icon></v-col>
          <v-col cols="12" md="10" v-if="place">
            <input type="text" :value="place" readonly>
          </v-col>
          <!-- 아이젠하워 매트릭스 조회 -->
          <v-col cols="12" md="2"><v-icon class="mr-2">mdi-alert-circle-outline</v-icon></v-col>
          <v-col cols="12" md="10">
            <input type="text" :value="getEisenhowerMatrixLabel(radios)" readonly>
          </v-col>
          <!-- 메모 조회 -->
          <v-col cols="12" md="2" v-if="memo">
            <v-icon class="mr-2">mdi-format-align-left</v-icon>
          </v-col>
          <v-col cols="12" md="10" v-if="memo">
            <v-textarea :value="memo" variant="solo-filled" readonly auto-grow></v-textarea>
          </v-col>
          <!-- 할일 조회 -->
          <v-col cols="12" md="2" v-if="todos.length > 0"><h4>할 일</h4></v-col>
          <v-col cols="12" md="10" v-if="todos.length > 0">
            <v-row dense v-for="(todo, index) in todos" :key="index" class="ma-0" style="height: 30px;">
              <v-col cols="12" md="1" class="mt-5 d-flex align-center">
                <v-checkbox v-model="todo.isChecked" @change="updateIsChecked(todo.id, todo.isChecked)"></v-checkbox>
              </v-col>
              <v-col cols="12" md="9" class="d-flex align-center mb-0">
                <div :style="todo.isChecked ? 'text-decoration: line-through; text-decoration-color: #6d6d6d;' : ''">{{todo.contents}}</div>
              </v-col>
            </v-row>
          </v-col>
          <!-- 알람 조회 -->
          <v-col cols="12" md="2" v-if="displayAlarmInfo">
            <v-icon class="mr-2">mdi-bell-outline</v-icon>
          </v-col>
          <v-col cols="12" md="10" v-if="displayAlarmInfo">
            <p v-html="displayAlarmInfo"></p>
          </v-col>
          <!-- 파일 다운로드 -->
          <v-col cols="12" md="2" v-if="fileUrl">
            <v-icon class="mr-2">mdi-file-multiple-outline</v-icon>
          </v-col>
          <v-col cols="12" md="10" v-if="fileUrl">
            <v-btn :href="fileUrl" target="_blank" download>파일 다운로드</v-btn>
          </v-col>
        </v-row>
      </v-card-text>

      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="green darken-1" text @click="goToUpdateEvent">수정</v-btn>
        <v-btn color="green darken-1" text @click="showDeleteDialog" v-if="repeatParent != null">삭제</v-btn>
        <v-btn color="green darken-1" text @click="deleteSingleEvent" v-else>삭제</v-btn>
      
      </v-card-actions>
      <DeleteRepeatEvent
          ref="delRepeatDialog"
          :eventId="id"
          :repeatParent="repeatParent"
      />
    </v-card>
  </v-dialog>
</template>


<script>
import axiosInstance from "@/axios";
import {useEventStore} from "@/stores/updateEventStore";
import DeleteRepeatEvent from "@/pages/search/DeleteRepeatEvent.vue";

import Swal from 'sweetalert2'

export default {
  props: ['eventId'],
  components: {DeleteRepeatEvent},
  data() {
    return {
      // Dialog 상태
      isVisible: false,
      // 상세 정보를 위한 데이터
      id: '',
      title: '',
      startDateTime: '',
      endDateTime: '',
      place: '',
      radios: '', // Eisenhower Matrix 선택 값
      alarmInfo: '',
      displayAlarmInfo: '',
      displayTodoInfo: '',
      memo: '',
      fileUrl: '',
      repeatParent: '',
      todos: [],
    };
  },
  methods: {
    async getEventDetail(eventId) {
      try {
        const token = localStorage.getItem("accessToken");
        const headers = { Authorization: `Bearer ${token}` };
        console.log(token)
        if (token == null) {
          this.$router.push({ name: "Login" });
          return;
        }
        const response = await axiosInstance.get(`${process.env.VUE_APP_API_BASE_URL}/api/events/${eventId}`, { headers });
        const eventDetail = response.data.data;
        console.log(eventDetail)
        this.startDateTime = eventDetail.startDate;
        this.endDateTime = eventDetail.endDate;
        this.radios = eventDetail.matrix;
        this.title = eventDetail.title;
        this.memo = eventDetail.memo;
        this.place = eventDetail.place;
        this.fileUrl = eventDetail.fileUrl;
        this.repeatParent = eventDetail.repeatParent;
      } catch (error) {
        console.log(error);
      }
    },
    openDialog(eventId) {
      this.isVisible = true;
      this.id = eventId;
      this.getEventDetail(eventId);
      this.getAlarmInfo(eventId);
      this.getTodoList(eventId);
    },
    closeDialog() {
      this.isVisible = false;
    },
    showDeleteDialog() {
      this.$refs.delRepeatDialog.openDeleteRepeatEventDialog();
    },
    goToUpdateEvent() {
      const eventStore = useEventStore();
      const event = {
        id: this.id,
        title: this.title,
        memo: this.memo,
        startDate: this.startDateTime,
        endDate: this.endDateTime,
        place: this.place,
        matrix: this.radios,
        fileUrl: this.fileUrl,
      }
      eventStore.setCurrentEvent(event);
      this.$router.push({name: "updateEvent"});
    },
    async getAlarmInfo(eventId) {
      try {
        const token = localStorage.getItem("accessToken");
        if (token == null) {
          this.$router.push({name: "Login"});
          return;
        }
        const headers = {Authorization: `Bearer ${token}`};
        const response = await axiosInstance.get(`${process.env.VUE_APP_API_BASE_URL}/api/events/search/alarm/${eventId}`, {headers});
        this.alarmInfo = response.data.data;
        this.displayAlarmInfo = this.alarmInfo.map(alarm => {
          let timeUnit = '';
          switch (alarm.alarmType) {
            case 'M':
              timeUnit = '분';
              break;
            case 'H':
              timeUnit = '시간';
              break;
            case 'D':
              timeUnit = '일';
              break;
            default:
              timeUnit = '';
          }
          return `${alarm.setTime}${timeUnit} 전<br/>`;
        }).join('');

        console.log('The alarm info is: ', this.alarmInfo);
      } catch (error) {
        console.log(error);
      }
    },
    async getTodoList(eventId) {
      const token = localStorage.getItem("accessToken");
      if (token == null) {
        this.$router.push({name: "Login"});
        return;
      }
      const headers = {Authorization: `Bearer ${token}`};
      try{
        const response = await axiosInstance.get(`${process.env.VUE_APP_API_BASE_URL}/api/events/${eventId}/todolist`, {headers});
        const todoInfo = response.data.data;
        const todos = [];
        todoInfo.forEach(todo => {
          console.log("foreach", todo)
          let isChecked = todo.isChecked == "Y";
          todos.push({
            id: todo.id,
            contents: todo.contents,
            isChecked: isChecked
          })
        });
        this.todos = todos;
      } catch(e) {
        console.log(e)
      }
    },
    async updateIsChecked(id, isChecked) {
      const token = localStorage.getItem("accessToken");
      if (token == null) {
        this.$router.push({name: "Login"});
        return;
      }
      const headers = {Authorization: `Bearer ${token}`};
      let checked = isChecked == true ? "Y" : "N";
      try {
        const response = await axiosInstance.post(`${process.env.VUE_APP_API_BASE_URL}/api/events/todolist/${id}?isChecked=${checked}`, {headers})
        console.log(response.data.data);
      }catch(e) {
        console.log(e)
      }
    },
    // Eisenhower Matrix 라벨 반환
    getEisenhowerMatrixLabel(value) {
      const labels = {
        Q1: '중요 & 긴급하지 않음',
        Q2: '중요 & 긴급',
        Q3: '중요하지 않음 & 긴급',
        Q4: '중요하지 않음 & 긴급하지 않음'
      };
      return labels[value] || '알 수 없음';
    },async deleteSingleEvent() {
      this.isVisible = false;
      try {
        const token = localStorage.getItem("accessToken");
        if (token == null) {
          this.$router.push({name: "Login"});
          return;
        }
        const headers = {Authorization: `Bearer ${token}`};
        const response = await axiosInstance.delete(`${process.env.VUE_APP_API_BASE_URL}/api/events/${this.id}`, {headers});
        if (response.status === 200) {
          Swal.fire({
            title: '일정이 삭제되었습니다.',
            icon: 'success',
            showConfirmButton: true,
            confirmButtonColor: '#3085d6',
            confirmButtonText: '확인',
          }).then((result) => {
            if(result.isConfirmed) {
              window.location.reload();
            }
          })
        } else {
          alert('단일 일정 삭제 실패');
        }
      } catch (error) {
        console.log(error);
        alert('단일 일정 삭제 실패');
      }
    }
  }
}
</script>

<style scoped>
</style>
