import { beforeEach, describe, expect, it, vi } from 'vitest'
import { HTTP } from '@/services/http'
import ReportService from '@/services/ReportService'

// The real client reads its address from the hostname and builds the router and the store
vi.mock('@/services/http', () => ({ HTTP: { get: vi.fn() } }))

describe('ReportService', () => {
    beforeEach(() => vi.clearAllMocks())

    it('asks for the trial balance of a range, with the dates as from and to', () => {
        ReportService.trialBalance({ from: '2026-01-01', to: '2026-12-31' })

        expect(HTTP.get).toHaveBeenCalledWith('/reports/trial-balance', {
            params: { from: '2026-01-01', to: '2026-12-31' },
        })
    })

    it('leaves out an empty date: no limit', () => {
        ReportService.trialBalance({ from: '', to: '2026-12-31' })
        ReportService.trialBalance()

        expect(HTTP.get).toHaveBeenNthCalledWith(1, '/reports/trial-balance', { params: { to: '2026-12-31' } })
        expect(HTTP.get).toHaveBeenNthCalledWith(2, '/reports/trial-balance', { params: {} })
    })

    it('asks for the ledger of one account', () => {
        ReportService.accountLedger({ accountId: 9, from: '2026-01-01', to: '' })

        expect(HTTP.get).toHaveBeenCalledWith('/reports/account-ledger', {
            params: { account_id: 9, from: '2026-01-01' },
        })
    })
})
