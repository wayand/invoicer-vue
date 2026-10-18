import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { createStore } from 'vuex'
import { defineComponent, h } from 'vue'
import { RouterView } from 'vue-router'
import ShowInvoice from '@/views/invoice/ShowInvoice.vue'
import { toast } from '@/utilities/toast'

// Heavy or network-bound modules the page imports but these tests do not use
vi.mock('html2pdf.js', () => ({ default: vi.fn() }))
vi.mock('@/components/invoice/InvoicePreview', () => ({ default: { render: () => null } }))
vi.mock('@/utilities/toast', () => ({ toast: vi.fn() }))

const page = () => defineComponent({ render: () => h('div') })
const draft = { id: 2, invoice_no: '1001', state: 'draft', is_sent: false, is_paid: false, contact: { name: 'Acme' } }

let actions
const mountPage = async ({ invoice = draft, confirm = true } = {}) => {
    actions = {
        fetchOrganization: vi.fn(),
        fetchInvoice: vi.fn(),
        deleteInvoice: vi.fn(),
        markInvoiceAsSent: vi.fn(),
    }
    const store = createStore({
        state: () => ({ invoice }),
        getters: {
            organization: () => ({ id: 1, slug: 'demo-aps' }),
            invoice: (state) => state.invoice,
            user: () => ({ organizationId: 1 }),
        },
        actions,
    })
    const router = createRouter({
        history: createMemoryHistory(),
        routes: [
            { path: '/invoices', name: 'Invoices', component: page() },
            { path: '/invoices/new', name: 'NewInvoice', component: page() },
            { path: '/invoices/:invoiceId', name: 'ShowInvoice', component: ShowInvoice, props: true },
            { path: '/invoices/:invoiceId/edit', name: 'EditInvoice', component: page() },
        ],
    })
    router.push('/invoices/2')
    await router.isReady()

    // The confirmation dialog is answered by the test. It records what it was
    // asked, because it goes away with the page after a redirect.
    const asked = []
    const PromiseDialog = defineComponent({
        data: () => ({ data: null }),
        methods: {
            showModal() {
                asked.push({ ...this.data })
                return Promise.resolve(confirm)
            },
        },
        render: () => null,
    })

    // Mounted inside a router view like in the app, so the page goes away when
    // the route changes
    const wrapper = mount(defineComponent({ render: () => h(RouterView) }), {
        global: { plugins: [store, router], components: { PromiseDialog }, stubs: { teleport: true } },
    })
    await flushPromises()
    return { wrapper, router, asked }
}

const menu = (wrapper) => wrapper.findAll('.dropdown-item').map((item) => item.text())
const click = async (wrapper, label) => {
    await wrapper
        .findAll('.dropdown-item')
        .find((item) => item.text() === label)
        .trigger('click')
    await flushPromises()
}

describe('ShowInvoice menu', () => {
    beforeEach(() => vi.clearAllMocks())

    it('offers Delete for a plain draft', async () => {
        const { wrapper } = await mountPage()

        expect(menu(wrapper)).toEqual(['Edit', 'Save as PDF', 'Duplicate', 'Delete'])
    })

    it.each([
        ['approved', { state: 'approved' }],
        ['a draft that was sent', { is_sent: true }],
        ['a draft that was paid', { is_paid: true }],
        ['a sent and paid invoice', { state: 'approved', is_sent: true, is_paid: true }],
    ])('does not offer Delete for %s, but still Duplicate', async (_, fields) => {
        const { wrapper } = await mountPage({ invoice: { ...draft, ...fields } })

        expect(menu(wrapper)).toContain('Duplicate')
        expect(menu(wrapper)).not.toContain('Delete')
    })

    it('offers "Mark as sent" only for an approved invoice that was not sent', async () => {
        const approved = await mountPage({ invoice: { ...draft, state: 'approved' } })
        const sent = await mountPage({ invoice: { ...draft, state: 'approved', is_sent: true } })

        expect(menu(approved.wrapper)).toContain('Mark as sent')
        expect(menu(sent.wrapper)).not.toContain('Mark as sent')
    })
})

describe('ShowInvoice Duplicate', () => {
    it('opens the new invoice form to copy this invoice', async () => {
        const { wrapper, router } = await mountPage()

        await click(wrapper, 'Duplicate')

        expect(router.currentRoute.value.name).toBe('NewInvoice')
        expect(router.currentRoute.value.query).toEqual({ copyFrom: '2' })
    })
})

describe('ShowInvoice Delete', () => {
    beforeEach(() => vi.clearAllMocks())

    it('asks first, then deletes the invoice, says so and returns to the list', async () => {
        const { wrapper, router, asked } = await mountPage()

        await click(wrapper, 'Delete')

        expect(asked).toHaveLength(1)
        expect(asked[0].content).toMatch(/delete this draft invoice/i)
        expect(actions.deleteInvoice).toHaveBeenCalledTimes(1)
        expect(actions.deleteInvoice.mock.calls[0][1]).toEqual({ organizationId: 1, invoiceId: 2 })
        expect(toast).toHaveBeenCalledWith('Draft invoice deleted', 'success')
        expect(router.currentRoute.value.name).toBe('Invoices')
    })

    it('does nothing when the confirmation is declined', async () => {
        const { wrapper, router } = await mountPage({ confirm: false })

        await click(wrapper, 'Delete')

        expect(actions.deleteInvoice).not.toHaveBeenCalled()
        expect(router.currentRoute.value.path).toBe('/invoices/2')
    })

    it("shows the API's reason and stays on the page when the server refuses", async () => {
        const { wrapper, router } = await mountPage()
        actions.deleteInvoice.mockRejectedValue({ response: { data: { error: 'Only draft invoices can be deleted' } } })

        await click(wrapper, 'Delete')

        expect(toast).toHaveBeenCalledWith('Only draft invoices can be deleted', 'error')
        expect(router.currentRoute.value.path).toBe('/invoices/2')
    })

    it('shows the error message when the request itself fails', async () => {
        const { wrapper } = await mountPage()
        actions.deleteInvoice.mockRejectedValue(new Error('Network Error'))

        await click(wrapper, 'Delete')

        expect(toast).toHaveBeenCalledWith('Network Error', 'error')
    })
})
