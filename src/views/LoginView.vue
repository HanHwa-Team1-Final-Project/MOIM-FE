<template>
  <v-container>
    <!-- 화면을 가득 채우기 위해 fluid 속성 사용 -->
    <v-row justify="center" align="center" style="height: 100vh;">
      <!-- 왼쪽 컬럼 -->
      <v-col cols="12" sm="8" md="7" lg="5" xl="3">
        <v-card class="elevation-5 pt-5 rounded-card">
          <v-toolbar class="custom-toolbar justify-center">
            <v-row>
              <v-col class="d-flex justify-center">
                <div class="text-block">
                  <div class="title-padding-toolbar">모임? MOIM!</div>
                  <div class="catchphrase">효율적인 일정 관리의 시작</div>
                </div>
              </v-col>
            </v-row>
          </v-toolbar>
          <v-card-text>
            <v-form v-model="form" class="padded-form" @submit.prevent="onSubmit">
              <v-card-title class="title-padding-title">이메일</v-card-title>
              <v-text-field
                  name="email"
                  placeholder="이메일을 입력하세요."
                  type="email"
                  color="#0aca08"
                  clearable
                  v-model="email"
                  :readonly="loading"
                  :rules="[rules.required, rules.email]"
                  variant="underlined"
                  density="comfortable"
              />
              <v-card-title class="title-padding-title">비밀번호</v-card-title>
              <v-text-field
                  name="password"
                  placeholder="비밀번호를 입력하세요."
                  color="#0aca08"
                  clearable
                  v-model="password"
                  :append-inner-icon="visible ? 'mdi-eye-off' : 'mdi-eye'"
                  :type="visible ? 'text' : 'password'"
                  :readonly="loading"
                  :rules="[rules.required]"
                  @click:append-inner="visible = !visible"
                  variant="underlined"
                  density="comfortable"
              />
              <v-btn
                  :disabled="!form"
                  :loading="loading"
                  color="#0f2a14"
                  size="large"
                  type="submit"
                  variant="elevated"
                  block
                  class="my-6 login-btn"
              >
                로그인
              </v-btn>
              <v-divider></v-divider>
              <v-btn
                  class="register-button my-6"
                  block
                  variant="outlined"
                  size="large"
                  color="#0aca08"
                  @click="$router.push({name:'register'})"
              >
                회원가입
              </v-btn>
              <v-btn
                  class="register-button my-6 google-login-button"
                  block
                  variant="outlined"
                  color="#0aca08"
                  size="large"
                  @click="googleLogin"
              >
                <div class="google-container">
                  <GoogleLogo class="google-logo"/>
                  <span class="google-text">구글 계정으로 계속하기</span>
                </div>
              </v-btn>
            </v-form>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import axiosInstance from "@/axios";
import GoogleLogo from "@/components/GoogleLogo.vue";

export default {
  components: {GoogleLogo},
  data() {
    return {
      form: false,
      email: "",
      password: "",
      loading: false,
      visible: false,
      rules: {
        required: (value) => !!value || "값을 입력해주세요",
        email: (value) => {
          const pattern =
              /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
          return pattern.test(value) || "이메일 형식이 맞지 않습니다.";
        },
      },
    };
  },
  methods: {
    onSubmit() {
      if (!this.form) {
        return;
      }
      this.loading = true;
      setTimeout(() => (this.loading = false), 2000);
      this.doLogin();
    },
    async doLogin() {
      const loginData = {
        email: this.email,
        password: this.password,
      };
      console.log(loginData);
      try {
        const response = await axiosInstance.post(
            `${process.env.VUE_APP_API_BASE_URL}/login`,
            loginData
        );
        console.log(response);
        const accessToken = response.data.Authorization;
        const refreshToken = response.data.Authorization_Refresh;
        if (accessToken && refreshToken) {
          localStorage.setItem("accessToken", accessToken);
          localStorage.setItem("refreshToken", refreshToken);
          this.$router.push({name: "MainPage"});
        } else {
          console.log("200 OK But Not Token");
          alert("로그인 실패");
        }
      } catch (error) {
        console.error(error);
        alert(error.response.data);
      }
    },
    googleLogin() {
      window.location.href = `${process.env.VUE_APP_API_BASE_URL}/oauth2/authorization/google?redirect_uri=http://localhost:8081/oauth2/redirect`;
    },
  },
};
</script>

<style>
.custom-toolbar {
  padding: 24px;
  line-height: 1.2;
  min-height: auto;
  background-color: #ffffff; /* 흰색 */
}

.custom-toolbar .v-toolbar__content {
  overflow: visible !important;
}

.padded-form {
  padding-left: 16px;
  padding-right: 16px;
}

.title-padding-toolbar {
  line-height: 1.2;
  font-weight: 900 !important;
  font-size: 40px; /* 글자 크기 수정 */
  background: linear-gradient(90deg, #0aca08, #06c7ba); /* 그라데이션 배경 적용 */
  background-size: 100%; /* 그라데이션 정도*/
  -webkit-background-clip: text; /* 그라데이션을 텍스트에 적용 */
  -webkit-text-fill-color: transparent; /* 원래의 텍스트 색상을 투명하게 하여 그라데이션을 보여줌 */
}

.title-padding-title {
  padding-left: 0;
  font-weight: 500 !important;
  color: #2b783b;
}

.register-button {
  color: #2b783b !important; /* 내부 텍스트 색상 */
  border-color: #e0e0e0 !important; /* 외곽선 색상 */
}

.google-login-button {
  /* 버튼 내부 아이템을 수직으로 중앙 정렬 */
  display: flex;
  align-items: center;
}

.google-container {
  display: flex;     /* flex 레이아웃 적용 */
  align-items: center;   /* 아이템들을 수직 중앙에 배치 */
}

.google-logo {
  margin-right: 10px;  /* 우측 여백 추가 */
}

.rounded-card {
  border-radius: 15px;
}

.text-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.catchphrase {
  line-height: 1.2;
  text-align: center;       /* 가운데 정렬 */
  font-size: 18px;          /* 폰트 크기 변경 */
  color: #666;              /* 텍스트 색상 변경 */
  margin-top: 10px;         /* "모임? MOIM!" 텍스트와의 간격 설정 */
  padding-bottom: 10px; /* 이 부분을 추가해보세요. */
}

.login-btn {
  background: linear-gradient(90deg, #0aca08, #06c7ba) !important;
}

.v-application__wrap {
  /* 불필요한 하단 여백 삭제 */
  min-height: 0;
}

body {
  overflow-y: auto;
}
</style>
