import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createStore } from 'vuex'
import InvoicePreview from '@/components/invoice/InvoicePreview.vue'

// The real client reads its address from the hostname and builds the router and
// the store; the preview only needs the address
vi.mock('@/services/http', () => ({ HTTP: { defaults: { baseURL: 'https://api.example.test' } } }))

const newStore = (salesVatRate) =>
    createStore({
        getters: { getAccountById: () => () => ({ name: 'Bank', number: 5710 }), salesVatRate: () => salesVatRate },
        actions: { fetchAccounts: () => {}, fetchTaxRates: () => {} },
    })

const mountPreview = (organization, invoice = {}, salesVatRate = 0.25) =>
    mount(InvoicePreview, {
        props: {
            organization: { name: 'Demo ApS', ...organization },
            invoice: { lines: [], amount: 0, ...invoice },
        },
        global: {
            plugins: [newStore(salesVatRate)],
            stubs: { LineShow: true },
            mocks: { $filters: { toCurrency: (value) => `kr ${Number(value).toFixed(2)}`, toFloat: (value) => value } },
        },
    })

describe('InvoicePreview', () => {
    it("loads the organization's logo from the API's address, not from a hard-coded one", () => {
        const wrapper = mountPreview({ slug: 'demo-aps', logo: 'logo.png' })

        expect(wrapper.find('img').attributes('src')).toBe(
            'https://api.example.test/organizations/demo-aps/logo/logo.png',
        )
    })

    it('shows no logo when the organization has no slug yet (still loading)', () => {
        expect(mountPreview({ slug: undefined, logo: '' }).find('img').exists()).toBe(false)
    })

    it('shows the amounts the server saved: total, VAT and the total including VAT', () => {
        const wrapper = mountPreview(
            { slug: 'demo-aps', logo: 'logo.png' },
            { amount: 300, vat_amount: 75, gross_amount: 375, lines: [{ quantity: 3, unit_price: 100, amount: 300 }] },
        )

        expect(wrapper.text()).toContain('I alt ekskl. momskr 300.00')
        expect(wrapper.text()).toContain('Moms (25%)kr 75.00')
        expect(wrapper.text()).toContain('I alt inkl. momskr 375.00')
    })

    it('does not calculate the VAT itself: it shows what was saved', () => {
        // saved while the rate was 0%: a recalculation with 25% would show 25.00 and 125.00
        const wrapper = mountPreview(
            { slug: 'demo-aps', logo: 'logo.png' },
            { amount: 100, vat_amount: 0, gross_amount: 100, lines: [{ quantity: 1, unit_price: 100, amount: 100 }] },
        )

        expect(wrapper.text()).toContain('Moms (25%)kr 0.00')
        expect(wrapper.text()).toContain('I alt inkl. momskr 100.00')
    })

    it('names the rate from the store, and no rate when there is no single sales rate', () => {
        const invoice = { amount: 100, vat_amount: 6.25, gross_amount: 106.25, lines: [] }

        expect(mountPreview({}, invoice, 0.0625).text()).toContain('Moms (6.25%)')
        expect(mountPreview({}, invoice, null).text()).toMatch(/Moms\s*kr 6\.25/)
    })

    it('shows the invoice number, the dates and the contact', () => {
        const wrapper = mountPreview(
            { slug: 'demo-aps', logo: 'logo.png' },
            {
                invoice_no: '1001',
                invoice_date: '2026-01-01',
                duedate: '2026-01-15',
                contact: { name: 'Acme ApS', street: 'Main St 1', zipcode: '8000', city: 'Aarhus' },
            },
        )

        const text = wrapper.text()
        for (const expected of ['1001', '2026-01-01', '2026-01-15', 'Acme ApS', 'Main St 1', '8000 Aarhus']) {
            expect(text).toContain(expected)
        }
    })
})
