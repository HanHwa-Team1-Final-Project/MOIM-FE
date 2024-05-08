<template>
  <v-container v-if="moims.length === 0" class="nonMoim" style="margin-top: -20%;">
    <v-row>
      <v-col cols="12" class="d-flex flex-column justify-center align-center" style="height: calc(100vh - 27vh);">
        <div class="d-flex justify-center">
          <v-icon class="no-moim-icon">mdi-account-group</v-icon>
        </div>
        <div style="font-size: 24px; font-weight: 500;">모임이 없습니다</div>
        <div style="font-size: 19px; font-weight: 300; color: #555555" class="pa-3">모임을 생성하고 간편하게 약속시간을 정해보세요</div>
        <v-btn flat @click="createMoim" class="no-moim-btn">모임 생성하기</v-btn>
        <MoimDialog ref="MoimCreate"></MoimDialog>
      </v-col>
    </v-row>
  </v-container>

  <v-container v-else style="margin-top: -17%;">
    <v-row>
      <v-col cols="12" md="4">
        <v-row v-if="moims.length > 0">
          <v-col cols="12" v-for="moim in moims" :key="moim.id">
            <v-card
                class="mx-auto result-card"
                :class="{
                  'selected-moim-card': selectedMoim && moim.id === selectedMoim.id,
                  'cancelled-moim-card': moim.groupType === 'GROUP_CANCEL',
                }"
                :title="moim.title"
                :subtitle="moim.hostNickname"
                max-width="800"
                @click="onMoimClick(moim)"
                link
            >
              <template v-slot:prepend>
                <v-btn
                    class="circle-button"
                    :class="{
                      'cancelled-moim-card-button': moim.groupType === 'GROUP_CANCEL',
                      'confirm-moim-card-button': moim.groupType === 'GROUP_CONFIRM',
                    }"
                >
                  {{ getStatus(moim) }}
                  <div
                      v-if="
                        (moim.groupType === 'GROUP_CHOICE' &&
                          moim.hostEmail === this.userEmail) ||
                        getStatus(moim) === 'new'
                      "
                      class="action-required-indicator"
                  >
                    N
                  </div>
                </v-btn>
              </template>
              <template v-slot:append>
                <v-list
                    lines="one"
                    class="result-card-time"
                    :class="{
                      'selected-moim-card': selectedMoim && moim.id === selectedMoim.id,
                      'cancelled-moim-card': moim.groupType === 'GROUP_CANCEL',
                    }"
                  >
                    <v-list-item style="background-color: transparent;"
                      v-if="moim.groupType == 'GROUP_CONFIRM'"
                      title="확정일"
                      :subtitle="
                        new Date(moim.confirmedDateTime).toLocaleDateString('ko-KR')
                      "
                    />
                    <v-list-item style="background-color: transparent !important;"
                      v-else
                      title="마감일"
                      :subtitle="new Date(moim.voteDeadline).toLocaleDateString('ko-KR')"
                  />
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

      <!-- 모임 상세 페이지 -->
      <v-col cols="12" md="8">
        <v-card class="pa-4">
          <div v-if="selectedMoim">
            <v-card-title
                class="text-h5"
                style="width: 100%; display: flex; align-items: center"
            >
              <div
                  class="title-text"
                  style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap"
              >
                {{ selectedMoim.title }}
              </div>
              <v-spacer></v-spacer>
              <v-btn fab icon="mdi-plus" @click="createMoim" class="fab-fixed"></v-btn>
              <MoimDialog ref="MoimCreate"></MoimDialog>
            </v-card-title>

            <v-card-text class="mt-5">
              <v-row>
                <v-col cols="12" md="2"><h4>호스트</h4></v-col>
                <v-col cols="12" md="10">
                  <input type="text" :value="selectedMoim.hostNickname" readonly/>
                </v-col>
                <v-col cols="12" md="2"><h4>참여 현황</h4></v-col>
                <v-col cols="12" md="10">
                  <div
                      v-for="guest in selectedMoim.guestEmailNicknameIsAgreed"
                      :key="guest[0]"
                      class="participant-info"
                  >
                    {{ guest[1] }} <span v-html="getAgreementIcon(guest[2])"></span>
                  </div>
                </v-col>

                <v-col cols="12" md="2" v-if="selectedMoim.groupType == 'GROUP_CONFIRM'"
                ><h4>최종 확정일</h4></v-col
                >
                <v-col
                    cols="12"
                    md="10"
                    v-if="selectedMoim.groupType == 'GROUP_CONFIRM'"
                >
                  <input
                      type="text"
                      :value="confirmedDate(selectedMoim)"
                      readonly
                      class="full-width-input"
                  />
                </v-col>

                <!-- <v-col v-else> -->
                <v-col cols="12" md="2" v-if="selectedMoim.groupType != 'GROUP_CONFIRM'"
                ><h4>시작일</h4></v-col
                >
                <v-col
                    cols="12"
                    md="10"
                    v-if="selectedMoim.groupType != 'GROUP_CONFIRM'"
                >
                  <input type="text" :value="selectedMoim.expectStartDate" readonly/>
                </v-col>
                <v-col cols="12" md="2" v-if="selectedMoim.groupType != 'GROUP_CONFIRM'"
                ><h4>종료일</h4></v-col
                >
                <v-col
                    cols="12"
                    md="10"
                    v-if="selectedMoim.groupType != 'GROUP_CONFIRM'"
                >
                  <input type="text" :value="selectedMoim.expectEndDate" readonly/>
                </v-col>
                <v-col cols="12" md="2" v-if="selectedMoim.groupType != 'GROUP_CONFIRM'"
                ><h4>시작 시간</h4></v-col
                >
                <v-col
                    cols="12"
                    md="10"
                    v-if="selectedMoim.groupType != 'GROUP_CONFIRM'"
                >
                  <input type="text" :value="selectedMoim.expectStartTime" readonly/>
                </v-col>
                <v-col cols="12" md="2" v-if="selectedMoim.groupType != 'GROUP_CONFIRM'"
                ><h4>종료 시간</h4></v-col
                >
                <v-col
                    cols="12"
                    md="10"
                    v-if="selectedMoim.groupType != 'GROUP_CONFIRM'"
                >
                  <input type="text" :value="selectedMoim.expectEndTime" readonly/>
                </v-col>
                <v-col cols="12" md="2" v-if="selectedMoim.groupType != 'GROUP_CONFIRM'"
                ><h4>소요 시간</h4></v-col
                >
                <v-col
                    cols="12"
                    md="10"
                    v-if="selectedMoim.groupType != 'GROUP_CONFIRM'"
                >
                  <input
                      type="text"
                      :value="selectedMoim.runningTime + ' 분'"
                      readonly
                  />
                </v-col>
                <v-col cols="12" md="2" v-if="selectedMoim.groupType != 'GROUP_CONFIRM'"
                ><h4>참여 마감</h4></v-col
                >
                <v-col
                    cols="12"
                    md="10"
                    v-if="selectedMoim.groupType != 'GROUP_CONFIRM'"
                >
                  <input
                      type="datetime-local"
                      :value="selectedMoim.voteDeadline"
                      readonly
                  />
                </v-col>
                <!-- </v-col> -->

                <v-col cols="12" md="2" v-if="selectedMoim.place"><h4>장소</h4></v-col>
                <v-col cols="12" md="10" v-if="selectedMoim.place">
                  <input type="text" :value="selectedMoim.place" readonly/>
                </v-col>

                <v-col cols="12" md="2" v-if="selectedMoim.contents"><h4>메모</h4></v-col>
                <v-col cols="12" md="10" v-if="selectedMoim.contents">
                  <v-textarea
                      :value="selectedMoim.contents"
                      readonly
                      auto-grow
                  ></v-textarea>
                </v-col>
                <!-- 파일 다운로드 -->
                <v-col cols="12" md="12" v-if="selectedMoim.filePath">
                  <v-row>
                    <v-col cols="12" md="2"><h4>파일</h4></v-col>
                    <v-col cols="12" md="10">
                      <v-btn :href="selectedMoim.filePath" target="_blank" download
                      >파일 다운로드
                      </v-btn
                      >
                    </v-col>
                  </v-row>
                </v-col>
              </v-row>
            </v-card-text>

            <v-card-text v-if="getStatus(selectedMoim) === 'new'">
              <v-spacer/>
              <v-btn class="vote-button" color="#3085d6" text @click="vote('Y')"
              >수락
              </v-btn
              >
              <v-btn class="vote-button" color="#d33" text @click="vote('N')"
              >거부
              </v-btn
              >
            </v-card-text>

            <!-- 추천일정 선택 -->
            <v-col
                cols="12"
                md="2"
                v-if="
                  selectedMoim &&
                  selectedMoim.groupType == 'GROUP_CHOICE' &&
                  selectedMoim.hostEmail === this.userEmail
                "
            ><h4>추천 일정</h4></v-col
            >
            <v-col
                cols="12"
                md="10"
                v-if="
                  selectedMoim &&
                  selectedMoim.groupType == 'GROUP_CHOICE' &&
                  selectedMoim.hostEmail === this.userEmail
                "
            >
              <v-container>
                <v-radio-group
                    v-model="selectedOption"
                    :rules="[(value) => !!value]"
                    required
                >
                  <v-radio
                      v-for="option in options"
                      :key="option.value"
                      :value="option.value"
                  >
                    <template v-slot:label>
                      <div>{{ option.label }}</div>
                    </template>
                  </v-radio>
                </v-radio-group>
              </v-container>
            </v-col>

            <v-card-actions
                v-if="
                  selectedMoim &&
                  selectedMoim.groupType == 'GROUP_CHOICE' &&
                  selectedMoim.hostEmail === this.userEmail
                "
            >
              <!-- <v-spacer /> -->
              <v-btn color="#3085d6" text @click="confirm(selectedOption)">확정</v-btn>
            </v-card-actions>
            <!-- 확정 후 -->

            <v-card-actions v-if="selectedMoim.groupType == 'GROUP_CONFIRM' && addEventCheck() != 'Y'">
              <!-- <v-spacer /> -->
              <v-btn
                  color="#3085d6"
                  text
                  @click="addEvent(selectedMoim, startDate, endDate)"
              >일정 등록
              </v-btn
              >
            </v-card-actions>
          </div>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
  <EventDialog ref="eventDialog"></EventDialog>
</template>

<script>
import axiosInstance from "@/axios";
import Swal from "sweetalert2";
import EventDialog from "../event/EventDialog.vue";
import MoimDialog from "../moim/MoimDialog.vue";

export default {
  components: {
    EventDialog,
    MoimDialog,
  },
  data() {
    return {
      moims: [],
      moimId: "",
      userEmail: "",
      userNickname: "",
      selectedMoim: null,
      selectedOption: null,
      options: [],
      sortedAvailableDays: [],
      confirmEvent: "",
      confirmGroupInfo: "",
      startDate: "",
      endDate: "",
      currentPage: 1, // 현재 페이지
      totalPages: null, // 총 페이지 수
      hasNextPage: true,
    };
  },
  watch: {
    selectedMoim: function (newVal) {
      if (newVal && newVal.groupType === "GROUP_CHOICE") {
        this.getavailable(newVal.id);
        // this.confirm(newVal.id);
      }
    },
  },
  created() {
    this.fetchMoims();
    this.getUserData();
  },
  methods: {
    createMoim() {
      // 여기에 모임 생성 로직을 추가
      console.log("Creating a new moim...");
      // 예를 들어, 모임 생성 폼으로 라우팅하거나 대화상자를 열 수 있음
      // this.$router.push({ name: 'CreateMoimForm' });
      // 또는 대화상자를 사용하는 경우
      this.$refs.MoimCreate.openDialog();
    },
    onMoimClick(moim) {
      // alert(`Moim with ID ${moim.id} clicked`);
      this.selectedMoim = moim;
      console.log(
          "Selected moim's Group Info ID:",
          this.selectedMoim.guestEmailNicknameIsAgreed[2]
      );
      console.log("모든 데이터", this.selectedMoim);
    },
    addEventCheck() {
      const guest = this.selectedMoim.guestEmailNicknameIsAgreed.find(
          (g) => g[0] === this.userEmail
      );
      if (guest && guest[4] === "Y") {
        return "Y";
      } else {
        return "N";
      }
    },
    async fetchMoims(page = 1) {
      const authToken = localStorage.getItem("accessToken");
      const url = `${process.env.VUE_APP_API_BASE_URL}/api/groups/groups/${page}`;
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
          this.moims = response.data.data.sort(
              (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
          );
          this.selectedMoim = this.moims[0] || null;
          this.currentPage = page;
          // this.hasNextPage = response.data.data.length  > 0; // 다음 페이지 존재 여부 업데이트
          await this.checkNextPage(page + 1);
        }
      } catch (error) {
        console.error("Error fetching moims:", error);
        this.moims = [];
        this.hasNextPage = false;
      }
    },
    async checkNextPage(nextPage) {
      const authToken = localStorage.getItem("accessToken");
      const nextUrl = `${process.env.VUE_APP_API_BASE_URL}/api/groups/groups/${nextPage}`;
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
        this.fetchMoims(this.currentPage + 1);
      }
    },

    prevPage() {
      if (this.currentPage > 1) {
        this.fetchMoims(this.currentPage - 1);
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

    getStatus(moim) {
      if (moim.groupType == "GROUP_CANCEL") {
        return (moim.isConfirmed = "취소");
      } else {
        // 호스트인 모임일때
        if (moim.hostEmail === this.userEmail) {
          return moim.groupType === "GROUP_CONFIRM" ? "확정" : "대기";
        } else {
          // 호스트가 아닌 모임일때
          const guest = moim.guestEmailNicknameIsAgreed.find(
              (g) => g[0] === this.userEmail
          );
          if (moim.groupType != "GROUP_CONFIRM") {
            if (guest && guest[2] === "P") {
              return "new";
            } else {
              return "대기";
            }
          } else {
            return "확정";
          }
        }
      }
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
    async vote(agreeYn) {
      const token = localStorage.getItem("accessToken");
      const headers = {Authorization: `Bearer ${token}`};
      if (!this.selectedMoim || !this.selectedMoim.id) {
        console.error("모임 정보가 선택되지 않았거나 필요한 정보가 누락되었습니다.");
        return;
      }
      const groupId = this.selectedMoim.id;

      const guest = this.selectedMoim.guestEmailNicknameIsAgreed.find(
          (g) => g[0] === this.userEmail
      );
      if (!guest) {
        console.error("사용자의 참가 정보를 찾을 수 없습니다.");
        return;
      }
      const groupInfoId = guest[3];
      try {
        const response = await axiosInstance.post(
            `${process.env.VUE_APP_API_BASE_URL}/api/groups/${groupId}/groupInfo/${groupInfoId}/notification?agreeYn=${agreeYn}`,
            {headers}
        );

        this.dialog = false;
        if (response.data.data.isAgree == "Y") {
          Swal.fire({
            title: "참여 완료되었습니다.",
            text: '일정이 확정되면 알려드릴게요.',
            icon: "success",
            showConfirmButton: true,
            confirmButtonColor: '#3085d6',
            confirmButtonText: '확인',
          }).then((result) => {
            if(result.isConfirmed) {
              window.location.reload();
            }
          })
        }
        if (response.data.data.isAgree == "N") {
          Swal.fire({
            title: "참여 거부하였습니다.",
            icon: "error",
            showConfirmButton: true,
            confirmButtonColor: '#3085d6',
            confirmButtonText: '확인',
          }).then((result) => {
            if(result.isConfirmed) {
              window.location.reload();
            }
          })
        }
        // location.reload();
      } catch (e) {
        alert(e);
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
        const response = await axiosInstance.get(
            `${process.env.VUE_APP_API_BASE_URL}/api/groups/${groupId}/choice`,
            {headers}
        );
        const availableDays = response.data.data;
        this.sortedAvailableDays = availableDays.slice(0, 3);
        console.log("추천 일정 리스트", availableDays);
        // availableDay 값으로 오름차순 정렬
        this.sortedAvailableDays = availableDays.sort(
            (a, b) => new Date(a.availableDay) - new Date(b.availableDay)
        );
        this.options = this.sortedAvailableDays.map((item, index) => ({
          value: index,
          label: new Intl.DateTimeFormat("ko-KR", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "numeric",
            minute: "2-digit",
            hour12: true, // 12시간제 사용
          }).format(new Date(item.availableDay)),
        }));
        if (this.options.length > 0) {
          this.selectedOption = this.options[0].value;
        }
        console.log(this.options);
      } catch (error) {
        console.log(error);
      }
    },
    //모임 확정

    async confirm(selectedOption) {
      const token = localStorage.getItem("accessToken");
      const headers = {Authorization: `Bearer ${token}`};
      const groupId = this.selectedMoim.id;
      try {
        this.confirmEvent = this.sortedAvailableDays[selectedOption].availableDay;
        console.log("확정일", this.confirmEvent);
        const response = await axiosInstance.post(
            `${process.env.VUE_APP_API_BASE_URL}/api/groups/${groupId}/confirm?confirmDay=${this.confirmEvent}`,
            {headers}
        );
        console.log("확정 모임", response.data);
        // this.dialog = false;
        Swal.fire({
          title: "모임이 확정되었습니다.",
          text: "일정에 등록해보세요!",
          icon: "success",
          showConfirmButton: true,
          confirmButtonColor: "#3085d6",
          confirmButtonText: "확인",
        }).then((result) => {
          if (result.isConfirmed) {
            console.log("이벤트변경시작", response.data.data);
            this.$refs.eventDialog.changeDialog(response.data.data);
          }
        });
      } catch (e) {
        alert(e);
      }
    },
    addEvent(GroupInfo) {
      console.log("그룹 정보", GroupInfo);
      this.$refs.eventDialog.changeDialog2(GroupInfo);
      this.dialog = false;
    },

    confirmedDate(moim) {
      const startDate = new Date(moim.confirmedDateTime);
      const endDate = new Date(startDate.getTime() + moim.runningTime * 60000); // 60000ms = 1분

      const formatDateTime = (date) => {
        const y = date.getFullYear();
        const m = (date.getMonth() + 1).toString().padStart(2, "0");
        const d = date.getDate().toString().padStart(2, "0");
        const hour = date.getHours();
        const minute = date.getMinutes();

        const hour12 = hour % 12 || 12; // 12시간제로 변환
        const ampm = hour < 12 ? "오전" : "오후";

        return `${y}-${m}-${d} ${ampm} ${hour12}:${minute.toString().padStart(2, "0")}`;
      };

      return `${formatDateTime(startDate)} ~ ${formatDateTime(endDate)}`;
    },
  },
};
</script>

<style>
.nonMoim {
  display: flex;
  justify-content: center; /* 가로 중앙 정렬 */
  height: 100vh;
}

.no-moim-icon {
  font-size: 100px;
  background: linear-gradient(
      90deg,
      #00d06a,
      #06c7ba
  );
  background-size: 100%;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.no-moim-btn {
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

.circle-button {
  border-radius: 50%;
  min-width: 50px;
  min-height: 50px;
  width: 50px;
  height: 50px;
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.25);
  background-color: #fbdfab;
  color: #162a2c;
  margin-right: 20px;
  margin-left: 10px;
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

.selected-moim-card {
  background-color: #cdd0cb; /* 선택되면 바뀌는 색 */
}

.cancelled-moim-card-button {
  background-color: #eca4a4;
}

.confirm-moim-card-button {
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
  display: flex;
}

.moim-detail {
  background-color: rgba(172, 198, 255, 1);
}

.vote-button {
  margin-right: 2%;
}

.fab-fixed {
  color: white !important;
  position: fixed; /* 고정 위치 */
  left: 15vw;
  bottom: 2vh;
  z-index: 100; /* 다른 요소 위에 표시 */
  background-color: #00d06a;
}
</style>
``
