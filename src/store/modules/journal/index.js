import JournalService from '@/services/JournalService'

export default {
    state: {
        journalEntries: [],
        journalEntry: null,
    },
    getters: {
        journalEntries: (state) => state.journalEntries,
        journalEntry: (state) => state.journalEntry,
    },
    actions: {
        // With an offset the page is added to the list, without one it replaces it
        fetchJournalEntries({ commit }, params = {}) {
            return JournalService.getAll(params).then((response) => {
                commit(params.offset ? 'ADD_JOURNAL_ENTRIES' : 'SET_JOURNAL_ENTRIES', response.data)
                return response
            })
        },
        fetchJournalEntry({ commit }, entryId) {
            return JournalService.getOne(entryId).then((response) => {
                commit('SET_JOURNAL_ENTRY', response.data)
                return response
            })
        },
        createJournalEntry({ commit }, entry) {
            return JournalService.create(entry).then((response) => {
                commit('PREPEND_JOURNAL_ENTRY', response.data)
                return response
            })
        },
        reverseJournalEntry({ commit }, { entryId, ...body }) {
            return JournalService.reverse(entryId, body).then((response) => {
                commit('MARK_JOURNAL_ENTRY_REVERSED', { entryId, reversalId: response.data.id })
                commit('PREPEND_JOURNAL_ENTRY', response.data)
                return response
            })
        },
    },
    mutations: {
        SET_JOURNAL_ENTRIES(state, entries) {
            state.journalEntries = entries
        },
        ADD_JOURNAL_ENTRIES(state, entries) {
            state.journalEntries.push(...entries)
        },
        SET_JOURNAL_ENTRY(state, entry) {
            state.journalEntry = entry
        },
        PREPEND_JOURNAL_ENTRY(state, entry) {
            state.journalEntries.unshift(entry)
        },
        // The list and the open entry both show what reversed an entry
        MARK_JOURNAL_ENTRY_REVERSED(state, { entryId, reversalId }) {
            for (const entry of [...state.journalEntries, state.journalEntry]) {
                if (entry && entry.id === entryId) entry.reversed_by_entry_id = reversalId
            }
        },
    },
}
