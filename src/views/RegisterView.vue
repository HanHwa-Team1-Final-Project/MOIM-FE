<template>
  <v-container fluid>
    <v-row justify="center" align="center" style="height: 100vh">
      <v-col cols="12" sm="8" md="7" lg="5" xl="3">
        <div class="left-panel">
          <!-- 회원가입 폼 -->
          <v-card class="elevation-5 pt-5 rounded-card" style="width: 30vw;">
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
              <v-form class="padded-form">
                <!-- 이메일 입력 칸 -->
                <v-text-field
                    placeholder="이메일"
                    maxlength="254"
                    prepend-inner-icon="mdi-email"
                    v-model="email"
                    color="#0aca08"
                    clearable
                    variant="underlined"
                    type="email"
                    :rules="[rules.required, rules.email]"
                    :disabled="emailCodeSent"
                    outlined
                    density="comfortable">
                  <template v-slot:append>
                    <!-- 중복 체크 버튼이 emailDuplicated가 true일 때만 표시되도록 함 -->
                    <v-btn text @click="checkEmail" v-if="emailDuplicated">중복 체크</v-btn>
                    <!-- 인증 코드 전송 버튼이 emailDuplicated가 false일 때만 표시되도록 함 -->
                    <v-btn text @click="sendEmailCode" v-else :disabled="emailCodeSent">인증 코드 전송</v-btn>
                  </template>
                </v-text-field>

                <span v-show="emailCodeSent" class="text-red-800 p-2 rounded-md mt-2" disabled>유효시간: {{ timer }}초</span>
                <!-- 인증코드 입력 칸 -->
                <v-text-field
                    placeholder="인증 코드 입력"
                    maxlength="6"
                    prepend-inner-icon="mdi-lock"
                    v-model="authCode"
                    color="#0aca08"
                    clearable
                    :rules="[rules.required]"
                    :disabled="emailCodeVerified"
                    variant="underlined"
                    density="comfortable"
                    outlined>
                  <template v-slot:append>
                    <!-- 여기에 인증 코드 검증 버튼 추가 -->
                    <v-btn text @click="verifyCode" :disabled="emailCodeVerified">인증 코드 검증</v-btn>
                  </template>

                </v-text-field>

                <!-- 닉네임 입력 칸 -->
                <v-text-field
                    placeholder="닉네임"
                    variant="underlined"
                    density="comfortable"
                    color="#0aca08"
                    clearable
                    prepend-inner-icon="mdi-account"
                    v-model="nickname"
                    :rules="[rules.required, rules.nickname]"
                    maxlength="15"
                    outlined
                >
                  <template v-slot:append>
                    <!-- 닉네임 중복 체크 버튼 -->
                    <v-btn text @click="checkNickname">중복 체크</v-btn>
                  </template>
                </v-text-field>

                <!-- 비밀번호 입력 칸 -->
                <v-text-field
                    placeholder="비밀번호"
                    color="#0aca08"
                    clearable
                    prepend-inner-icon="mdi-lock"
                    v-model="password"
                    variant="underlined"
                    density="comfortable"
                    :type="showPassword ? 'text' : 'password'"
                    :append-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
                    @click:append="showPassword = !showPassword"
                    :rules="[rules.required, rules.password]"
                    maxlength="60"
                    outlined
                ></v-text-field>

                <!-- 비밀번호 확인 입력 칸 -->
                <v-text-field placeholder="비밀번호 확인" prepend-inner-icon="mdi-lock" v-model="passwordConfirm"
                              color="#0aca08"
                              clearable
                              :type="showPasswordConfirm ? 'text' : 'password'"
                              :append-icon="showPasswordConfirm ? 'mdi-eye' : 'mdi-eye-off'"
                              @click:append="showPasswordConfirm = !showPasswordConfirm"
                              :rules="[rules.required, rules.passwordMatch]" variant="underlined"
                              density="comfortable" outlined></v-text-field>

                <v-file-input
                    placeholder="프로필 이미지 선택"
                    prepend-icon="mdi-camera"
                    variant="underlined"
                    density="comfortable"
                    @change="validateFileSize"
                    outlined
                ></v-file-input>
                <!-- 이미지 미리보기 -->
                <v-img
                    v-if="profileImage"
                    :src="imageUrl"
                    aspect-ratio="1"
                    class="mt-3"
                    style="max-width: 200px; max-height: 200px"
                ></v-img>

                <!-- 회원가입 버튼 -->
                <v-btn
                    class="my-6 login-btn"
                    block
                    variant="elevated"
                    color="#0f2a14"
                    size="large"
                    @click="register">회원가입
                </v-btn>
              </v-form>
            </v-card-text>
          </v-card>

        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import axiosInstance from "@/axios";

export default {
  data() {
    return {
      email: '',
      authCode: '',
      nickname: '',
      password: '',
      passwordConfirm: '',
      profileImage: '',
      showPassword: false,
      showPasswordConfirm: false,
      // 중복 체크 초기값을 true로 설정하여 인증 코드 요청 버튼이 처음에는 표시되지 않도록 함
      emailDuplicated: true,
      nicknameDuplicated: true,
      emailCodeSent: false,
      emailCodeVerified: false,

      fileTooLarge: true,
      timer: 180,
      rules: {
        required: value => !!value || '필수 입력 사항입니다.',
        email: (value) => {
          const pattern =
              /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
          if (!pattern.test(value)) {
            return '유효한 이메일 주소를 입력해주세요.';
          }
          if (value.length > 254) {
            return '이메일 주소는 254자를 초과할 수 없습니다.';
          }
          return true;
        },
        passwordMatch: () => this.password === this.passwordConfirm || '비밀번호가 일치하지 않습니다.',

        nickname: (value) => {
          const pattern = /^[a-zA-Z0-9ㄱ-ㅎ가-힣\-_]{3,15}$/;
          if (!pattern.test(value)) {
            return '닉네임은 공백 없이 영문 대소문자, 숫자, 하이픈(-), 언더스코어(_), 한글을 포함하여 3자 이상 15자 이하로 입력해야 합니다.';
          }
          return true;
        },
        password: (value) => {
          const pattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/;
          if (!pattern.test(value)) {
            return '비밀번호는 최소 8자 이상이어야 하며, 소문자, 대문자, 숫자, 그리고 특수 문자(!@#$%^&*) 중 하나를 각각 포함해야 합니다.';
          }
          if (value.length > 50) {
            return '마! 그만해라!';
          } else if (value.length > 40) {
            return '적당히 길게 하시죠?!';
          } else if (value.length > 30) {
            return '기억할 수 있겠어요...?';
          } else if (value.length > 20) {
            return '이 정도 길이면 충분할 것 같은데...';
          }
          return true;
        },
      }
    }
  },

  methods: {
    validateFileSize(event) {
      const files = event.target.files;
      if (!files.length) {
        // 파일이 선택되지 않았을 때의 로직
        this.profileImage = null;
        this.imageUrl = null;
        this.fileTooLarge = false;  // 파일이 없더라도 register 함수 내의 첫 if문을 통과하는데 문제가 없도록 처리
        return; // 함수를 여기서 종료시킴
      }

      const file = files[0];
      const maxFileSize = 3 * 1024 * 1024; // 3MB를 바이트로 변환

      if (file.size > maxFileSize) {
        alert('파일 크기는 최대 3MB까지입니다.');
      } else {
        this.fileTooLarge = false;
        this.previewImage(event); // 파일 사이즈가 적절하면 previewImage 실행
      }
    },

    previewImage(event) {
      this.profileImage = event.target.files[0];
      if (this.profileImage) {
        this.imageUrl = URL.createObjectURL(this.profileImage);
      } else {
        // 파일이 선택되지 않았을 경우
        this.imageUrl = null;
      }
    },

    async sendEmailCode() {
      // 이메일 인증 코드 요청 로직
      if (confirm("입력한 이메일로 인증 번호를 발송하시겠습니까?")) {
        alert("입력된 이메일로 인증 번호를 발송하였습니다.");
        await axiosInstance.post(
            `${process.env.VUE_APP_API_BASE_URL}/api/auth/send`, {},
            {
              params: {
                email: this.email,
              },
            }
        );
        this.emailCodeSent = true;
        this.startTimer();
      }
    },
    async verifyCode() {
      if (!this.authCode) {
        alert("인증 코드를 입력해주세요.");
        return;
      }
      try {
        const response = await axiosInstance.post(
            `${process.env.VUE_APP_API_BASE_URL}/api/auth/verify`, {},
            {
              params: {
                email: this.email,
                authCode: this.authCode,
              }
            }
        );

        if (response.status === 200) {
          this.emailCodeVerified = true;
          alert("인증 코드가 확인되었습니다.");
          clearInterval(this.intervalId);
        }
      } catch (error) {
        console.error(error);
        alert(error.response.data.error.message);
      }
    },
    startTimer() {
      this.isTimerStarted = true;
      this.intervalId = setInterval(() => {
        this.timer--;
        if (this.timer === 0) {
          clearInterval(this.intervalId);
          this.isTimerStarted = false;
          alert("유효 시간이 만료되었습니다. 다시 시도해주세요");
          window.location.reload();
        }
      }, 1000);
    },
    async checkEmail() {
      const isEmailRequired = this.rules.required(this.email);
      if (isEmailRequired !== true) {
        alert('이메일을 입력하세요.');
        return;
      }
      const isEmailValid = this.rules.email(this.email);
      if (isEmailValid !== true) { // email 규칙이 true를 반환하지 않는 경우, 에러 메시지(isEmailValid)를 표시
        alert(isEmailValid); // 유효한 이메일 주소를 입력해주세요.
        return;
      }

      // 이메일 중복 확인 로직
      try {
        const response = await axiosInstance.post(`${process.env.VUE_APP_API_BASE_URL}/api/auth/email-validate`, {},
            {
              params: {
                email: this.email,
              },
            });
        console.log(response);

        if (response.status === 200) {
          this.emailDuplicated = false;
          alert("사용 가능한 이메일입니다.");
        }
      } catch (error) {
        console.error(error);
        alert(error.response.data.error.message);
      }
    },
    async checkNickname() {
      // 닉네임 중복 확인 로직
      if (!this.nickname) {
        alert("닉네임을 입력해주세요.");
        return;
      }

      try {
        const response = await axiosInstance.post(`${process.env.VUE_APP_API_BASE_URL}/api/auth/nickname-validate`, {},
            {
              params: {
                nickname: this.nickname,
              },
            });
        console.log(response);

        if (response.status === 200) {
          this.nicknameDuplicated = false;
          alert("사용 가능한 닉네임입니다.");
        }
      } catch (error) {
        console.error(error);
        alert(error.response.data.error.message);
      }
    },
    async register() {
      // 회원가입 로직
      console.log("register 진입했음!")
      if (this.emailDuplicated ||
          this.nicknameDuplicated ||
          !this.emailCodeSent ||
          !this.emailCodeVerified ||
          (this.fileTooLarge && this.profileImage)) {
        alert("입력되지 않은 값이 있습니다.");
        return;
      }
      const isPasswordMatch = this.rules.passwordMatch();
      if (isPasswordMatch !== true) {
        alert('비밀번호가 일치하지 않습니다.');
        return;
      }

      const registerData = new FormData();
      registerData.append("email", this.email);
      registerData.append("password", this.password);
      registerData.append("nickname", this.nickname);
      if (this.profileImage) {
        registerData.append("profileImage", this.profileImage);
      }

      let headers = {
        'Content-Type': 'multipart/form-data'
      };

      try {
        const response = await axiosInstance.post(`${process.env.VUE_APP_API_BASE_URL}/api/auth/sign-up`, registerData, {headers});
        console.log(response);

        if (response.status === 200) {
          alert("회원가입이 완료되었습니다.");
          this.$router.push({name: 'login'});
        }
      } catch (error) {
        console.error(error);
        alert("회원가입에 실패했습니다. 입력한 정보를 다시 확인해주세요.");
      }
    }
  }
};
</script>

<style scoped>
.left-panel {
  height: 95vh;
  background-color: #FFFFFF;
}

.right-panel {
  /* 오른쪽 패널 스타일링 */
  background-color: #6F8A6B;
  height: 95vh;
  display: flex;
  justify-content: center;
  align-items: center;
}

.register-form {
  border: 1px solid #000; /* 로그인 폼 테두리 추가 */
  max-width: 70vh; /* 적절한 최대 너비 설정 */
}

.catchphrase {
  line-height: 1.2;
  text-align: center; /* 가운데 정렬 */
  font-size: 18px; /* 폰트 크기 변경 */
  color: #666; /* 텍스트 색상 변경 */
  margin-top: 10px; /* "모임? MOIM!" 텍스트와의 간격 설정 */
  padding-bottom: 10px; /* 이 부분을 추가해보세요. */
}

</style>
