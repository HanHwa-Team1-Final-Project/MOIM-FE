import {createRouter, createWebHistory} from "vue-router";
import MainPage from "@/components/MainPage.vue";
import Register from "@/views/RegisterView.vue";
import Login from "@/views/LoginView.vue";
import Oauth2Redirect from "@/components/Oauth2Redirect.vue";
import EventDialog from "@/pages/event/EventDialog.vue";
import EisenhowerMatrix from "@/pages/eisenhower/EisenhowerMatrix.vue";
import fullCalendarComponent from "@/views/FullCalendarComponent.vue";
import SearchResults from "@/pages/search/SearchResults.vue";
import EventDetailDialog from "@/pages/event/EventDetailDialog.vue";
import UpdateEvent from "@/components/UpdateEvent.vue";
import MoimList from "@/pages/moim/MoimList.vue"
import ChattingList from "@/pages/chat/ChattingList.vue";
import ChatPage from "@/pages/chat/ChatPage.vue";
import RoomCreateDialog from "@/pages/chat/RoomCreateDialog.vue";

const routes = [
    {
        path: "/login",
        name: "login",
        component: Login,
        beforeEnter: (to, from, next) => {
            const accessToken = localStorage.getItem('accessToken');
            if (accessToken) {
                next('/main'); // accessToken이 있으면 /main으로 redirect
            } else {
                next(); // accessToken이 없으면 로그인 페이지로 진입
            }
        }
    },
    {
        path: "/register",
        name: "register",
        component: Register
    },
    {
        path: "/oauth2/redirect",
        component: Oauth2Redirect,
    },
    {
        path: "/",
        redirect: '/main',
        beforeEnter: (to, from, next) => {
            const accessToken = localStorage.getItem('accessToken');
            if (!accessToken) {
                next('/login'); // accessToken이 없으면 /login으로 리다이렉트
            } else {
                next(); // accessToken이 있다면 리다이렉트 없이 현재 경로를 유지
            }
        },
        component: MainPage,
        children: [
            {
                path: "main",
                name: "MainPage",
                component: fullCalendarComponent
            },
            {
                path: "event",
                name: "EventDialog",
                component: EventDialog
            },
            {
                path: "EisenhowerMatrix",
                name: "EisenhowerMatrix",
                component: EisenhowerMatrix
            },
            {
                path: "search",
                name: "Search",
                component: SearchResults,
            },
            {
                path: "fullCalendarComponent",
                name: "fullCalendarComponent",
                component: fullCalendarComponent
            },
            {
                path: "eventDetail",
                name: "eventDetail",
                component: EventDetailDialog
            },
            {
                path: "updateEvent",
                name: "updateEvent",
                component: UpdateEvent
            },

            {
                path: "MoimList",
                name: "MoimList",
                component: MoimList
            },

            {
                path: "chat",
                name: "chat",
                component: ChatPage
            },
            {
                path: "roomCreate",
                name: "roomCreateDialog",
                component: RoomCreateDialog
            },
            {
                path: "ChattingList",
                name: "ChattingList",
                component: ChattingList
            },
        ]
    },
];

const router = createRouter({
    history: createWebHistory(),
    routes,
});

export default router;
