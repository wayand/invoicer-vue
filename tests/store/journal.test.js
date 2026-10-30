import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createStore } from 'vuex'
import journal from '@/store/modules/journal'
import JournalService from '@/services/JournalService'

// The service talks to the API through axios, the router and the store: the store
// module is tested alone, so it is replaced.
vi.mock('@/services/JournalService', () => ({
    default: { getAll: vi.fn(), getOne: vi.fn(), create: vi.fn(), reverse: vi.fn() },
}))

const newStore = () =>
    createStore({ modules: { journal: { ...journal, state: () => ({ journalEntries: [], journalEntry: null }) } } })

const entry = (id, extra = {}) => ({ id, voucher_no: id, lines: [], reversed_by_entry_id: null, ...extra })

describe('journal store', () => {
    let store
    beforeEach(() => {
        vi.clearAllMocks()
        store = newStore()
    })

    it('fetches the first page and replaces the list', async () => {
        JournalService.getAll.mockResolvedValue({ data: [entry(3), entry(2)] })
        store.commit('SET_JOURNAL_ENTRIES', [entry(99)])

        await store.dispatch('fetchJournalEntries', { limit: 50 })

        expect(JournalService.getAll).toHaveBeenCalledWith({ limit: 50 })
        expect(store.getters.journalEntries.map((item) => item.id)).toEqual([3, 2])
    })

    it('adds a later page to the list', async () => {
        store.commit('SET_JOURNAL_ENTRIES', [entry(3), entry(2)])
        JournalService.getAll.mockResolvedValue({ data: [entry(1)] })

        await store.dispatch('fetchJournalEntries', { limit: 2, offset: 2 })

        expect(store.getters.journalEntries.map((item) => item.id)).toEqual([3, 2, 1])
    })

    it('fetches one entry', async () => {
        JournalService.getOne.mockResolvedValue({ data: entry(5) })

        await store.dispatch('fetchJournalEntry', 5)

        expect(JournalService.getOne).toHaveBeenCalledWith(5)
        expect(store.getters.journalEntry.id).toBe(5)
    })

    it('puts a posted entry first in the list and returns the response', async () => {
        store.commit('SET_JOURNAL_ENTRIES', [entry(1)])
        JournalService.create.mockResolvedValue({ data: entry(2) })

        const response = await store.dispatch('createJournalEntry', { description: 'x' })

        expect(JournalService.create).toHaveBeenCalledWith({ description: 'x' })
        expect(response.data.id).toBe(2)
        expect(store.getters.journalEntries.map((item) => item.id)).toEqual([2, 1])
    })

    it('marks the original as reversed and puts the reversal first', async () => {
        store.commit('SET_JOURNAL_ENTRIES', [entry(2), entry(1)])
        store.commit('SET_JOURNAL_ENTRY', entry(1))
        JournalService.reverse.mockResolvedValue({ data: entry(3, { reverses_entry_id: 1 }) })

        await store.dispatch('reverseJournalEntry', { entryId: 1 })

        expect(JournalService.reverse).toHaveBeenCalledWith(1, {})
        expect(store.getters.journalEntries.map((item) => item.id)).toEqual([3, 2, 1])
        expect(store.getters.journalEntries.find((item) => item.id === 1).reversed_by_entry_id).toBe(3)
        expect(store.getters.journalEntry.reversed_by_entry_id).toBe(3)
    })

    it('leaves the list alone when the reversal is refused', async () => {
        store.commit('SET_JOURNAL_ENTRIES', [entry(1)])
        JournalService.reverse.mockRejectedValue({ response: { data: { error: 'already reversed' } } })

        await expect(store.dispatch('reverseJournalEntry', { entryId: 1 })).rejects.toBeDefined()

        expect(store.getters.journalEntries).toEqual([entry(1)])
    })

    it('passes the date and description of a reversal on', async () => {
        JournalService.reverse.mockResolvedValue({ data: entry(2) })

        await store.dispatch('reverseJournalEntry', { entryId: 1, entry_date: '2026-04-01', description: 'Wrong' })

        expect(JournalService.reverse).toHaveBeenCalledWith(1, { entry_date: '2026-04-01', description: 'Wrong' })
    })
})
