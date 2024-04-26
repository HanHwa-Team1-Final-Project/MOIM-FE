<template>
  <v-container>
    <v-row justify="center" align="center" style="height: 100vh;">
      <v-col cols="12" sm="8" md="4">
        <v-card class="elevation-12">
          <v-toolbar color="primary" dark flat>
            <v-toolbar-title>로그인</v-toolbar-title>
          </v-toolbar>
          <v-card-text>
            <v-form>
              <v-text-field prepend-icon="mdi-email" name="email" label="이메일을 입력하세요." type="email" required></v-text-field>
              <v-text-field prepend-icon="mdi-lock" name="password" label="비밀번호" type="password" required></v-text-field>
            </v-form>
          </v-card-text>
          <v-card-actions>
            <v-btn color="primary" text>로그인</v-btn>
            <v-btn text>회원가입</v-btn>
            <v-spacer></v-spacer>
            <v-btn icon color="red"><v-icon>mdi-google</v-icon></v-btn>
            <v-btn icon color="yellow"><v-icon>mdi-email</v-icon></v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
export default {
  name: 'LoginView',
};
</script>

<style>
/* 기존 스타일링에 추가 */
html, body {
  height: 100%;
  margin: 0;
}

#app {
  height: 100%;
  overflow: hidden; /* 스크롤바를 숨깁니다 */
}

/* Vuetify 컴포넌트의 높이가 전체 화면을 채우도록 조정 */
.v-application--wrap {
  min-height: 100vh;
}

/* 로그인 폼의 최소 크기 설정 */
.login-form {
  min-width: 300px; /* 로그인 폼의 최소 너비 */
  min-height: 400px; /* 로그인 폼의 최소 높이 */
}

/* 화면 크기가 로그인 폼의 최소 크기보다 작아지는 것을 방지하는 미디어 쿼리 */
@media (max-width: 300px), (max-height: 400px) {
  body {
    overflow: auto; /* 화면 크기가 너무 작을 경우 스크롤바를 다시 활성화 */
  }
  .v-application--wrap {
    min-height: auto;
  }
}
</style>
