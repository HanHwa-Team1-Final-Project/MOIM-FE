<template>
  <v-container>
    <!-- 화면을 가득 채우기 위해 fluid 속성 사용 -->
    <v-row justify="center" align="center" style="height: 100vh;">
      <!-- 왼쪽 컬럼 -->
      <v-col cols="12" sm="8" md="4">
        <v-card class="elevation-12">
          <v-toolbar class="custom-toolbar">
            <v-toolbar-title>로그인</v-toolbar-title>
          </v-toolbar>
          <v-card-text>
            <v-form v-model="form" @submit.prevent="onSubmit">
              <v-card-title>이메일</v-card-title>
              <v-text-field
                  name="email"
                  placeholder="이메일을 입력하세요."
                  type="email"
                  clearable
                  v-model="email"
                  :readonly="loading"
                  :rules="[rules.required, rules.email]"
                  variant="outlined"
                  class="padded-form"
              />
              <v-card-title>비밀번호</v-card-title>
              <v-text-field
                  name="password"
                  placeholder="비밀번호를 입력하세요."
                  clearable
                  v-model="password"
                  :append-inner-icon="visible ? 'mdi-eye-off' : 'mdi-eye'"
                  :type="visible ? 'text' : 'password'"
                  :readonly="loading"
                  :rules="[rules.required]"
                  @click:append-inner="visible = !visible"
                  variant="outlined"
                  class="padded-form"
              />
              <v-btn
                  :disabled="!form"
                  :loading="loading"
                  color="#000000"
                  size="large"
                  type="submit"
                  variant="elevated"
                  block
              >
                로그인
              </v-btn>
            </v-form>
          </v-card-text>
          <v-form v-model="form" @submit.prevent="onSubmit">

            <v-btn
                :disabled="!form"
                :loading="loading"
                color="#000000"
                size="large"
                type="submit"
                variant="elevated"
                block
            >
              로그인
            </v-btn>
            <v-btn color="blue" class="mt-3">
              <router-link to="register">회원가입</router-link>
            </v-btn>
            <v-btn color="red" class="mt-2" block @click="googleLogin">
              구글 로그인
            </v-btn>
            <v-btn
                color="yellow darken-1"
                class="mt-2"
                block
                @click="kakaoLogin"
            >
              카카오 로그인
            </v-btn>
          </v-form>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import axiosInstance from "@/axios";

export default {
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
          this.$router.push({ name: "MainPage" });
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
  padding: 16px;
}

.padded-form {
  padding-left: 16px;
  padding-right: 16px;
}

.login-form {
  border: 1px solid #000; /* 로그인 폼 테두리 추가 */
  max-width: 400px; /* 적절한 최대 너비 설정 */
}

.left-panel {
  background-color: #ffffff;
}
</style>
