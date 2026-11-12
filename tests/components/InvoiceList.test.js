import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter, RouterView } from 'vue-router'
import { createStore } from 'vuex'
import { defineComponent, h } from 'vue'
import Invoices from '@/views/invoice/Invoices.vue'

vi.mock('@/utilities/toast', () => ({ toast: vi.fn() }))

const contact = { name: 'Acme ApS' }
const invoices = [
    { id: 1, state: 'draft', kind: 'invoice', invoice_no: null, amount: 100, gross_amount: 125, contact },
    { id: 2, state: 'approved', kind: 'invoice', invoice_no: '10', amount: 1000, gross_amount: 1250, contact },
    { id: 3, state: 'approved', kind: 'credit_note', invoice_no: '11', amount: 400, gross_amount: 500, contact },
    { id: 4, state: 'draft', kind: 'credit_note', invoice_no: null, amount: 0, gross_amount: 0, contact },
]
const page = () => defineComponent({ render: () => h('div') })

const open = async () => {
    const store = createStore({
        getters: { invoices: () => invoices, user: () => ({ organizationId: 1 }) },
        actions: { fetchInvoices: () => {} },
    })
    const router = createRouter({
        history: createMemoryHistory(),
        routes: [
            { path: '/invoices', name: 'Invoices', component: Invoices },
            { path: '/invoices/:invoiceId', name: 'ShowInvoice', component: page(), props: true },
            { path: '/invoices/:invoiceId/edit', name: 'EditInvoice', component: page(), props: true },
        ],
    })
    router.push('/invoices')
    await router.isReady()
    const wrapper = mount(defineComponent({ render: () => h(RouterView) }), {
        global: { plugins: [store, router], mocks: { $filters: { toCurrency: (value) => Number(value).toFixed(2) } } },
    })
    await flushPromises()
    return { wrapper, router }
}

describe('invoice list', () => {
    beforeEach(() => vi.clearAllMocks())

    it('shows the number of an invoice, and Draft until it has one', async () => {
        const { wrapper } = await open()

        expect(wrapper.findAll('td.number').map((cell) => cell.text())).toEqual([
            'Draft',
            '#inv10',
            'Credit note #11',
            'Draft credit note',
        ])
    })

    it('shows the amounts of a credit note with a minus, as it reduces what is owed', async () => {
        const { wrapper } = await open()

        expect(wrapper.findAll('td.amount').map((cell) => cell.text())).toEqual([
            '100.00',
            '1000.00',
            '-400.00',
            '0.00',
        ])
        expect(wrapper.findAll('td.gross').map((cell) => cell.text())).toEqual(['125.00', '1250.00', '-500.00', '0.00'])
    })

    it('shows no minus zero for a credit note of nothing', async () => {
        const { wrapper } = await open()

        expect(wrapper.findAll('td.gross')[3].text()).toBe('0.00')
    })

    it('opens an invoice or a credit note when its row is clicked', async () => {
        const { wrapper, router } = await open()

        await wrapper.findAll('tbody tr')[2].trigger('click')
        await flushPromises()

        expect(router.currentRoute.value.path).toBe('/invoices/3')
    })
})
