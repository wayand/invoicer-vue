import { describe, expect, it, vi } from 'vitest'
import vatcode from '@/store/modules/vatcode'
import VatCodeService from '@/services/VatCodeService'

vi.mock('@/services/VatCodeService', () => ({ default: { getAll: vi.fn() } }))

const vatCodes = [
    { id: 1, code: 'S01', applies_to: 'sales', direction: 'output', rate: 0.25, is_supported: true },
    { id: 2, code: 'S02', applies_to: 'sales', direction: 'none', rate: 0, is_supported: true },
    { id: 3, code: 'S81', applies_to: 'sales', direction: 'none', rate: null, is_supported: true },
    { id: 4, code: 'S83', applies_to: 'sales', direction: null, rate: 0.25, is_supported: false },
    { id: 5, code: 'K010', applies_to: 'purchases', direction: 'input', rate: 0.25, is_supported: true },
]
const state = { vatCodes }
const getter = (name) => vatcode.getters[name](state)

describe('vatcode store', () => {
    it('lets an invoice line choose the supported sales codes, and no others', () => {
        expect(getter('salesVatCodes').map((vatCode) => vatCode.code)).toEqual(['S01', 'S02', 'S81'])
    })

    it('lets an account choose any supported code, sales or purchases', () => {
        expect(getter('supportedVatCodes').map((vatCode) => vatCode.code)).toEqual(['S01', 'S02', 'S81', 'K010'])
    })

    it('gives the rate an invoice charges for each code: 0 for a code that carries no VAT', () => {
        expect(getter('salesRates')).toEqual({ S01: 0.25, S02: 0, S81: 0, S83: 0, K010: 0 })
    })

    it('finds a code by its id', () => {
        expect(vatcode.getters.getVatCodeById(state)(1).code).toBe('S01')
        expect(vatcode.getters.getVatCodeById(state)(99)).toBeUndefined()
    })

    it('loads the codes into the store', async () => {
        VatCodeService.getAll.mockResolvedValue({ data: vatCodes })
        const commit = vi.fn()

        await vatcode.actions.fetchVatCodes({ commit })

        expect(commit).toHaveBeenCalledWith('SET_VAT_CODES', vatCodes)
    })

    it('sets the codes', () => {
        const target = { vatCodes: [] }

        vatcode.mutations.SET_VAT_CODES(target, vatCodes)

        expect(target.vatCodes).toEqual(vatCodes)
    })
})
