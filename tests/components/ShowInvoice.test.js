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
const draft = { id: 2, invoice_no: null, state: 'draft', is_sent: false, contact: { name: 'Acme' } }
const approved = {
    ...draft,
    invoice_no: '1001',
    state: 'approved',
    journal_entry_id: 41,
    voucher_no: 9,
}

let actions
const mountPage = async ({ invoice = draft, confirm = true } = {}) => {
    actions = {
        fetchOrganization: vi.fn(),
        fetchInvoice: vi.fn(),
        deleteInvoice: vi.fn(),
        markInvoiceAsSent: vi.fn(),
        createCreditNote: vi.fn(),
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
            { path: '/invoices/:invoiceId/edit', name: 'EditInvoice', component: page(), props: true },
            { path: '/vouchers/:entryId(\\d+)', name: 'ShowVoucher', component: page(), props: true },
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
        global: {
            plugins: [store, router],
            components: { PromiseDialog },
            stubs: { teleport: true },
            mocks: { $filters: { toCurrency: (value) => Number(value).toFixed(2) } },
        },
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

    it('offers neither Edit nor Delete for an approved invoice, which is part of the books, but still Duplicate', async () => {
        const { wrapper } = await mountPage({ invoice: approved })

        expect(menu(wrapper)).toContain('Duplicate')
        expect(menu(wrapper)).not.toContain('Edit')
        expect(menu(wrapper)).not.toContain('Delete')
    })

    it('offers "Mark as sent" only for an approved invoice that was not sent', async () => {
        const open = await mountPage({ invoice: approved })
        const sent = await mountPage({ invoice: { ...approved, is_sent: true } })
        const notApproved = await mountPage()

        expect(menu(open.wrapper)).toContain('Mark as sent')
        expect(menu(sent.wrapper)).not.toContain('Mark as sent')
        expect(menu(notApproved.wrapper)).not.toContain('Mark as sent')
    })
})

describe('ShowInvoice heading', () => {
    it('calls a draft a draft: it has no number yet', async () => {
        const { wrapper } = await mountPage()

        expect(wrapper.find('h3').text()).toBe('Draft invoice for Acme')
        expect(wrapper.find('.voucher').exists()).toBe(false)
    })

    it('gives the number of an approved invoice, and links the voucher it was posted as', async () => {
        const { wrapper, router } = await mountPage({ invoice: approved })

        expect(wrapper.find('h3').text()).toBe('Invoice #1001 for Acme')
        expect(wrapper.find('.voucher').text()).toBe('Posted as voucher 9')
        await wrapper.find('.voucher a').trigger('click')
        await flushPromises()
        expect(router.currentRoute.value.path).toBe('/vouchers/41')
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

describe('ShowInvoice, credit notes', () => {
    beforeEach(() => vi.clearAllMocks())

    const credited = { ...approved, gross_amount: 1250, credited_amount: 0, credit_notes: [] }
    const note = {
        ...approved,
        id: 3,
        invoice_no: '11',
        kind: 'credit_note',
        credits_invoice_id: 2,
        credits_invoice_no: '10',
        gross_amount: 500,
    }

    describe('making one', () => {
        it.each([
            ['an approved invoice', credited, true],
            ['an invoice that is credited in part', { ...credited, credited_amount: 500 }, true],
            ['an invoice that is credited in full', { ...credited, credited_amount: 1250 }, false],
            ['a draft', { ...draft, gross_amount: 1250 }, false],
            ['a credit note: there is no credit note of a credit note', note, false],
            ['an invoice of nothing', { ...credited, gross_amount: 0 }, false],
        ])('%s: the Credit note item is %s', async (_name, invoice, shown) => {
            const { wrapper } = await mountPage({ invoice })

            expect(menu(wrapper).includes('Credit note')).toBe(shown)
        })

        it('makes a draft credit note and opens it for editing', async () => {
            const { wrapper, router } = await mountPage({ invoice: credited })
            actions.createCreditNote.mockResolvedValue({ data: { id: 7 } })

            await click(wrapper, 'Credit note')

            expect(actions.createCreditNote).toHaveBeenCalledTimes(1)
            expect(actions.createCreditNote.mock.calls[0][1]).toEqual({ organizationId: 1, invoiceId: 2 })
            expect(router.currentRoute.value.name).toBe('EditInvoice')
            expect(router.currentRoute.value.params.invoiceId).toBe('7')
        })

        it('says why the server refused, and stays on the invoice', async () => {
            const { wrapper, router } = await mountPage({ invoice: credited })
            actions.createCreditNote.mockRejectedValue({
                response: { data: { error: 'Invoice 10 is already credited in full' } },
            })

            await click(wrapper, 'Credit note')

            expect(toast).toHaveBeenCalledWith('Invoice 10 is already credited in full', 'error')
            expect(router.currentRoute.value.name).toBe('ShowInvoice')
        })
    })

    describe('showing one', () => {
        it('says it is a credit note, and links the invoice it corrects', async () => {
            const { wrapper, router } = await mountPage({ invoice: note })

            expect(wrapper.find('h3').text()).toBe('Credit note #11 for Acme')
            expect(wrapper.find('.credits').text()).toBe('Corrects invoice #10')
            await wrapper.find('.credits a').trigger('click')
            await flushPromises()
            expect(router.currentRoute.value.path).toBe('/invoices/2')
        })

        it('is a draft credit note while it has no number', async () => {
            const { wrapper } = await mountPage({ invoice: { ...note, state: 'draft', invoice_no: null } })

            expect(wrapper.find('h3').text()).toBe('Draft credit note for Acme')
        })

        it('is not duplicated: a mistake is corrected with a new invoice', async () => {
            const { wrapper } = await mountPage({ invoice: note })

            expect(menu(wrapper)).not.toContain('Duplicate')
        })

        it('is read-only once approved, like an invoice, and can be marked as sent', async () => {
            const { wrapper } = await mountPage({ invoice: note })

            expect(menu(wrapper)).toEqual(['Mark as sent', 'Save as PDF'])
        })
    })

    describe('what an invoice shows of its credit notes', () => {
        const withNotes = {
            ...credited,
            credited_amount: 500,
            credit_notes: [
                { id: 3, invoice_no: '11', state: 'approved', gross_amount: 500 },
                { id: 4, invoice_no: null, state: 'draft', gross_amount: 750 },
            ],
        }

        it('lists them with links, drafts too, and what the approved ones credit', async () => {
            const { wrapper, router } = await mountPage({ invoice: withNotes })

            expect(wrapper.find('.credit-notes').text()).toBe(
                'Credit notes: #11 (500.00), draft (750.00), 500.00 credited',
            )
            await wrapper.findAll('.credit-notes a')[0].trigger('click')
            await flushPromises()
            expect(router.currentRoute.value.path).toBe('/invoices/3')
        })

        it('says nothing when there are none', async () => {
            const { wrapper } = await mountPage({ invoice: credited })

            expect(wrapper.find('.credit-notes').exists()).toBe(false)
        })

        it('does not say "credited" while only drafts exist', async () => {
            const { wrapper } = await mountPage({
                invoice: { ...credited, credit_notes: [withNotes.credit_notes[1]] },
            })

            expect(wrapper.find('.credit-notes').text()).toBe('Credit notes: draft (750.00)')
        })
    })
})
