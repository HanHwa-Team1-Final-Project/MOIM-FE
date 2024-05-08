<template>
  <v-dialog v-model="isDialogOpen" max-width="600" :persistent="false" @click:outside="closeDialog">
    <v-card class="pa-4">
      <v-card-title>
        <v-icon class="mr-2" style="transform: scaleX(-1)">mdi-chat-plus-outline</v-icon>
        채팅방 생성
      </v-card-title>
      <v-card-text>
        <v-row dense>
          <!-- 제목 -->
          <v-col cols="12" sm="2"><h4>제목</h4></v-col>
          <v-col cols="12" sm="10">
            <v-text-field
                maxlength="50"
                variant="underlined"
                placeholder="제목을 입력하세요"
                :rules="[rules.required, rules.roomTitle]"
                required
                v-model="title"
            >
            </v-text-field>
          </v-col>

          <!-- 참여자 추가 (Auto-complete) -->
          <v-col cols="12" sm="2"><h4>참여자</h4></v-col>
          <v-col cols="12" sm="10">
            <v-autocomplete
                v-model="friends"
                :items="people"
                color="blue-grey-lighten-2"
                item-text="email"
                item-value="email"
                label="참여자를 추가하세요"
                chips
                dense
                multiple
                closable-chips
                autocomplete="on"
                :rules="[rules.required, rules.participants]">

              <!-- 참여자 추가하세요 뜨는 부분 -->
              <template v-slot:chip="{ props, item }">
                <v-chip
                    v-bind="props"
                    :prepend-avatar="item.raw.profileImage"
                    :text="item.raw.nickname"
                ></v-chip>
              </template>

              <!-- 눌렀을때 뜨는 부분 -->
              <template v-slot:item="{ props, item }">
                <v-list-item
                    v-bind="props"
                    :prepend-avatar="item.raw.profileImage"
                    :title="item.raw.nickname"
                    :subtitle="item.raw.email"
                ></v-list-item>
              </template>

              <template v-slot:selection="{ item, index }">
                <v-chip :key="index" closable @click:close="removeFriend(item.id)">
                  {{ item.nickname }} ({{ item.email }})
                </v-chip>
              </template>
            </v-autocomplete>
          </v-col>

          <!-- 메모 -->
          <v-col cols="12" sm="2"><h4>메모</h4></v-col>
          <v-col cols="12" md="10">
            <v-text-field
                variant="underlined"
                placeholder="메모를 입력하세요."
                maxlength="100"
                :rules="[rules.memo]"
                v-model="contents">
            </v-text-field>
          </v-col>

          <v-col cols="12" md="3"><h4>채팅 종료일</h4></v-col>
          <v-col cols="12" md="9">
            <input
                type="datetime-local"
                v-model="deadline"
                :rules="[rules.required]"
                required
            />
          </v-col>
        </v-row>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="blue darken-1" @click="createRoom">생성</v-btn>
        <v-btn color="blue darken-1" @click="closeDialog">취소</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import axiosInstance from "@/axios";
import Swal from 'sweetalert2'

export default {
  data() {
    return {
      isDialogOpen: false,
      title: "",
      friends: [],
      people: [],
      deadline: "",
      contents: "",
      rules: {
        required: (value) => !!value || '값을 입력해주세요',
        roomTitle: (value) => {
          if (value.length > 50) {
            return '제목은 50자를 넘을 수 없습니다.';
          }
        },
        memo: (value) => {
          if (value.length > 100) {
            return '메모는 100자까지만 입력할 수 있습니다.';
          }
        },
        participants: (value) => !!value.length || '최소 한 명의 참가자가 있어야 모임이 생성됩니다.',
      }
    };
  },
  mounted() {
    this.fetchPeople();
  },

  methods: {
    openDialog() {
      this.isDialogOpen = true;
      this.fetchPeople();
    },

    closeDialog() {
      this.isDialogOpen = false;
      this.title = "";
      this.friends = [];
      this.people = [];
      this.deadline = "";
      this.contents = "";
    },

    async fetchPeople() {
      const authToken = localStorage.getItem("accessToken");
      const url = `${process.env.VUE_APP_API_BASE_URL}/api/members/search`;
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

        if (response.data.success && Array.isArray(response.data.data)) {
          this.people = response.data.data.map((user) => ({
            id: user.id,
            name: user.nickname,
            profileImage:
                user.profileImage ||
                "https://moim-bucket.s3.ap-northeast-2.amazonaws.com/members/default_profile.png",
            nickname: user.nickname,
            email: user.email,
          }));

        } else {
          console.error("사람들을 불러오는데 실패했습니다: API 에러 반환", response.data);
          this.people = [];
        }
      } catch (error) {
        console.error("사람들을 불러오는데 실패했습니다:", error);
        this.people = [];
      }
    },

    removeFriend(id) {
      this.friends = this.friends.filter((p) => p.id !== id);
    },
    async createRoom() {
      if (!this.title) {
        alert("제목을 입력하세요.");
        return;
      }

      if (!this.deadline) {
        alert("채팅 종료일을 입력하세요.");
        return;
      }

      if (new Date() > new Date(this.deadline)) {
        alert("종료일을 확인해주세요.");
        console.log(new Date())
        return;
      }

      const formData = new FormData();
      formData.append('title', this.title);
      console.log("T가 있냐 없냐", this.deadline)
      formData.append('deleteDate', this.deadline);
      formData.append('memo', this.contents);

      // memberRoomRequests 조립
      const roomMembers = this.friends.map((friend) => ({memberEmail: friend}));
      console.log("roommembers", roomMembers)
      const memberBlob = new Blob([JSON.stringify(roomMembers)], {
        type: "application/json",
      });
      console.log("??", this.friends[0])
      console.log("추가된 참가자", roomMembers);

      formData.append("memberRoomRequests", memberBlob);

      // const TOKEN = localStorage.getItem("accessToken");
      const authToken = localStorage.getItem("accessToken");
      const url = `${process.env.VUE_APP_API_BASE_URL}/api/room/create`;

      if (!authToken) {
        console.error("인증 토큰이 없습니다.");
        return;
      }

      try {
        await axiosInstance.post(url, formData, {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "multipart/form-data",
          },
        });
        console.log("채팅 생성완료");
        this.closeDialog();

        Swal.fire({
          title: '채팅방이 생성되었습니다.',
          text: '채팅에 참여해주세요.',
          icon: 'success',
          showConfirmButton: true,
          confirmButtonColor: '#3085d6',
          confirmButtonText: '확인',
        }).then((result) => {
          if (result.isConfirmed) {
            window.location.reload();
          }
        })


      } catch (error) {
        console.log(error);
      }
    },
  },
};
</script>
