
// store/notificationStore.js
import { defineStore } from 'pinia';
export const useNotificationStore = defineStore('notification', {
  state: () => ({
    newNotificationCount: 0,
  }),
  actions: {
    initializeCount(count) {
      this.newNotificationCount = count;
    },
    incrementCount() {
      this.newNotificationCount++;
    },
    decrementCount() {
      this.newNotificationCount = Math.max(0, this.newNotificationCount - 1);
    },
  },
});