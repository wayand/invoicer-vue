import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createStore } from 'vuex'
import InvoicePreview from '@/components/invoice/InvoicePreview.vue'

// The real client reads its address from the hostname and builds the router and
// the store; the preview only needs the address
vi.mock('@/services/http', () => ({ HTTP: { defaults: { baseURL: 'https://api.example.test' } } }))

const newStore = () =>
    createStore({
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
            plugins: [newStore()],
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

    it('shows the amounts the server saved: total, VAT by code and the total including VAT', () => {
        const wrapper = mountPreview(
            { slug: 'demo-aps', logo: 'logo.png' },
            {
                amount: 300,
                vat_amount: 75,
                gross_amount: 375,
                vat_by_code: [{ code: 'S01', rate: 0.25, base: 300, vat: 75 }],
                lines: [{ quantity: 3, unit_price: 100, amount: 300 }],
            },
        )

        expect(wrapper.text()).toContain('I alt ekskl. momskr 300.00')
        expect(wrapper.text()).toContain('Moms S01 25% af kr 300.00kr 75.00')
        expect(wrapper.text()).toContain('I alt inkl. momskr 375.00')
    })

    it('shows the VAT of every code on its own row, as the server listed them', () => {
        const wrapper = mountPreview(
            {},
            {
                amount: 150,
                vat_amount: 25,
                gross_amount: 175,
                vat_by_code: [
                    { code: 'S01', rate: 0.25, base: 100, vat: 25 },
                    { code: 'S02', rate: 0, base: 50, vat: 0 },
                ],
            },
        )

        const rows = wrapper.findAll('table.float-end tr').map((row) => row.text())
        expect(rows).toEqual([
            'I alt ekskl. momskr 150.00',
            'Moms S01 25% af kr 100.00kr 25.00',
            'Moms S02 0% af kr 50.00kr 0.00',
            'I alt inkl. momskr 175.00',
        ])
    })

    it('does not calculate the VAT itself: it shows what was saved', () => {
        // saved with a rate of 6.25%: a recalculation with 25% would show other numbers
        const wrapper = mountPreview(
            {},
            {
                amount: 100,
                vat_amount: 6.25,
                gross_amount: 106.25,
                vat_by_code: [{ code: 'S01', rate: 0.0625, base: 100, vat: 6.25 }],
            },
        )

        expect(wrapper.text()).toContain('Moms S01 6.25% af kr 100.00kr 6.25')
        expect(wrapper.text()).toContain('I alt inkl. momskr 106.25')
    })

    it('shows one VAT row with the saved amount when the invoice has no VAT by code', () => {
        const wrapper = mountPreview({}, { amount: 100, vat_amount: 25, gross_amount: 125, lines: [] })

        expect(wrapper.text()).toMatch(/Moms\s*kr 25\.00/)
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

    it('is a Faktura with payment terms and a due date', () => {
        const wrapper = mountPreview({}, { invoice_no: '10', duedate: '2026-11-15', kind: 'invoice' })

        expect(wrapper.find('td.title').text()).toBe('Faktura')
        expect(wrapper.text()).toContain('Fakturanr.: 10')
        expect(wrapper.text()).toContain('Forfaldsdato: 2026-11-15')
        expect(wrapper.find('.payment-terms').exists()).toBe(true)
    })

    it('is a Kreditnota for a credit note: its own number, and the invoice it refers to, and no payment terms', () => {
        const wrapper = mountPreview(
            {},
            {
                kind: 'credit_note',
                invoice_no: '11',
                credits_invoice_no: '10',
                invoice_date: '2026-11-01',
                duedate: '2026-11-01',
                amount: 400,
                vat_amount: 100,
                gross_amount: 500,
                vat_by_code: [{ code: 'S01', rate: 0.25, base: 400, vat: 100 }],
            },
        )

        expect(wrapper.find('td.title').text()).toBe('Kreditnota')
        expect(wrapper.text()).toContain('Kreditnotanr.: 11')
        expect(wrapper.text()).toContain('Kreditnotadato: 2026-11-01')
        expect(wrapper.find('.credits').text()).toBe('Vedrører faktura nr.: 10')
        expect(wrapper.text()).not.toContain('Forfaldsdato')
        expect(wrapper.find('.payment-terms').exists()).toBe(false)
        // The amounts are positive, as on a printed credit note
        expect(wrapper.text()).toContain('I alt inkl. momskr 500.00')
    })
})
