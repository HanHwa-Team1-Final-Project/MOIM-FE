<template>
  <v-app class="rounded rounded-md">
    <AppHeader></AppHeader>
    <AppSideBar></AppSideBar>
    <v-main class="test-background-area">
      <router-view/>
    </v-main>
  </v-app>
</template>
<script setup>
import AppSideBar from "@/components/layout/AppSideBar.vue";
import AppHeader from "@/components/layout/AppHeader.vue";
</script>
<style scoped>
.test-background-area {
  background-color: white;
  margin-top: 15%;
}
</style>
