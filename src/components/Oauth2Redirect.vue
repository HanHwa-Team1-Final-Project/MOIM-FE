<template>
  <div></div>
</template>

<script>
export default {
  created() {
    console.log("OAuth 리다이렉트 페이지 진입!");
    console.log(this.$route.query);
    const accessToken = this.$route.query.accessToken;
    const refreshToken = this.$route.query.refreshToken;
    if (accessToken && refreshToken) {
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken);
      this.$router.push({ name: "MainPage" });
    } else {
      window.alert("로그인에 실패하였습니다.");
    }
  },
};
</script>

<style lang="scss" scoped></style>
