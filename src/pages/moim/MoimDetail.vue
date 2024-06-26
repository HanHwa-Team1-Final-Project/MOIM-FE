<template>
  <v-dialog v-model="dialog" max-width="600">
    <v-card class="pa-4">
      <v-card-title class="text-h5" style="width: 100%; display: flex; align-items: center;">
        <v-icon class="mr-2" style="font-size: 40px;">mdi-account-multiple-plus</v-icon>
        <div v-if="notificationType == 'GROUP_CHOICE' || notificationType == 'GROUP_CONFIRM'"
            class="title-text"
            style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;"
        >{{title}}
        </div>
        <div v-else
            class="title-text"
            style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;"
        >"{{ hostNickname }}" 님이 "{{title}}" 참여를 요청했습니다.
        </div>
        <v-spacer></v-spacer>
        <v-btn class="no-shadow" density="comfortable" icon="mdi-close" @click="dialog = false"></v-btn>
      </v-card-title>
      <v-card-text class="mt-5">
        <v-row>
          <v-col cols="12" md="2"><h4>시작일</h4></v-col>
          <v-col cols="12" md="10">
            <input type="datetime-local" :value="startDate" readonly>
          </v-col>
          <v-col cols="12" md="2"><h4>종료일</h4></v-col>
          <v-col cols="12" md="10">
            <input type="datetime-local" :value="endDate" readonly>
          </v-col>
          <!-- 필요 시간 조회 -->
          <v-col cols="12" md="2" v-if="runningTime">
            <v-icon class="mr-2">mdi-clock-time-eight-outline</v-icon>
          </v-col>
          <v-col cols="12" md="10" v-if="runningTime">
            <input type="text" :value="runningTime" readonly>
          </v-col>
          <!-- 장소 조회 -->
          <v-col cols="12" md="2" v-if="place">
            <v-icon class="mr-2">mdi-map-marker</v-icon>
          </v-col>
          <v-col cols="12" md="10" v-if="place">
            <input type="text" :value="place" readonly>
          </v-col>
          <!-- 참여자 조회-->
          <v-col cols="12" md="2" v-if="members">
            <v-icon class="mr-2">mdi-account-multiple</v-icon>
          </v-col>
          <v-col cols="12" md="10" v-if="members">
            <div
              v-for="(member, index) in members"
              :key="index"
              class="participant-info"
            >
              {{ member.nickname }} <span v-html="getAgreementIcon(member.isAgreed)"></span>
            </div>
          </v-col>
          <!-- <v-col cols="12" md="10" v-if="members">
              <v-chip
                v-for="(member, index) in members"
                :key="index"
                :prepend-avatar="profileImage"
                :text="member"
              ></v-chip>
          </v-col> -->
          <!-- 내용 조회 -->
          <v-col cols="12" md="2" v-if="contents">
            <v-icon class="mr-2">mdi-format-align-left</v-icon>
          </v-col>
          <v-col cols="12" md="10" v-if="contents">
            <v-textarea :value="contents" variant="solo-filled" readonly auto-grow></v-textarea>
          </v-col>
          <!-- 파일 다운로드 -->
          <v-col cols="12" md="2" v-if="fileUrl">
            <v-icon class="mr-2">mdi-file-multiple-outline</v-icon>
          </v-col>
          <v-col cols="12" md="10" v-if="fileUrl">
            <v-btn :href="fileUrl" target="_blank" download>파일 다운로드</v-btn>
          </v-col>
          <v-col cols="12" md="2" v-if="voteDeadline"><h4>마감일</h4></v-col>
          <v-col cols="12" md="10" v-if="voteDeadline">
            <input type="datetime-local" :value="voteDeadline" readonly>
          </v-col>
           <!-- 추천일정 선택 -->
           <v-col cols="12" md="2" v-if="notificationType == 'GROUP_CHOICE'"><h4>추천 일정</h4></v-col>
           <v-col cols="12" md="10" v-if="notificationType == 'GROUP_CHOICE'">
             <v-container>
               <v-radio-group
                 v-model="eventIndex"
                 :rules="[
                   (value) => !!value || '3가지 선택지 중 하나를 선택해주세요',
                  ]"
                 required
               >
                 <v-radio
                 v-for="option in options"
                 :key="option.value"
                 :value="option.value">
                   <template v-slot:label>
                     <div>{{option.label}}</div>
                   </template>
                 </v-radio>
               </v-radio-group>
             </v-container>
           </v-col> 
        </v-row>
      </v-card-text>
      <v-card-actions v-if="notificationType == 'GROUP_CHOICE'">
        <v-spacer/>
        <v-btn color="#3085d6" text @click="confirm">확정</v-btn>
        <v-btn color="#d33" text @click="cancelMoim">취소</v-btn>
      </v-card-actions>
      <v-card-actions v-if="notificationType == 'GROUP_CONFIRM'">
        <v-spacer/>
        <v-btn color="#3085d6" text @click="addEvent(confirmGroupInfo)">일정 등록</v-btn>
      </v-card-actions>
      <v-card-actions v-if="!notificationType">
        <v-spacer/>
        <v-btn color="#3085d6" text @click="vote('Y')">수락</v-btn>
        <v-btn color="#d33" text @click="vote('N')">거부</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
  <EventDialog ref="eventDialog"></EventDialog>
</template>

<script>
import axiosInstance from "@/axios";
import Swal from 'sweetalert2'
import EventDialog from "../event/EventDialog.vue";

export default {
  components: {
    EventDialog,
  },
  data() {
    return {
      dialog: false,
      notificationType: '',
      hostNickname: '',
      groupId: "",
      groupInfoId: "",
      title: '',
      startDate: '',
      endDate: '',
      runningTime: null,
      members: [],
      place: '',
      voteDeadline: null,
      contents: '',
      fileUrl: '',
      eventIndex: 1,
      options: [],
      sortedAvailableDays: [],
      confirmEvent: '',
      confirmGroupInfo: '',
    };
  },
  methods: {
    openDialog(groupId, hostNickname) {
      this.hostNickname = hostNickname;
      this.groupId = groupId;
      this.dialog = true;
      this.getMoimInfo(groupId);
    },
    choiceDialog(groupId, hostNickname, message, notificationType) {
      this.notificationType = notificationType;
      this.title = message;
      this.hostNickname = hostNickname;
      this.groupId = groupId;
      this.dialog = true;
      this.getMoimInfo(groupId);
      this.getavailable(groupId);
    },
    confirmDialog(groupId, hostNickname, notificationType) {
      this.notificationType = notificationType;
      this.hostNickname = hostNickname;
      this.groupId = groupId;
      this.voteDeadline = null;
      this.runningTime = null;
      this.dialog = true;
      this.getConfirmMoim(groupId);
    },
    getAgreementIcon(status) {
      if (status === "Y") {
        return '<i class="fa-regular fa-square-check" style="color: #3085d6;"></i>';
      } else if (status === "N") {
        return '<i class="fa-regular fa-square-check" style="color: #d33;"></i>';
      } else if (status === "P") {
        return '<i class="fa-regular fa-square" style="color: #000000;"></i>';
      }
    },
    async getMoimInfo(groupId) {
      try {
        const token = localStorage.getItem("accessToken");
        if (token == null) {
          this.$router.push({name: "Login"});
          return;
        }
        const headers = {Authorization: `Bearer ${token}`};
        const response = await axiosInstance.get(`${process.env.VUE_APP_API_BASE_URL}/api/groups/pending/${groupId}`, {headers});
        const groupInfo = response.data.data;
        console.log("그룹 정보", groupInfo)
        if(this.notificationType != 'GROUP_CHOICE') {
          this.title = groupInfo.title
        }
        this.startDate = `${groupInfo.expectStartDate} ${groupInfo.expectStartTime}`
        this.endDate = `${groupInfo.expectEndDate} ${groupInfo.expectEndTime}`
        this.runningTime = this.convertMinutes(groupInfo.runningTime)
        this.groupInfoId = groupInfo.groupInfos[0].id
        console.log("getMoimInfo의 id", this.groupInfoId)
        const members = [];
        members.push({
          nickname: this.hostNickname,
          isAgreed: "Y"
        })
        groupInfo.groupInfos.forEach(member => {
          members.push({
            nickname: member.nickname,
            isAgreed: member.isAgreed
          })
        });
        console.log(members)
        this.members = members;
        console.log("this.members", this.members)
        this.place = groupInfo.place
        this.voteDeadline = groupInfo.voteDeadline
        this.contents = groupInfo.contents

      } catch (error) {
        console.log(error);
      }
    },
    async getConfirmMoim(groupId) {
      try {
        const token = localStorage.getItem("accessToken");
        if (token == null) {
          alert("로그인이 필요합니다.");
          this.$router.push({name: "Login"});
          return;
        }
        const headers = {Authorization: `Bearer ${token}`};
        const response = await axiosInstance.get(`${process.env.VUE_APP_API_BASE_URL}/api/groups/confirmed/${groupId}`, {headers});
        const groupInfo = response.data.data;
        this.confirmGroupInfo = groupInfo;
        console.log("그룹 정보", groupInfo)
        this.title = groupInfo.title;
        const date = groupInfo.confirmedDate;
        console.log("확정일", date)
        this.startDate = date.replace('T', ' ')
        console.log("시작일",this.startDate)
        this.endDate = this.addMinutesToDate(date, groupInfo.runningTime);
        console.log("running 더하기", this.endDate)
        const members = [];
        members.push({
          nickname: this.hostNickname,
          isAgreed: "Y"
        })
        groupInfo.groupInfos.forEach(member => {
          members.push({
            nickname: member.nickname,
          isAgreed: member.isAgreed
          });
        });
        console.log(members)
        this.members = members;
        console.log("this.members", this.members)
        this.place = groupInfo.place;
        this.contents = groupInfo.contents;

      } catch (error) {
        console.log(error);
      }
    },
    async getavailable(groupId) {
      try {
        const token = localStorage.getItem("accessToken");
        if (token == null) {
          alert("로그인이 필요합니다.");
          this.$router.push({name: "Login"});
          return;
        }
        const headers = {Authorization: `Bearer ${token}`};
        const response = await axiosInstance.get(`${process.env.VUE_APP_API_BASE_URL}/api/groups/${groupId}/choice`, {headers});
        const availableDays = response.data.data;
        console.log("추천 일정 리스트", availableDays)
        // availableDay 값으로 오름차순 정렬
        this.sortedAvailableDays = availableDays.sort((a, b) => new Date(a.availableDay) - new Date(b.availableDay));
        this.options = this.sortedAvailableDays.map((item, index) => ({
          value: index + 1,
          label: new Intl.DateTimeFormat('ko-KR', 
          {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true // 12시간제 사용
          }).format(new Date(item.availableDay))
        }));
        console.log(this.options)
      } catch (error) {
        console.log(error);
      }
    },
    addMinutesToDate(dateString, minutesToAdd) {
      // dateString을 Date 객체로 변환
      const date = new Date(dateString);
      // 분을 더함
      date.setMinutes(date.getMinutes() + minutesToAdd);

      // 로컬 시간대를 기준으로 Date를 문자열로 변환
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0'); // 0을 1월로 취급하므로 +1
      const day = date.getDate().toString().padStart(2, '0');
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      
      return `${year}-${month}-${day} ${hours}:${minutes}:00`;
    },
    convertMinutes(minutes) {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      
      if (minutes >= 60) {
        return `${hours}시간 ${remainingMinutes}분`;
      } else {
        return `${remainingMinutes}분`;
      }
    },
    async vote(agreeYn) {
      const token = localStorage.getItem("accessToken");
      const headers = {Authorization: `Bearer ${token}`};
      try {
        const response = await axiosInstance.post(`${process.env.VUE_APP_API_BASE_URL}/api/groups/${this.groupId}/groupInfo/${this.groupInfoId}/notification?agreeYn=${agreeYn}`, {headers});
        console.log("vote 정보 ", this.groupId, this.groupInfoId)
        console.log("답", response.data.data)
        this.dialog = false;
        if(response.data.data.isAgree == "Y") {
          Swal.fire({
            title: '참여 완료되었습니다.',
            text: '일정이 확정되면 알려드릴게요.',
            icon: 'success',
            showConfirmButton: true,
            confirmButtonColor: '#3085d6',
            confirmButtonText: '확인',
          }).then((result) => {
            if (result.isConfirmed) {
              window.location.reload();
            }
          })
        }
        if(response.data.data.isAgree == "N") {
          Swal.fire({
            title: '참여 거부하였습니다.',
            icon: 'error',
            showConfirmButton: true,
            confirmButtonColor: '#3085d6',
            confirmButtonText: '확인',
          }).then((result) => {
            if (result.isConfirmed) {
              window.location.reload();
            }
          })
        }
      }catch(e){
        alert(e)
      }
      
    },
    // 모임 확정
    async confirm() {
      const token = localStorage.getItem("accessToken");
      const headers = {Authorization: `Bearer ${token}`};
      try {
        this.confirmEvent = this.sortedAvailableDays[this.eventIndex - 1].availableDay;
        console.log(this.confirmEvent)
        const response = await axiosInstance.post(`${process.env.VUE_APP_API_BASE_URL}/api/groups/${this.groupId}/confirm?confirmDay=${this.confirmEvent}`, {headers});
        console.log("확정 모임", response.data.data)
        this.dialog = false;
        Swal.fire({
          title: '모임이 확정되었습니다.',
          text: '일정에 등록해보세요!',
          icon: 'success',
          showConfirmButton: true,
          confirmButtonColor: '#3085d6',
          confirmButtonText: '확인',
        }).then((result) => {
          if(result.isConfirmed) {
            console.log("이벤트변경시작", response.data.data)
            this.$refs.eventDialog.changeDialog(response.data.data)
          }
        })
      }catch(e){
        alert(e)
      }
    },
    addEvent(GroupInfo) {
      this.$refs.eventDialog.changeDialog(GroupInfo);
      this.dialog = false;
    },
    // 모임 취소 - 삭제
    async cancelMoim() {
      console.log("삭제")
      const token = localStorage.getItem("accessToken");
      const headers = {Authorization: `Bearer ${token}`};
      try {
        const response = await axiosInstance.post(`${process.env.VUE_APP_API_BASE_URL}/api/groups/${this.groupId}/cancel`, {headers});
        console.log("취소 모임", response.data.data)
        this.dialog = false;
        Swal.fire({
          title: '모임이 취소되었습니다.',
          icon: 'error',
          showConfirmButton: true,
          confirmButtonColor: '#3085d6',
          confirmButtonText: '확인',
        }).then((result) => {
          if (result.isConfirmed) {
            window.location.reload();
          }
        })
       
      }catch(e){
        alert(e)
      }
    }
  }
};
</script>

<style>
.no-shadow {
  box-shadow: none !important;
}
</style>