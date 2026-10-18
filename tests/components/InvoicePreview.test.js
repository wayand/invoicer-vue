import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createStore } from 'vuex'
import InvoicePreview from '@/components/invoice/InvoicePreview.vue'

// The real client reads its address from the hostname and builds the router and
// the store; the preview only needs the address
vi.mock('@/services/http', () => ({ HTTP: { defaults: { baseURL: 'https://api.example.test' } } }))

const store = createStore({
    getters: { getAccountById: () => () => ({ name: 'Bank', number: 5710 }) },
    actions: { fetchAccounts: () => {} },
})

const mountPreview = (organization, invoice = {}) =>
    mount(InvoicePreview, {
        props: {
            organization: { name: 'Demo ApS', ...organization },
            invoice: { lines: [], amount: 0, ...invoice },
        },
        global: {
            plugins: [store],
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

    it('shows the totals: lines, 25% VAT and the total including VAT', () => {
        const wrapper = mountPreview(
            { slug: 'demo-aps', logo: 'logo.png' },
            {
                amount: 300,
                lines: [
                    { quantity: 1, unit_price: 100 },
                    { quantity: 2, unit_price: 100 },
                ],
            },
        )

        const text = wrapper.text()
        expect(text).toContain('kr 300.00') // 1 x 100 + 2 x 100
        expect(text).toContain('kr 75.00') // 25% of the invoice amount
        expect(text).toContain('kr 375.00') // amount + VAT
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
