<template>
  <div class='demo-app'>
    <div class='demo-app-main'>
      <v-sheet>
        <FullCalendar ref="fullCalendar" class='demo-app-calendar' :options='calendarOptions'>
        </FullCalendar>
      </v-sheet>
    </div>
  </div>
  <EventDetailDialog ref="EventDetail"></EventDetailDialog>
  <EventDialog ref="EventCreate"></EventDialog>

</template>

<script>
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import EventDetailDialog from '../pages/event/EventDetailDialog.vue'
import EventDialog from '../pages/event/EventDialog.vue'
import axiosInstance from "@/axios";

export default {
  components: {
    FullCalendar, // make the <FullCalendar> tag available
    EventDetailDialog,
    EventDialog
  },
  data() {
    return {
      events: [],
      holidayEvents: [],
      calendarOptions: {
        plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
        headerToolbar: {
          left: 'prev next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay'
        },
        initialView: 'dayGridMonth',
        selectable: true,
        select: this.handleDateSelect,
        eventClick: this.handleEventClick,
        events: this.events,
        datesSet: this.handleDatesSet
      },
    }
  },
  methods: {
    // 일정 누르면 상세보기로 바꾸기
    handleEventClick(clickInfo) {
      console.log("clickInfo", clickInfo)
      this.$refs.EventDetail.openDialog(clickInfo.event.id)
    },
    // 날짜 누르면 이벤트 등록하게 바꾸기
    handleDateSelect(selectInfo) {
      this.$refs.EventCreate.selectOpenDialog(selectInfo);
    },
    async fetchEvents({startStr}) {
      // 날짜 정보에서 연도와 월 추출
      const startDate = new Date(startStr);
      console.log("시작일자", startDate)
      const selectDate = new Date(startDate.setDate(startDate.getDate() + 7));
      console.log("중간이라고 생각함", selectDate)
      const year = startDate.getFullYear();
      const month = startDate.getMonth() + 1;
      console.log(year, 'fetchevent year ', month, "fetchevent month ")
      try {
        const token = localStorage.getItem("accessToken");
        const headers = {Authorization: `Bearer ${token}`};
        console.log(token)
        if (token == null) {
          this.$router.push({name: "Login"});
          return;
        }

        // 월간 일정
        const response = await axiosInstance.get(`${process.env.VUE_APP_API_BASE_URL}/api/events/monthly/${year}/${month}`, {headers});
        const getEvents = response.data.data;
        console.log("월간 일정: ", getEvents);
        const events = [];
        getEvents.forEach(event => {
          const color = event.matrix === 'Q2' ? '#FF7A85' :
                  event.matrix === 'Q1' ? '#FFEB5A' :
                  event.matrix === 'Q3' ? '#5BFFB0' : '#1EDDFF'; // 'defaultColor'는 event.matrix가 q1, q2, q3 중 어느 것에도 해당하지 않을 때 사용할 색상입니다.

            events.push({
              title: event.title,
              id: event.id,
              color: color,
              start: new Date(event.startDate),
              end: new Date(event.endDate),
              extendedProps: {
                sourceId: 'events'
              }
            });
        });

        this.events = events;

        // FullCalendar에 일정이 이미 로드되어 있는지 확인한다.
        const eventSources = this.$refs.fullCalendar.getApi().getEventSources();
        const exists = eventSources.some(es => es.extendedProps && es.extendedProps.sourceId === 'events');

        // If events don't exist then fetch events.
        if (!exists) {
          // fetch events code...
          // Add sourceId to events.
          // this.events.forEach(event => event.sourceId = 'events');
          this.$refs.fullCalendar.getApi().addEventSource(this.events);
          console.log('Event fetched and added');
        }

      } catch (error) {
        console.log(error);
      }
    },
    async fetchHolidayEvents({startStr}) {
      // 국경일 불러오기
      // 일정이 없을 때 404 에러가 발생하는데, catch문에서 잡히면서 국경일을 불러오지 못하기 때문에 분리함.
      const startDate = new Date(startStr);
      const selectDate = new Date(startDate.setDate(startDate.getDate() + 7));
      console.log("중간이라고 생각함", selectDate)
      const year = startDate.getFullYear();
      const month = startDate.getMonth() + 1;
      console.log("FetchHolidayEvent YEAR: ", year, ", FetchHolidayEvent MONTH: ", month);
      try {
        const TOKEN = localStorage.getItem("accessToken");
        if (TOKEN == null) {
          this.$router.push({name: "Login"});
          return;
        }

        const formData = new FormData();
        formData.append('year', year);
        formData.append('month', month);

        const holidayResponse = await axiosInstance.post(
            `${process.env.VUE_APP_API_BASE_URL}/api/events/getHoliday`, formData, {
              headers: {
                "Authorization": `Bearer ${TOKEN}`,
                "Content-Type": "multipart/form-data"
              }
            });
        console.log("1. 국경일 정보: ", holidayResponse.data);
        console.log("2. 국경일 이름: ", holidayResponse.data[0].dateName);
        console.log("3. 국경일 시작일: ", this.parseDateString(holidayResponse.data[0].locdate));
        console.log("4. holidayResponse.status: ", holidayResponse.status);

        if (holidayResponse.status === 200) {
          const holidays = holidayResponse.data;
          const holidayEvents = [];
          holidays.forEach(holiday =>
              holidayEvents.push({
                title: holiday.dateName,
                allDay: true, // 국경일은 종일 일정에 해당됨.
                start: this.parseDateString(holiday.locdate),
                end: this.parseDateString(holiday.locdate),
                textColor: '#555555',
                color: '#ffffff',
                // 국경일API response 중 fullCalendar event objects에 부합하지 않는 데이터는 extendedProps에 추가
                extendedProps: {
                  dateKind: holiday.dateKind,
                  isHoliday: holiday.isHoliday,
                  seq: holiday.seq,
                  sourceId: 'holidays',
                }
              }),
          );
          this.holidayEvents = holidayEvents;
        }

        // Check if holidayEvents already exists.
        const eventSources = this.$refs.fullCalendar.getApi().getEventSources();
        const exists = eventSources.some(es => es.extendedProps && es.extendedProps.sourceId === 'holidays');

        // If holidyEvents don't exist then fetch holidayEvents.
        if (!exists) {
          // fetch holidayEvents code...
          // Add sourceId to holidayEvents.
          // this.holidayEvents.forEach(event => event.sourceId = 'holidays');
          this.$refs.fullCalendar.getApi().addEventSource(this.holidayEvents);
          console.log('Holiday Events fetched and added');
        }
      } catch (error) {
        console.log("fetchHolidayEvents ERROR: ", error);
      }

    },
    async handleDatesSet({start, end, startStr, endStr}) {
      console.log(start, "handleDatesSet start ", end, " ", startStr, " ", endStr, " ")
      const calendarApi = this.$refs.fullCalendar.getApi();

      // 캘린더 상에 나타난 모든 일정 삭제
      calendarApi.removeAllEvents();

      await this.fetchEvents({startStr});
      await this.fetchHolidayEvents({startStr});
    },

    // 공공데이터 날짜 데이터 파싱
    parseDateString(date) {
      date = String(date);
      return date.slice(0, 4) + '-' + date.slice(4, 6) + '-' + date.slice(6, 8);
    }
  }
}
</script>

<style lang='css'>

.demo-app {
  display: flex;
  min-height: 100%;
  font-family: Arial, Helvetica Neue, Helvetica, sans-serif;
  font-size: 14px;
  justify-content: center; /* 가로 방향으로 중앙 정렬 */
  align-items: center; /* 세로 방향으로 중앙 정렬 */
  height: 80vh; /* 뷰포트의 전체 높이 */
  margin-top: -10%;
}

.demo-app-main {
  flex-grow: 0.7;
  padding: 3em;
}

.fc-button {
  background-color: transparent !important;
  border-color: transparent !important;
  color: #555555 !important;
  font-weight: bold !important;

}

.fc-button-active {
  background-color: #0aca08 !important;
  border-color: #0aca08 !important;
  color: #ffffff !important;
  font-weight: bold !important;
}


</style>
