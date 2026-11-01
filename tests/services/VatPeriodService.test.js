import { beforeEach, describe, expect, it, vi } from 'vitest'
import { HTTP } from '@/services/http'
import VatPeriodService from '@/services/VatPeriodService'

// The real client reads its address from the hostname and builds the router and the store
vi.mock('@/services/http', () => ({ HTTP: { get: vi.fn(), post: vi.fn(), patch: vi.fn() } }))

describe('VatPeriodService', () => {
    beforeEach(() => vi.clearAllMocks())

    it('lists the periods', () => {
        VatPeriodService.getAll()

        expect(HTTP.get).toHaveBeenCalledWith('/vat-periods')
    })

    it('settles the open period', () => {
        VatPeriodService.settle()

        expect(HTTP.post).toHaveBeenCalledWith('/vat-periods/settle')
    })

    it('files a period with the date and the reference', () => {
        VatPeriodService.file(5, { filed_on: '2026-05-30', reference: 'TastSelv 1' })

        expect(HTTP.post).toHaveBeenCalledWith('/vat-periods/5/file', {
            filed_on: '2026-05-30',
            reference: 'TastSelv 1',
        })
    })

    it('changes the due date of a period', () => {
        VatPeriodService.changeDueDate(5, '2026-06-02')

        expect(HTTP.patch).toHaveBeenCalledWith('/vat-periods/5', { due_date: '2026-06-02' })
    })
})
