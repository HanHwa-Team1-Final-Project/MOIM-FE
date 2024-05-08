import {defineStore} from "pinia";

export const useSearchStore = defineStore({
    // id: 'search',
    id: 'searchList',
    state: () => ({
        results: []
    }),
    actions: {
        setResults(results) {
            this.results = [];
            this.results = results;
        }
    }
});