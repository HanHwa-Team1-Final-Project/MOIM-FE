<template>
  <v-dialog v-model="isDialogOpen" max-width="600">
    <v-card class="pa-4">
      <v-card-title>
        <i class="fa-solid fa-user"></i>
        마이 페이지
      </v-card-title>
      <v-card-text>
        <v-row align="center" justify="center">
          <v-col cols="12" class="text-center">
            <img
              :src="profileImage"
              style="width: 150px; height: 150px; border-radius: 75px"
            />
            <input v-if="isEditing" type="file" @change="handleFileUpload" />
          </v-col>

          <v-col cols="12" md="2"><h4>닉네임</h4></v-col>
          <v-col cols="12" md="10">
            
            <input type="text" :value="nickname" readonly />
          </v-col>

          <v-col cols="12" md="2"><h4>이메일</h4></v-col>
          <v-col cols="12" md="10">
            <input type="text" :value="email" readonly />
          </v-col>
        </v-row>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="blue darken-1" @click="closeDialog">닫기</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import axiosInstance from "@/axios";

export default {
  data() {
    return {
      isDialogOpen: true,
      profileImage: "",
      editableProfileImage: null,
      nickname: "",
      editableNickname: "",
      email: "",
      isEditing: false,
      updateUserData: "",
    };
  },
  mounted() {
    this.getUserData();
  },

  methods: {
    openDialog() {
      this.isDialogOpen = true;
    },
    closeDialog() {
      this.isDialogOpen = false;
      // isDialogOpen = computed(() => mainStore.isDialogOpen);
    },
    // startEdit() {
    //   this.editableNickname = this.nickname;
    //   this.isEditing = true;
    // },
    // submitEdit() {
    //   this.nickname = this.editableNickname;
    //   this.profileImage = this.editableProfileImage || this.profileImage;
    //   this.editProfile();
    //   this.isEditing = false;
    // },

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
          this.email = response.data.data.email;
          this.nickname = response.data.data.nickname;
          this.profileImage = response.data.data.profileImage;
        } else {
          console.error("Failed to fetch user data");
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    },
    // handleFileUpload(event) {
    //   const file = event.target.files[0];
    //   this.editableProfileImage = URL.createObjectURL(file);
    // },
    // async editProfile() {
    //   const updateUserData = new FormData();
    //   updateUserData.append("nickname", this.editableNickname);
    //   if (this.editableProfileImage) {
    //     updateUserData.append("profileImage", this.editableProfileImage);
    //   }
    //   console.log("수정된 nickname", this.editableNickname);
      
    //   console.log("수정된 파일", this.editableProfileImage);

    //   const authToken = localStorage.getItem("accessToken");
    //   const url = `${process.env.VUE_APP_API_BASE_URL}/api/members/update`;
    //   if (!authToken) {
    //     console.error("인증 토큰이 없습니다.");
    //     return;
    //   }

    //   try {
    //     await axiosInstance.patch(url, updateUserData, {
    //       headers: {
    //         Authorization: `Bearer ${authToken}`,
    //         "Content-Type": "multipart/form-data",
    //       },
    //     });
    //     console.log("프로필 수정 완료");
    //     window.alert(this.nickname + " 프로필이 수정되었습니다.");
    //     window.location.reload();
    //   } catch (error) {
    //     console.error("Error fetching user data:", error);
    //   }
    // },
  },
};
</script>
