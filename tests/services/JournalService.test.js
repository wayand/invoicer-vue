import { beforeEach, describe, expect, it, vi } from 'vitest'
import { HTTP } from '@/services/http'
import JournalService from '@/services/JournalService'

// The real client reads its address from the hostname and builds the router and the store
vi.mock('@/services/http', () => ({ HTTP: { get: vi.fn(), post: vi.fn() } }))

describe('JournalService', () => {
    beforeEach(() => vi.clearAllMocks())

    it('lists the entries, with the page as query parameters', () => {
        JournalService.getAll({ limit: 50, offset: 50 })

        expect(HTTP.get).toHaveBeenCalledWith('/journal-entries', { params: { limit: 50, offset: 50 } })
    })

    it('lists the entries without parameters', () => {
        JournalService.getAll()

        expect(HTTP.get).toHaveBeenCalledWith('/journal-entries', { params: {} })
    })

    it('reads one entry', () => {
        JournalService.getOne(7)

        expect(HTTP.get).toHaveBeenCalledWith('/journal-entries/7')
    })

    it('posts an entry as it is given', () => {
        const entry = { entry_date: '2026-03-01', description: 'A sale', lines: [] }

        JournalService.create(entry)

        expect(HTTP.post).toHaveBeenCalledWith('/journal-entries', entry)
    })

    it('reverses an entry, with an empty body unless one is given', () => {
        JournalService.reverse(7)
        JournalService.reverse(8, { entry_date: '2026-04-01' })

        expect(HTTP.post).toHaveBeenNthCalledWith(1, '/journal-entries/7/reverse', {})
        expect(HTTP.post).toHaveBeenNthCalledWith(2, '/journal-entries/8/reverse', { entry_date: '2026-04-01' })
    })
})
