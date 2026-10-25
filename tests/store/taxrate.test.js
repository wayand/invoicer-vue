import { describe, expect, it, vi } from 'vitest'
import taxrate from '@/store/modules/taxrate'

// The real service pulls in the HTTP client, which builds the router and the store
vi.mock('@/services/TaxRateService', () => ({ default: {} }))

const rate = (overrides) => ({ id: 1, rate: 0.25, applies_to_sales: true, is_active: true, ...overrides })
const salesVatRate = (taxRates) => taxrate.getters.salesVatRate({ taxRates })

describe('taxrate store, salesVatRate', () => {
    it('is the one active sales rate', () => {
        expect(salesVatRate([rate()])).toBe(0.25)
    })

    it('ignores rates that are inactive or not for sales', () => {
        const taxRates = [
            rate({ id: 2, rate: 0.12, is_active: false }),
            rate({ id: 3, rate: 0.25, applies_to_sales: false, applies_to_purchases: true }),
            rate({ id: 4, rate: 0.0625 }),
        ]

        expect(salesVatRate(taxRates)).toBe(0.0625)
    })

    it('is a rate of 0 when that is the one rate', () => {
        expect(salesVatRate([rate({ rate: 0 })])).toBe(0)
    })

    it('is null when there is none, as the server refuses to save an invoice then', () => {
        expect(salesVatRate([])).toBeNull()
        expect(salesVatRate([rate({ is_active: false })])).toBeNull()
    })

    it('is null when there are several, since it cannot tell which one the server uses', () => {
        expect(salesVatRate([rate(), rate({ id: 2, rate: 0.0625 })])).toBeNull()
    })
})
