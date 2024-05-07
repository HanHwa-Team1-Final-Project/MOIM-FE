<template>
  <v-container class="search-results">
    <v-row v-if="results.length > 0">
      <EventDetail ref="dialog"></EventDetail>
      <v-col cols="12" v-for="result in results" :key="result.id">
        <v-card
            class="mx-auto result-card"
            :title="result.title"
            :subtitle="formatDate(result.startDate)"
            max-width="800"
            @click="onResultClick(result)"
            link>
          <template v-slot:prepend>
            <span class="circle-day" :style="{ backgroundColor: getBackgroundColor(result.matrix) }">
              {{ getDay(result.startDate) }}
            </span>
          </template>
          <template v-slot:append >
            <v-list lines="one" class="result-card-a">
              <v-list-item
                  :title="'시작'"
                  :subtitle="formatDateAndTime(result.startDate)"
              />
              <v-list-item
                  :title="'종료'"
                  :subtitle="formatDateAndTime(result.endDate)"
              />
            </v-list>
          </template>
<!--          <v-text-field>{{result}}</v-text-field>-->
        </v-card>
      </v-col>
    </v-row>
    <v-row justify="center" class="none-result" v-else>
      <p>검색 결과가 없습니다.</p>
    </v-row>
  </v-container>
</template>

<script>
import {useSearchStore} from "@/stores/searchStore";
import {computed} from "vue";
import EventDetail from "@/pages/search/EventDetail.vue";
import {getDay, formatDate, formatDateAndTime} from "@/utils/date-utils";

export default {
  components: {
    EventDetail,
  },
  methods: {
    onResultClick(result) {
      this.$refs.dialog.openDialog(
          result.id,
          result.nickname,
          result.title,
          result.memo,
          result.startDate,
          result.endDate,
          result.place,
          result.matrix,
          result.fileUrl,
          result.deleteYn,
          result.repeatParent,
          result.alarmYn,
      );
    },
    getBackgroundColor(matrixValue) {
      switch(matrixValue) {
        case 'Q2':
          return '#FF5252'; // 빨간색
        case 'Q1':
          return '#FFCA28'; // 노란색
        case 'Q4':
          return '#29B6F6'; // 파란색
        case 'Q3':
          return '#66BB6A'; // 녹색
        default:
          return '#ffffff'; // 기본값은 흰색
      }
    },
  },
  setup() {
    const searchStore = useSearchStore();
    const results = computed(() => searchStore.results);

    return {
      results: results,
      getDay: getDay,
      formatDate: formatDate,
      formatDateAndTime: formatDateAndTime
    }
  }
}
</script>

<style>
.search-results .result-card {
  margin-top: 20px;
  transition: box-shadow 0.3s ease-in-out, transform 0.2s ease-in-out;
  cursor: pointer;
}

.none-result {
  font-size: 18px;
}

.circle-day {
  border-radius: 50%; /* 원형 버튼을 만들기 위한 CSS */
  min-width: 50px; /* 버튼의 최소 너비 */
  min-height: 50px; /* 버튼의 최소 높이 */
  width: 50px; /* 버튼의 너비를 고정값으로 설정 */
  height: 50px; /* 버튼의 높이를 고정값으로 설정 */
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #ffffff;
  color: #162A2C;
  margin-right: 20px;
  margin-left: 10px;
  font-weight: bold; 
  font-size: 16px; 
  border: 2px solid #162A2C;
}

.result-card {
  background-color: #ffffff;
}

.result-card-time .v-list-item-title,
.result-card-time .v-list-item-subtitle {
  font-size: 0.875rem;
}

</style>
