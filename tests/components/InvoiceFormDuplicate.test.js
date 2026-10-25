import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter, RouterView } from 'vue-router'
import { createStore } from 'vuex'
import { defineComponent, h } from 'vue'
import InvoiceForm from '@/views/invoice/InvoiceForm.vue'
import invoice from '@/store/modules/invoice'
import InvoiceService from '@/services/InvoiceService'
import { toast } from '@/utilities/toast'

// Network-bound modules the form imports but this test does not use
vi.mock('@/services/InvoiceService', () => ({
    default: { getOne: vi.fn(), getAll: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
}))
vi.mock('@/utilities/toast', () => ({ toast: vi.fn() }))

// An approved, sent and paid invoice with two lines, as the API returns it
const source = {
    id: 2,
    organization_id: 1,
    contact_id: 5,
    invoice_no: '1001',
    state: 'approved',
    is_sent: true,
    is_paid: true,
    currency_id: 'EUR',
    excluding_vat: false,
    template_id: '2',
    invoice_date: '2026-01-01',
    duedate: '2026-01-15',
    amount: 300,
    vat_amount: 75,
    gross_amount: 375,
    created_at: '2026-01-01T10:00:00',
    updated_at: '2026-01-02T10:00:00',
    lines: [
        {
            id: 11,
            invoice_id: 2,
            product_id: 1,
            description: 'First job',
            quantity: 1,
            unit_price: 100,
            amount: 100,
            created_at: 'x',
            updated_at: 'y',
        },
        {
            id: 12,
            invoice_id: 2,
            product_id: 1,
            description: 'Second job',
            quantity: 2,
            unit_price: 100,
            amount: 200,
            created_at: 'x',
            updated_at: 'y',
        },
    ],
}
const contacts = [
    { id: 4, name: 'Other ApS', street: 'Side St 2', zipcode: '9000', city: 'Aalborg' },
    { id: 5, name: 'Acme ApS', street: 'Main St 1', zipcode: '8000', city: 'Aarhus' },
]

const page = () => defineComponent({ render: () => h('div') })
const stubbed = (name) => defineComponent({ name, render: () => null })

const newStore = () =>
    createStore({
        modules: { invoice: { ...invoice, state: () => ({ invoices: [], invoice: {} }) } },
        getters: {
            user: () => ({ organizationId: 1 }),
            organization: () => ({ id: 1, invoice_setting: {} }),
            contacts: () => contacts,
            products: () => [],
            invoiceSetting: () => ({ invoice_no_mode: 'sequential', next_invoice_no: 1003 }),
            getAccountById: () => () => ({ name: 'Bank' }),
            salesVatRate: () => 0.25,
        },
        actions: {
            fetchOrganization: () => {},
            fetchContacts: () => {},
            fetchProducts: () => {},
            fetchAccounts: () => {},
            fetchTaxRates: () => {},
        },
    })

const openNewInvoice = async (url) => {
    const store = newStore()
    const router = createRouter({
        history: createMemoryHistory(),
        routes: [
            { path: '/invoices/new', name: 'NewInvoice', component: InvoiceForm },
            { path: '/invoices/:invoiceId(\\d+)/edit', name: 'EditInvoice', component: page(), props: true },
            { path: '/invoices/:invoiceId(\\d+)', name: 'ShowInvoice', component: page(), props: true },
        ],
    })
    router.push(url)
    await router.isReady()
    const wrapper = mount(defineComponent({ render: () => h(RouterView) }), {
        global: {
            plugins: [store, router],
            components: { PromiseDialog: stubbed('PromiseDialog') },
            stubs: { teleport: true, Datepicker: true, InvoiceLine: true, ContactFormModal: true },
            mocks: { $filters: { toCurrency: (value) => String(value), toFloat: (value) => value } },
        },
    })
    await flushPromises()
    return { store, wrapper }
}

describe('new invoice form, copying an existing invoice', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        // Only the date is faked, so promises and timers keep working
        vi.useFakeTimers({ toFake: ['Date'] })
        vi.setSystemTime(new Date('2026-10-17T10:00:00Z'))
        InvoiceService.getOne.mockResolvedValue({ data: structuredClone(source) })
    })
    afterEach(() => vi.useRealTimers())

    it('loads the invoice to copy', async () => {
        await openNewInvoice('/invoices/new?copyFrom=2')

        expect(InvoiceService.getOne).toHaveBeenCalledWith('2')
    })

    it('starts a new draft: the next number, today, nothing sent or paid, no id', async () => {
        const { store } = await openNewInvoice('/invoices/new?copyFrom=2')
        const copy = store.getters.invoice

        expect(copy.id).toBeUndefined()
        expect(copy.created_at).toBeUndefined()
        expect(copy.invoice_no).toBe('1003')
        expect(copy.state).toBe('draft')
        expect(copy.is_sent).toBe(false)
        expect(copy.is_paid).toBe(false)
        expect(copy.invoice_date).toBe('2026-10-17')
        expect(copy.duedate).toBe('2026-10-17')
    })

    it('keeps the contact, currency and template of the original', async () => {
        const { store } = await openNewInvoice('/invoices/new?copyFrom=2')
        const copy = store.getters.invoice

        expect(copy.contact_id).toBe(5)
        expect(copy.currency_id).toBe('EUR')
        expect(copy.template_id).toBe('2')
    })

    it('copies the lines without their ids, timestamps and amounts', async () => {
        const { store } = await openNewInvoice('/invoices/new?copyFrom=2')

        expect(store.getters.invoice.lines).toEqual([
            { product_id: 1, description: 'First job', quantity: 1, unit_price: 100 },
            { product_id: 1, description: 'Second job', quantity: 2, unit_price: 100 },
        ])
    })

    it('has no amounts of its own: the totals shown are calculated from the lines', async () => {
        const { store, wrapper } = await openNewInvoice('/invoices/new?copyFrom=2')
        const copy = store.getters.invoice

        expect(copy.amount).toBeUndefined()
        expect(copy.vat_amount).toBeUndefined()
        expect(copy.gross_amount).toBeUndefined()
        expect(copy.excluding_vat).toBeUndefined()
        expect(wrapper.text()).toContain('Total excluding VAT300')
        expect(wrapper.text()).toContain('Sale VAT (25%)75')
        expect(wrapper.text()).toContain('Total including VAT375')
    })

    it('shows the contact of the original as the selected one', async () => {
        const { wrapper } = await openNewInvoice('/invoices/new?copyFrom=2')

        expect(wrapper.text()).toContain('Acme ApS')
        expect(wrapper.text()).toContain('8000 Aarhus')
        expect(wrapper.text()).not.toContain('9000 Aalborg') // only the selected contact's address is shown
    })

    it('starts a blank invoice and says why when the original cannot be loaded', async () => {
        InvoiceService.getOne.mockRejectedValue({ response: { data: { error: 'Invoice with id 2 not found!' } } })

        const { store } = await openNewInvoice('/invoices/new?copyFrom=2')

        expect(toast).toHaveBeenCalledWith('Invoice with id 2 not found!', 'error')
        expect(store.getters.invoice.contact_id).toBeNull()
        expect(store.getters.invoice.invoice_no).toBe('1003')
        expect(store.getters.invoice.lines).toHaveLength(1)
        expect(store.getters.invoice.lines[0].description).toBe('')
    })
})

describe('new invoice form, without copying', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.useFakeTimers({ toFake: ['Date'] })
        vi.setSystemTime(new Date('2026-10-17T10:00:00Z'))
    })
    afterEach(() => vi.useRealTimers())

    it('is a blank draft with one empty line and does not fetch any invoice', async () => {
        const { store } = await openNewInvoice('/invoices/new')
        const blank = store.getters.invoice

        expect(InvoiceService.getOne).not.toHaveBeenCalled()
        expect(blank.state).toBe('draft')
        expect(blank.contact_id).toBeNull()
        expect(blank.invoice_no).toBe('1003')
        expect(blank.invoice_date).toBe('2026-10-17')
        expect(blank.lines).toEqual([{ product_id: -1, description: '', quantity: 1, unit_price: 0 }])
    })
})
